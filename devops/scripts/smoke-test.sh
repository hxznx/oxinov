#!/usr/bin/env bash
# Public smoke test of production after a deploy (ADR-018). Exits non-zero on any failure.
#   smoke-test.sh [base domain, default oxinov.com]
set -uo pipefail
DOMAIN=${1:-oxinov.com}
failures=0

expect() {
  local label=$1 url=$2 pattern=$3 code
  # curl prints 000 itself when it cannot connect.
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$url" || true)
  if [[ $code =~ $pattern ]]; then
    echo "ok   $label ($code)"
  else
    echo "FAIL $label: $url returned $code, expected $pattern"
    failures=$((failures + 1))
  fi
}

# Certificates can take a minute on a first deploy; retry the first check for up to two minutes.
for _ in $(seq 12); do
  curl -s -o /dev/null --max-time 10 "https://edu.$DOMAIN/" && break
  sleep 10
done

expect "Edu home" "https://edu.$DOMAIN/" '^(2|3)'
expect "Account portal" "https://app.$DOMAIN/" '^(2|3)'
expect "Sign-in discovery" "https://id.$DOMAIN/realms/oxinov/.well-known/openid-configuration" '^200$'
expect "Edu sign-in redirect" "https://edu.$DOMAIN/auth/login" '^(3)'
# Administration must never be public (the closed route answers 404 or 503, never Keycloak).
expect "Admin console hidden" "https://id.$DOMAIN/admin/" '^(404|503)$'
expect "Master realm hidden" "https://id.$DOMAIN/realms/master/" '^(404|503)$'
expect "HTTP redirects to HTTPS" "http://edu.$DOMAIN/" '^(301|308)$'

# The bare sign-in address sends people to the account portal, never to Keycloak's admin console. The old
# broken redirect was also a 302, so check the target; retry while Traefik loads a new middleware.
for _ in $(seq 12); do
  location=$(curl -sI --max-time 20 "https://id.$DOMAIN/" | tr -d '\r' | sed -n 's/^[Ll]ocation: //p' || true)
  [ "$location" = "https://app.$DOMAIN/" ] && break
  sleep 5
done
if [ "$location" = "https://app.$DOMAIN/" ]; then
  echo "ok   Sign-in home redirects to the portal"
else
  echo "FAIL Sign-in home: https://id.$DOMAIN/ redirects to '$location', expected https://app.$DOMAIN/"
  failures=$((failures + 1))
fi

# The account portal and sign-in never appear in search results (X-Robots-Tag from the ingress).
robots_header() { # Traefik loads a new middleware a few seconds after the release.
  local _
  for _ in $(seq 12); do
    curl -sI --max-time 20 "$1" | grep -qi '^x-robots-tag: noindex' && return 0
    sleep 5
  done
  return 1
}
for url in "https://app.$DOMAIN/" "https://id.$DOMAIN/realms/oxinov/account/"; do
  if robots_header "$url"; then
    echo "ok   Kept out of search: $url"
  else
    echo "FAIL No X-Robots-Tag noindex header: $url"
    failures=$((failures + 1))
  fi
done

if curl -sI --max-time 20 "https://edu.$DOMAIN/" | grep -qi '^strict-transport-security'; then
  echo "ok   HSTS header"
else
  echo "FAIL HSTS header missing"
  failures=$((failures + 1))
fi

[ "$failures" = 0 ] || { echo "$failures smoke check(s) failed"; exit 1; }
echo "all smoke checks passed"
