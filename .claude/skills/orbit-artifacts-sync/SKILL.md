---
name: orbit-artifacts-sync
description: Use when changing the Orbit design boards or the architecture map, when publishing them to claude.ai, or when copying changes made on claude.ai back into the repo (.orbit/design, .orbit/map, .orbit/published, .orbit/artifacts.json).
---

# Design canvas and architecture map

The repo is the source. claude.ai shows and shares the result.

| Artifact | Source in the repo | Built by | Live copy |
| --- | --- | --- | --- |
| Design canvas "Grafana UI Redesign Prototype" | `.orbit/design/project/` (36 boards + `canvas.json`) | `sh .orbit/design/tools/build_all.sh` | `.orbit/published/design/project/` |
| "Grafana Architecture Map" | `.orbit/map/build_map.py` | `python3 .orbit/map/build_map.py` | `.orbit/published/map/index.html` |

Slugs, URLs, last published versions and file hashes: `.orbit/artifacts.json`.

## Change a board or the map

1. Work branch `design/<topic>`.
2. Edit the builder in `.orbit/design/tools/` (boards start from `.orbit/design/pre_lifecycle/`), never only the output: the next build would overwrite a hand edit.
3. Build twice; the second build must change nothing (`git status` clean after it). Render and look: `python3 tools/shot.py <Board>.dc.html` from `.orbit/design/`.
4. Update the docs the change touches and add a revision note in `.orbit/docs/ARCHITECTURE.md`.
5. Commit `orbit(design): <what>`, checks, ask, push, PR.

## Publish (after the owner merged the PR)

Publishing needs the claude.ai artifact tools. If this session has them (`publish_files`), publish only the changed files with the version in `artifacts.json` as the base version; otherwise tell the owner to ask a claude.ai session: "Publish .orbit/design from the current orbit line". After publishing, copy the published files into `.orbit/published/`, update `artifacts.json` (version, date, sha256) and commit `orbit(design): record published version <version>`.

## Bring back changes made on claude.ai

The owner may move boards or leave comments on claude.ai. When asked to sync: read the live file list (`list_files`), compare hashes with `artifacts.json`, copy changed files into `.orbit/published/` and, for `canvas.json` positions, into `.orbit/design/project/`, then commit on `design/sync-<date>`. Comments stay on claude.ai; list open ones in the PR body.

## Never

- Publish from a branch that is not merged.
- Edit `.orbit/published/` by hand: it is a copy of what is live.
