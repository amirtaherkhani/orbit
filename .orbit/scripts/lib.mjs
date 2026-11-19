// Shared rules for the Orbit guards (agent hook, CI checks). Plain Node, no dependencies.
// Source of truth: .orbit/docs/ARCHITECTURE.md sections 6 (seams), 13.1 (branches), 13.4 (namespace), 13.6 (AI files).
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Paths that are ours. Everything else in the repository is Grafana's and read-only, except seam files.
export const OURS = [
  'public/app/orbit/',
  'pkg/orbit/',
  '.orbit/',
  '.claude/skills/orbit-',
  '.claude/rules/orbit-',
  '.github/workflows/orbit-',
];
// Files of ours that only change with the owner's approval (they define the rules themselves).
export const OURS_GUARDED = [
  '.claude/settings.json',
  '.claude/rules/',
  '.orbit/scripts/',
  '.orbit/seams.json',
  '.github/workflows/orbit-',
];
// Grafana's agent files: never edited (OD35).
export const GRAFANA_AI_FILES = ['CLAUDE.md', 'AGENTS.md', 'AI_POLICY.md', '.gitignore'];

// main mirrors Grafana's main; everything under orbit/ is a product line, one per Grafana release (orbit/13.3.1). Both change only by PR or by the owner.
export const PROTECTED_BRANCH = /^(main|orbit\/.+)$/;
// Short-lived work branches, one PR each (decided 2026-11-19).
export const WORK_TYPES = ['feat', 'fix', 'seam', 'design', 'docs', 'update', 'release', 'ci', 'tooling'];
export const WORK_BRANCH = new RegExp(`^(${WORK_TYPES.join('|')})/[a-z0-9][a-z0-9.+-]*$`);
// Release tags (ARCHITECTURE.md 13.5): v<grafana>+orbit.<n>, release candidates v<grafana>+orbit.<n>.rc.<m>.
export const RELEASE_TAG = /^v(\d+\.\d+\.\d+)\+orbit\.(\d+)(?:\.rc\.(\d+))?$/;
export function dockerTag(tag) {
  const m = RELEASE_TAG.exec(tag);
  return m ? `${m[1]}-orbit.${m[2]}${m[3] ? `-rc.${m[3]}` : ''}` : null;
}
export const TITLE_SCOPES = ['seam', 'shell', 'apps', 'pages', 'acl', 'backend', 'design', 'docs', 'ci', 'release', 'update', 'tooling'];
export const TITLE_RE = new RegExp(`^orbit\\((${TITLE_SCOPES.join('|')})\\): \\S.{2,90}$`);

export function git(args, cwd) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

export function repoRoot(cwd) {
  return git(['rev-parse', '--show-toplevel'], cwd) ?? cwd;
}

export function loadSeams(root) {
  const p = join(root, '.orbit', 'seams.json');
  if (!existsSync(p)) {
    return { base: null, edits: [], generated: [] };
  }
  return JSON.parse(readFileSync(p, 'utf8'));
}

export function isOurs(rel) {
  return OURS.some((p) => rel === p.replace(/\/$/, '') || rel.startsWith(p));
}

export function isGuarded(rel) {
  return OURS_GUARDED.some((p) => rel === p || rel.startsWith(p));
}

// Grafana's own agent files, wherever they are: root files, its skills, and any AGENTS.md/CLAUDE.md outside our folders.
export function isGrafanaAiFile(rel) {
  if (GRAFANA_AI_FILES.includes(rel)) {
    return true;
  }
  if (rel.startsWith('.claude/skills/') && !rel.startsWith('.claude/skills/orbit-')) {
    return true;
  }
  const base = rel.split('/').pop();
  return (base === 'AGENTS.md' || base === 'CLAUDE.md') && !isOurs(rel);
}

export function checkTitle(title) {
  const t = (title ?? '').trim();
  if (!TITLE_RE.test(t)) {
    return `"${t}" does not follow orbit(<scope>): <summary>. Scopes: ${TITLE_SCOPES.join(', ')}.`;
  }
  if (t.startsWith('orbit(seam):') && !/\bSM\d{2}\b/.test(t)) {
    return `"${t}": a seam commit must name its seam ID, for example "orbit(seam): SM01 swap AppChrome import".`;
  }
  return null;
}
