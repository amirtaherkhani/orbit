#!/usr/bin/env node
// Checks pull request titles and commit subjects: orbit(<scope>): <summary>.
// Usage: node .orbit/scripts/check-title.mjs "<title>"       one title
//        node .orbit/scripts/check-title.mjs --range A..B    every non-merge commit subject in a range
import { checkTitle, git, repoRoot } from './lib.mjs';

const i = process.argv.indexOf('--range');
let titles;
if (i > 0) {
  const log = git(['log', '--no-merges', '--format=%s', process.argv[i + 1]], repoRoot(process.cwd())) || '';
  titles = log.split('\n').filter(Boolean);
} else {
  titles = [process.argv.slice(2).join(' ')];
}
const errors = titles.map(checkTitle).filter(Boolean);
titles.forEach((t) => console.log(`${checkTitle(t) ? '✘' : '✔'} ${t}`));
errors.forEach((e) => console.log(`  ${e}`));
process.exit(errors.length ? 1 : 0);
