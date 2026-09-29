#!/usr/bin/env bash
# Tests for ci-scope.sh against a throwaway git repository. Run: bash devops/scripts/ci-scope.test.sh
set -euo pipefail
SCOPE="$(cd "$(dirname "$0")" && pwd)/ci-scope.sh"
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
code() { bash "$SCOPE" "$@" | sed -n 's/^code=//p'; }

green=$(commit README.md backend/products/edu-api/src/main.ts)

docs=$(commit docs/11-planning/changelog.md .claude/skills/oxinov-backend/SKILL.md prompts/BUILD.md backend/products/edu-api/README.md)
check "documentation-only change skips the heavy jobs" false "$(code "$green" "$docs")"

skill_asset=$(commit .claude/skills/oxinov-seo/example.json)
check "any file under .claude/skills counts as documentation" false "$(code "$green" "$skill_asset")"

source_change=$(commit backend/products/edu-api/src/notes.ts)
check "a source change runs the full CI" true "$(code "$green" "$source_change")"

# The gate: a code commit that never went green is still in the diff of a later documentation push.
later_docs=$(commit docs/README.md)
check "documentation after an untested code commit still runs the full CI" true "$(code "$green" "$later_docs")"

check "a new green base makes the next documentation push cheap" false "$(code "$source_change" "$later_docs")"

lockfile=$(commit pnpm-lock.yaml)
check "the lockfile is code" true "$(code "$later_docs" "$lockfile")"
settings=$(commit .claude/launch.json)
check "non-skill files under .claude are code" true "$(code "$lockfile" "$settings")"
workflow=$(commit .github/workflows/ci.yml)
check "a workflow change runs the full CI" true "$(code "$settings" "$workflow")"

check "no base runs the full CI" true "$(code "" "$workflow")"
check "an unknown base runs the full CI" true "$(code 0123456789abcdef0123456789abcdef01234567 "$workflow")"
check "no changes runs the full CI" true "$(code "$workflow" "$workflow")"

git checkout -q -b side "$green"
side=$(commit docs/side.md)
check "a base that is not an ancestor runs the full CI" true "$(code "$workflow" "$side")"

if [ "$failures" -gt 0 ]; then
  echo "$failures failed"
  exit 1
fi
echo "all ci-scope tests passed"
