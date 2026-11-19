---
name: orbit-upstream-update
description: Use when Grafana publishes a new release (patch, minor or major, e.g. v13.3.2 or v13.4.0) and the owner asks to bring it into Orbit, or to check what a new Grafana release would break.
---

# Bring a new Grafana release into Orbit

There is one product branch, `orbit`. A new Grafana release comes in through one branch `update/<tag>` and one pull request, merged with a merge commit. Nothing is rebased, nothing is force-pushed, and the default branch never changes. Only start when the owner asks. Rules: `.claude/rules/orbit-git.md`.

The method, tested on 2026-11-19 by merging v13.3.1 into a copy of Orbit on v13.2.6: a plain `git merge` gives hundreds of conflicts in Grafana's own files (245 there), because Grafana's release tags sit on separate release branches. We never solve those by hand. Grafana's files are taken **exactly** as the new tag has them, our files are kept, and only the seam lines are applied again.

## 0. Look first (read only)

```bash
git fetch upstream tag <new> --no-tags                 # e.g. v13.3.2
node -p "require('./.orbit/seams.json').base"           # current base, e.g. v13.3.1
git diff --stat <base> <new> -- $(node -p "require('./.orbit/seams.json').edits.map(e=>e.file).join(' ')") public/app/core/components/AppChrome/ public/app/routes/ public/app/AppWrapper.tsx pkg/services/navtree/
```

Report to the owner: which seam files changed upstream, and release-note items that touch the chrome, navigation, Preferences or plugin loading.

## 1. Update branch

```bash
git switch orbit && git pull --ff-only
git switch -c update/v13.3.2
OLD=$(node -p "require('./.orbit/seams.json').base")     # v13.3.1
node .orbit/scripts/list-ours.mjs > /tmp/orbit-ours.list # BEFORE read-tree: it removes our scripts from the disk
```

## 2. Merge the tag

```bash
git merge --no-ff --no-commit v13.3.2 || true           # conflicts are expected; do not solve them
git read-tree --reset -u v13.3.2                        # every file = the tag exactly (the guard asks the owner)
xargs -0 git checkout HEAD -- < /tmp/orbit-ours.list    # our files back, unchanged
for f in $(node -p "require('./.orbit/seams.json').edits.map(e=>e.file).join(' ')"); do
  git diff "$OLD" HEAD -- "$f" > /tmp/orbit-seam.patch
  if [ -s /tmp/orbit-seam.patch ]; then git apply --3way /tmp/orbit-seam.patch; fi
done
```

- `"$OLD"` must be the base that `orbit` really has. A wrong base turns the seam patch into a revert of Grafana's code. `check-seams` catches that (too many changed lines).
- A seam patch that does not apply means Grafana changed that spot: open the file, keep Grafana's new code, put our line back by hand, and tell the owner.
- Set `"base": "v13.3.2"` in `.orbit/seams.json` (the owner approves the edit), then `make gen-go` if a backend seam exists.
- `git add -A && git commit -m "orbit(update): merge Grafana v13.3.2"`. Check that it is a merge commit: `git log -1 --format=%P` shows two parents.

## 3. Check

```bash
node .orbit/scripts/check-seams.mjs          # Grafana files equal the tag, except seam lines
node .orbit/scripts/check-namespace.mjs
node .orbit/scripts/check-boundaries.mjs
git diff --quiet HEAD^1 HEAD -- $(tr '\0' ' ' < /tmp/orbit-ours.list) && echo "our files unchanged"   # except seams.json base
make gen-go && git diff --exit-code pkg/server/wire_gen.go
yarn typecheck && yarn lint && yarn jest --no-watch public/app/orbit     # the package manager of the new tag
go test ./pkg/orbit/...
```

A failing contract test under `public/app/orbit/__tests__/contract` points at one `upstream/` adapter: fix the adapter, not its callers, in a new commit on the same branch. For a minor or major release, also run the parity watch (ARCHITECTURE.md 13.2) and re-check the line references that ARCHITECTURE.md marks Verified.

## 4. Test build (when the owner wants)

A release candidate can be tagged on the update branch before it reaches `orbit`: `v13.3.2+orbit.1.rc.1` with the `orbit-release` skill, step 3. Its image is built by `orbit-release.yml` and can be tested. Fixes go into new commits on the same branch, and the next candidate is `rc.2`.

## 5. Pull request

Ask before pushing, then `gh pr create --base orbit --title "orbit(update): merge Grafana v13.3.2"`. The body must say: **merge with "Create a merge commit", do not squash**. The merge commit is what tells Git that `orbit` contains Grafana's tag. After the merge, release `v13.3.2+orbit.1` with `orbit-release`. Nothing else changes.
