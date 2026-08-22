// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Fast pre-push gate: structural invariants, encoding ratchet, module-load probe.
 * Full quality gate runs automatically when the push targets refs/heads/main.
 * Emergency bypass: EIDOVARA_SKIP_PREPUSH=1 git push ...
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

function _run(script) {
  const r = spawnSync(process.execPath, [script], { stdio: 'inherit' });
  return r.status === 0;
}

if (process.env.EIDOVARA_SKIP_PREPUSH === '1') {
  console.log('[prepush] skipped via EIDOVARA_SKIP_PREPUSH');
  process.exit(0);
}

let targetMain = false;
try {
  targetMain = /refs\/heads\/main/.test(fs.readFileSync(0, 'utf8'));
} catch {}

const fastSteps = [
  ['invariants', 'scripts/guard-invariants.mjs'],
  ['encoding-ratchet', 'scripts/audit-encoding.mjs'],
  ['module-load-probe', 'scripts/module-load-probe.mjs'],
];

for (const [name, script] of fastSteps) {
  console.log(`[prepush] ${name}...`);
  const r = spawnSync(process.execPath, [script], { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(`[prepush] FAIL: ${name}`);
    process.exit(1);
  }
}

if (targetMain || process.env.EIDOVARA_PREPUSH_FULL === '1') {
  console.log('[prepush] targeting main - running full quality gate...');
  const r = spawnSync(process.execPath, ['scripts/quality-gate.mjs'], { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error('[prepush] FAIL: quality gate');
    process.exit(1);
  }
}

console.log('[prepush] PASS');
