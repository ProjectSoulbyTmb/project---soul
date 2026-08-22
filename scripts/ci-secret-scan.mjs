// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * CI secret-pattern scan (V2_RELEASE_ROADMAP W3.5).
 * Fails when source/config files contain credential-shaped strings.
 * Test fixtures that intentionally embed fake secrets live in tests/ and are
 * scanned too - keep fake values clearly synthetic (e.g. sk-TEST-...).
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIRS = ['src', 'scripts', 'server', 'docs', 'tests'];
const EXTS = /\.(js|cjs|mjs|ts|json|html|yml|yaml|toml|md|txt)$/i;
const SKIP = /node_modules|\.min\./;

const PATTERNS = [
  { id: 'private-key-block', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { id: 'openai-style-key', re: /\bsk-(?!TEST-)[A-Za-z0-9_-]{20,}\b/ },
  { id: 'assigned-api-key', re: /\bapi[_-]?key\s*[:=]\s*['"][A-Za-z0-9_-]{16,}['"]/i },
  { id: 'bearer-literal', re: /\bBearer\s+[A-Za-z0-9\-_.]{28,}\b/ },
  { id: 'github-pat', re: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/ },
];

function walk(dir, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (EXTS.test(e.name) && !SKIP.test(e.name)) out.push(full);
  }
}

const files = [];
for (const d of DIRS) walk(path.join(ROOT, d), files);

const hits = [];
for (const file of files) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  for (const p of PATTERNS) {
    if (p.re.test(text)) hits.push(`${path.relative(ROOT, file)} [${p.id}]`);
  }
}

if (hits.length) {
  console.error('[ci-secret-scan] potential secrets found:');
  for (const h of hits.slice(0, 20)) console.error('  - ' + h);
  process.exit(1);
}
console.log(`[ci-secret-scan] clean (${files.length} files scanned).`);
