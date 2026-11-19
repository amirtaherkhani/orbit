# Orbit changelog

All notable changes to Orbit, the fork layer on top of Grafana. Grafana's own changes are in Grafana's `CHANGELOG.md`.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Release names: `v<grafana>+orbit.<n>` (`.claude/rules/orbit-git.md`).

## [Unreleased]

### Added
- Project files: architecture docs, design boards and builders, architecture map, guard scripts, agent rules and skills, CI workflows.

### Changed
- Design tools run through `.orbit/design/tools/py`, which finds the right Python without activating an environment and stops early when `playwright` or `Pillow` is missing.
- The agent guard asks the owner before installing packages, browsers or tool versions.
- One product branch `orbit` instead of one branch per Grafana release. A Grafana release comes in through one `update/<tag>` pull request (merge commit); new `.orbit/scripts/list-ours.mjs`; the guard protects `orbit` and `hotfix/*` and asks before `git read-tree --reset`.
