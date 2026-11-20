# Orbit changelog

All notable changes to Orbit, the fork layer on top of Grafana. Grafana's own changes are in Grafana's `CHANGELOG.md`.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Release names: `v<grafana>+orbit.<n>` (`.claude/rules/orbit-git.md`).

## [Unreleased]

### Added
- Design canvas: R12 · Component catalog and `.orbit/design/components.json`, one contract per shared component (props, states, events and keys, data), rendered by `lc_components` onto R12, R06–R11 and the R03 naming table.
- Design canvas: board S22 Menu flow (Home, Menu, Apps, Page with a state switcher), a flow link on S04, S06, S08, S11 and S20, and its row in R03; for review before any product code.
- Project files: architecture docs, design boards and builders, architecture map, guard scripts, agent rules and skills, CI workflows.

### Changed
- Design tools run through `.orbit/design/tools/py`, which finds the right Python without activating an environment and stops early when `playwright` or `Pillow` is missing.
- The agent guard asks the owner before installing packages, browsers or tool versions.
- One product branch `orbit` instead of one branch per Grafana release. A Grafana release comes in through one `update/<tag>` pull request (merge commit); new `.orbit/scripts/list-ours.mjs`; the guard protects `orbit` and `hotfix/*` and asks before `git read-tree --reset`.
- The agent guard judges a file against the work tree that holds it, so sessions in a Claude Code worktree (`.claude/worktrees/<name>`) can write Orbit files there; Grafana files there stay read-only.
