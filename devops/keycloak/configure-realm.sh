#!/usr/bin/env bash
# Configures the `oxinov` realm on id.oxinov.com's Keycloak (ADR-011, ADR-016). Safe to re-run.
# Local usage, from the repository root after `docker compose --profile identity up -d --wait`:
#   bash devops/keycloak/configure-realm.sh
# Production (ADR-018) runs it from devops/kubernetes/scripts/deploy.sh with SKIP_DOTENV=1, KCADM_EXEC set
# to `kubectl exec` into the Keycloak pod, public URLs, the SMTP relay, and CLIENT_SECRETS_OUT to collect
# the web client secrets.
set -euo pipefail
# Git Bash on Windows rewrites container paths such as /opt/keycloak unless this is set.
export MSYS_NO_PATHCONV=1
cd "$(dirname "$0")/../.."
if [ "${SKIP_DOTENV:-0}" != 1 ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

REALM=oxinov
PORTAL_URL=${PLATFORM_WEB_URL:-http://localhost:3001}
EDU_URL=${EDU_WEB_URL:-http://localhost:3002}
SMTP_HOST=${SMTP_HOST:-mailpit}
SMTP_PORT=${SMTP_PORT:-1025}
SMTP_FROM=${SMTP_FROM:-no-reply@oxinov.test}

# KCADM_EXEC runs a command in the Keycloak container: Docker Compose locally, kubectl on the k3s node.
kcadm() { ${KCADM_EXEC:-docker compose exec -T keycloak} /opt/keycloak/bin/kcadm.sh "$@"; }
# Automation signs in as the `oxinov-automation` service account (client credentials) once it exists, so
# people who administer Keycloak can be required to use a one-time code (staff MFA, FR-ID-2209). The first
# run, and any run without KEYCLOAK_AUTOMATION_SECRET, falls back to the administrator's password.
kc_login() {
  if [ -n "${KEYCLOAK_AUTOMATION_SECRET:-}" ] && kcadm config credentials --server http://localhost:8080 \
    --realm master --client oxinov-automation --secret "$KEYCLOAK_AUTOMATION_SECRET" >/dev/null 2>&1; then
    return 0
  fi
  kcadm config credentials --server http://localhost:8080 --realm master \
    --user "$KEYCLOAK_ADMIN_USER" --password "$KEYCLOAK_ADMIN_PASSWORD" >/dev/null
}
# Every kcadm call starts a JVM, so on a busy machine the run can outlast the admin session or token; log in
# again and retry once. (A 401 inside a condition would otherwise read as "not found" and take the wrong branch.)
KC_ERR=$(mktemp)
trap 'rm -f "$KC_ERR"' EXIT
kc() {
  local out status=0
  out=$(kcadm "$@" 2>"$KC_ERR") || status=$?
  if grep -qE 'Session has expired|HTTP 401' "$KC_ERR"; then
    kc_login
    status=0
    out=$(kcadm "$@" 2>"$KC_ERR") || status=$?
  fi
  cat "$KC_ERR" >&2
  if [ -n "$out" ]; then printf '%s\n' "$out"; fi
  return "$status"
}
# Readers in these pipelines consume all input: under `set -o pipefail`, `grep -q` or `awk { exit }` closing the
# pipe early fails the pipeline with SIGPIPE (exit 141) whenever kcadm is still writing.
has_line() { grep -x -- "$1" >/dev/null; }
has_output() { grep . >/dev/null; }
flow_exists() { kc get authentication/flows -r "$REALM" --fields alias --format csv --noquotes | has_line "$1"; }
flow_id() {
  kc get authentication/flows -r "$REALM" --fields id,alias --format csv --noquotes \
    | awk -F, -v a="$1" '!found && $2 == a { print $1; found = 1 }'
}
# Prints the execution ID in flow $1 (including its subflows) whose providerId or displayName is $2.
exec_id() {
  kc get "authentication/flows/$1/executions" -r "$REALM" --fields id,providerId,displayName --format csv --noquotes \
    | awk -F, -v p="$2" '!found && ($2 == p || $3 == p) { print $1; found = 1 }'
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
  -s "smtpServer.host=$SMTP_HOST" \
  -s "smtpServer.port=$SMTP_PORT" \
  -s "smtpServer.from=$SMTP_FROM" \
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
if ! kc get "authentication/executions/$OTP_ID" -r "$REALM" --fields authenticatorConfig --format csv --noquotes | has_output; then
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

# --- Registration: a copy of Keycloak's built-in flow with the password step disabled, so Register asks only
# for name and email (Keycloak hides the password fields); the address is verified by email, and sign-in
# uses the emailed code.
# A flow left without the password step by an interrupted earlier attempt is replaced with a fresh copy.
if flow_exists oxinov-registration && [ -z "$(exec_id oxinov-registration registration-password-action)" ]; then
  kc delete "authentication/flows/$(flow_id oxinov-registration)" -r "$REALM"
fi
if ! flow_exists oxinov-registration; then
  kc create authentication/flows/registration/copy -r "$REALM" -s newName=oxinov-registration >/dev/null
fi
PASSWORD_ID=$(exec_id oxinov-registration registration-password-action)
[ -n "$PASSWORD_ID" ] || { echo "oxinov-registration has no password step to disable" >&2; exit 1; }
require oxinov-registration "$PASSWORD_ID" DISABLED
kc update "realms/$REALM" -s registrationFlow=oxinov-registration

# Nobody is ever asked to set a password. Disabling the action also skips it for accounts that already
# carry it (created through the old registration form), without editing those accounts.
kc update authentication/required-actions/UPDATE_PASSWORD -r "$REALM" -s enabled=false -s defaultAction=false

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
if ! kc get "authentication/executions/$REVIEW_ID" -r "$REALM" --fields authenticatorConfig --format csv --noquotes | has_output; then
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
  if ! kc get "clients/$id/protocol-mappers/models" -r "$REALM" --fields name --format csv --noquotes | has_line "$mapper"; then
    kc create "clients/$id/protocol-mappers/models" -r "$REALM" \
      -s "name=$mapper" -s protocol=openid-connect -s protocolMapper=oidc-audience-mapper \
      -s "config.\"included.custom.audience\"=$audience" \
      -s 'config."access.token.claim"=true' -s 'config."id.token.claim"=false' >/dev/null
  fi
}

# Account portal (account.oxinov.com) -> platform API; Oxinov Edu (edu.oxinov.com) -> Edu API.
web_client oxinov-platform-web "$PORTAL_URL" oxinov-platform-api
web_client oxinov-edu-web "$EDU_URL" oxinov-lms-api

# Hands the confidential clients' secrets to the caller as `clientId=secret` lines (never printed).
if [ -n "${CLIENT_SECRETS_OUT:-}" ]; then
  : > "$CLIENT_SECRETS_OUT"
  for client in oxinov-platform-web oxinov-edu-web; do
    id=$(kc get clients -r "$REALM" -q "clientId=$client" --fields id --format csv --noquotes)
    printf '%s=%s
' "$client" "$(kc get "clients/$id/client-secret" -r "$REALM" --fields value --format csv --noquotes)" >> "$CLIENT_SECRETS_OUT"
  done
fi

# --- Staff sign-in (master realm, FR-ID-2209): people who administer Keycloak sign in with a password and
# a code from an authenticator app; the first console sign-in asks them to set the app up. Automation uses
# the `oxinov-automation` service account, so a person's second factor never blocks a deploy.
USER_REALM=$REALM
REALM=master
if [ -n "${KEYCLOAK_AUTOMATION_SECRET:-}" ]; then
  id=$(kc get clients -r "$REALM" -q clientId=oxinov-automation --fields id --format csv --noquotes)
  if [ -z "$id" ]; then
    kc create clients -r "$REALM" -s clientId=oxinov-automation -s protocol=openid-connect \
      -s publicClient=false -s serviceAccountsEnabled=true -s standardFlowEnabled=false \
      -s directAccessGrantsEnabled=false -s implicitFlowEnabled=false \
      -s 'description=Realm configuration by devops/keycloak/configure-realm.sh' >/dev/null
    id=$(kc get clients -r "$REALM" -q clientId=oxinov-automation --fields id --format csv --noquotes)
  fi
  kc update "clients/$id" -r "$REALM" -s "secret=$KEYCLOAK_AUTOMATION_SECRET"
  kc add-roles -r "$REALM" --uusername service-account-oxinov-automation --rolename admin
fi
if ! flow_exists oxinov-staff-browser; then
  kc create authentication/flows -r "$REALM" -s alias=oxinov-staff-browser -s providerId=basic-flow \
    -s topLevel=true -s builtIn=false -s 'description=Staff sign-in with a password and an authenticator code (FR-ID-2209)' >/dev/null
  add_exec oxinov-staff-browser auth-cookie
  add_subflow oxinov-staff-browser oxinov-staff-browser-forms
  add_exec oxinov-staff-browser-forms auth-username-password-form
  add_exec oxinov-staff-browser-forms auth-otp-form
fi
require oxinov-staff-browser "$(exec_id oxinov-staff-browser auth-cookie)" ALTERNATIVE
require oxinov-staff-browser "$(exec_id oxinov-staff-browser oxinov-staff-browser-forms)" ALTERNATIVE
require oxinov-staff-browser-forms "$(exec_id oxinov-staff-browser-forms auth-username-password-form)" REQUIRED
require oxinov-staff-browser-forms "$(exec_id oxinov-staff-browser-forms auth-otp-form)" REQUIRED
kc update "realms/$REALM" -s browserFlow=oxinov-staff-browser -s bruteForceProtected=true -s failureFactor=5 \
  -s otpPolicyType=totp -s otpPolicyAlgorithm=HmacSHA1 -s otpPolicyDigits=6 -s otpPolicyPeriod=30
REALM=$USER_REALM

echo "Realm '$REALM' configured for $EDU_URL and $PORTAL_URL (email via $SMTP_HOST:$SMTP_PORT)"
