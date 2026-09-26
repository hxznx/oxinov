#!/usr/bin/env bash
# Tests for release-plan.sh against a throwaway git repository. Run: bash devops/scripts/release-plan.test.sh
set -euo pipefail
PLAN="$(cd "$(dirname "$0")" && pwd)/release-plan.sh"
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
cd "$WORK"
git init -q
git config user.email test@example.com
git config user.name test
git config core.autocrlf false

failures=0
check() {
  local name=$1 expected=$2 actual=$3
  if [ "$expected" = "$actual" ]; then
    echo "ok - $name"
  else
    echo "not ok - $name: expected [$expected], got [$actual]"
    failures=$((failures + 1))
  fi
}
commit() {
  for file in "$@"; do mkdir -p "$(dirname "$file")"; echo "$RANDOM" >> "$file"; done
  git add -A && git commit -qm change && git rev-parse HEAD
}
field() { sed -n "s/^$1=//p"; }

first=$(commit README.md backend/api/src/main.ts devops/keycloak/Dockerfile)

# First deploy: no base, every service is built with the head tag.
out=$(bash "$PLAN" "" "$first")
check "first deploy builds everything" '["lms-api","platform-api","edu-web","platform-web","migrate","mail-relay","keycloak","backup"]' "$(echo "$out" | field build)"
check "first deploy deploys" true "$(echo "$out" | field deploy)"
echo "$out" | sed -n '/^release<<EOF$/,/^EOF$/p' | sed '1d;$d' > release.env
check "release records the deployed commit" "$first" "$(field DEPLOYED_SHA < release.env)"

# An Edu API change rebuilds only the API; Keycloak keeps its tag.
second=$(commit backend/api/src/stream.ts)
out=$(bash "$PLAN" "$first" "$second" release.env)
check "api change builds the api only" '["lms-api"]' "$(echo "$out" | field build)"
check "keycloak keeps its tag" "$first" "$(echo "$out" | field TAG_KEYCLOAK)"
check "api gets the new tag" "$second" "$(echo "$out" | field TAG_LMS_API)"

# Documentation alone deploys nothing.
third=$(commit docs/guide.md)
out=$(bash "$PLAN" "$second" "$third" release.env)
check "docs change builds nothing" '[]' "$(echo "$out" | field build)"
check "docs change does not deploy" false "$(echo "$out" | field deploy)"

# Server configuration deploys without building.
fourth=$(commit devops/kubernetes/helm/oxinov/values.yaml)
out=$(bash "$PLAN" "$third" "$fourth" release.env)
check "config change builds nothing" '[]' "$(echo "$out" | field build)"
check "config change deploys" true "$(echo "$out" | field deploy)"

# Shared web packages rebuild both web apps; the lockfile rebuilds every Node.js image but not Keycloak.
fifth=$(commit packages/web-auth/src/index.ts)
check "web-auth rebuilds both web apps" '["edu-web","platform-web"]' "$(bash "$PLAN" "$fourth" "$fifth" release.env | field build)"
sixth=$(commit pnpm-lock.yaml)
check "lockfile rebuilds node images" '["lms-api","platform-api","edu-web","platform-web","migrate","mail-relay"]' "$(bash "$PLAN" "$fifth" "$sixth" release.env | field build)"

# A migration rebuilds the migrate image; a Keycloak change rebuilds Keycloak alone.
seventh=$(commit database/migrations/20990101000000_x/migration.sql)
check "migration rebuilds migrate" '["migrate"]' "$(bash "$PLAN" "$sixth" "$seventh" release.env | field build)"
eighth=$(commit devops/keycloak/Dockerfile)
check "keycloak change rebuilds keycloak" '["keycloak"]' "$(bash "$PLAN" "$seventh" "$eighth" release.env | field build)"
ninth=$(commit devops/docker/Dockerfile)
check "dockerfile rebuilds node images and backup" '["lms-api","platform-api","edu-web","platform-web","migrate","mail-relay","backup"]' "$(bash "$PLAN" "$eighth" "$ninth" release.env | field build)"
tenth=$(commit devops/kubernetes/scripts/deploy.sh)
out=$(bash "$PLAN" "$ninth" "$tenth" release.env)
check "node script change deploys without builds" 'true []' "$(echo "$out" | field deploy) $(echo "$out" | field build)"

# FORCE_ALL and an unknown base both rebuild everything.
check "force rebuilds all" 8 "$(FORCE_ALL=1 bash "$PLAN" "$seventh" "$eighth" release.env | field build | tr ',' '\n' | wc -l | tr -d ' ')"
check "unknown base rebuilds all" 8 "$(bash "$PLAN" 0000000000000000000000000000000000000000 "$eighth" release.env | field build | tr ',' '\n' | wc -l | tr -d ' ')"

[ "$failures" = 0 ] && echo "all release-plan tests passed" || { echo "$failures failed"; exit 1; }
