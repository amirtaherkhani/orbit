---
name: orbit-git-workflow
description: Use for every change in the Orbit repo that ends in a commit, push or pull request - starting a work branch, committing, running the Orbit checks, asking the owner before pushing, and opening the PR into the orbit branch.
---

# Orbit git workflow

Rules: `.claude/rules/orbit-git.md`. The guard hook enforces them; this is the procedure.

## 1. Start

```bash
git status --short                      # must be clean; if not, ask the owner what to do with the changes
git switch orbit && git pull --ff-only
git switch -c <type>/<topic>            # feat, fix, seam, design, docs, update, release, ci, tooling
```

Every task starts from `orbit`, the default branch. The Grafana version it holds is `base` in `.orbit/seams.json`.

## 2. Work

- Code only in `public/app/orbit/`, `pkg/orbit/`, `.orbit/`. A Grafana file needs a seam: stop and use `orbit-seam-change`.
- Frontend and backend changes go in separate pull requests.
- Tests next to the code. Contract test for every new `upstream/` function.

## 3. Commit

```bash
git add <paths>                          # name paths; for new orbit skills or rules: git add -f
git commit -m "orbit(<scope>): <summary>"
```

Scopes: seam, shell, apps, pages, acl, backend, design, docs, ci, release, update, tooling. Seam commits name the ID: `orbit(seam): SM13 register pkg/orbit provider`.

Add one line under `## [Unreleased]` in `.orbit/CHANGELOG.md` (Added / Changed / Fixed), unless the PR is docs or CI only.

## 4. Check (all must pass before asking to push)

```bash
node .orbit/scripts/check-seams.mjs
node .orbit/scripts/check-boundaries.mjs
node .orbit/scripts/check-namespace.mjs
node .orbit/scripts/check-title.mjs --range orbit..HEAD
node .orbit/scripts/agent-guard.test.mjs     # only if .orbit/scripts changed
```

Then the repository's own checks for what changed. On the 13.3 lines the package manager is yarn (see `packageManager` in `package.json`):

```bash
yarn typecheck
yarn lint
yarn jest --no-watch public/app/orbit
go test ./pkg/orbit/...
make gen-go && git diff --exit-code pkg/server/wire_gen.go   # only if pkg/orbit wiring changed
```

## 5. Ask, then push

Show the owner, in this order: branch, commits (`git log --oneline orbit..HEAD`), changed files (`git diff --stat orbit...HEAD`), check results with ✔ ✘ ? ○. Then:

```bash
git push -u origin <type>/<topic>       # the permission prompt is the owner's approval
```

## 6. Pull request

```bash
gh pr create --base orbit --title "orbit(<scope>): <summary>" --body-file <file>
```

Body: what and why, IDs touched (boards, seams, ODs), checks run, what was not checked. Then stop with a **Status: Waiting for PR** block. Never merge; the owner squash-merges.

## When something is blocked

The hook's reason says which rule. Do not try another way to do the same thing. Tell the owner what you wanted to do and why.
