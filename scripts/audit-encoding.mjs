#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Encoding corruption ratchet.
 * Fails only on files NEWLY carrying corruption signatures vs tests/encoding-baseline.json.
 * `--update` re-baselines after legitimate repairs shrink the set.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
const BASELINE = new URL('../tests/encoding-baseline.json', import.meta.url);
const UPDATE = process.argv.includes('--update');
const SIGNS = [
  [/\uFFFD/, 'U+FFFD replacement char'],
  [/[\u00C2\u00C3\u00E2][\u0080-\u00FF]/, 'cp1252 mojibake pair'],
  [/\?{4,}/, 'question-mark glyph run'],
];
const files = execSync('git ls-files', { encoding: 'utf8' })
  .split(/\r?\n/).filter(Boolean)
  .filter((f) => /\.(js|cjs|mjs|ts|html|css|json|md|txt|yml|yaml|toml|xml|cff)$/i.test(f))
  .filter((f) => !f.includes('localization.js'));
const corrupted = [];
for (const f of files) {
  let t = '';
  try { t = fs.readFileSync(f, 'utf8'); } catch { continue; }
  const hits = SIGNS.filter(([re]) => re.test(t)).map(([, label]) => label);
  if (hits.length) corrupted.push(`${f} (${hits.join(', ')})`);
}
const baseline = fs.existsSync(BASELINE_PATH())
  ? JSON.parse(fs.readFileSync(BASELINE_PATH(), 'utf8'))
  : [];
function BASELINE_PATH() { return BASELINE; }
const known = new Set(baseline);
const fresh = corrupted.filter((c) => !known.has(c));
const healed = baseline.filter((c) => !corrupted.includes(c));
console.log(`[encoding] corrupted: ${corrupted.length} | baseline: ${baseline.length} | NEW: ${fresh.length} | healed: ${healed.length}`);
if (UPDATE) {
  fs.writeFileSync(BASELINE_PATH(), JSON.stringify(corrupted, null, 2) + '\n');
  console.log('[encoding] baseline rewritten');
  process.exit(0);
}
if (fresh.length) {
  console.error('[encoding] REGRESSION - newly corrupted files:');
  fresh.forEach((c) => console.error('  NEW: ' + c));
  if (healed.length) console.log('[encoding] healed since baseline: ' + healed.join(' | '));
  process.exit(1);
}
healed.forEach((c) => console.log('[encoding] healed (re-baseline with --update): ' + c));
console.log('[encoding] PASS - no new corruption');
