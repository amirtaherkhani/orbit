#!/usr/bin/env node
// Claude Code PreToolUse hook (see .claude/settings.json). Enforces the Orbit rules for git and file edits.
// deny  = the tool call is blocked and the reason is shown to the agent.
// ask   = the owner must approve the call in the permission prompt.
// Rules: .claude/rules/orbit-git.md and orbit-code.md. Tests: node .orbit/scripts/agent-guard.test.mjs
import { readFileSync } from 'node:fs';
import { relative, isAbsolute, resolve, dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { git, repoRoot, loadSeams, isOurs, isGuarded, isGrafanaAiFile, checkTitle, PROTECTED_BRANCH, WORK_BRANCH, WORK_TYPES, RELEASE_TAG, dockerTag } from './lib.mjs';

function out(decision, reason) {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: decision, permissionDecisionReason: reason } }));
  process.exit(0);
}
const deny = (r) => out('deny', `Orbit rule: ${r}`);
const ask = (r) => out('ask', `Orbit rule: ${r}`);

let input;
try {
  input = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  process.exit(0); // not a hook call we understand: do nothing
}
const cwd = input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
// The repository the session works in. A worktree (e.g. .claude/worktrees/<name>) is its own root,
// so CLAUDE_PROJECT_DIR, which names the main checkout, is only the fallback.
const root = git(['rev-parse', '--show-toplevel'], cwd) || process.env.CLAUDE_PROJECT_DIR || cwd;
const tool = input.tool_name;
const ti = input.tool_input || {};

// ------------------------------------------------------------------ file edits
function checkPath(file, how) {
  if (!file) {
    return;
  }
  const abs = isAbsolute(file) ? file : resolve(cwd, file);
  // Judge the file against the work tree that holds it: the main checkout or one of its worktrees.
  let dir = dirname(abs);
  while (!existsSync(dir) && dirname(dir) !== dir) {
    dir = dirname(dir);
  }
  const fileRoot = git(['rev-parse', '--show-toplevel'], dir);
  if (!fileRoot || !existsSync(join(fileRoot, '.orbit', 'seams.json'))) {
    return; // not inside an Orbit work tree
  }
  const rel = relative(fileRoot, abs).split('\\').join('/');
  if (isGrafanaAiFile(rel)) {
    deny(`${rel} is one of Grafana's agent files and is never edited (OD35). Put Orbit guidance in .orbit/, public/app/orbit/ or pkg/orbit/ AGENTS.md, or in .claude/rules/orbit-*.md.`);
  }
  const seams = loadSeams(fileRoot);
  if ((seams.generated || []).includes(rel)) {
    deny(`${rel} is generated. Change the source and run the generator (make gen-go), never ${how} it by hand.`);
  }
  if (isGuarded(rel)) {
    ask(`${rel} defines the project rules (hooks, rules, guards, seam list, CI). The owner must approve this change.`);
  }
  if (isOurs(rel)) {
    return;
  }
  const seam = (seams.edits || []).find((e) => e.file === rel);
  if (seam) {
    ask(`${rel} is Grafana's file, open only as seam ${seam.id} (max ${seam.maxChangedLines} changed lines). Keep the edit within that limit; the owner approves it.`);
  }
  deny(`${rel} belongs to Grafana and is read-only. Put the code in public/app/orbit/ or pkg/orbit/. If an upstream edit is truly needed, follow the orbit-seam-change skill: the owner adds the file to .orbit/seams.json first.`);
}

if (['Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(tool)) {
  checkPath(ti.file_path || ti.notebook_path, 'edit');
  process.exit(0);
}
if (tool !== 'Bash') {
  process.exit(0);
}

// ------------------------------------------------------------------ shell commands
const cmd = String(ti.command || '');
const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], cwd) || '';
const onProtected = PROTECTED_BRANCH.test(branch) || branch === 'HEAD';

