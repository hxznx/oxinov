#!/usr/bin/env bash
# Starts and configures the local identity service with administrator secrets kept out of the root .env.
# FR-ID-2207 (cross-product SSO) and FR-ID-2209 (separate staff administration with MFA).
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../../.." && pwd)"
ADMIN_ENV="$HERE/.env"

[ -f "$ROOT/.env" ] || {
  echo "Missing $ROOT/.env; copy .env.example to .env and set the local service secrets." >&2
  exit 1
}
[ -f "$ADMIN_ENV" ] || {
  echo "Missing $ADMIN_ENV; copy $HERE/.env.example to $ADMIN_ENV and replace every change-me value." >&2
  exit 1
}

if grep -q 'change-me' "$ADMIN_ENV"; then
  echo "$ADMIN_ENV still contains a change-me placeholder." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "$ROOT/.env"
# shellcheck disable=SC1090
. "$ADMIN_ENV"
set +a

cd "$ROOT"
docker compose --env-file .env --env-file "$ADMIN_ENV" --profile identity up -d --wait
SKIP_DOTENV=1 bash devops/keycloak/configure-realm.sh

# Proves the configured realm works end to end: branded pages, the emailed code, wrong and right codes.
node devops/keycloak/signin-smoke.mjs

echo "Keycloak is ready. Open http://localhost:${KEYCLOAK_PORT:-8080}/admin to manage users."
