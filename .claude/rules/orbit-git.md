# Orbit: branches, commits, pull requests, tags and releases

These rules are enforced. `.orbit/scripts/agent-guard.mjs` runs before every shell command and file edit and blocks what breaks them; CI checks them again on every pull request. Do not try to get around a block: report it to the owner.

## Remotes

- `origin` is `amirtaherkhani/orbit`. `upstream` is `grafana/grafana`: fetch only, never push.
- Fetch Grafana tags one at a time: `git fetch upstream tag v13.3.2 --no-tags`.

## Branches

| Branch | What it is | Who changes it |
| --- | --- | --- |
| `main` | Mirror of Grafana's `main`. Never commit to it | The owner, with GitHub's "Sync fork" |
| `orbit/<grafana version>`, e.g. `orbit/13.3.1` | A product line: one Grafana release tag plus our commits. One line per Grafana release, patch releases included | Created by the owner from the tag; then only through pull requests the owner merges |
| `<type>/<topic>` | Short-lived work branch, one pull request | You |

- Work branch types: `feat`, `fix`, `seam`, `design`, `docs`, `update`, `release`, `ci`, `tooling`. Topic in lowercase with hyphens: `feat/dock-bookmarks`, `update/v13.3.2`, `release/v13.3.1-orbit.1`.
- Start every task from the current product line, the newest `orbit/*` (the repository's default branch; its version is `base` in `.orbit/seams.json`): `git switch orbit/13.3.1 && git pull && git switch -c feat/<topic>`.
- Older lines stay for rollback and are not changed, unless the owner asks for a fix on one.
- Never commit on `main`, `orbit/*` or a detached HEAD.

## Commits

- Format: `orbit(<scope>): <summary>`, summary in the imperative, under 90 characters, no full stop.
- Scopes: `seam`, `shell`, `apps`, `pages`, `acl`, `backend`, `design`, `docs`, `ci`, `release`, `update`, `tooling`.
- A commit that edits a Grafana file is a seam commit: scope `seam`, names its ID, touches that seam only: `orbit(seam): SM01 swap AppChrome import`.
- One logical change per commit. Frontend and backend in separate pull requests (Grafana's rule).
- Never `--no-verify`, never `--amend` or `rebase` on a pushed branch: add a new commit.

## Push and pull requests

- Before a push, run the checks (`orbit-git-workflow` skill), then show the owner: branch, commits, changed files, check results. Push only after the owner approves; the push prompt is that approval.
- Never force-push, never push to `upstream`, `main` or `orbit/*`, never push `--tags`.
- Open a pull request into the current `orbit/<grafana version>` with `gh pr create`, after approval. Title in commit format, since pull requests are **squash-merged** and the title becomes the commit (except `update/*`, see below).
- Every pull request adds one line under `## [Unreleased]` in `.orbit/CHANGELOG.md`, unless it changes only docs or CI.
- Never merge. Merging is the owner's job. When checks are green, say the pull request is ready and stop.

## Tags and releases

| Kind | Git tag | Docker image (GHCR) |
| --- | --- | --- |
| Release | `v<grafana>+orbit.<n>`, e.g. `v13.3.1+orbit.1` | `ghcr.io/amirtaherkhani/orbit:13.3.1-orbit.1` |
| Release candidate | `v<grafana>+orbit.<n>.rc.<m>`, e.g. `v13.3.1+orbit.2.rc.1` | `…:13.3.1-orbit.2-rc.1` |

- `<grafana>` is the version of the line, the same as its branch name and the `base` in `.orbit/seams.json` (`orbit/13.3.1` releases `v13.3.1+orbit.<n>`). `<n>` counts our releases on that line and starts at 1 on each new line. `<m>` counts candidates for the coming `<n>`.
- Tags are annotated, made on the product line after the release pull request is merged, and never moved or deleted.
- Grafana's own version never changes. The Orbit API version in `.orbit/VERSION` follows SemVer: major when apps or users break (`ui.json`, `/api/orbit`, `orbit_` tables), minor for features, patch for fixes. It is `0.x` until v1.
- A release is prepared with the `orbit-release` skill. Pushing the tag starts `orbit-release.yml`, which builds the image and the GitHub release; the owner approves that push.

## Grafana updates

Every Grafana release, patch, minor or major, gets its own line (owner's decision, 2026-11-19):
1. The owner creates `orbit/13.3.2` from Grafana's tag `v13.3.2`.
2. You copy our commits from the current line onto a work branch `update/v13.3.2` made from it, and set `base` in `.orbit/seams.json`.
3. Pull request into `orbit/13.3.2`, merged with **"Create a merge commit"**, never squashed: a squash would fold all our commits into one, and seam commits must stay separate so the next copy replays cleanly. Say this in the pull request body.
4. The owner makes `orbit/13.3.2` the default branch. The old line stays as it is.
- Details: `orbit-upstream-update` skill. Never rebase a pushed branch.
