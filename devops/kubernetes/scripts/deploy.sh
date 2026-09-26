#!/usr/bin/env bash
# Releases Oxinov to the k3s node (ADR-018). Runs as root on the starter server from /opt/oxinov, normally
# from the deploy workflow over Systems Manager; people use `oxctl` instead of calling it directly.
#
#   deploy.sh apply <registry> <chart version>   bootstrap the node, then install release.next.env
#   deploy.sh rollback                            return to the previous Helm revision
#   deploy.sh release                             print the running release (TAG_<SERVICE>=... lines)
#   deploy.sh status                              pods, release history, node memory and disk
#
# release.next.env holds one image tag per service plus DEPLOYED_SHA (devops/scripts/release-plan.sh);
# the services come from services.yaml through the bundled services.sh.
# `helm upgrade --rollback-on-failure` waits until every workload is healthy and rolls back by itself; the
# public names are then checked through Traefik, and a failure there rolls back too.
set -euo pipefail
cd "$(dirname "$0")"

NAMESPACE=oxinov
RELEASE=oxinov
CHART_REPO=charts/oxinov
PREFIX=/oxinov/production/starter
export AWS_REGION=ap-south-1 AWS_DEFAULT_REGION=ap-south-1
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
PATH=/usr/local/bin:$PATH
umask 077

log() { printf '%s deploy: %s\n' "$(date -u +%FT%TZ)" "$*"; }
param() { aws ssm get-parameter --name "$PREFIX/$1" --with-decryption --query Parameter.Value --output text 2>/dev/null || true; }
put_param() { aws ssm put-parameter --name "$PREFIX/$1" --type SecureString --value "$2" --overwrite >/dev/null; }

# Services and the Helm value holding each image tag come from services.yaml (bundled services.sh).
# shellcheck source=../../scripts/services.sh
source ./services.sh
helm_key() { catalog_helm_key "$1"; }
manifest_vars() {
  local service
  for service in "${CATALOG_SERVICES[@]}"; do catalog_tag_var "$service"; done
  echo DEPLOYED_SHA
}

release() {
  helm status "$RELEASE" -n "$NAMESPACE" >/dev/null 2>&1 || return 0
  local values
  values=$(helm get values "$RELEASE" -n "$NAMESPACE" -o json)
  for var in $(manifest_vars); do
    local value
    value=$(jq -r --arg path "$(helm_key "$var")" 'getpath($path | split(".")) // empty' <<<"$values")
    if [ -n "$value" ]; then echo "$var=$value"; fi
  done
}

# Public names answer through Traefik on this node (certificates may take a minute on the first run).
verify() {
  local host path code
  for entry in "edu.oxinov.com /" "app.oxinov.com /" "id.oxinov.com /realms/oxinov/.well-known/openid-configuration"; do
    read -r host path <<<"$entry"
    for _ in $(seq 36); do
      code=$(curl -sk -o /dev/null -w '%{http_code}' --max-time 10 --resolve "$host:443:127.0.0.1" "https://$host$path" || true)
      case $code in 2* | 3*) break ;; esac
      sleep 5
    done
    log "check $host$path -> $code"
    case $code in 2* | 3*) ;; *) return 1 ;; esac
  done
}

# The realm is configured on the first release (or on request); client secrets go to Parameter Store and
# the application Secret, and the web apps restart to pick them up.
configure_realm() {
  log "configuring the sign-in realm"
  local secrets
  secrets=$(mktemp)
  KCADM_EXEC="kubectl -n $NAMESPACE exec -i deploy/keycloak --" SKIP_DOTENV=1 \
    KEYCLOAK_ADMIN_USER=oxinov-admin KEYCLOAK_ADMIN_PASSWORD="$(param KEYCLOAK_ADMIN_PASSWORD)" \
    PLATFORM_WEB_URL=https://app.oxinov.com EDU_WEB_URL=https://edu.oxinov.com \
    SMTP_HOST=mail-relay SMTP_PORT=2525 SMTP_FROM=no-reply@oxinov.com \
    CLIENT_SECRETS_OUT="$secrets" bash devops/keycloak/configure-realm.sh
  put_param EDU_OIDC_CLIENT_SECRET "$(sed -n 's/^oxinov-edu-web=//p' "$secrets")"
  put_param PLATFORM_OIDC_CLIENT_SECRET "$(sed -n 's/^oxinov-platform-web=//p' "$secrets")"
  rm -f "$secrets"
  REGISTRY=$REGISTRY bash bootstrap-node.sh >/dev/null
  kubectl -n "$NAMESPACE" rollout restart deploy/edu-web deploy/platform-web >/dev/null
  kubectl -n "$NAMESPACE" rollout status deploy/edu-web --timeout=300s >/dev/null
  kubectl -n "$NAMESPACE" rollout status deploy/platform-web --timeout=300s >/dev/null
}