// Split into simple commands; good enough for the patterns that matter here.
const parts = cmd.split(/\n|&&|\|\||;|\|/).map((s) => s.trim()).filter(Boolean);
const words = (s) => s.match(/"[^"]*"|'[^']*'|\S+/g) || [];

for (const p of parts) {
  const w = words(p);
  // file writes through the shell into Grafana files
  const redir = p.match(/(?:^|\s)>{1,2}\s*([^\s|&;]+)/);
  if (redir && !redir[1].startsWith('/dev/') && !redir[1].startsWith('&')) {
    checkPath(redir[1].replace(/^["']|["']$/g, ''), 'write');
  }
  if (/^(sed|perl)\b/.test(p) && /\s-i\b|\s-pi\b|\s-i\.|--in-place/.test(p)) {
    for (const a of w.slice(1).filter((x) => !x.startsWith('-') && /[./]/.test(x) && !/^['"]?s[/|#]/.test(x))) {
      checkPath(a.replace(/^["']|["']$/g, ''), 'edit');
    }
  }
  // Installing software changes the owner's machine or the dependency files: always the owner's call.
  // Installing what the lockfile already pins (yarn install --immutable) is fine.
  const installs = /(^|\/)(pip3?|pipx)\s+install\b|\s-m\s+pip\s+install\b|^uv\s+(pip\s+install|tool\s+install|python\s+install|add)\b|\bplaywright\s+install\b|^brew\s+(install|upgrade|reinstall)\b|^(npm|pnpm)\s+(i|install|add)\b.*(-g|--global|\S+@|\s[a-z@][\w./@-]*$)|^yarn\s+(add|global|dlx|up)\b|^(nvm|fnm)\s+install\b|^go\s+install\b|^corepack\s+(prepare|install)\b/;
  if (installs.test(p)) {
    ask(`"${p}" installs software or changes dependencies. The owner must approve it; for design tools, show the commands printed by "sh .orbit/design/tools/py --check" instead.`);
  }
  if (w[0] === 'gh') {
    if (w[1] === 'pr' && w[2] === 'merge') {
      deny('merging a pull request is the owner\'s job. Report that the PR is ready and stop.');
    }
    if (w[1] === 'pr' && w[2] === 'create') {
      ask('opening a pull request needs the owner\'s approval. Show the summary first.');
    }
    const readOnly = ['list', 'view', 'status', 'diff', 'checks'];
    if ((w[1] === 'release' || w[1] === 'repo' || ['secret', 'variable', 'ruleset', 'workflow'].includes(w[1])) && !readOnly.includes(w[2]) && w[2] !== 'clone') {
      ask('this changes repository settings, releases or CI. The owner must approve it.');
    }
    if (w[1] === 'api' && /-X\s*(POST|PUT|PATCH|DELETE)|--method\s+(POST|PUT|PATCH|DELETE)/i.test(p)) {
      ask('a write call to the GitHub API needs the owner\'s approval.');
    }
    continue;
  }
  if (w[0] !== 'git') {
    continue;
  }
  const sub = w[1];
  const rest = w.slice(2);
  if (rest.includes('--no-verify') || (sub === 'commit' && rest.includes('-n'))) {
    deny('--no-verify skips the checks. Fix the problem instead.');
  }
  if (['filter-branch', 'filter-repo', 'replace'].includes(sub)) {
    deny(`git ${sub} rewrites history. Not allowed.`);
  }
  if (sub === 'push') {
    const flags = rest.filter((x) => x.startsWith('-'));
    const args = rest.filter((x) => !x.startsWith('-'));
    if (flags.some((f) => /^(-f|--force|--force-with-lease.*|--force-if-includes|--mirror|--all|--prune)$/.test(f)) || args.some((a) => a.startsWith('+'))) {
      deny('force pushes and mirror/all/prune pushes are never allowed. Make a new commit, or a new branch, instead of rewriting history.');
    }
    if (args[0] === 'upstream') {
      deny('upstream is grafana/grafana. Nothing is ever pushed there.');
    }
    const refs = args.slice(1);
    if (flags.includes('--delete') || flags.includes('-d') || refs.some((r) => r.startsWith(':'))) {
      deny('deleting remote branches or tags is the owner\'s job.');
    }
    const targets = refs.length ? refs.map((r) => r.split(':').pop().replace(/^refs\/heads\//, '')) : [branch];
    if (targets.some((t) => PROTECTED_BRANCH.test(t))) {
      deny(`${targets.join(', ')} changes only through a pull request that the owner merges. Push a work branch (<type>/<topic>) instead.`);
    }
    if (flags.includes('--tags')) {
      deny('push tags one at a time, by name, so only the intended release tag goes out.');
    }
    const tagRefs = refs.map((r) => r.replace(/^refs\/tags\//, '')).filter((r) => /^v\d/.test(r));
    const badTag = tagRefs.find((t) => !RELEASE_TAG.test(t));
    if (badTag) {
      deny(`${badTag} is not a release tag. Format: v<grafana>+orbit.<n>, or v<grafana>+orbit.<n>.rc.<m> for a release candidate (ARCHITECTURE.md 13.5).`);
    }
    if (tagRefs.length) {
      ask(`pushing ${tagRefs.join(', ')} starts the release workflow (image ${tagRefs.map(dockerTag).join(', ')}). The owner must approve it.`);
    }
    ask(`push of ${targets.join(', ')} to ${args[0] || 'origin'}: show the owner the summary (commits, files, checks) and wait for approval.`);
  }
  if (sub === 'commit') {
    if (onProtected) {
      deny(`you are on ${branch || 'a detached HEAD'}. Never commit there. Create a work branch first: git switch -c <type>/<topic> (types: ${WORK_TYPES.join(', ')}).`);
    }
    if (!WORK_BRANCH.test(branch)) {
      deny(`branch "${branch}" does not follow <type>/<topic> (types: ${WORK_TYPES.join(', ')}; lowercase, hyphens). Rename it: git branch -m <type>/<topic>.`);
    }
    const m = p.match(/(?:-m|--message)(?:=|\s+)("([^"]*)"|'([^']*)')/);
    if (m && !rest.includes('--amend')) {
      const subject = (m[2] ?? m[3] ?? '').split('\n')[0];
      if (!subject.startsWith('$(')) {
        const err = checkTitle(subject);
        if (err) {
          deny(err);
        }
      }
    }
  }
  if (sub === 'merge' && onProtected) {
    deny(`merging into ${branch} happens only through a pull request that the owner merges. Do the merge on a work branch such as update/v13.3.2.`);
  }
  if (sub === 'rebase' || (sub === 'commit' && rest.includes('--amend'))) {
    const pushed = branch && git(['rev-parse', '--verify', '--quiet', `refs/remotes/origin/${branch}`], cwd);
    if (pushed) {
      deny(`${branch} is already pushed. Rebasing or amending it would need a force push. Add a new commit instead.`);
    }
  }
  if (sub === 'tag' && rest.some((x) => x === '-d' || x === '--delete' || x === '-f')) {
    deny('deleting or moving tags is not allowed. Release tags are permanent.');
  }
  const discards = (sub === 'reset' && rest.includes('--hard'))
    || (sub === 'clean' && rest.some((x) => /^-[a-z]*f/.test(x)))
    || (sub === 'branch' && rest.includes('-D'))
    || (sub === 'stash' && ['drop', 'clear'].includes(rest[0]))
    || ((sub === 'checkout' || sub === 'restore') && rest.includes('.'))
    || (sub === 'read-tree' && rest.includes('--reset'));
  if (discards) {
    ask(`git ${sub} ${rest.join(' ')} discards work. The owner must approve it.`);
  }
  if (sub === 'config' && rest.some((x) => /^(core\.hooksPath|remote\.|user\.)/.test(x))) {
    ask('changing git remotes, hooks or identity needs the owner\'s approval.');
  }
}
process.exit(0);
