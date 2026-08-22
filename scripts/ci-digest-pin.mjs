// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * CI digest-pin check (V2_RELEASE_ROADMAP W3.5).
 * Every `uses:` reference must be pinned to a full 40-char commit digest.
 */
import fs from 'node:fs';
import path from 'node:path';

const dir = path.join(process.cwd(), '.github', 'workflows');
const bad = [];

for (const f of fs.readdirSync(dir).filter(f => /\.ya?ml$/i.test(f))) {
  const lines = fs.readFileSync(path.join(dir, f), 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/\buses:\s*(\S+)@(\S+)/);
    if (m && !/^[0-9a-f]{40}$/i.test(m[2])) bad.push(`${f}:${i + 1}: ${m[1]}@${m[2]}`);
  }
}

if (bad.length) {
  console.error('[ci-digest-pin] floating action references:');
  for (const b of bad.slice(0, 20)) console.error('  - ' + b);
  process.exit(1);
}
console.log('[ci-digest-pin] all action references are digest-pinned.');
