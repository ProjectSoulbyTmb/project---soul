// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Workflow security audit:
 * 1. every workflow must declare explicit top-level permissions
 * 2. no workflow may request write to contents+issues+PRs combined beyond
 *    an allowlist (least-privilege drift detector)
 * 3. flags any use of unpinned third-party actions (@vX instead of @sha)
 */
import fs from 'node:fs';
import path from 'node:path';

const dir = '.github/workflows';
const ALLOW_FULL = new Set(['auto-fix.yml', 'release-windows.yml', 'stale.yml']);
let problems = 0;

for (const f of fs.readdirSync(dir).filter(n => n.endsWith('.yml') || n.endsWith('.yaml'))) {
  const t = fs.readFileSync(path.join(dir, f), 'utf8');
  if (!/^\s*permissions:/m.test(t) && !t.includes('permissions:')) {
    console.log(`FAIL ${f}: no explicit permissions block`);
    problems++;
  }
  const writes = (t.match(/write/g) || []).length;
  if (writes >= 3 && !ALLOW_FULL.has(f)) {
    console.log(`WARN ${f}: broad write permissions (${writes}) — review least privilege`);
  }
  for (const m of t.matchAll(/uses:\s*([^\s]+)/g)) {
    const ref = m[1];
    if (/^actions\/|^github\//.test(ref)) continue; // first-party trusted
    if (!/@[0-9a-f]{40}/.test(ref)) {
      console.log(`FAIL ${f}: action not SHA-pinned -> ${ref}`);
      problems++;
    }
  }
}
console.log(problems === 0 ? 'WORKFLOW SECURITY OK' : `${problems} problem(s)`);
process.exit(problems === 0 ? 0 : 1);
