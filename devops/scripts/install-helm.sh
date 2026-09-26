#!/usr/bin/env bash
# Installs the pinned Helm release, verified by SHA-256, for CI runners (the node uses bootstrap-node.sh).
#   install-helm.sh [install dir, default /usr/local/bin]
set -euo pipefail
HELM_VERSION=v4.3.0
HELM_SHA256=86584a54def73570558f66f5111cc53dfed56689637ae32c1201205d494f54fb
DEST=${1:-/usr/local/bin}

if [ "$(helm version --template '{{.Version}}' 2>/dev/null || true)" = "$HELM_VERSION" ]; then exit 0; fi
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
curl -fsSL --retry 3 -o "$work/helm.tgz" "https://get.helm.sh/helm-$HELM_VERSION-linux-amd64.tar.gz"
echo "$HELM_SHA256  $work/helm.tgz" | sha256sum -c --quiet -
tar -xzf "$work/helm.tgz" -C "$work"
install -m 0755 "$work/linux-amd64/helm" "$DEST/helm"
helm version --template 'helm {{.Version}}{{"\n"}}'
