// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Pre-commit guard: blocks commits containing encoding corruption
 * (the failure mode that damaged this repo repeatedly).
 * Scans only staged additions, so it stays fast.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const BAD = [
  [/\uFFFD/, 'U+FFFD replacement char'],
  [/[\u00C2\u00C3\u00E2][\u0080-\u00FF]/, 'cp1252 mojibake pair'],
  [/\?{4,}/, 'destroyed-glyph question-mark run'],
];

let names = [];
try {
  names = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean);
} catch {
  process.exit(0);
}

const exts = /\.(js|cjs|mjs|html|css|json|md|txt|yml|toml|xml|cff)$/;
let bad = 0;
for (const f of names) {
  if (!exts.test(f) || f.includes('localization.js')) continue;
  let t;
  try {
    t = fs.readFileSync(f, 'utf8');
  } catch {
    continue;
  }
  for (const [re, label] of BAD) {
    if (re.test(t)) {
      console.error(`BLOCKED ${f}: ${label}`);
      bad++;
    }
  }
}
process.exit(bad ? 1 : 0);
