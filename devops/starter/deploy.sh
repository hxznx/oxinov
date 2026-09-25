#!/bin/bash
# Deploys one release to the starter server (ADR-017). Run as root from /opt/oxinov, normally by the
# deploy workflow through Systems Manager:  bash deploy.sh <image tag> <registry> <media bucket> <backup bucket>
# Safe to re-run. Secrets are generated once into Parameter Store (SecureString) and rendered to a
# root-only .env; they are never printed.
set -euo pipefail
cd "$(dirname "$0")"

TAG=${1:?image tag}
REGISTRY=${2:?registry host}
MEDIA_BUCKET=${3:?media bucket}
BACKUP_BUCKET=${4:?backup bucket}
PREFIX=/oxinov/production/starter
export AWS_REGION=ap-south-1 AWS_DEFAULT_REGION=ap-south-1
umask 077

log() { printf '%s %s\n' "$(date -u +%FT%TZ)" "$*"; }

param() { aws ssm get-parameter --name "$PREFIX/$1" --with-decryption --query Parameter.Value --output text 2>/dev/null || true; }
put_param() { aws ssm put-parameter --name "$PREFIX/$1" --type SecureString --value "$2" --overwrite >/dev/null; }
# Creates a random secret the first time only; existing values are never rotated by a deploy.
ensure_secret() {
  if [ -z "$(param "$1")" ]; then
    put_param "$1" "$(openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c "${2:-40}")"
    log "generated $1"
  fi
}

for name in POSTGRES_PASSWORD APP_DB_PASSWORD PLATFORM_APP_DB_PASSWORD KEYCLOAK_DB_PASSWORD KEYCLOAK_ADMIN_PASSWORD; do
  ensure_secret "$name"
done
ensure_secret EDU_SESSION_SECRET 64
ensure_secret PLATFORM_SESSION_SECRET 64

render_env() {
  {
    echo "IMAGE_TAG=$TAG"
    echo "REGISTRY=$REGISTRY"
    echo "MEDIA_BUCKET=$MEDIA_BUCKET"
    echo "KEYCLOAK_ADMIN_USER=oxinov-admin"
    for name in POSTGRES_PASSWORD APP_DB_PASSWORD PLATFORM_APP_DB_PASSWORD KEYCLOAK_DB_PASSWORD KEYCLOAK_ADMIN_PASSWORD \
      EDU_SESSION_SECRET PLATFORM_SESSION_SECRET EDU_OIDC_CLIENT_SECRET PLATFORM_OIDC_CLIENT_SECRET; do
      # Client secrets exist only after the realm is configured; a placeholder keeps Compose happy until then.
      value=$(param "$name")
      echo "$name=${value:-pending-realm-configuration}"
    done
  } > .env.new
  mv .env.new .env
}
render_env

log "pulling release $TAG"
aws ecr get-login-password | docker login --username AWS --password-stdin "$REGISTRY" >/dev/null
docker compose pull --quiet

log "starting the database and running migrations"
docker compose up -d --wait postgres
docker compose --profile tools run --rm migrate

log "starting services"
docker compose up -d --wait --remove-orphans keycloak mail-relay edu-api platform-api

# The realm is configured on the first deploy (or when asked with CONFIGURE_REALM=1); the script is
# idempotent. It returns the web clients' secrets, which are stored in Parameter Store.
if [ -z "$(param EDU_OIDC_CLIENT_SECRET)" ] || [ "${CONFIGURE_REALM:-0}" = 1 ]; then
  log "configuring the sign-in realm"
  # "Healthy" can precede the end of Keycloak's first bootstrap by a few seconds; wait for the master realm.
  for _ in $(seq 60); do
    curl -sf -o /dev/null http://127.0.0.1:8080/realms/master && break
    sleep 5
  done
  secrets=$(mktemp)
  trap 'rm -f "$secrets"' EXIT
  COMPOSE_FILE="$PWD/compose.yml" KEYCLOAK_ADMIN_USER=oxinov-admin KEYCLOAK_ADMIN_PASSWORD="$(param KEYCLOAK_ADMIN_PASSWORD)" \
    PLATFORM_WEB_URL=https://app.oxinov.com EDU_WEB_URL=https://edu.oxinov.com \
    SMTP_HOST=mail-relay SMTP_PORT=2525 SMTP_FROM=no-reply@oxinov.com \
    CLIENT_SECRETS_OUT="$secrets" SKIP_DOTENV=1 \
    bash devops/keycloak/configure-realm.sh
  put_param EDU_OIDC_CLIENT_SECRET "$(sed -n 's/^oxinov-edu-web=//p' "$secrets")"
  put_param PLATFORM_OIDC_CLIENT_SECRET "$(sed -n 's/^oxinov-platform-web=//p' "$secrets")"
  rm -f "$secrets"
  render_env
fi

docker compose up -d --wait --remove-orphans

# Nightly database dump at 02:30 Nepal time (20:45 UTC), kept in S3 for 30 days.
cat > /etc/systemd/system/oxinov-backup.service <<EOF
[Unit]
Description=Oxinov starter database dump to S3
[Service]
Type=oneshot
ExecStart=/bin/bash $PWD/backup.sh $BACKUP_BUCKET
EOF
cat > /etc/systemd/system/oxinov-backup.timer <<'EOF'
[Unit]
Description=Nightly Oxinov database dump
[Timer]
OnCalendar=*-*-* 20:45:00 UTC
Persistent=true
[Install]
WantedBy=timers.target
EOF
systemctl daemon-reload
systemctl enable --now oxinov-backup.timer >/dev/null

docker image prune -af --filter "until=168h" >/dev/null
log "release $TAG is running"
docker compose ps --format 'table {{.Service}}\t{{.Status}}'
