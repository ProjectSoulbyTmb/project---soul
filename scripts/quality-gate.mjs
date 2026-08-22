// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Quality gate ratchet.
 *
 * Runs the full test suite and compares failures against the known-failure
 * baseline in tests/known-failures.json:
 *   - NEW failure  -> exit 1 (regression blocked)
 *   - known failure-> reported as debt, allowed
 *   - healed test  -> reported; shrink baseline via `--update`
 *
 * Usage:
 *   node scripts/quality-gate.mjs            # gate mode (CI)
 *   node scripts/quality-gate.mjs --update   # re-baseline after fixing tests
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const BASELINE_PATH = fileURLToPath(new URL('../tests/known-failures.json', import.meta.url));
const UPDATE = process.argv.includes('--update');

function listTestFiles(dir = 'tests', acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = `${dir}/${entry.name}`;
    if (entry.isDirectory()) listTestFiles(full, acc);
    else if (/\.test\.js$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

const files = listTestFiles();
const res = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...files], {
  encoding: 'utf8',
  maxBuffer: 1024 * 1024 * 64,
});

const out = `${res.stdout ?? ''}${res.stderr ?? ''}`;
const current = [...out.matchAll(/^not ok \d+ - (.+)$/gm)].map(m => m[1].trim()).sort();

const passMatch = out.match(/^# pass (\d+)$/m);
const baseline = existsSync(BASELINE_PATH) ? JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) : [];
const known = new Set(baseline);
const fresh = current.filter(name => !known.has(name));
const healed = baseline.filter(name => !current.includes(name));

console.log(`[quality-gate] total failures: ${current.length}`);
console.log(`[quality-gate] tests passed:    ${passMatch ? passMatch[1] : '?'}`);
console.log(`[quality-gate] baseline size:   ${baseline.length}`);

if (UPDATE) {
  writeFileSync(BASELINE_PATH, `${JSON.stringify(current, null, 2)}\n`);
  console.log(`[quality-gate] baseline rewritten with ${current.length} entries`);
  process.exit(0);
}

if (fresh.length > 0) {
  console.error(`[quality-gate] REGRESSION: ${fresh.length} new failure(s) not in baseline:`);
  fresh.slice(0, 25).forEach(name => console.error(`  NEW FAIL: ${name}`));
  if (fresh.length > 25) console.error(`  ... and ${fresh.length - 25} more`);
  process.exit(1);
}

healed.forEach(name =>
  console.log(`[quality-gate] healed (run with --update to shrink baseline): ${name}`)
);

console.log('[quality-gate] PASS - no new failures');
process.exit(0);
