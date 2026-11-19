#!/usr/bin/env node
// Tests for agent-guard.mjs. Run: node .orbit/scripts/agent-guard.test.mjs  (CI runs it in orbit-ci.yml)
// Builds a throw-away git repository with a seams.json and checks the decision for each case.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const guard = join(dirname(fileURLToPath(import.meta.url)), 'agent-guard.mjs');
const repo = mkdtempSync(join(tmpdir(), 'orbit-guard-'));
const g = (...a) => execFileSync('git', a, { cwd: repo, stdio: 'ignore' });
g('init', '-q', '-b', 'orbit/13.3.1');
g('config', 'user.email', 't@example.com');
g('config', 'user.name', 't');
mkdirSync(join(repo, '.orbit'));
writeFileSync(join(repo, '.orbit', 'seams.json'), JSON.stringify({ base: 'v13.3.1', edits: [{ id: 'SM01', file: 'public/app/routes/RoutesWrapper.tsx', maxChangedLines: 2 }], generated: ['pkg/server/wire_gen.go'] }));
g('add', '.');
g('commit', '-q', '-m', 'init');

function run(tool, input, branch) {
  if (branch) {
    g('switch', '-q', '-C', branch);
  }
  const r = spawnSync('node', [guard], { input: JSON.stringify({ tool_name: tool, tool_input: input, cwd: repo }), env: { ...process.env, CLAUDE_PROJECT_DIR: repo }, encoding: 'utf8' });
  return r.stdout ? JSON.parse(r.stdout).hookSpecificOutput.permissionDecision : 'allow';
}
const cases = [
  // [expected, tool, input, branch]
  ['deny', 'Bash', { command: 'git push --force origin feat/x' }, 'feat/x'],
  ['deny', 'Bash', { command: 'git push origin +feat/x' }, 'feat/x'],
  ['deny', 'Bash', { command: 'git push --force-with-lease' }, 'feat/x'],
  ['deny', 'Bash', { command: 'git push upstream feat/x' }, 'feat/x'],
  ['deny', 'Bash', { command: 'git push origin orbit/13.3.1' }, 'feat/x'],
  ['deny', 'Bash', { command: 'git push origin HEAD:main' }, 'feat/x'],
  ['deny', 'Bash', { command: 'git push' }, 'orbit/13.3.1'],
  ['ask', 'Bash', { command: 'git push -u origin feat/x' }, 'feat/x'],
  ['ask', 'Bash', { command: 'git push origin v13.3.1+orbit.1' }, 'feat/x'],
  ['ask', 'Bash', { command: 'git push origin v13.3.1+orbit.2.rc.1' }, 'feat/x'],
  ['deny', 'Bash', { command: 'git push origin v13.3.1-orbit.1' }, 'feat/x'],
  ['deny', 'Bash', { command: 'git push origin --tags' }, 'feat/x'],
  ['deny', 'Bash', { command: 'git push origin orbit/feat-x' }, 'feat/x'],
  ['deny', 'Bash', { command: 'git commit -m "orbit(shell): add dock bookmarks"' }, 'my-branch'],
  ['allow', 'Bash', { command: 'git commit -m "orbit(update): merge Grafana v13.3.2"' }, 'update/v13.3.2'],
  ['deny', 'Bash', { command: 'git commit -m "orbit(shell): add dock"' }, 'orbit/13.3.1'],
  ['deny', 'Bash', { command: 'git commit -m "add dock"' }, 'feat/x'],
  ['deny', 'Bash', { command: 'git commit -m "orbit(seam): swap import"' }, 'feat/x'],
  ['allow', 'Bash', { command: 'git commit -m "orbit(seam): SM01 swap AppChrome import"' }, 'feat/x'],
  ['allow', 'Bash', { command: 'git add -A && git commit -m "orbit(shell): add dock bookmarks"' }, 'feat/x'],
  ['deny', 'Bash', { command: 'git commit --no-verify -m "orbit(docs): x y z"' }, 'feat/x'],
  ['deny', 'Bash', { command: 'git merge v13.3.2' }, 'orbit/13.3.1'],
  ['allow', 'Bash', { command: 'git merge v13.3.2' }, 'update/v13.3.2'],
  ['deny', 'Bash', { command: 'gh pr merge 12 --squash' }, 'feat/x'],
  ['ask', 'Bash', { command: 'gh pr create --base orbit/13.3.1 --title "orbit(docs): x y z"' }, 'feat/x'],
  ['allow', 'Bash', { command: 'gh pr view 12' }, 'feat/x'],
  ['deny', 'Bash', { command: 'git tag -d v13.3.1+orbit.1' }, 'feat/x'],
  ['ask', 'Bash', { command: 'git reset --hard HEAD~1' }, 'feat/x'],
  ['deny', 'Bash', { command: "sed -i 's/a/b/' public/app/core/x.ts" }, 'feat/x'],
  ['deny', 'Bash', { command: 'echo hi > conf/defaults.ini' }, 'feat/x'],
  ['allow', 'Bash', { command: 'echo hi > public/app/orbit/x.ts' }, 'feat/x'],
  ['allow', 'Bash', { command: 'yarn typecheck 2>&1 | tail -5' }, 'feat/x'],
  ['deny', 'Edit', { file_path: join(repo, 'AGENTS.md') }, null],
  ['deny', 'Edit', { file_path: join(repo, '.claude/skills/add-e2e-selectors/SKILL.md') }, null],
  ['deny', 'Write', { file_path: join(repo, 'public/app/core/components/AppChrome/AppChrome.tsx') }, null],
  ['deny', 'Edit', { file_path: join(repo, 'pkg/server/wire_gen.go') }, null],
  ['ask', 'Edit', { file_path: join(repo, 'public/app/routes/RoutesWrapper.tsx') }, null],
  ['ask', 'Edit', { file_path: join(repo, '.claude/settings.json') }, null],
  ['ask', 'Edit', { file_path: join(repo, '.orbit/seams.json') }, null],
  ['allow', 'Write', { file_path: join(repo, 'public/app/orbit/shell/AppShell.tsx') }, null],
  ['allow', 'Write', { file_path: join(repo, 'pkg/orbit/service.go') }, null],
  ['allow', 'Write', { file_path: join(repo, '.claude/skills/orbit-new/SKILL.md') }, null],
  ['allow', 'Write', { file_path: '/tmp/scratch.txt' }, null],
];
let fail = 0;
for (const [exp, tool, input, branch] of cases) {
  const got = run(tool, input, branch);
  const ok = got === exp;
  fail += ok ? 0 : 1;
  console.log(`${ok ? '✔' : '✘'} ${exp.padEnd(5)} ${tool} ${input.command || input.file_path.replace(repo, '<repo>')}${branch ? `  [on ${branch}]` : ''}${ok ? '' : `  -> got ${got}`}`);
}
console.log(`\nResult: ${cases.length - fail} ✔ · ${fail} ✘`);
process.exit(fail ? 1 : 0);
