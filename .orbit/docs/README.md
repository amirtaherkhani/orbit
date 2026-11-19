# Orbit: design boards and architecture

Design and architecture work for a custom UI layered on **Grafana v13.3.1** (checked against v13.3.0; cited files compared with v13.3.1): a shell with a dock, apps (Monitoring, Management, Maintenance, Quality, Energy), pages, sub pages and tabs, and page bookmarks.

**Status:** design and research done for this phase; repository rules, hooks and CI in place. No product code has been written, type-checked or tested (see `ARCHITECTURE.md`, status block). Start with `HANDOFF.md`.

## Layout

| Path | What it is |
| --- | --- |
| `.orbit/design/project/` | The design canvas: `canvas.json` (board positions, row titles, order) and 36 board files (`*.dc.html`; R01-R11, S01-S21 without S05, S09 and S17, P01-P07). Same files as the live claude.ai artifact (`.orbit/published/`, `.orbit/artifacts.json`). |
| `.orbit/docs/ARCHITECTURE.md` | Overlay architecture, upstream sync, apps model, seams, risks, open decisions (OD1 onwards), revision notes, and a traceability table from boards to modules (section 21). |
| `.orbit/design/tools/` | The build chain for the generated boards (`build_all.sh`) and its helpers; base files in `.orbit/design/pre_lifecycle/`. One-off scripts in `tools/oneoff/`: do not run. |
| `.orbit/map/` | The architecture map builder (`build_map.py`). |
| `.orbit/scripts/`, `.claude/`, `.github/workflows/orbit-*` | Guards, agent rules and skills, hooks, CI. See `.claude/rules/orbit-git.md`. |

## The app lifecycle (decided 2026-11-16)

Apps are installed with `grafana-cli`. The UI then takes each app through Initialize, Review, Setup, Validate, Enable and Migrate, with 13 lifecycle statuses. App health runs after Enable (Grafana answers it only for an enabled app). Button positions follow Grafana (section 10.11, boards P01 and P07). See `ARCHITECTURE.md`, section 10.9, and board R10.

## The apps model (decided 2026-11-06)

- **App**: a plugin with its own accent colour. The app home (`defaultNav`) is not a bookmark.
- **Page**: a nav item below the app with a URL. Can be bookmarked.
- **Sub page**: a child of a page. Can be bookmarked.
- **Tab**: `pageNav` inside a page. Not a bookmark.

Details, the Grafana v13.3.0 code it was checked against, and the open decision OD22 (nesting in our own code versus enabling `grafana.pluginPathNesting`) are in `ARCHITECTURE.md`, section 10.

## Viewing the boards

The boards are design-canvas files, not plain web pages: they use `{{ }}` holes, `<sc-if>` / `<sc-for>` and a `class Component extends DCLogic` block, and need the Claude Design runtime to render. To view them, publish the contents of `design/` as the `project/` folder of a Design artifact.

For a static snapshot of one board in a given state (needs Node):

```sh
sh tools/py tools/dcrender.py project/AppsPin.dc.html out.html '{}'   # from .orbit/design/
```

The last argument is a JSON object merged into the component state before `renderVals()` runs.

## UI reference

New layouts and components start from Grafana UI and its design principles; the current designs stay as they are. Preview components in the Grafana UI Storybook:
https://developers.grafana.com/ui/latest/index.html?path=/docs/docs-overview-intro--docs
How to use it: `ARCHITECTURE.md`, section 4.1. Icons: section 10.12. Button positions: section 10.11.

## Names and versions (decided 2026-11-17)

- **Namespace `orbit`:** everything the fork adds uses this one name: `.orbit/`, `public/app/orbit/`, `pkg/orbit/`, branches `orbit/<grafana version>` (one per Grafana release, e.g. `orbit/13.3.1`), `grafana.ini` sections `[orbit]` and `[orbit.apps]`, tables `orbit_*`, API `/api/orbit/…`, skills `.claude/skills/orbit-*`. Checked: no Grafana path or setting uses it.
- **Versions:** Grafana's version stays upstream (`13.3.1`). Fork releases are `v13.3.1+orbit.<n>` (git) and `13.3.1-orbit.<n>` (Docker); release candidates `v13.3.1+orbit.<n>.rc.<m>`. The Orbit API version is a separate SemVer in `.orbit/VERSION` (0.1.0 until v1).
- **AI files:** Grafana's `CLAUDE.md`, `AGENTS.md`, skills and `.gitignore` are never edited; ours sit in our own folders.
- Details: `ARCHITECTURE.md`, sections 13.4-13.6.

## Tools

- **Prerequisites (once per machine):** Python 3.13 in a virtual environment outside the repository, with `playwright` 1.63, `Pillow` and Chromium, plus Node (already needed by Grafana):
  ```sh
  uv venv --seed ~/.venvs/orbit-design --python 3.13      # or: python3.13 -m venv ~/.venvs/orbit-design
  ~/.venvs/orbit-design/bin/python -m pip install playwright==1.63.0 pillow
  ~/.venvs/orbit-design/bin/python -m playwright install chromium
  ```
  These are the versions the published boards were built with. A newer Python (3.15) may lack ready packages, so keep 3.13 here.
- **No activation needed:** every tool runs through `sh tools/py <script.py>`, which picks `$ORBIT_PYTHON`, then `~/.venvs/orbit-design/bin/python`, then `python3`. `sh tools/py --check` tells you whether the packages are there; `build_all.sh` runs that check first and stops before changing any file.
- Board heights are measured in a headless browser with the machine's fonts. A build on macOS can differ by a few pixels from the published boards, which were built on Linux; do not commit such differences without checking them.
- `tools/build_all.sh` is the only way to rebuild the generated boards. It runs, in order: `lc_s12`, `lc_flow`, `lc_s15`, `lc_r10`, `lc_refs`, `lc_misc`, `lc_s17`, `lc_od28`, `lc_post`, `lc_r12`, `tpl_build`, `lc_fit`. Each builder starts from a fixed snapshot, so the chain can run any number of times. Running one step alone is refused or gives a partial result.
- `lifecycle_kit.py` holds the 13 statuses, their seven colour groups, icons and lifecycle buttons.
- `lc_r12.py` applies the button zones and the `PageTreeRow` component; `tpl_build.py` builds the page templates P03-P07 and the button zone table on P01; `lc_fit.py` fits every board's height and keeps an 80px gap between canvas rows.
- `ARCHITECTURE.md` is edited directly. The retired builders were not moved into the repository: they would undo later decisions.
- The scripts find their folders from their own location (`ROOT` at the top of each), so run them from anywhere inside the repository. Run `build_all.sh` twice: the second run must change nothing.

## Not included

- The Design artifact type's own runtime files (`SKILL.md`, `artifact-type/`, `index.html`). They are published by the type, not authored here.
- Backup folders, `*.before-*.html` snapshots, screenshots and render output (`.orbit/.gitignore`).
- The legacy tablet and mobile variants (`*_t`, `*_m`), `AppsRepo`, `AppsRepoManage` and `ExtDock` were deleted on 2026-11-16 (old concepts).
