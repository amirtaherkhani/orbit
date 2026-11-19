# Init prompt for Claude Code

Use once, in Claude Code on the Mac, in `/Users/mac/Documents/GitHub/orbit`, after `orbit/13.3.1` exists on GitHub (`GITHUB-SETUP.md` step 1) and the branch `tooling/orbit-import` was pushed from claude.ai. Paste everything between the lines.

---

You are setting up the Orbit project in this repository. Orbit is a fork of Grafana; the project files (docs, design source, rules, skills, hooks, CI) are on the branch `origin/tooling/orbit-import`, which has no Grafana history. Do the steps in order and stop at every "ask me".

1. Check the starting point and report with ✔ ✘ ?:
   - `git remote -v`: `origin` is amirtaherkhani/orbit, `upstream` is grafana/grafana with its push URL `DISABLE`.
   - `git fetch origin orbit/13.3.1 tooling/orbit-import` and `git fetch upstream tag v13.3.1 --no-tags`.
   - `git rev-parse origin/orbit/13.3.1` equals `git rev-parse v13.3.1^{commit}` (the line is exactly Grafana v13.3.1 so far).
   - `node --version` satisfies `.nvmrc`; `python3 --version` is 3.10 or newer.
   If anything is ✘, stop and ask me.

2. Create the work branch and bring in the files without touching any Grafana file:
   ```bash
   git switch -c tooling/orbit-setup origin/orbit/13.3.1
   git checkout origin/tooling/orbit-import -- .orbit .claude .github
   git status --short
   ```
   `git status` must list only new files under `.orbit/`, `.claude/settings.json`, `.claude/rules/orbit-*`, `.claude/skills/orbit-*` and `.github/workflows/orbit-*`. Anything else: stop and ask me.

3. Check that everything works here (report each with ✔ ✘ ?):
   - `node .orbit/scripts/agent-guard.test.mjs` (43 cases).
   - `node .orbit/scripts/check-seams.mjs`, `check-namespace.mjs`, `check-boundaries.mjs` from `.orbit/scripts/`.
   - From `.orbit/design/`: `sh tools/build_all.sh` twice; after both runs `git status --short .orbit/design` shows no change to the committed files. Then `cmp` each file in `.orbit/design/project/` with `.orbit/published/design/project/`: all equal.
   - From `.orbit/map/`: `python3 build_map.py`; `map.html` equals `.orbit/published/map/index.html`.
   - Prepare for the latest Grafana version: for every Grafana file path with a line number in `.orbit/docs/ARCHITECTURE.md`, confirm the cited line still says what the document claims in `v13.3.1` (spot-check SM01 `public/app/routes/RoutesWrapper.tsx:9`, SM13 `pkg/server/wire_core.go:150,260`, SM14 `pkg/services/sqlstore/migrations/migrations.go:6,102`, `pkg/api/api.go:437`). List any that moved.

4. Commit (the hooks are not active yet in this session, so follow `.claude/rules/orbit-git.md` by hand):
   ```bash
   git add -f .claude/settings.json .claude/rules .claude/skills/orbit-*
   git add .orbit .github/workflows/orbit-*.yml
   git commit -m "orbit(tooling): add Orbit project files, rules, hooks and CI"
   ```

5. Ask me before pushing. Show: branch, the commit, `git diff --stat origin/orbit/13.3.1...HEAD | tail -3`, and the results of step 3. After my yes: `git push -u origin tooling/orbit-setup`, then (ask me again) `gh pr create --base orbit/13.3.1 --title "orbit(tooling): add Orbit project files, rules, hooks and CI"` with a body that lists what is added, the check results, and "Squash merge."

6. Stop with a **Status: Waiting for PR** block. Tell me to restart Claude Code after the merge, so it loads `.claude/settings.json` (hooks) and `.claude/rules/`, and then to do `GITHUB-SETUP.md` steps 2-6. Then read `.orbit/docs/HANDOFF.md` and tell me the next step.

Rules for this whole task: do not edit any Grafana file, do not merge, do not force-push, answer in the language I write in, and use ✔ ✘ ? ! ⊘ ◐ ○ for status.

---
