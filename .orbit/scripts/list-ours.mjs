#!/usr/bin/env node
// Lists every file of ours (our folders, our agent files, our workflows) in a commit, NUL-separated.
// Used by the orbit-upstream-update skill: save the list before `git read-tree --reset -u <tag>` removes
// our files from the work tree, then restore them with `xargs -0 git checkout HEAD -- < list`.
// Usage: node .orbit/scripts/list-ours.mjs [rev]   (default HEAD)
import { git, repoRoot, isOurs, isGuarded } from './lib.mjs';

const rev = process.argv[2] || 'HEAD';
// Only the top folders that can hold our files, so the listing stays small.
const out = git(['ls-tree', '-r', '-z', '--name-only', rev, '--', '.orbit', '.claude', '.github/workflows', 'public/app/orbit', 'pkg/orbit'], repoRoot());
if (out === null) {
  console.error(`✘ cannot read ${rev}`);
  process.exit(1);
}
process.stdout.write(out.split('\0').filter((f) => f && (isOurs(f) || isGuarded(f))).join('\0'));
