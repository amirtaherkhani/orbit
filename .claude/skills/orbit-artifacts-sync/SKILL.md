---
name: orbit-artifacts-sync
description: Use when changing the Orbit design boards or the architecture map, when publishing them to claude.ai, or when copying changes made on claude.ai back into the repo (.orbit/design, .orbit/map, .orbit/published, .orbit/artifacts.json).
---

# Design canvas and architecture map

The repo is the source. claude.ai shows and shares the result.

| Artifact | Source in the repo | Built by | Live copy |
| --- | --- | --- | --- |
| Design canvas "Grafana UI Redesign Prototype" | `.orbit/design/project/` (59 boards + `canvas.json`) | `sh .orbit/design/tools/build_all.sh` | `.orbit/published/design/project/` |
| "Grafana Architecture Map" | `.orbit/map/build_map.py` | `sh .orbit/design/tools/py .orbit/map/build_map.py` | `.orbit/published/map/index.html` |

Slugs, URLs, last published versions and file hashes: `.orbit/artifacts.json`.

## Before you start

```bash
sh .orbit/design/tools/py --check
```

The design tools are Python and always run through this launcher; never activate a virtual environment or call `python3` yourself. If the check fails, stop and show the owner the install commands it prints (Python 3.13 in `~/.venvs/orbit-design`, `playwright` 1.63, `Pillow`, Chromium). Board heights depend on the fonts of the machine: if a build on another machine changes files in `.orbit/design/project/`, do not commit them; report them to the owner.

## Where to run it

Claude Code in a Terminal session, signed in with `/login` to the owner's claude.ai account. There the `Artifact` tool reads and republishes both artifacts (checked 2026-11-19, Claude Code 2.1.327). The desktop app and the agent view do not offer it; the owner does not switch to a claude.ai chat for this.

- Map: one file, `index.html`. Before republishing, read the whole live page once.
- Canvas: made from the Design type. Only the `project/` files are ours; the type's files (`SKILL.md`, `index.html`, `artifact-type/*`) cannot be changed. Read the type's `SKILL.md` once before the first change in a session. Publish only the changed `project/` files.
- Both refuse a publish over a newer live version: then read again, and stop and tell the owner if the live files differ from `.orbit/published/` (someone changed them on claude.ai).

## Change a board or the map (owner's decision, 2026-11-19: review on the live canvas before implementation)

1. Work branch `design/<topic>`.
2. Edit the builder in `.orbit/design/tools/` (boards start from `.orbit/design/pre_lifecycle/`), never only the output: the next build would overwrite a hand edit.
3. Build twice; the second build must change nothing. Render and look: `sh tools/py tools/shot.py <Board>.dc.html` from `.orbit/design/`; the map: `sh .orbit/design/tools/py .orbit/map/shot_map.py`.
4. Check the live version against `.orbit/artifacts.json` (`list_files`, sha256). Different means changes on claude.ai: bring them back first (below).
5. **Review publish**: publish only the changed files to the live artifact, from this branch. Give the owner the link and the list of changed boards, then wait. Nothing is recorded in `.orbit/published/` yet.
6. Owner says no: fix and publish again, or put the previous files back by publishing them from `.orbit/published/`.
7. Owner says yes: update the docs the change touches, add a revision note in `.orbit/docs/ARCHITECTURE.md`, copy the published files into `.orbit/published/`, update `.orbit/artifacts.json` (version, date, sha256), commit `orbit(design): <what>`, checks, then push and PR (automatic when the checks pass). The merge is the backup.
8. Product code for the change starts only after that merge.

## Bring back changes made on claude.ai

The owner may move boards or leave comments on claude.ai. When asked, or when step 4 finds a difference: read the live file list (`list_files`), compare hashes with `artifacts.json`, copy changed files into `.orbit/published/` and, for `canvas.json` positions, into `.orbit/design/project/`, then commit on `design/sync-<date>`. Comments stay on claude.ai; list open ones in the PR body. A new live version number with identical files only needs the number updated in `artifacts.json`.

## Never

- Record a review publish in `.orbit/published/` or `artifacts.json` before the owner said yes.
- Publish to the type's files, or publish a file you did not read or build in this session.
- Edit `.orbit/published/` by hand: it is a copy of what is live.
