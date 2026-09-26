#!/usr/bin/env bash
# Decides what a push to main changes on the k3s node (ADR-018).
#
#   release-plan.sh <base sha or empty> <head sha> [current release file]
#
# Prints shell-style lines for GitHub Actions ($GITHUB_OUTPUT) and humans:
#   build=["lms-api","edu-web"]   services whose image must be rebuilt (JSON array)
#   deploy=true|false             whether the server needs a deploy at all
#   release<<EOF ... EOF          the next release manifest: one TAG_<SERVICE>=<tag> per service
#
# A service is rebuilt only when a file it is built from changed, so an unrelated push never restarts
# Keycloak or the database. With no base (first deploy) or FORCE_ALL=1, everything is rebuilt.
# Tags map to Helm values in devops/kubernetes/scripts/deploy.sh.
# Services not rebuilt keep the tag from the current release file.
set -euo pipefail

BASE=${1:-}
HEAD=${2:?head sha}
CURRENT=${3:-}

SERVICES=(lms-api platform-api edu-web platform-web migrate mail-relay keycloak backup)

# Inputs shared by every Node.js image built from devops/docker/Dockerfile.
NODE_COMMON='^(devops/docker/Dockerfile|pnpm-lock\.yaml|pnpm-workspace\.yaml|package\.json|\.npmrc|tsconfig\.json|\.dockerignore)$'

# Extended regular expressions of the paths each image is built from.
inputs() {
  case $1 in
    lms-api) echo '^(backend/products/lms-api/|packages/server-kit/|database/products/lms/prisma/|security/soc/event-schema\.json)' ;;
    platform-api) echo '^(backend/platform-api/|packages/server-kit/|database/platform/prisma/|security/soc/event-schema\.json)' ;;
    edu-web) echo '^(frontend/products/lms-web/|packages/web-auth/|packages/design-system/)' ;;
    platform-web) echo '^(frontend/platform-web/|packages/web-auth/|packages/design-system/)' ;;
    migrate) echo '^(database/products/lms/migrations/|database/products/lms/prisma/|database/platform/migrations/|database/platform/prisma/|backend/workers/migrate/)' ;;
    mail-relay) echo '^backend/workers/mail-relay/' ;;
    keycloak) echo '^devops/keycloak/Dockerfile$' ;;
    # PostgreSQL client tools and the AWS CLI only; the Node.js inputs do not affect it.
    backup) echo '^devops/docker/Dockerfile$' ;;
    *) echo "unknown service $1" >&2; return 1 ;;
  esac
}

# Chart and node configuration that needs a deploy but no image build.
CONFIG='^(devops/kubernetes/helm/|devops/kubernetes/scripts/|devops/keycloak/configure-realm\.sh$)'

tag_var() { echo "TAG_$(echo "$1" | tr 'a-z-' 'A-Z_')"; }

current_tag() {
  [ -n "$CURRENT" ] && [ -f "$CURRENT" ] || return 0
  sed -n "s/^$(tag_var "$1")=//p" "$CURRENT" | tail -1
}

all=0
if [ -z "$BASE" ] || [ "${FORCE_ALL:-0}" = 1 ] || ! git cat-file -e "$BASE^{commit}" 2>/dev/null; then
  all=1
  changed=''
else
  changed=$(git diff --name-only "$BASE" "$HEAD")
fi

build=()
release=()
for service in "${SERVICES[@]}"; do
  tag=$(current_tag "$service")
  rebuild=0
  if [ "$all" = 1 ] || [ -z "$tag" ]; then
    rebuild=1
  elif printf '%s\n' "$changed" | grep -Eq "$(inputs "$service")"; then
    rebuild=1
  elif [ "$service" != keycloak ] && [ "$service" != backup ] && printf '%s\n' "$changed" | grep -Eq "$NODE_COMMON"; then
    rebuild=1
  fi
  if [ "$rebuild" = 1 ]; then
    build+=("$service")
    tag=$HEAD
  fi
  release+=("$(tag_var "$service")=$tag")
done

deploy=false
if [ "${#build[@]}" -gt 0 ] || printf '%s\n' "$changed" | grep -Eq "$CONFIG"; then
  deploy=true
fi

json='['
for service in "${build[@]}"; do json+="\"$service\","; done
json="${json%,}]"

echo "build=$json"
echo "deploy=$deploy"
echo "release<<EOF"
printf '%s\n' "${release[@]}"
echo "DEPLOYED_SHA=$HEAD"
echo "EOF"
