---
name: orbit-seam-change
description: Use when an Orbit change seems to need an edit to a Grafana (upstream) file, or when an existing seam SM01-SM14 must be changed. Decides whether a seam is really needed and how to add one safely.
---

# Seams: the only edits to Grafana files

A seam is a point where Orbit touches Grafana. The list is `.orbit/seams.json` and ARCHITECTURE.md section 6. Every seam costs conflict risk on every Grafana update, so a new one is the last resort.

## 1. Try without a seam first

In this order, and say in the PR which ones you tried:
1. Existing hooks and APIs: SM03 `extraRoutes`, SM04 `AppWrapper` hooks, SM05 branding, SM02 `AppChromeService` state, SM08-SM11 Preferences, nav tree, plugin files, userstorage.
2. A function in `public/app/orbit/upstream/` that reads what Grafana already exposes.
3. A table or route in `pkg/orbit/` (wired already by SM13, SM14).
4. Only then a new seam.

## 2. Propose (no edit yet)

Tell the owner: the file, the exact lines, why 1-3 do not work, how many lines change, and the effect on the deletable check. Wait for a yes.

## 3. Register

The owner approves the edit to `.orbit/seams.json` (the hook asks):

```json
{ "id": "SM15", "file": "<path>", "maxChangedLines": 2 }
```

Next free ID after the highest in the file. Same commit: the seam table in `.orbit/docs/ARCHITECTURE.md` section 6, with file, line, kind, and status Proposed.

## 4. Edit

- Change only those lines, within `maxChangedLines` (added + deleted). Prefer one import or one call into `orbit/`; all logic stays in our folders.
- One seam per commit: `orbit(seam): SM15 <what>`. Seam commits stay small so they replay cleanly on the next Grafana release.
- Generated files (`wire_gen.go`) are never edited: run the generator.

## 5. Check

```bash
node .orbit/scripts/check-seams.mjs     # shows SM15 <path>: n/limit lines
```

Then the normal checks and PR from `orbit-git-workflow`, on a `seam/<topic>` branch.

## Changing or removing a seam

Same steps. Lowering `maxChangedLines` or removing a seam needs only the owner's approval. When Grafana changes a seam line in an update, re-apply our line in the `update/*` branch (`orbit-upstream-update`).
