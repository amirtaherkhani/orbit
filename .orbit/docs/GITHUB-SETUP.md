# GitHub setup for the Orbit fork (owner, one time)

These are repository settings, so only the owner changes them. Agents may print these steps but never run the write commands (the guard asks first).

## 1. Base branch

```bash
git remote set-url --push upstream DISABLE
git fetch upstream tag v13.3.1 --no-tags
git switch -c orbit/13.3.1 v13.3.1
git push -u origin orbit/13.3.1
```

Then merge the pull request that brings in `.orbit/`, `.claude/` and `.github/workflows/orbit-*` (see `INIT-PROMPT.md`).

## 2. Turn off Grafana's workflows (keep ours)

Grafana's 100+ workflows need Grafana's secrets and would run on every push. Disable them, do not delete them (deleting edits Grafana files):

```bash
gh workflow list --repo amirtaherkhani/orbit --all --limit 400 --json path,state \
  --jq '.[] | select(.state=="active") | select(.path | startswith(".github/workflows/orbit-") | not) | .path' |
while read -r p; do gh workflow disable "$(basename "$p")" --repo amirtaherkhani/orbit; done
```

Run it again after step 3, because the list follows the default branch.

## 3. Default branch and merge buttons

Settings → General → Default branch → `orbit/13.3.1`. On each new Grafana release line, switch it to the new `orbit/<version>`.

Settings → General → Pull Requests: allow **Squash merging** and **Merge commits**, turn off **Rebase merging**. For both squash and merge commits, set "Default commit message" to **Pull request title**, so the commit on the line keeps the `orbit(<scope>): …` title. Turn on "Automatically delete head branches".

## 4. Rulesets (Settings → Rules → Rulesets)

| Ruleset | Target | Rules |
| --- | --- | --- |
| `orbit-lines` | branches `orbit/**` | Restrict deletions · Block force pushes · Require a pull request (0 approvals; merge methods squash and merge) · Require status checks: `guards` (and `frontend`, `backend`: a skipped job counts as passed) · Bypass: repository admin, only for emergencies |
| `main-mirror` | branch `main` | Restrict deletions · Block force pushes. No pull request rule, so "Sync fork" keeps working |
| `release-tags` | tags `v*+orbit*` | Restrict deletions · Restrict updates (a release tag is never moved) |

Do not turn on "Require linear history": `update/*` pull requests need a merge commit.

## 5. Actions and packages

- Settings → Actions → General → Workflow permissions: "Read repository contents and packages permissions" is enough; the Orbit workflows ask for more themselves where needed (release: contents and packages write; watch: issues write).
- After the first release, open the package `orbit` on your profile → Package settings → link it to this repository, and check its visibility.

## 6. Check

- Open a test pull request from `docs/test-ci` into `orbit/13.3.1`: `orbit-ci / guards` must run; no Grafana workflow may run.
- Ask Claude Code to `git push --force` a test branch: the guard must refuse it.
