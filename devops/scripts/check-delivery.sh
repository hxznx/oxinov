#!/usr/bin/env bash
# Every delivery check in one command, identical locally and in CI (ADR-018):
#   bash devops/scripts/check-delivery.sh
# Runs: executable bits, shellcheck on all delivery scripts, the release-planner tests, Helm lint, rendered-manifest validation
# against the Kubernetes schema, and Terraform formatting. Tools run in pinned containers, so the only
# requirements are Docker and bash.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
export MSYS_NO_PATHCONV=1
# Docker on Windows needs a Windows path for the bind mount; elsewhere pwd is already right.
HOST_ROOT=$( (pwd -W 2>/dev/null) || pwd)

SHELLCHECK=koalaman/shellcheck:v0.11.0
HELM=alpine/helm:3.19.0
KUBECONFORM=ghcr.io/yannh/kubeconform:v0.7.0
TERRAFORM=hashicorp/terraform:1.16.2
CHART=devops/kubernetes/helm/oxinov

step() { printf '\n== %s\n' "$*"; }
run() { docker run --rm -v "$HOST_ROOT:/src" -w /src "$@"; }

step "executable bits"
# Git on Windows ignores file modes; a script stored as 100644 fails when an image or runner executes it.
# (Database init scripts are sourced by the postgres entrypoint, so they are not in this list.)
bad=$(git ls-files -s -- 'devops/scripts/*' 'devops/kubernetes/scripts/*' 'devops/keycloak/configure-realm.sh' 'backend/workers/*/*.sh'   | awk '$1 != "100755" {print $4}')
if [ -n "$bad" ]; then
  echo "not executable in git (fix: git update-index --chmod=+x <file>):"
  echo "$bad"
  exit 1
fi
echo "all scripts executable"

step "shellcheck"
mapfile -t scripts < <(ls devops/scripts/*.sh devops/scripts/oxctl devops/kubernetes/scripts/*.sh devops/keycloak/configure-realm.sh)
run "$SHELLCHECK" -S warning "${scripts[@]}"
echo "${#scripts[@]} scripts clean"

step "release planner"
bash devops/scripts/release-plan.test.sh | tail -1

step "helm lint"
for values in values.yaml values-production.yaml; do
  run "$HELM" lint "$CHART" -f "$CHART/$values" --set global.tag=check | tail -1
done

step "kubernetes schema"
for values in values.yaml values-production.yaml; do
  run "$HELM" template oxinov "$CHART" -f "$CHART/$values" --set global.tag=check \
    | docker run --rm -i "$KUBECONFORM" -strict -summary -ignore-missing-schemas -kubernetes-version 1.33.0
done

step "terraform format"
run "$TERRAFORM" fmt -recursive -check devops/terraform && echo "formatted"

echo
echo "all delivery checks passed"
