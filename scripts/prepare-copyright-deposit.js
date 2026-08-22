// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const OUT_DIR = path.resolve(ROOT, process.argv.includes('--out')
  ? process.argv[process.argv.indexOf('--out') + 1]
  : 'copyright-deposit');

const SKIP_DIR = new Set([
  '.git', 'node_modules', '.pnpm-store', 'dist', 'dist-mac', 'release',
  'private', 'internal', 'private-patent', 'ip-evidence-private',
  'research-notes-private', 'copyright-deposit', 'executed-assignments',
  'ip-filings-private', '.wrangler', 'coverage'
]);

const SKIP_FILE = /\.(?:pfx|p12|key|pem|pvk|spc|jks|keystore|env)$/i;
const INCLUDE_EXT = new Set([
  '.js', '.cjs', '.mjs', '.css', '.html', '.md', '.txt', '.json', '.yml', '.yaml',
  '.cff', '.svg', '.png', '.ico', '.xml'
]);

const CLAIMED_ROOTS = ['src', 'docs', 'scripts', 'server', 'tests', 'assets', 'installer', '.github'];
const CLAIMED_FILES = [
  'LICENSE', 'NOTICE.md', 'COPYRIGHT.txt', 'OWNERSHIP.md', 'AUTHORS.md', 'TRADEMARKS.md',
  'TERMS.md', 'PRIVACY.md', 'AGE.md', 'LEGAL_NOTICES.md', 'SECURITY.md', 'CONTRIBUTING.md',
  'THIRD_PARTY_NOTICES.md', 'README.md', 'CHANGELOG.md', 'CITATION.cff', 'package.json',
  'NETWORK-USAGE.md', 'LIVE.md'
];

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIR.has(entry.name) || entry.name.startsWith('.env')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (INCLUDE_EXT.has(path.extname(entry.name).toLowerCase()) && !SKIP_FILE.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

if (OUT_DIR === ROOT || OUT_DIR.startsWith(path.join(ROOT, '.git'))) {
  throw new Error('Refusing to write a copyright deposit into the git root.');
}

const files = [];
for (const name of CLAIMED_FILES) {
  const full = path.join(ROOT, name);
  if (fs.existsSync(full)) files.push(full);
}
for (const dir of CLAIMED_ROOTS) walk(path.join(ROOT, dir), files);

const unique = [...new Set(files)].sort();
const rows = unique.map((full) => {
  const rel = path.relative(ROOT, full).replaceAll('\\', '/');
  const data = fs.readFileSync(full);
  return {
    path: rel,
    bytes: data.length,
    sha256: crypto.createHash('sha256').update(data).digest('hex').toUpperCase()
  };
});

fs.mkdirSync(OUT_DIR, { recursive: true });
const header = [
  'Eidovara first-party deposit listing (local only â€” do not commit this directory).',
  `Claimant: Soul Consciousness Studios`,
  `Generated: ${new Date().toISOString()}`,
  `Files: ${rows.length}`,
  'This listing is not a U.S. Copyright Office registration.',
  'Exclude secrets, third-party runtimes, and user content before uploading to copyright.gov.',
  '',
  'SHA256  BYTES  PATH'
].join('\n');
const body = rows.map((row) => `${row.sha256}  ${String(row.bytes).padStart(8, ' ')}  ${row.path}`).join('\n');
fs.writeFileSync(path.join(OUT_DIR, 'MANIFEST.txt'), `${header}\n${body}\n`, 'utf8');
fs.writeFileSync(path.join(OUT_DIR, 'README.txt'), `${header}\n\nUpload via copyright.gov yourself. Keep certificates private.\n`, 'utf8');
console.log(`Wrote ${rows.length} first-party paths to ${path.relative(ROOT, OUT_DIR) || OUT_DIR}`);

