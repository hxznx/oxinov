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
# KEYCLOAK_LOGIN=admin forces the administrator: needed to change the staff `master` realm, which the
# automation account may not administer (least privilege, see the end of this script).
kc_login() {
  if [ "${KEYCLOAK_LOGIN:-}" != admin ] && [ -n "${KEYCLOAK_AUTOMATION_SECRET:-}" ] && kcadm config credentials --server http://localhost:8080 \
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
  -s smtpServer.fromDisplayName=Oxinov \
  -s loginTheme=oxinov \
  -s emailTheme=oxinov \
  -s accountTheme=oxinov \
  -s internationalizationEnabled=false \
  -s editUsernameAllowed=true \
  -s 'attributes."actionTokenGeneratedByUserLifespan.verify-email"=1800' \
  -s 'attributes."actionTokenGeneratedByUserLifespan.update-email"=1800'
# The Oxinov theme (devops/keycloak/themes/oxinov) brands sign-in, account creation, the email code, email
# confirmation, errors, and sign-out, in English only (ADR-020). The staff `master` realm keeps Keycloak's own.
# Email confirmation and email-change links last 30 minutes (Keycloak's 5-minute default often expires before the
# email arrives); each link still works once. The theme's oxVerifyTipExpiry message states this lifetime.
# Keycloak's account page (accountTheme) stays for signed-in devices and "sign out everywhere" (FR-ID-2208) and
# for changing the email. editUsernameAllowed lets the username follow a confirmed email change (the username is
# the email here); the account API ignores direct username or email edits, which was tested on 2026-09-30.

# --- Audit: security-relevant sign-in events and admin changes, kept one year (data retention: audit logs at
# least one year). Routine token refreshes are not recorded. Events hold user IDs and IP addresses, never codes.
EVENT_TYPES='["LOGIN","LOGIN_ERROR","REGISTER","REGISTER_ERROR","LOGOUT","LOGOUT_ERROR","CODE_TO_TOKEN_ERROR","REFRESH_TOKEN_ERROR","SEND_VERIFY_EMAIL","SEND_VERIFY_EMAIL_ERROR","VERIFY_EMAIL","VERIFY_EMAIL_ERROR","UPDATE_EMAIL","IDENTITY_PROVIDER_LOGIN","IDENTITY_PROVIDER_LOGIN_ERROR","IDENTITY_PROVIDER_FIRST_LOGIN","IDENTITY_PROVIDER_LINK_ACCOUNT","DELETE_ACCOUNT","CLIENT_LOGIN_ERROR"]'
audit_events() {
  kc update "realms/$1" -s eventsEnabled=true -s eventsExpiration=31536000 -s "enabledEventTypes=$EVENT_TYPES" \
    -s adminEventsEnabled=true -s adminEventsDetailsEnabled=false
}
audit_events "$REALM"

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
# Customer sign-in never asks for an authenticator app, security key, or recovery codes, so the account page
# must not offer to set them up (they would do nothing and confuse people). Staff MFA lives in `master`.
for action in CONFIGURE_TOTP webauthn-register webauthn-register-passwordless CONFIGURE_RECOVERY_AUTHN_CODES; do
  kc update "authentication/required-actions/$action" -r "$REALM" -s enabled=false -s defaultAction=false
done
# People change their own email on the account page; the new address takes effect only after its
# confirmation link is opened (verifyEmail). The platform and Edu APIs pick up the change from the next token.
kc update authentication/required-actions/UPDATE_EMAIL -r "$REALM" -s enabled=true -s defaultAction=false

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

# --- Continue with Google (FR-ID-2201): added once the owner has created a Google OAuth client
# (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET; Parameter Store in production). Its redirect URI in Google Cloud is
# <issuer>/broker/google/endpoint. Google's verified email links to an existing account only through the
# emailed confirmation in oxinov-first-broker (FR-ID-2206); the platform API still refuses unverified emails.
if [ -n "${GOOGLE_CLIENT_ID:-}" ] && [ -n "${GOOGLE_CLIENT_SECRET:-}" ]; then
  google=(-s alias=google -s providerId=google -s enabled=true -s trustEmail=true -s storeToken=false
    -s firstBrokerLoginFlowAlias=oxinov-first-broker -s 'displayName=Google'
    -s "config.clientId=$GOOGLE_CLIENT_ID" -s "config.clientSecret=$GOOGLE_CLIENT_SECRET"
    -s 'config.defaultScope=openid email profile' -s config.syncMode=IMPORT -s config.hideOnLoginPage=false)
  if kc get identity-provider/instances/google -r "$REALM" >/dev/null 2>&1; then
    kc update identity-provider/instances/google -r "$REALM" "${google[@]}"
  else
    kc create identity-provider/instances -r "$REALM" "${google[@]}" >/dev/null
  fi
fi

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
    -s "redirectUris=[\"$url/auth/callback\"]" \
    -s "webOrigins=[\"$url\"]" \
    -s 'attributes."pkce.code.challenge.method"=S256' \
    -s "attributes.\"post.logout.redirect.uris\"=$url/"
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
#
# Least privilege: the automation account administers only the customer realm (the `oxinov-realm` roles
# below). It cannot change staff accounts, staff sign-in, or other realms, so a leaked automation secret
# cannot take over Keycloak. This section therefore runs only for a session that administers `master`: the
# administrator (KEYCLOAK_LOGIN=admin, only for an administrator without an authenticator code, as a script
# cannot enter one), or an automation account that holds the `admin` role, which this section then removes as
# its last step. To change the staff realm in production: in the admin console give the service account
# `service-account-oxinov-automation` the `admin` realm role, then redeploy with CONFIGURE_REALM=1 (or run the
# script); it applies this section and removes the role again. Rehearsed locally on 2026-09-30.
USER_REALM=$REALM
REALM=master
AUTOMATION_ROLES=(view-realm manage-realm view-clients manage-clients view-events manage-events view-identity-providers manage-identity-providers)
if ! kc get users -r "$REALM" -q username=service-account-oxinov-automation --fields id --format csv --noquotes >/dev/null 2>&1; then
  echo "Staff realm unchanged: this session does not administer 'master' (run with KEYCLOAK_LOGIN=admin to change it)." >&2
  REALM=$USER_REALM
  echo "Realm '$REALM' configured for $EDU_URL and $PORTAL_URL (email via $SMTP_HOST:$SMTP_PORT)"
  exit 0
fi
if [ -n "${KEYCLOAK_AUTOMATION_SECRET:-}" ]; then
  id=$(kc get clients -r "$REALM" -q clientId=oxinov-automation --fields id --format csv --noquotes)
  if [ -z "$id" ]; then
    kc create clients -r "$REALM" -s clientId=oxinov-automation -s protocol=openid-connect \
      -s publicClient=false -s serviceAccountsEnabled=true -s standardFlowEnabled=false \
      -s directAccessGrantsEnabled=false -s implicitFlowEnabled=false \
      -s 'description=Configures the oxinov realm (devops/keycloak/configure-realm.sh); no master rights' >/dev/null
    id=$(kc get clients -r "$REALM" -q clientId=oxinov-automation --fields id --format csv --noquotes)
  fi
  kc update "clients/$id" -r "$REALM" -s "secret=$KEYCLOAK_AUTOMATION_SECRET" \
    -s 'description=Configures the oxinov realm (devops/keycloak/configure-realm.sh); no master rights'
  role_args=()
  for role in "${AUTOMATION_ROLES[@]}"; do role_args+=(--rolename "$role"); done
  kc add-roles -r "$REALM" --uusername service-account-oxinov-automation --cclientid "${USER_REALM}-realm" "${role_args[@]}"
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
  -s otpPolicyType=totp -s otpPolicyAlgorithm=HmacSHA1 -s otpPolicyDigits=6 -s otpPolicyPeriod=30 \
  -s "displayName=Ox Inov Pvt. Ltd. Administration"
audit_events "$REALM"
# Last: take away the full `admin` role the automation account held before (it keeps the customer-realm roles
# above). If this session is that account, its current token keeps working until the script ends.
if [ -n "${KEYCLOAK_AUTOMATION_SECRET:-}" ]; then
  kc remove-roles -r "$REALM" --uusername service-account-oxinov-automation --rolename admin 2>/dev/null || true
fi
REALM=$USER_REALM

echo "Realm '$REALM' configured for $EDU_URL and $PORTAL_URL (email via $SMTP_HOST:$SMTP_PORT)"
