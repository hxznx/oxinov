#!/usr/bin/env bash
# Configures the local `oxinov` realm on id.oxinov.com's Keycloak (ADR-011, ADR-016). Safe to re-run.
# Usage, from the repository root after `docker compose --profile identity up -d --wait`:
#   bash devops/keycloak/configure-realm.sh
# Local development only: staging and production realms are managed by reviewed infrastructure code.
set -euo pipefail
# Git Bash on Windows rewrites container paths such as /opt/keycloak unless this is set.
export MSYS_NO_PATHCONV=1
cd "$(dirname "$0")/../.."
set -a
# shellcheck disable=SC1091
. ./.env
set +a

REALM=oxinov
PORTAL_URL=${PLATFORM_WEB_URL:-http://localhost:3001}
EDU_URL=${EDU_WEB_URL:-http://localhost:3002}

kcadm() { docker compose exec -T keycloak /opt/keycloak/bin/kcadm.sh "$@"; }
kc_login() {
  kcadm config credentials --server http://localhost:8080 --realm master \
    --user "$KEYCLOAK_ADMIN_USER" --password "$KEYCLOAK_ADMIN_PASSWORD" >/dev/null
}
# Every kcadm call starts a JVM, so on a busy machine the run can outlast the admin session; log in again and retry once.
KC_ERR=$(mktemp)
trap 'rm -f "$KC_ERR"' EXIT
kc() {
  local out status=0
  out=$(kcadm "$@" 2>"$KC_ERR") || status=$?
  if grep -q 'Session has expired' "$KC_ERR"; then
    kc_login
    status=0
    out=$(kcadm "$@" 2>"$KC_ERR") || status=$?
  fi
  cat "$KC_ERR" >&2
  if [ -n "$out" ]; then printf '%s\n' "$out"; fi
  return "$status"
}
flow_exists() { kc get authentication/flows -r "$REALM" --fields alias --format csv --noquotes | grep -qx "$1"; }
# Prints the execution ID in flow $1 whose providerId or displayName is $2.
exec_id() {
  kc get "authentication/flows/$1/executions" -r "$REALM" --fields id,providerId,displayName --format csv --noquotes \
    | awk -F, -v p="$2" '$2 == p || $3 == p { print $1; exit }'
}
require() { kc update "authentication/flows/$1/executions" -r "$REALM" -b "{\"id\":\"$2\",\"requirement\":\"$3\"}"; }
add_exec() { kc create "authentication/flows/$1/executions/execution" -r "$REALM" -s "provider=$2" >/dev/null; }
add_subflow() {
  kc create "authentication/flows/$1/executions/flow" -r "$REALM" \
    -s "alias=$2" -s type=basic-flow -s provider=registration-page-form >/dev/null
}

kc_login

# --- Realm: no passwords, verified emails, short tokens, rotating refresh tokens (FR-ID-2204, FR-ID-2208)
if ! kc get "realms/$REALM" >/dev/null 2>&1; then
  kc create realms -s "realm=$REALM" -s enabled=true >/dev/null
fi
kc update "realms/$REALM" \
  -s displayName=Oxinov \
  -s registrationAllowed=true \
  -s registrationEmailAsUsername=true \
  -s loginWithEmailAllowed=true \
  -s duplicateEmailsAllowed=false \
  -s verifyEmail=true \
  -s resetPasswordAllowed=false \
  -s rememberMe=true \
  -s bruteForceProtected=true \
  -s failureFactor=5 \
  -s accessTokenLifespan=600 \
  -s ssoSessionIdleTimeout=2592000 \
  -s ssoSessionMaxLifespan=7776000 \
  -s revokeRefreshToken=true \
  -s refreshTokenMaxReuse=0 \
  -s smtpServer.host=mailpit \
  -s smtpServer.port=1025 \
  -s smtpServer.from=no-reply@oxinov.test \
  -s smtpServer.fromDisplayName=Oxinov

# --- Browser flow: cookie, or Google redirect, or email then a six-digit email code. No password form.
if ! flow_exists oxinov-browser; then
  kc create authentication/flows -r "$REALM" -s alias=oxinov-browser -s providerId=basic-flow \
    -s topLevel=true -s builtIn=false -s 'description=Oxinov sign-in without passwords (ADR-016)' >/dev/null
  add_exec oxinov-browser auth-cookie
  add_exec oxinov-browser identity-provider-redirector
  add_subflow oxinov-browser oxinov-browser-forms
  add_exec oxinov-browser-forms auth-username-form
  add_exec oxinov-browser-forms email-otp-form
fi
require oxinov-browser "$(exec_id oxinov-browser auth-cookie)" ALTERNATIVE
require oxinov-browser "$(exec_id oxinov-browser identity-provider-redirector)" ALTERNATIVE
require oxinov-browser "$(exec_id oxinov-browser oxinov-browser-forms)" ALTERNATIVE
require oxinov-browser-forms "$(exec_id oxinov-browser-forms auth-username-form)" REQUIRED
OTP_ID=$(exec_id oxinov-browser-forms email-otp-form)
require oxinov-browser-forms "$OTP_ID" REQUIRED
if ! kc get "authentication/executions/$OTP_ID" -r "$REALM" --fields authenticationConfig --format csv --noquotes | grep -q .; then
  kc create "authentication/executions/$OTP_ID/config" -r "$REALM" -b '{
    "alias": "oxinov-email-code",
    "config": {
      "code-alphabet": "0123456789",
      "code-length": "6",
      "code-lifetime": "600",
      "ip-trust-enabled": "false",
      "device-trust-enabled": "false"
    }
  }' >/dev/null
fi
kc update "realms/$REALM" -s browserFlow=oxinov-browser

# --- First broker login: create when unique, otherwise link only after an emailed confirmation.
if ! flow_exists oxinov-first-broker; then
  kc create authentication/flows -r "$REALM" -s alias=oxinov-first-broker -s providerId=basic-flow \
    -s topLevel=true -s builtIn=false -s 'description=Google linking with email confirmation (ADR-016)' >/dev/null
  add_exec oxinov-first-broker idp-review-profile
  add_subflow oxinov-first-broker oxinov-first-broker-link
  add_exec oxinov-first-broker-link idp-create-user-if-unique
  add_subflow oxinov-first-broker-link oxinov-first-broker-existing
  add_exec oxinov-first-broker-existing idp-email-verification
fi
REVIEW_ID=$(exec_id oxinov-first-broker idp-review-profile)
require oxinov-first-broker "$REVIEW_ID" REQUIRED
if ! kc get "authentication/executions/$REVIEW_ID" -r "$REALM" --fields authenticationConfig --format csv --noquotes | grep -q .; then
  kc create "authentication/executions/$REVIEW_ID/config" -r "$REALM" \
    -b '{"alias":"oxinov-review-profile","config":{"update.profile.on.first.login":"missing"}}' >/dev/null
fi
require oxinov-first-broker "$(exec_id oxinov-first-broker oxinov-first-broker-link)" REQUIRED
require oxinov-first-broker-link "$(exec_id oxinov-first-broker-link idp-create-user-if-unique)" ALTERNATIVE
require oxinov-first-broker-link "$(exec_id oxinov-first-broker-link oxinov-first-broker-existing)" ALTERNATIVE
require oxinov-first-broker-existing "$(exec_id oxinov-first-broker-existing idp-email-verification)" REQUIRED
kc update "realms/$REALM" -s firstBrokerLoginFlow=oxinov-first-broker

# --- Product web clients (FR-ID-2207): each is confidential, uses the authorization code flow with PKCE,
# and receives access tokens for its own API audience only, so one product's token is refused by another.
# Usage: web_client <clientId> <app url> <api audience>
web_client() {
  local client=$1 url=$2 audience=$3 mapper="${3#oxinov-}-audience" id
  id=$(kc get clients -r "$REALM" -q "clientId=$client" --fields id --format csv --noquotes)
  if [ -z "$id" ]; then
    kc create clients -r "$REALM" -s "clientId=$client" -s protocol=openid-connect \
      -s publicClient=false -s standardFlowEnabled=true -s directAccessGrantsEnabled=false \
      -s implicitFlowEnabled=false -s serviceAccountsEnabled=false >/dev/null
    id=$(kc get clients -r "$REALM" -q "clientId=$client" --fields id --format csv --noquotes)
  fi
  kc update "clients/$id" -r "$REALM" \
    -s "redirectUris=[\"$url/*\"]" \
    -s "webOrigins=[\"$url\"]" \
    -s 'attributes."pkce.code.challenge.method"=S256' \
    -s "attributes.\"post.logout.redirect.uris\"=$url/*"
  if ! kc get "clients/$id/protocol-mappers/models" -r "$REALM" --fields name --format csv --noquotes | grep -qx "$mapper"; then
    kc create "clients/$id/protocol-mappers/models" -r "$REALM" \
      -s "name=$mapper" -s protocol=openid-connect -s protocolMapper=oidc-audience-mapper \
      -s "config.\"included.custom.audience\"=$audience" \
      -s 'config."access.token.claim"=true' -s 'config."id.token.claim"=false' >/dev/null
  fi
}

# Account portal (account.oxinov.com) -> platform API; Oxinov Edu (edu.oxinov.com) -> Edu API.
web_client oxinov-platform-web "$PORTAL_URL" oxinov-platform-api
web_client oxinov-edu-web "$EDU_URL" oxinov-lms-api

echo "Realm '$REALM' configured: sign-in at http://localhost:8080/realms/$REALM/account, email at http://localhost:8025"
