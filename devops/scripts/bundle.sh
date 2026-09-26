#!/usr/bin/env bash
# Packs the k3s node scripts (plus an optional release manifest) into one base64 line small enough to
# travel inside a Systems Manager command (ADR-018). Unpacked into /opt/oxinov on the server.
#   bundle.sh [release.next.env] > payload
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT

mkdir -p "$STAGE/devops/keycloak"
cp "$ROOT"/devops/kubernetes/scripts/{deploy.sh,bootstrap-node.sh} "$ROOT/devops/scripts/services.sh" "$STAGE/"
cp "$ROOT/devops/keycloak/configure-realm.sh" "$STAGE/devops/keycloak/"
if [ -n "${1:-}" ]; then cp "$1" "$STAGE/release.next.env"; fi

payload=$(tar -C "$STAGE" -czf - . | base64 | tr -d '\n')
# Systems Manager limits a command's parameters; stay well below it.
if [ "${#payload}" -ge 48000 ]; then
  echo "deploy bundle is ${#payload} bytes, too large for one command" >&2
  exit 1
fi
printf '%s' "$payload"
