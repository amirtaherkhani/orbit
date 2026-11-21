---
name: orbit-release
description: Use when the owner asks to cut an Orbit release or release candidate (tag v<grafana>+orbit.<n> or v<grafana>+orbit.<n>.rc.<m>, Docker image on GHCR), or asks what the next release number is.
---

# Orbit release

Formats: `.claude/rules/orbit-git.md` (Tags and releases). Only when the owner asks.

## 1. Work out the number

```bash
git fetch origin --tags
node -e "console.log(JSON.parse(require('fs').readFileSync('.orbit/seams.json')).base)"   # Grafana base, e.g. v13.3.1
git tag --list 'v13.3.1+orbit.*' --sort=-v:refname | head -5
```

- Next release: `n` = highest released `n` for this Grafana base + 1 (1 after a Grafana update). The tag's Grafana version is always `base` in `.orbit/seams.json` of the tagged commit.
- Release candidate: same coming `n`, `m` = highest `.rc.<m>` for it + 1.
- Check that the base tag is merged: `git merge-base --is-ancestor v13.3.1 origin/orbit`.

## 2. Release pull request (skip for a release candidate)

On `release/v13.3.1-orbit.1`:
- `.orbit/CHANGELOG.md`: move `## [Unreleased]` items under `## [v13.3.1+orbit.1] - <YYYY-MM-DD>`, leave an empty Unreleased.
- `.orbit/VERSION`: raise the Orbit API version by the rule (major, minor, patch; `0.x` until v1).
- `.orbit/COMPAT.md`: add a row: fork release, Grafana base, Orbit API version, lowest `ui.json` `schemaVersion`.
- Commit `orbit(release): v13.3.1+orbit.1`, run the checks, then push and PR (automatic when the checks pass). Squash merge by the owner; the tag push still asks.

## 3. Tag (after the owner merged the release PR; a release candidate can also be tagged on an `update/*` branch to test a new Grafana version)

```bash
git fetch origin
git tag -a v13.3.1+orbit.1 origin/orbit -m "Orbit v13.3.1+orbit.1 (Grafana v13.3.1, Orbit API 0.2.0)"
git push origin v13.3.1+orbit.1          # the owner approves; this starts orbit-release.yml
```

The guard refuses tags that do not match the format, `--tags`, and deleting or moving tags.

## 4. What CI does

`orbit-release.yml` builds Grafana with Orbit from the tag (`Dockerfile`), pushes `ghcr.io/amirtaherkhani/orbit:13.3.1-orbit.1` (`-rc.<m>` for candidates), and creates the GitHub release with the changelog section; candidates are marked pre-release. Report the run with a **Status: Waiting for CI** block and the run link; do not re-run or delete anything without the owner.

## If a release is broken

Never move or delete the tag. Fix on a `fix/` branch and release `n + 1`.
