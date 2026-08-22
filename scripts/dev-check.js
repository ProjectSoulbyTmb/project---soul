#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * One-command developer verification (ERROR_PREVENTION_ROADMAP 7.3).
 * Runs the full local gate in order and stops at first failure:
 *   session guard -> syntax check -> lint -> unit tests -> smoke
 * Usage: node scripts/dev-check.js [--fast]   (--fast skips unit tests)
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import url from 'node:url';

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const steps = [
  { name: 'session-guard', cmd: [process.execPath, 'scripts/session-guard.js'] },
  { name: 'syntax check', cmd: [npm, 'run', '--silent', 'check'] },
  { name: 'lint', cmd: [npm, 'run', '--silent', 'lint'] },
];
if (!process.argv.includes('--fast')) {
  steps.push({ name: 'unit tests', cmd: [npm, 'test', '--silent'] });
}
steps.push({ name: 'smoke', cmd: [npm, 'run', '--silent', 'smoke'] });

let failed = 0;
for (const step of steps) {
  const started = Date.now();
  process.stdout.write(`[dev-check] ${step.name} ... `);
  try {
    execFileSync(step.cmd[0], step.cmd.slice(1), { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
    process.stdout.write(`OK (${((Date.now() - started) / 1000).toFixed(1)}s)\n`);
  } catch (error) {
    failed++;
    process.stdout.write('FAILED\n');
    const tail = String(error.stderr || error.stdout || error.message || '')
      .split('\n')
      .slice(-15)
      .join('\n');
    console.error(tail);
    break;
  }
}
console.log(failed ? '[dev-check] RESULT: FAILED' : '[dev-check] RESULT: ALL GREEN');
process.exit(failed ? 1 : 0);
