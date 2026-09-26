#!/usr/bin/env bash
# Rehearses a production release on a throwaway local k3s cluster (same k3s and Helm versions as the node),
# before chart or node-script changes reach production (ADR-018). Needs Docker and bash only.
#
#   bash devops/kubernetes/scripts/rehearse-local.sh [--skip-build] [--keep]
#
# Builds the images (unless --skip-build), starts k3s in Docker, loads the images, installs the chart with
# the production values, checks migrations, the public routes through Traefik, the closed admin paths, and
# the realm configuration through `kubectl exec`, then proves that a broken release rolls itself back.
# Removes the cluster at the end unless --keep. Nothing touches AWS.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
export MSYS_NO_PATHCONV=1

K3S_IMAGE=rancher/k3s:v1.36.4-k3s1
HELM_VERSION=v4.3.0
HELM_SHA256=86584a54def73570558f66f5111cc53dfed56689637ae32c1201205d494f54fb
NAME=oxinov-k3s-rehearsal
REGISTRY=rehearsal.local
TAG=rehearsal
HTTPS_PORT=18443
BUILD=1
KEEP=0
for arg in "$@"; do
  case $arg in
    --skip-build) BUILD=0 ;;
    --keep) KEEP=1 ;;
    *) echo "unknown option $arg" >&2; exit 2 ;;
  esac
done

# Images and their Dockerfile, context, and target come from services.yaml.
# shellcheck source=../../scripts/services.sh
source devops/scripts/services.sh

log() { printf '\n== %s\n' "$*"; }
kube() { docker exec "$NAME" kubectl -n oxinov "$@"; }
helm_run() { docker exec -e KUBECONFIG=/etc/rancher/k3s/k3s.yaml "$NAME" helm "$@"; }
check() { # check <label> <host> <path> <expected regex>
  local code
  # curl prints 000 itself when it cannot connect; ignore its exit status (Windows curl cannot write /dev/null).
  code=$(curl -sk -o /dev/null -w '%{http_code}' --max-time 20 --resolve "$2:$HTTPS_PORT:127.0.0.1" "https://$2:$HTTPS_PORT$3" || true)
  if [[ $code =~ $4 ]]; then echo "ok   $1 ($code)"; else echo "FAIL $1: $code, expected $4"; failures=$((failures + 1)); fi
}
cleanup() { if [ "$KEEP" = 0 ]; then docker rm -f "$NAME" >/dev/null 2>&1 || true; fi; }
trap cleanup EXIT
failures=0

if [ "$BUILD" = 1 ]; then
  log "building images"
  for image in "${CATALOG_SERVICES[@]}"; do
    read -r file context target _ <<<"$(catalog_build "$image")"
    target_args=()
    if [ "$target" != - ]; then target_args=(--target "$target"); fi
    docker build -q -f "$file" "${target_args[@]}" -t "$REGISTRY/oxinov/$image:$TAG" "$context" >/dev/null
    echo "built $image"
  done
fi

log "starting k3s ($K3S_IMAGE)"
docker rm -f "$NAME" >/dev/null 2>&1 || true
docker run -d --name "$NAME" --privileged --tmpfs /run --tmpfs /var/run -p "127.0.0.1:$HTTPS_PORT:443" \
  "$K3S_IMAGE" server --disable=metrics-server --kubelet-arg=fail-swap-on=false >/dev/null
for _ in $(seq 60); do docker exec "$NAME" kubectl get nodes 2>/dev/null | grep -q ' Ready' && break; sleep 3; done

log "installing Helm $HELM_VERSION and loading images"
work=$(mktemp -d)
# Native Windows programs (curl, docker) need a Windows path when MSYS path conversion is off.
native=$( (cygpath -m "$work" 2>/dev/null) || echo "$work")
curl -fsSL --retry 3 -o "$native/helm.tgz" "https://get.helm.sh/helm-$HELM_VERSION-linux-amd64.tar.gz"
echo "$HELM_SHA256  $work/helm.tgz" | sha256sum -c --quiet -
tar -xzf "$work/helm.tgz" -C "$work"
docker cp "$native/linux-amd64/helm" "$NAME:/bin/helm"
rm -rf "$work"
refs=()
for image in "${CATALOG_SERVICES[@]}"; do refs+=("$REGISTRY/oxinov/$image:$TAG"); done
docker save "${refs[@]}" | docker exec -i "$NAME" ctr -n k8s.io images import - >/dev/null

log "creating the namespace and application secret"
docker exec "$NAME" kubectl create namespace oxinov >/dev/null
secret() { openssl rand -hex 24; }
args=()
for key in POSTGRES_PASSWORD APP_DB_PASSWORD PLATFORM_APP_DB_PASSWORD KEYCLOAK_DB_PASSWORD KEYCLOAK_ADMIN_PASSWORD; do
  args+=("--from-literal=$key=$(secret)")
