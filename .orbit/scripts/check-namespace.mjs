#!/usr/bin/env node
// Namespace check (ARCHITECTURE.md 13.4): nothing of Grafana's may use the name "orbit", so ours never collides.
// Usage: node .orbit/scripts/check-namespace.mjs   (run after merging a new Grafana tag)
import { git, repoRoot, isOurs } from './lib.mjs';

const root = repoRoot(process.cwd());
const files = (git(['ls-files'], root) || '').split('\n').filter(Boolean);
const hits = [];
for (const f of files) {
  if (!isOurs(f) && f !== '.claude/settings.json' && /(^|[/_.-])orbit([/_.-]|$)/i.test(f)) {
    hits.push(`Grafana path uses the name: ${f}`);
  }
}
const grep = (pattern, ...paths) => (git(['grep', '-n', '-I', '-E', pattern, '--', ...paths], root) || '').split('\n').filter(Boolean);
for (const l of grep('^\\[orbit', 'conf/')) {
  hits.push(`ini section: ${l}`);
}
for (const l of grep('orbit_[a-z_]+', 'pkg/services/sqlstore/migrations/')) {
  hits.push(`table name: ${l}`);
}
for (const l of grep('/api/orbit', 'pkg/api/')) {
  hits.push(`route: ${l}`);
}
// Our own seam lines (SM13, SM14) mention orbit inside Grafana files on purpose.
const real = hits.filter((h) => !/orbitmigrations|pkg\/orbit/.test(h));
real.forEach((h) => console.log(`✘ ${h}`));
console.log(real.length ? `Result: ${real.length} ✘ (Grafana now uses "orbit"; rename ours before merging)` : 'Result: 1 ✔ (no Grafana use of "orbit")');
process.exit(real.length ? 1 : 0);
