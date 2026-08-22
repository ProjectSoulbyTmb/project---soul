// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Internal link integrity checker for docs/*.html.
 * - local href/src targets must exist on disk
 * - in-page #anchors must match an id= in the same page (when file is the same)
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'docs';
const files = fs.readdirSync(ROOT).filter((n) => n.endsWith('.html'));
let broken = 0;

for (const f of files) {
  const t = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const refs = [...t.matchAll(/(?:href|src)="([^"#]+)(#[^"]*)?"/g)];
  for (const [, target, hash] of refs) {
    if (/^(https?:|mailto:|data:|#)/.test(target)) continue;
    const clean = target.split('?')[0];
    if (!clean) continue;
    const resolved = path.join(ROOT, decodeURIComponent(clean));
    if (!fs.existsSync(resolved)) {
      broken++;
      console.log(`BROKEN ${f} -> ${target}`);
      continue;
    }
    if (hash && path.basename(resolved) === f) {
      const id = hash.slice(1);
      const ids = new Set([...t.matchAll(/id="([^"]+)"/g)].map((x) => x[1]));
      if (!ids.has(id)) { broken++; console.log(`MISSING ANCHOR ${f} -> ${hash}`); }
    }
  }
}
console.log(broken === 0 ? 'ALL LINKS OK' : `${broken} broken reference(s)`);
process.exit(broken === 0 ? 0 : 1);