apply() {
  REGISTRY=${1:?registry}
  local version=${2:?chart version}
  [ -f release.next.env ] || { log "release.next.env is missing from the bundle"; exit 1; }
  export REGISTRY

  bash bootstrap-node.sh

  log "pulling chart $CHART_REPO $version"
  aws ecr get-login-password | helm registry login --username AWS --password-stdin "$REGISTRY" >/dev/null 2>&1
  rm -rf chart && mkdir chart
  helm pull "oci://$REGISTRY/$CHART_REPO" --version "$version" --untar --untardir chart >/dev/null

  local args=() var value
  while IFS='=' read -r var value; do
    local key
    if [ -n "$var" ] && key=$(helm_key "$var" 2>/dev/null); then args+=(--set-string "$key=$value"); fi
  done < release.next.env

  log "installing release $(sed -n 's/^DEPLOYED_SHA=//p' release.next.env)"
  helm upgrade --install "$RELEASE" chart/oxinov -n "$NAMESPACE" \
    -f chart/oxinov/values-production.yaml "${args[@]}" \
    --rollback-on-failure --wait=watcher --timeout 20m --history-max 10

  # The realm is (re)applied on the first release, on request, and whenever configure-realm.sh changed:
  # its fingerprint is kept in a ConfigMap, so a realm change deploys like any other change.
  local realm_hash applied_hash
  realm_hash=$(sha256sum devops/keycloak/configure-realm.sh | cut -c1-64)
  applied_hash=$(kubectl -n "$NAMESPACE" get configmap oxinov-realm -o jsonpath='{.data.script-sha256}' 2>/dev/null || true)
  if [ -z "$(param EDU_OIDC_CLIENT_SECRET)" ] || [ "${CONFIGURE_REALM:-0}" = 1 ] || [ "$realm_hash" != "$applied_hash" ]; then
    configure_realm
    kubectl -n "$NAMESPACE" create configmap oxinov-realm --from-literal=script-sha256="$realm_hash" \
      --dry-run=client -o yaml | kubectl apply -f - >/dev/null
  fi

  if verify; then
    rm -f release.next.env
    log "release $(release | sed -n 's/^DEPLOYED_SHA=//p') is running"
    status_brief
  else
    log "public checks failed; rolling back"
    rollback || true
    exit 1
  fi
}

rollback() {
  local revision
  revision=$(helm history "$RELEASE" -n "$NAMESPACE" -o json | jq '[.[] | select(.status == "superseded")] | last | .revision // empty')
  [ -n "$revision" ] || { log "no earlier revision to return to"; return 1; }
  log "rolling back to revision $revision"
  helm rollback "$RELEASE" "$revision" -n "$NAMESPACE" --wait --timeout 15m
  log "revision $revision restored"
}

status_brief() {
  kubectl -n "$NAMESPACE" get pods -o wide --no-headers | awk '{printf "%-40s %-10s %s\n", $1, $3, $4}'
}

status() {
  status_brief
  echo
  helm history "$RELEASE" -n "$NAMESPACE" --max 5 2>/dev/null || true
  echo
  free -m | awk '/Mem:/ {print "memory: " $3 " MiB used of " $2 " MiB"}'
  df -h / | awk 'NR == 2 {print "disk: " $3 " used of " $2 " (" $5 ")"}'
  kubectl -n "$NAMESPACE" get cronjob postgres-backup --no-headers 2>/dev/null | awk '{print "backup schedule: " $2 " " $3 " " $4 " " $5 " " $6 ", last run: " $(NF-1)}'
}

case ${1:-} in
  apply) shift; apply "$@" ;;
  rollback) rollback ;;
  release) release ;;
  status) status ;;
  *) echo "usage: deploy.sh apply <registry> <chart version> | rollback | release | status" >&2; exit 2 ;;
esac
