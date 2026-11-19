#!/usr/bin/env node
// Claude Code SessionStart hook: prints where the session stands, so the agent starts from the right branch.
// Output goes into the agent's context. Keep it short.
import { git, repoRoot, loadSeams, PROTECTED_BRANCH } from './lib.mjs';

const root = process.env.CLAUDE_PROJECT_DIR || repoRoot(process.cwd());
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
process.stdout.write(lines.join('\n') + '\n');