done
args+=("--from-literal=EDU_SESSION_SECRET=$(secret)$(secret)" "--from-literal=PLATFORM_SESSION_SECRET=$(secret)$(secret)")
args+=(--from-literal=EDU_OIDC_CLIENT_SECRET=pending --from-literal=PLATFORM_OIDC_CLIENT_SECRET=pending)
kube create secret generic oxinov-app "${args[@]}" >/dev/null

log "installing the chart (production values)"
docker cp devops/kubernetes/helm/oxinov "$NAME:/tmp/chart"
install() { # install <extra --set args...>
  helm_run upgrade --install oxinov /tmp/chart -n oxinov -f /tmp/chart/values-production.yaml \
    --set global.registry="$REGISTRY" --set-string global.tag="$TAG" "$@" \
    --rollback-on-failure --wait=watcher --timeout "${INSTALL_TIMEOUT:-20m}"
}
install >/dev/null
kube get pods --no-headers | awk '{printf "     %-42s %s\n", $1, $3}'

log "checking the release"
edu=$(kube exec postgres-0 -- psql -U oxinov -d oxinov_lms -tAc 'select count(*) from _prisma_migrations where finished_at is not null')
expected=$(find database/products/lms/migrations -mindepth 1 -maxdepth 1 -type d -name '2*' | wc -l | tr -d ' ')
[ "$edu" = "$expected" ] && echo "ok   Edu migrations ($edu)" || { echo "FAIL Edu migrations: $edu of $expected"; failures=$((failures + 1)); }
check "Edu home" edu.oxinov.com / '^200$'
check "Account portal" app.oxinov.com / '^200$'
check "Admin console closed" id.oxinov.com /admin/ '^(404|503)$'
check "Master realm closed" id.oxinov.com /realms/master/ '^(404|503)$'
# The bare sign-in address redirects to the account portal (Traefik may take a few seconds to load it).
# Read the Location header of a HEAD request: with MSYS_NO_PATHCONV, Windows curl cannot open /dev/null
# and then leaves %{redirect_url} empty.
for _ in $(seq 12); do
  home=$(curl -skI --max-time 20 --resolve "id.oxinov.com:$HTTPS_PORT:127.0.0.1" "https://id.oxinov.com:$HTTPS_PORT/" | tr -d '\r' | sed -n 's/^[Ll]ocation: //p' || true)
  [ "$home" = "https://app.oxinov.com/" ] && break
  sleep 5
done
if [ "$home" = "https://app.oxinov.com/" ]; then echo "ok   Sign-in home redirects to the portal"; else echo "FAIL Sign-in home redirects to '$home'"; failures=$((failures + 1)); fi

log "configuring the realm through kubectl exec"
admin=$(kube get secret oxinov-app -o jsonpath='{.data.KEYCLOAK_ADMIN_PASSWORD}' | base64 -d)
secrets=$(mktemp)
KCADM_EXEC="docker exec -i $NAME kubectl -n oxinov exec -i deploy/keycloak --" SKIP_DOTENV=1 \
  KEYCLOAK_ADMIN_USER=oxinov-admin KEYCLOAK_ADMIN_PASSWORD="$admin" \
  PLATFORM_WEB_URL=https://app.oxinov.com EDU_WEB_URL=https://edu.oxinov.com \
  SMTP_HOST=mail-relay SMTP_PORT=2525 SMTP_FROM=no-reply@oxinov.com CLIENT_SECRETS_OUT="$secrets" \
  bash devops/keycloak/configure-realm.sh >/dev/null
[ "$(wc -l < "$secrets" | tr -d ' ')" = 2 ] && echo "ok   client secrets returned" || { echo "FAIL client secrets"; failures=$((failures + 1)); }
rm -f "$secrets"
check "Sign-in discovery" id.oxinov.com /realms/oxinov/.well-known/openid-configuration '^200$'

log "proving automatic rollback with a broken image"
if INSTALL_TIMEOUT=3m install --set-string services.edu-api.tag=does-not-exist >/dev/null 2>&1; then
  echo "FAIL a broken release was accepted"; failures=$((failures + 1))
else
  image=$(kube get deploy edu-api -o jsonpath='{.spec.template.spec.containers[0].image}')
  [ "$image" = "$REGISTRY/oxinov/lms-api:$TAG" ] && echo "ok   rolled back to the working image" || { echo "FAIL still on $image"; failures=$((failures + 1)); }
fi
check "Edu home after rollback" edu.oxinov.com / '^200$'

log "memory"
docker stats --no-stream --format '     {{.MemUsage}}' "$NAME"

echo
if [ "$failures" = 0 ]; then echo "rehearsal passed"; else echo "$failures rehearsal check(s) failed"; exit 1; fi
