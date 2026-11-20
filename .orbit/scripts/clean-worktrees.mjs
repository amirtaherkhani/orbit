#!/usr/bin/env node
// Finds worktrees whose work is already merged on GitHub, and removes them only with --apply.
// Safe to remove = a clean worktree on a work branch whose merged pull request has exactly the
// worktree's commit as its head. Squash merges hide this from `git branch --merged`, so we ask GitHub.
// Never touches the main checkout, the worktree this command runs in, or a branch with unpushed commits.
// Usage: node .orbit/scripts/clean-worktrees.mjs           (report only)
//        node .orbit/scripts/clean-worktrees.mjs --apply   (the owner approves; removes the safe ones)
import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { git, repoRoot, PROTECTED_BRANCH } from './lib.mjs';

const apply = process.argv.includes('--apply');
const here = realpathSync(repoRoot(process.cwd()));
const list = git(['worktree', 'list', '--porcelain'], here) || '';
const trees = list.split('\n\n').filter(Boolean).map((block) => {
  const t = {};
  for (const line of block.split('\n')) {
    const [k, ...v] = line.split(' ');
    t[k] = v.join(' ') || true;
  }
  return { path: t.worktree, head: t.HEAD, branch: (t.branch || '').replace('refs/heads/', ''), main: false };
});
if (trees.length) {
  trees[0].main = true; // git lists the main checkout first
}

function mergedPullRequests(branch) {
  try {
    const out = execFileSync('gh', ['pr', 'list', '--state', 'merged', '--head', branch, '--json', 'number,headRefOid'], { cwd: here, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 30000 });
    return JSON.parse(out);
  } catch {
    return null;
  }
}

const safe = [];
for (const t of trees) {
  const label = `${t.path} [${t.branch || 'detached'}]`;
  if (t.main) {
    continue;
  }
  if (realpathSync(t.path) === here) {
    console.log(`○ ${label}: this session's own worktree; remove it after the session ends`);
    continue;
  }
  if (!t.branch || PROTECTED_BRANCH.test(t.branch)) {
    console.log(`? ${label}: no work branch; check it by hand`);
    continue;
  }
  if ((git(['status', '--porcelain'], t.path) || '') !== '') {
    console.log(`! ${label}: has uncommitted changes; kept`);
    continue;
  }
  const prs = mergedPullRequests(t.branch);
  if (prs === null) {
    console.log(`? ${label}: could not ask GitHub (gh); kept`);
    continue;
  }
  const pr = prs.find((p) => p.headRefOid === t.head);
  if (!pr) {
    console.log(`! ${label}: no merged pull request with this exact commit (unpushed or unmerged work); kept`);
    continue;
  }
  console.log(`✔ ${label}: merged in PR #${pr.number}; safe to remove`);
  safe.push(t);
}

if (!apply) {
  console.log(safe.length ? `\nRun with --apply to remove ${safe.length} worktree(s) and their branches.` : '\nNothing to remove.');
  process.exit(0);
}
for (const t of safe) {
  execFileSync('git', ['worktree', 'remove', t.path], { cwd: here, stdio: 'inherit' }); // refuses if anything changed meanwhile
  execFileSync('git', ['branch', '-D', t.branch], { cwd: here, stdio: 'inherit' }); // -D: squash merges look unmerged to git
  console.log(`✔ removed ${t.path} and ${t.branch}`);
}
