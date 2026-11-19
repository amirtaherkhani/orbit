#!/usr/bin/env node
// Import boundaries for public/app/orbit (ARCHITECTURE.md 5.2, rules 1-5).
// L5 orbit/upstream is the only layer that may import Grafana internals (app/..., or relative paths leaving orbit/).
// L4 orbit/apps -> upstream only.  L3 orbit/shell -> apps, upstream, theme.  L2 orbit/pages -> apps, upstream, theme.
// Public packages (@grafana/*, react, ...) are allowed everywhere. Usage: node .orbit/scripts/check-boundaries.mjs
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname, resolve } from 'node:path';
import { repoRoot } from './lib.mjs';

const root = repoRoot(process.cwd());
const base = join(root, 'public/app/orbit');
if (!existsSync(base)) {
  console.log('○ public/app/orbit does not exist yet: nothing to check');
  process.exit(0);
}
const ALLOW = {
  pages: ['apps', 'upstream', 'theme', 'pages'],
  shell: ['apps', 'upstream', 'theme', 'shell'],
  apps: ['upstream', 'apps'],
  upstream: ['upstream'],
  theme: ['theme'],
};
const walk = (d) => readdirSync(d).flatMap((n) => {
  const p = join(d, n);
  return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|mts)$/.test(n) ? [p] : [];
});
const problems = [];
for (const file of walk(base)) {
  const rel = relative(base, file).split('\\').join('/');
  const layer = rel.split('/')[0];
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/(?:import|export)[^'"]*?from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    const spec = m[1] || m[2];
    let target = null;
    if (spec.startsWith('.')) {
      const r = relative(base, resolve(dirname(file), spec)).split('\\').join('/');
      target = r.startsWith('..') ? 'grafana' : r.split('/')[0];
    } else if (spec.startsWith('app/orbit/')) {
      target = spec.split('/')[2];
    } else if (spec.startsWith('app/') || spec.startsWith('public/')) {
      target = 'grafana';
    } else {
      continue; // a package
    }
    if (target === 'grafana' && layer !== 'upstream') {
      problems.push(`${rel}: imports Grafana internals (${spec}). Only orbit/upstream may; add a function there.`);
    } else if (ALLOW[layer] && target !== 'grafana' && !ALLOW[layer].includes(target)) {
      problems.push(`${rel}: layer ${layer} may not import ${target} (${spec}).`);
    }
  }
}
problems.forEach((p) => console.log(`✘ ${p}`));
console.log(`Result: ${problems.length ? `${problems.length} ✘` : '1 ✔ (boundaries hold)'}`);
process.exit(problems.length ? 1 : 0);
