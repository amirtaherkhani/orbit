#!/usr/bin/env node
// Claude Code SessionStart hook: prints where the session stands, so the agent starts from the right branch.
// Output goes into the agent's context. Keep it short.
import { execFileSync } from 'node:child_process';
import { git, repoRoot, loadSeams, PROTECTED_BRANCH } from './lib.mjs';

// main: the owner's checkout (CLAUDE_PROJECT_DIR). root: where this session works, the main checkout or a worktree.
const main = process.env.CLAUDE_PROJECT_DIR || repoRoot(process.cwd());
const root = repoRoot(process.cwd()) || main;
const notes = syncMain();
const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], root) || '?';
const seams = loadSeams(root);
const dirty = (git(['status', '--porcelain'], root) || '').split('\n').filter(Boolean).length;
const tags = (git(['tag', '--list', 'v[0-9]*', '--sort=-v:refname'], root) || '').split('\n').filter((t) => t && !t.includes('+orbit') && !/-/.test(t));
const newest = tags[0];
const lines = [
  'Orbit project (Grafana fork). Rules: .claude/rules/orbit-*.md. Skills: orbit-git-workflow, orbit-upstream-update, orbit-seam-change, orbit-release, orbit-artifacts-sync.',
  `Branch: ${branch}${dirty ? ` (${dirty} uncommitted change(s))` : ''}. Grafana base: ${seams.base ?? 'unknown'}.`,
];
if (PROTECTED_BRANCH.test(branch) || branch === 'HEAD') {
  lines.push(`${branch} is protected: do not commit here. Start work with: git switch -c <type>/<topic> (feat, fix, seam, design, docs, update, release, ci, tooling)`);
}
if (newest && seams.base && newest !== seams.base && git(['merge-base', '--is-ancestor', newest, 'HEAD'], root) === null) {
  lines.push(`Grafana tag ${newest} is newer than the base ${seams.base} and not merged yet. Tell the owner; use the orbit-upstream-update skill only when asked.`);
}
if (root !== main) {
  lines.push(`This session works in a worktree (${root}). It ends with: push the work branch, open a pull request into orbit. Never merge into orbit locally.`);
}
lines.push(...notes);
process.stdout.write(lines.join('\n') + '\n');

// Bring the owner's main checkout up to date with origin/orbit, so the guard, rules and skills of the next session are current.
// Only a fast-forward of a clean checkout that is on orbit: never a merge, never touching local work.
function syncMain() {
  try {
    execFileSync('git', ['fetch', '--quiet', 'origin', 'orbit'], { cwd: main, stdio: 'ignore', timeout: 20000 });
  } catch {
    return ['! Could not fetch origin/orbit (offline?). Start work branches from origin/orbit after a git fetch.'];
  }
  const head = git(['rev-parse', 'HEAD'], main);
  const remote = git(['rev-parse', 'origin/orbit'], main);
  if (!head || !remote || head === remote) {
    return [];
  }
  const onOrbit = git(['rev-parse', '--abbrev-ref', 'HEAD'], main) === 'orbit';
  const clean = (git(['status', '--porcelain', '--untracked-files=no'], main) || '') === '';
  const behind = git(['merge-base', '--is-ancestor', head, remote], main) !== null;
  if (onOrbit && clean && behind) {
    try {
      execFileSync('git', ['merge', '--ff-only', '--quiet', 'origin/orbit'], { cwd: main, stdio: 'ignore', timeout: 20000 });
      return [`Main checkout moved forward to origin/orbit (${remote.slice(0, 7)}). Rule and guard changes in it apply from the next session.`];
    } catch {
      return ['! Main checkout could not fast-forward to origin/orbit. Tell the owner.'];
    }
  }
  if (onOrbit && !behind) {
    return ['! Local orbit has commits that are not on GitHub (a local merge?). Tell the owner; the fix, after saving any work: git switch orbit && git reset --hard origin/orbit.'];
  }
  return ['Main checkout is not on a clean orbit, so it was not updated. Start work branches from origin/orbit.'];
}
