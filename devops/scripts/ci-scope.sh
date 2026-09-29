#!/usr/bin/env bash
# Decides how much of CI a commit needs, to save Actions minutes without weakening the gate.
#
#   ci-scope.sh <base sha or empty> <head sha>
#
# <base> is the last commit whose CI passed on main (the workflow looks it up), or the merge base with
# main for other branches. Prints shell-style lines for GitHub Actions ($GITHUB_OUTPUT) and humans:
#   code=true|false   false only when every file changed since <base> is documentation
#   reason=<text>     why
#
# Comparing with the last green commit, not the previous push, keeps the gate intact: a code commit
# whose CI failed or was cancelled is still in the diff of the next documentation-only push, so the
# full CI runs before anything reaches production (the release plan diffs against the running release).
# Anything unexpected (no base, unknown base, base not an ancestor, empty diff) runs the full CI.
set -euo pipefail

BASE=${1:-}
HEAD=${2:?head sha}

# Documentation: Markdown anywhere, plus the documentation, prompt, and assistant-skill folders.
# No application code reads these files; the scaffold job, which always runs, validates them.
DOCS='(^docs/|^prompts/|^\.claude/skills/|\.md$)'

full() { echo "code=true"; echo "reason=$1"; exit 0; }

[ -n "$BASE" ] || full "no base commit to compare with"
git cat-file -e "$BASE^{commit}" 2>/dev/null || full "base commit $BASE is not in this checkout"
git merge-base --is-ancestor "$BASE" "$HEAD" 2>/dev/null || full "base commit $BASE is not an ancestor of $HEAD"

changed=$(git diff --name-only "$BASE" "$HEAD")
[ -n "$changed" ] || full "no changes since $BASE"

code_files=$(printf '%s\n' "$changed" | grep -Ev "$DOCS" || true)
if [ -n "$code_files" ]; then
  full "code changed since ${BASE:0:7}: $(printf '%s\n' "$code_files" | head -n 3 | paste -sd ' ' -)"
fi

echo "code=false"
echo "reason=only documentation changed since ${BASE:0:7} ($(printf '%s\n' "$changed" | wc -l | tr -d ' ') files)"
