---
name: oxinov-version-control
description: Use Git safely in the Oxinov repository - branches, worktrees, committing only your own paths in a shared checkout, commit messages, and pushing to main (which deploys to production). Use before any commit, push, branch, or history operation.
---

# Oxinov version control

Sources: [Git workflow](../../../docs/08-engineering/git-workflow.md), [AGENTS.md](../../../AGENTS.md) sections 3, 7, and 12.

## Facts that change how you use Git here

- **A push to `main` deploys to production** when CI passes. Push only when the person asked, with all checks green.
- **Several assistants share one checkout.** Other sessions' uncommitted files are in the same working tree.
- Line endings: files are stored with LF; Windows editors may switch them to CRLF, which shows every line as changed.

## Steps for a change

1. `git status` first. Note every modified or untracked file that is not yours and leave it alone.
2. For a large or shared change, work in a separate worktree from `origin/main`:

   ```bash
   git fetch origin
   git worktree add ../oxinov-<task> -b <task> origin/main
   ```

3. Commit only your own paths, with a conventional message (`feat(edu): ...`, `fix(platform-api): ...`, `docs: ...`, `refactor: ...`, `ci: ...`):

   ```bash
   git commit -m "feat(edu): add lesson notes export (FR-PLAYER-403)" -- <path> <path>
   ```

4. Before pushing:
   - `git fetch origin` and rebase your own commit onto `origin/main`.
   - `gh run list --branch main --limit 5`: `main` must be green and no deploy may be running.
   - Confirm the person asked you to push, and state what the push deploys (see AGENTS.md section 7.1).
5. After pushing, report the commit, the CI run, and the production effect.

## Never in a shared checkout

`git add -A`, `git add .`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `git pull --autostash`. They capture or destroy other sessions' work.

## Never without the owner's explicit request

Force-pushing, rewriting published history, deleting branches that are not yours, or merging someone else's pull request.

## Files that must never be committed

`.env` files, keys, credentials, personal data, `DELETE_ME/`, build output (`dist/`, `.next/`, `src/generated/`), and `node_modules/`.
