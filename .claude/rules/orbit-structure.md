# Orbit: folders, files and names

This repository is **Orbit**, a fork of Grafana. Grafana's own guidance in `AGENTS.md` still applies to Grafana code. These rules add what is specific to Orbit and win where they are stricter. Full background: `.orbit/docs/ARCHITECTURE.md`.

## The one principle

Grafana stays as shipped. Everything we add lives in our own folders, under one name: `orbit`. Deleting the `orbit` paths and reverting the seam lines must give stock Grafana again.

## Where things go

| What | Folder |
| --- | --- |
| Frontend code | `public/app/orbit/` with `entry.ts`, `shell/`, `pages/`, `apps/`, `upstream/`, `theme/` |
| Backend code | `pkg/orbit/` (service, API under `/api/orbit/`, `migrations/` as a leaf package) |
| Fork tooling, guards, hooks | `.orbit/scripts/` |
| Seam allow-list | `.orbit/seams.json` |
| Version, changelog, compatibility | `.orbit/VERSION`, `.orbit/CHANGELOG.md`, `.orbit/COMPAT.md` |
| Docs | `.orbit/docs/` (`ARCHITECTURE.md`, `HANDOFF.md`, runbooks). Never Grafana's `docs/` |
| Design boards (source of the claude.ai design canvas) | `.orbit/design/project/` (36 `*.dc.html` + `canvas.json`), builders in `.orbit/design/tools/`, base files in `.orbit/design/pre_lifecycle/` |
| Architecture map (source of its artifact) | `.orbit/map/` |
| Exact copies of the live artifacts | `.orbit/published/`, indexed in `.orbit/artifacts.json` |
| Agent files of ours | `.claude/rules/orbit-*.md`, `.claude/skills/orbit-*/`, `.claude/settings.json`, and `AGENTS.md` + `CLAUDE.md` (`@AGENTS.md`) inside our folders |
| CI of ours | `.github/workflows/orbit-*.yml` |

## Never

- Edit a Grafana file, except a seam listed in `.orbit/seams.json`, within its line limit. A hook blocks the rest. If an upstream edit is truly needed, use the `orbit-seam-change` skill.
- Edit Grafana's agent files: root `CLAUDE.md`, root `AGENTS.md`, any `AGENTS.md` outside our folders, Grafana's `.claude/skills/*`, `AI_POLICY.md`, `.gitignore` (OD35).
- Edit generated files by hand (`pkg/server/wire_gen.go`): change the source and run `make gen-go`.
- Edit Grafana's `CHANGELOG.md`, `package.json` version or `Makefile` version. Grafana's version stays exactly upstream.

## Names

- Settings: `[orbit]`, `[orbit.apps]`, `[orbit.audit]` in `grafana.ini`. Not Grafana feature toggles.
- Database tables: prefix `orbit_`. HTTP API: `/api/orbit/…`. User storage: `orbit-…`. CSS class prefix and i18n namespace: `orbit`.
- Files in `public/app/orbit/`: Grafana's style. Components `PascalCase.tsx`, hooks `useThing.ts`, tests next to the file as `*.test.tsx`.
- Our skills and rules start with `orbit-`. Tracked despite Grafana's `.gitignore`, so add new ones with `git add -f`.
- No app plugin ID starts with `grafana-orbit`.

## IDs used in docs, boards and commits

Each ID is unique. Boards: `R01`-`R11` reference, `S01`-`S21` screens, `P01`-`P07` page templates. Seams `SM01`-`SM14`, risks `RK01`-`RK24`, decisions `OD1`-`OD35`, triggers `T1`-`T6`, layers `L1`-`L7`. `S11` is always a board, `SM11` always a seam. Board R03 explains every ID and tag.

## Layers (frontend)

Imports point down. Only `public/app/orbit/upstream/` (L5, the anti-corruption layer) may import Grafana internals (`app/...`). `apps/` imports only `upstream/`; `shell/` and `pages/` import `apps/`, `upstream/`, `theme/`. Public packages (`@grafana/ui`, `@grafana/data`, ...) are fine everywhere. Checked by `node .orbit/scripts/check-boundaries.mjs`.

## Tools and their languages

| What | Language | How to run |
| --- | --- | --- |
| Product code (`public/app/orbit/`, `pkg/orbit/`) | TypeScript, Go (Grafana's standards) | Grafana's own commands (`yarn …`, `go test …`) |
| Guards and checks (`.orbit/scripts/`) | Node (`.mjs`) | `node .orbit/scripts/<script>.mjs` |
| Design and map builders (`.orbit/design/tools/`, `.orbit/map/`) | Python 3.13 with `playwright` 1.63, `Pillow` and Chromium | **Always through the launcher:** `sh .orbit/design/tools/py <script.py> [args]`. `build_all.sh` uses it by itself |

- Never activate a virtual environment and never call `python3` directly for design tools. The launcher picks `$ORBIT_PYTHON`, then `~/.venvs/orbit-design/bin/python`, then `python3`.
- Before design work, run `sh .orbit/design/tools/py --check`. If it fails, nothing was changed: show the owner the install commands it prints. Never install packages, browsers or Python versions yourself; the guard asks the owner first.
- Do not port the design tools to another language: their output is the published design, and the docs describe them (owner's decision, 2026-11-19).

## UI

Build from `@grafana/ui` and theme tokens first; the Grafana UI Storybook is the reference. Follow the button zones (ARCHITECTURE.md 10.11), icons from Unicons or Tabler stored as `grafana:<name>` / `tabler:<name>` (10.12), and the page templates P01-P07.

UI code follows the design canvas. A change to a screen is first made on the canvas, published for review and approved by the owner (`orbit-artifacts-sync`); product code for it starts after that design pull request is merged.
