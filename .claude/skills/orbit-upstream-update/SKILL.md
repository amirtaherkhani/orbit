---
name: orbit-upstream-update
description: Use when Grafana publishes a new release (patch, minor or major, e.g. v13.3.2 or v13.4.0) and the owner asks to bring it into Orbit as a new orbit/<version> line, or to check what a new Grafana release would break.
---

# Bring a new Grafana release into Orbit

Every Grafana release gets its own line: `orbit/13.3.1`, `orbit/13.3.2`, `orbit/13.4.0`. Our commits are copied onto it; nothing is merged from Grafana and nothing is rebased. Only start when the owner asks. Rules: `.claude/rules/orbit-git.md`.

## 0. Look first (read only)

```bash
git fetch upstream tag <new> --no-tags                 # e.g. v13.3.2
node -p "require('./.orbit/seams.json').base"           # current base, e.g. v13.3.1
git diff --stat <base> <new> -- public/app/core/components/AppChrome/ public/app/routes/ public/app/AppWrapper.tsx pkg/services/navtree/ pkg/server/wire_core.go pkg/services/sqlstore/migrations/migrations.go
```

Report to the owner: which seam files changed upstream, and release-note items that touch the chrome, navigation, Preferences or plugin loading.

## 1. The owner creates the new line

On their machine (the guard does not let you push `orbit/*`):

```bash
git fetch upstream tag v13.3.2 --no-tags
git switch -c orbit/13.3.2 v13.3.2 && git push -u origin orbit/13.3.2
```

## 2. Copy our commits

All non-merge commits on the current line that are not Grafana's, oldest first:

```bash
git fetch origin orbit/13.3.2
git switch -c update/v13.3.2 origin/orbit/13.3.2
git config rerere.enabled true
git cherry-pick -x $(git rev-list --reverse --no-merges <base>..origin/orbit/13.3.1)
```

- Seam commits come first and can conflict only on their own line: keep Grafana's new code and re-apply our line. Any other conflict means the seam list is wrong: stop and tell the owner.
- Set `"base": "v13.3.2"` in `.orbit/seams.json` (the owner approves) and commit `orbit(update): set seam base to v13.3.2`.

## 3. Check

```bash
node .orbit/scripts/check-seams.mjs
node .orbit/scripts/check-namespace.mjs
node .orbit/scripts/check-boundaries.mjs
make gen-go && git diff --exit-code pkg/server/wire_gen.go
yarn typecheck && yarn lint && yarn jest --no-watch public/app/orbit     # the package manager of the new tag
go test ./pkg/orbit/...
```

A failing contract test under `public/app/orbit/__tests__/contract` points at one `upstream/` adapter: fix the adapter, not its callers. For a minor or major release, also run the parity watch (ARCHITECTURE.md 13.2) and re-check the line references that ARCHITECTURE.md marks Verified.

## 4. Pull request

Ask before pushing, then `gh pr create --base orbit/13.3.2 --title "orbit(update): Grafana v13.3.2"`. The body must say: **merge with "Create a merge commit", do not squash.** After the merge the owner makes `orbit/13.3.2` the default branch; `orbit/13.3.1` stays for rollback. Release the new line with `orbit-release` (`v13.3.2+orbit.1`).
