#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Pre-session collision guard (ERROR_PREVENTION_ROADMAP 1.2).
 * Run before starting work: `node scripts/session-guard.js`
 * Exits non-zero when the repo shows signs of another active session.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const repoRoot = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');

function resolveGit() {
  const candidates =
    process.platform === 'win32'
      ? [
          'git',
          'C:\\Program Files\\Git\\bin\\git.exe',
          'C:\\Program Files\\Git\\cmd\\git.exe',
          String(process.env['ProgramFiles(x86)'] || '') + '\\Git\\bin\\git.exe',
          path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Git', 'bin', 'git.exe'),
        ]
      : ['git', '/usr/bin/git', '/usr/local/bin/git'];
  for (const c of candidates) {
    if (c === 'git') {
      try {
        execFileSync(c, ['--version'], { stdio: 'pipe' });
        return c;
      } catch {
        continue;
      }
    }
    if (fs.existsSync(c)) return c;
  }
  return null;
}
const GIT = resolveGit();
const git = args => {
  if (!GIT) return '';
  try {
    return execFileSync(GIT, args, { cwd: repoRoot, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
};

const problems = [];

for (const marker of ['.git/rebase-merge', '.git/rebase-apply', '.git/MERGE_HEAD', '.git/CHERRY_PICK_HEAD']) {
  if (fs.existsSync(path.join(repoRoot, marker))) {
    problems.push(`Interrupted git operation in progress: ${marker}`);
  }
}

try {
  const reflog = git(['reflog', '-1', '--date=iso']);
  const m = reflog.match(/HEAD@\{(\d{4}-\d{2}-\d{2} [^}]+)\}/);
  if (m) {
    const last = new Date(m[1].replace(/ [+-]\d{4}$/, ''));
    const minutes = (Date.now() - last.getTime()) / 60000;
    if (minutes < 30 && process.env.EIDOVARA_SESSION_ID !== reflog.split(':').pop()?.trim()) {
      problems.push(
        `Last git operation was ${Math.round(minutes)} min ago - possible concurrent session:\n  ${reflog}`
      );
    }
  }
} catch {
  /* reflog unavailable */
}

const dirty = git(['status', '--porcelain']).split('\n').filter(Boolean);
if (dirty.length > 20) {
  problems.push(`${dirty.length} dirty files (>20) - uncommitted pileup; commit or stash first.`);
}

if (process.env.EIDOVARA_SESSION_IGNORE_GUARD === 'true') {
  console.log('[session-guard] bypassed via EIDOVARA_SESSION_IGNORE_GUARD');
  process.exit(0);
}
if (problems.length) {
  console.error('[session-guard] DO NOT START WORK:');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log('[session-guard] OK: no concurrent-session signals.');
