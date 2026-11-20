# GitHub setup for the Orbit fork (owner, one time)

These are repository settings, so only the owner changes them. Agents may print these steps but never run the write commands (the guard asks first).

## 1. Base branch

The product branch is `orbit` (revision 85). It started as `orbit/13.3.1` from Grafana's tag `v13.3.1` and was renamed:

```bash
git remote set-url --push upstream DISABLE
git fetch upstream tag v13.3.1 --no-tags
```

- Already done: `orbit/13.3.1` was created from `v13.3.1`, and pull requests #1 and #2 brought in `.orbit/`, `.claude/` and `.github/workflows/orbit-*`.
- Rename it once: Settings → Branches (or the Branches page, ⋯ next to the branch) → **Rename branch** → `orbit`. GitHub moves open pull requests and redirects the old name. Git cannot hold `orbit` and `orbit/13.3.1` at the same time, so this is a rename, not a new branch.
- On each Mac clone afterwards: `git fetch --prune origin && git branch -m orbit/13.3.1 orbit && git branch -u origin/orbit orbit && git remote set-head origin -a` (`--prune` first removes the old `origin/orbit/13.3.1`, which would block `origin/orbit`).

## 2. Turn off Grafana's workflows (keep ours)

Grafana's 100+ workflows need Grafana's secrets and would run on every push. Disable them, do not delete them (deleting edits Grafana files):

```bash
gh workflow list --repo amirtaherkhani/orbit --all --limit 400 --json path,state \
  --jq '.[] | select(.state=="active") | select(.path | startswith(".github/workflows/orbit-") | not) | .path' |
while read -r p; do gh workflow disable "$(basename "$p")" --repo amirtaherkhani/orbit; done
```

Run it again after step 3, because the list follows the default branch.

## 3. Default branch and merge buttons

Settings → General → Default branch → `orbit`. It never changes again: a new Grafana release comes in through an `update/*` pull request into `orbit`.

Settings → General → Pull Requests: allow **Squash merging** and **Merge commits**, turn off **Rebase merging**. For both squash and merge commits, set "Default commit message" to **Pull request title**, so the commit on the line keeps the `orbit(<scope>): …` title. Turn on "Automatically delete head branches".

## 4. Rulesets (Settings → Rules → Rulesets)

| Ruleset | Target | Rules |
| --- | --- | --- |
| `orbit-product` | branches `orbit` and `hotfix/**` | Restrict deletions · Block force pushes · Require a pull request (0 approvals; merge methods squash and merge) · Require status checks: `guards` · Bypass: repository admin, for pull requests only |
| `main-mirror` | branch `main` | Restrict deletions · Block force pushes. No pull request rule, so "Sync fork" keeps working |
| `release-tags` | tags `v*+orbit*` | Restrict deletions · Restrict updates (a release tag is never moved) |

**Worktrees (desktop app).** Merge only on GitHub. Never press the desktop app's merge or "apply" button for a worktree session: it merges into the local `orbit`, which then differs from GitHub (the ruleset refuses to push it). Fix: `git switch orbit && git reset --hard origin/orbit`.

**Syncing `main`** (optional: updates use Grafana's tags, not `main`). GitHub's "Sync fork" button updates the branch that is open on the page, and the page opens on `orbit`. Never press it while `orbit` is shown: `orbit` has no counterpart in Grafana, so it would try to bring Grafana's `main` into `orbit` (Inferred; the `orbit-product` ruleset should block it, Not verified). Use the command, which names the branch:

```bash
gh repo sync amirtaherkhani/orbit -b main      # never with --force
```

Or switch the page to `main` first, then "Sync fork" → "Update branch".

Do not turn on "Require linear history": `update/*` pull requests need a merge commit (it records that `orbit` contains Grafana's tag).

## 5. Actions and packages

- Settings → Actions → General → Workflow permissions: "Read repository contents and packages permissions" is enough; the Orbit workflows ask for more themselves where needed (release: contents and packages write; watch: issues write).
- After the first release, open the package `orbit` on your profile → Package settings → link it to this repository, and check its visibility.

## 6. Check

- Open a test pull request from `docs/test-ci` into `orbit`: `orbit-ci / guards` must run; no Grafana workflow may run.
- Ask Claude Code to `git push --force` a test branch: the guard must refuse it.
