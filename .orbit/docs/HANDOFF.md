# Orbit handoff

Read this first in a new session. It replaces the design chat on claude.ai (2026-10-31 to 2026-11-19), which cannot be moved. Details and every decision: `ARCHITECTURE.md` (revision notes 1-85).

## What Orbit is

A fork of Grafana OSS (`github.com/amirtaherkhani/orbit`, public) for a production-line monitoring product. It replaces Grafana's frame (side menu, top bar) with a new shell: a dock, a menu sheet, an app switcher and a breadcrumb. It adds **apps** (Grafana app plugins with an Orbit lifecycle: Initialize, Review, Setup, Validate, Enable, Migrate) and page **bookmarks**. Grafana itself stays as shipped: our code is in `public/app/orbit/` and `pkg/orbit/`, and Grafana files change only at the seams in `.orbit/seams.json`.

## Where it stands (2026-11-19)

| Area | Status |
| --- | --- |
| Architecture (`ARCHITECTURE.md`) | ✔ Written and checked against Grafana v13.3.0; cited files compared with v13.3.1 (51 of 52 identical, one line number moved) |
| Design canvas, 36 boards (claude.ai) | ✔ Done for this phase; source in `.orbit/design/`, live version in `.orbit/artifacts.json` |
| Architecture map (claude.ai) | ! Source current to revision note 85; the live artifact still shows revision 83 (publish after this branch is merged) |
| Repository rules, skills, hooks, CI | ✔ In `orbit` (PR #1, #2); guard has 55 passing tests; `orbit-ci / guards` ran green on PR #1 and #2 |
| Branch model | One product branch `orbit` (revision 85); Grafana releases come in by `update/<tag>` pull requests with a merge commit |
| Product code (`public/app/orbit/`, `pkg/orbit/`) | ○ Not started. Nothing is built, type-checked or tested (RK01) |
| GitHub settings | ✔ Grafana workflows off · ✔ merge buttons (squash and merge commit, PR title as message) · ○ rename `orbit/13.3.1` → `orbit`, default branch `orbit`, rulesets (`GITHUB-SETUP.md` 1, 3, 4) |

## Next steps, in order

1. Owner: finish `GITHUB-SETUP.md` (rename to `orbit`, default branch, rulesets). Then publish the architecture map (`orbit-artifacts-sync`).
2. v0.1 spike (ARCHITECTURE.md section 16): SM01 shell swap behind the kill switch (OD1 still open), `orbit/entry.ts`, an empty `AppShell` that renders the stock chrome; prove RK02 (import-time routes) and RK13 (Jest, tsconfig, rspack pick up `public/app/orbit`).
3. v0.4 spike: `pkg/orbit` wiring (SM13, SM14) and `orbit_app_lifecycle`; prove RK24 on SQLite, MySQL and PostgreSQL.
4. Write the deletable check script and the contract-test folder (`public/app/orbit/__tests__/contract`), both described in 13.3 but not written.

Open decisions with the version that needs them: ARCHITECTURE.md section 20 (OD1, OD3-OD9, OD13, OD16, OD19, OD22, OD25, OD26, OD30). Unverified items: section 15 (RK01-RK24).

## How the owner works (keep doing this)

- Language follows the owner's message: English, or Farsi (right-to-left fixed) when he writes in Farsi. Technical terms in English. Docs and code always in English Markdown.
- Status symbols ✔ ✘ ? ! ⊘ ◐ ○ and → only, never emoji or checkboxes. ✔ only for something actually checked.
- Ask before changing any UI or UX behaviour, docs or designs when something is open or unclear. For concept changes, send a review first and apply after acceptance.
- Keep boards, reference specs and docs in sync; every design or doc change gets a numbered revision note.
- Separate Verified, Inferred, Not verified and Proposed. Cite file and line for Verified.
- Never expose secrets. Never claim work that was not done.
- Buttons follow Grafana's own layout (zones in 10.11). Icons: Unicons plus Tabler (10.12). Components from `@grafana/ui`, checked against the Grafana UI Storybook.
- Git: commit on work branches, ask before every push, never merge (`.claude/rules/orbit-git.md`).

## Artifacts on claude.ai

| Artifact | Link | Source |
| --- | --- | --- |
| Grafana UI Redesign Prototype (design canvas) | https://claude.ai/artifact/Ws6sBN15bhF8SpMd1nbUEY | `.orbit/design/` |
| Grafana Architecture Map | https://claude.ai/artifact/EPLoHu8XdqusP6VrmsUVUU | `.orbit/map/` |

Publishing needs a claude.ai session with the artifact tools (`orbit-artifacts-sync` skill). Backup of changes made on claude.ai: by that skill on request; a scheduled daily copy is not set up (owner has not decided).

## Known gaps

- The architecture map's footer and some board tags say "v13.3.0": correct for what was checked; the line itself is now based on v13.3.1.
- `orbit-ci.yml` has no deletable check yet, and actions are pinned to major versions, not commit SHAs.
- Design tools need Python 3.13 with `playwright` and `Pillow` (`.orbit/docs/README.md`, Tools); they run through `sh .orbit/design/tools/py`, never with an activated environment.
- One-off scripts in `.orbit/design/tools/oneoff/` were used once (ID rename, 2026-11-17) and are kept for the record; do not run them.
