# Orbit: branches, commits, pull requests, tags and releases

These rules are enforced. `.orbit/scripts/agent-guard.mjs` runs before every shell command and file edit and blocks what breaks them; CI checks them again on every pull request. Do not try to get around a block: report it to the owner.

## Remotes

- `origin` is `amirtaherkhani/orbit`. `upstream` is `grafana/grafana`: fetch only, never push.
- Fetch Grafana tags one at a time: `git fetch upstream tag v13.3.2 --no-tags`.

## Branches

| Branch | What it is | Who changes it |
| --- | --- | --- |
| `main` | Mirror of Grafana's `main`. Never commit to it | The owner, with GitHub's "Sync fork" |
| `orbit` | The product: one Grafana release plus our commits. The default branch. It never changes name; the Grafana version it holds is `base` in `.orbit/seams.json` | Only through pull requests the owner merges |
| `hotfix/<version>`, e.g. `hotfix/13.3.1` | Only when an old release needs a fix: made by the owner from that release's tag | Only through pull requests the owner merges |
| `<type>/<topic>` | Short-lived work branch, one pull request | You |

- Work branch types: `feat`, `fix`, `seam`, `design`, `docs`, `update`, `release`, `ci`, `tooling`. Topic in lowercase with hyphens: `feat/dock-bookmarks`, `update/v13.3.2`, `release/v13.3.1-orbit.1`.
- Start every task from the newest `origin/orbit`, never from a local copy: `git fetch origin && git switch -c feat/<topic> origin/orbit`. The session start hook already fast-forwards the owner's main checkout when it is clean and on `orbit`.
- Never commit on `main`, `orbit`, `hotfix/*` or a detached HEAD.

## Worktrees

- A session may run in a worktree (`.claude/worktrees/<name>`, made by the Claude desktop app). It is only a separate folder for one work branch; `orbit` stays checked out in the main checkout.
- Work in a worktree ends like any other: commit on the work branch, run the checks, push it, open a pull request into `orbit`. The owner merges on GitHub.
- Never merge a work branch into `orbit` locally, and never suggest the desktop app's merge or "apply" button: a local merge leaves the local `orbit` different from GitHub, and the ruleset refuses to push it.
- Finished worktrees are removed with `node .orbit/scripts/clean-worktrees.mjs`: it lists only clean worktrees whose exact commit was merged in a pull request on GitHub; `--apply` removes them and is the owner's decision. Never remove a worktree with uncommitted or unpushed work.

## Commits

- Format: `orbit(<scope>): <summary>`, summary in the imperative, under 90 characters, no full stop.
- Scopes: `seam`, `shell`, `apps`, `pages`, `acl`, `backend`, `design`, `docs`, `ci`, `release`, `update`, `tooling`.
- A commit that edits a Grafana file is a seam commit: scope `seam`, names its ID, touches that seam only: `orbit(seam): SM01 swap AppChrome import`.
- One logical change per commit. Frontend and backend in separate pull requests (Grafana's rule).
- Never `--no-verify`, never `--amend` or `rebase` on a pushed branch: add a new commit.

## Push and pull requests

- Push and pull requests are automatic for work branches (owner's decision, 2026-11-21; for Orbit work branches this replaces the "ask before git push" gate in Grafana's AGENTS.md). When the work is done: run the checks (`orbit-git-workflow` skill), and only if every check passes, push the work branch to `origin` and open the pull request into `orbit`, without asking. Then report: branch, commits, changed files, check results, PR link.
- A failing check stops it: fix it or report it, never push red. Everything else still waits for the owner: pushing anything that is not a work branch, tags and releases, repository settings, and every merge.
- Never force-push, never push to `upstream`, `main`, `orbit` or `hotfix/*`, never push `--tags`.
- Open the pull request into `orbit` (or the `hotfix/*` branch the owner named) with `gh pr create --base orbit --title …`. Title in commit format, since pull requests are **squash-merged** and the title becomes the commit (except `update/*`, see below).
- Every pull request adds one line under `## [Unreleased]` in `.orbit/CHANGELOG.md`, unless it changes only docs or CI.
- Never merge. Merging is the owner's job. When checks are green, say the pull request is ready and stop.

## Tags and releases

| Kind | Git tag | Docker image (GHCR) |
| --- | --- | --- |
| Release | `v<grafana>+orbit.<n>`, e.g. `v13.3.1+orbit.1` | `ghcr.io/amirtaherkhani/orbit:13.3.1-orbit.1` |
| Release candidate | `v<grafana>+orbit.<n>.rc.<m>`, e.g. `v13.3.1+orbit.2.rc.1` | `…:13.3.1-orbit.2-rc.1` |

- `<grafana>` is the Grafana version in the tagged commit, the `base` in `.orbit/seams.json` (base `v13.3.1` releases `v13.3.1+orbit.<n>`). `<n>` counts our releases on that Grafana version and starts at 1 after each update. `<m>` counts candidates for the coming `<n>`.
- Release tags are annotated, made on `orbit` after the release pull request is merged, and never moved or deleted. A release candidate may also be tagged on an `update/*` branch, to test a new Grafana version before it reaches `orbit`.
- Grafana's own version never changes. The Orbit API version in `.orbit/VERSION` follows SemVer: major when apps or users break (`ui.json`, `/api/orbit`, `orbit_` tables), minor for features, patch for fixes. It is `0.x` until v1.
- A release is prepared with the `orbit-release` skill. Pushing the tag starts `orbit-release.yml`, which builds the image and the GitHub release; the owner approves that push.

## Grafana updates

One branch, `orbit`, for every Grafana version (owner's decision, 2026-11-19, revision 85). A new Grafana release, patch, minor or major, comes in through one pull request:
1. When the owner asks: `update/v13.3.2` from `orbit`, merge Grafana's tag `v13.3.2`, take Grafana's files exactly as the tag has them, keep our folders, re-apply the seam lines, set `base` in `.orbit/seams.json`.
2. Test it. If the owner wants, tag a release candidate on the update branch (`v13.3.2+orbit.1.rc.1`) to test its image.
3. Pull request into `orbit`, merged with **"Create a merge commit"**, never squashed: the merge commit records that `orbit` now contains Grafana's tag, so the next update merges only the new changes. Say this in the pull request body.
4. After the merge, release `v13.3.2+orbit.1` from `orbit`. Nothing else changes: default branch, rulesets and settings stay.
- Details: `orbit-upstream-update` skill. Never rebase a pushed branch.
