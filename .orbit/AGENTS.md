# AGENTS.md for .orbit/

This folder holds everything of Orbit that is not product code: docs, design source, tooling, guards and release files. Product code lives in `public/app/orbit/` and `pkg/orbit/`.

Read first: `.claude/rules/orbit-structure.md` and `.claude/rules/orbit-git.md`. Start a new session with `docs/HANDOFF.md`.

| Path | What | How it changes |
| --- | --- | --- |
| `docs/ARCHITECTURE.md` | The architecture and every decision (OD), risk (RK), seam (SM) | Edit, then add a numbered revision note at the end |
| `docs/HANDOFF.md` | Where the project stands and what is next | Keep current when a phase ends |
| `design/` | Source of the claude.ai design canvas | Through the builders only (`orbit-artifacts-sync`) |
| `map/` | Source of the architecture map | `python3 map/build_map.py` |
| `published/`, `artifacts.json` | Exact copies of what is live on claude.ai | Only after publishing |
| `scripts/` | Guard hook and CI checks | Owner approves every change; run `node scripts/agent-guard.test.mjs` |
| `seams.json` | Allowed edits to Grafana files | Owner approves (`orbit-seam-change`) |
| `VERSION`, `CHANGELOG.md`, `COMPAT.md` | Orbit API version and release history | `orbit-release` and one changelog line per PR |

Writing: English, Markdown, plain words. Mark claims as Verified, Inferred, Not verified or Proposed, and cite file and line for Verified ones.
