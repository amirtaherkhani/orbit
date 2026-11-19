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
- Start every task from `orbit`: `git switch orbit && git pull --ff-only && git switch -c feat/<topic>`.
- Never commit on `main`, `orbit`, `hotfix/*` or a detached HEAD.

## Commits

- Format: `orbit(<scope>): <summary>`, summary in the imperative, under 90 characters, no full stop.
- Scopes: `seam`, `shell`, `apps`, `pages`, `acl`, `backend`, `design`, `docs`, `ci`, `release`, `update`, `tooling`.
- A commit that edits a Grafana file is a seam commit: scope `seam`, names its ID, touches that seam only: `orbit(seam): SM01 swap AppChrome import`.
- One logical change per commit. Frontend and backend in separate pull requests (Grafana's rule).
- Never `--no-verify`, never `--amend` or `rebase` on a pushed branch: add a new commit.

## Push and pull requests

- Before a push, run the checks (`orbit-git-workflow` skill), then show the owner: branch, commits, changed files, check results. Push only after the owner approves; the push prompt is that approval.
- Never force-push, never push to `upstream`, `main`, `orbit` or `hotfix/*`, never push `--tags`.
- Open a pull request into `orbit` (or the `hotfix/*` branch the owner named) with `gh pr create`, after approval. Title in commit format, since pull requests are **squash-merged** and the title becomes the commit (except `update/*`, see below).
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
