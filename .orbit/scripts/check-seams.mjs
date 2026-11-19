#!/usr/bin/env node
// Seam allow-list and AI-file check (ARCHITECTURE.md 13.3).
// Usage: node .orbit/scripts/check-seams.mjs [--base <ref>] [--head <ref>]
// Every path changed between the base Grafana tag and HEAD must be ours, a listed seam within its line limit,
// or a generated file. Grafana's agent files must not change. Deleted or renamed Grafana files fail.
import { git, repoRoot, loadSeams, isOurs, isGrafanaAiFile } from './lib.mjs';

const arg = (k) => {
  const i = process.argv.indexOf(k);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const root = repoRoot(process.cwd());
const seams = loadSeams(root);
const base = arg('--base') || seams.base;
const head = arg('--head') || 'HEAD';
if (!base) {
  console.error('✘ no base: set "base" in .orbit/seams.json or pass --base <tag>');
  process.exit(2);
}
if (git(['rev-parse', '--verify', '--quiet', `${base}^{commit}`], root) === null) {
  console.error(`✘ base ${base} not found. Fetch it: git fetch upstream tag ${base} --no-tags`);
  process.exit(2);
}
if (git(['merge-base', '--is-ancestor', base, head], root) === null) {
  console.error(`✘ ${base} is not an ancestor of ${head}. Is "base" in .orbit/seams.json the last Grafana tag merged into this branch?`);
  process.exit(1);
}
const status = git(['diff', '--name-status', '-M', base, head], root) || '';
const numstat = git(['diff', '--numstat', '-M', base, head], root) || '';
const lines = new Map();
for (const l of numstat.split('\n').filter(Boolean)) {
  const [a, d, ...p] = l.split('\t');
  lines.set(p.join('\t').replace(/^.*=> /, '').replace(/[{}]/g, ''), (a === '-' ? 0 : +a) + (d === '-' ? 0 : +d));
}
const problems = [];
let ours = 0;
const seamHits = [];
for (const l of status.split('\n').filter(Boolean)) {
  const [st, ...paths] = l.split('\t');
  const path = paths[paths.length - 1];
  const from = paths[0];
  if (st.startsWith('R') && !isOurs(from)) {
    problems.push(`renamed Grafana file: ${from} -> ${path}`);
    continue;
  }
  if (st === 'D' && !isOurs(path)) {
    problems.push(`deleted Grafana file: ${path}`);
    continue;
  }
  if (isGrafanaAiFile(path)) {
    problems.push(`Grafana agent file changed (OD35): ${path}`);
    continue;
  }
  if (isOurs(path) || path === '.claude/settings.json') {
    ours++;
    continue;
  }
  if ((seams.generated || []).includes(path)) {
    seamHits.push(`generated ${path} (CI checks it equals the generator output)`);
    continue;
  }
  const seam = (seams.edits || []).find((e) => e.file === path);
  if (!seam) {
    problems.push(`Grafana file changed outside the seam list: ${path}`);
    continue;
  }
  const n = lines.get(path) ?? 0;
  if (n > seam.maxChangedLines) {
    problems.push(`${seam.id} ${path}: ${n} changed lines, limit ${seam.maxChangedLines}`);
  } else {
    seamHits.push(`${seam.id} ${path}: ${n}/${seam.maxChangedLines} lines`);
  }
}
console.log(`Seam check against ${base}: ${ours} file(s) in our folders`);
seamHits.forEach((s) => console.log(`✔ ${s}`));
problems.forEach((p) => console.log(`✘ ${p}`));
console.log(`Result: ${seamHits.length + (ours ? 1 : 0)} ✔ · ${problems.length} ✘`);
process.exit(problems.length ? 1 : 0);
