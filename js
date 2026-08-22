// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Encoding-hygiene regression guard.
 *
 * A series of bulk text transforms (BOM stripping, name replacement, encoding
 * "fixes") destroyed non-ASCII characters across the repo: UTF-8 sequences were
 * re-decoded as cp1252 (em dash became a-circumflex + euro + right-double-quote,
 * Espanol gained a capital A-tilde), unmappable bytes became U+FFFD, and whole
 * glyphs collapsed into runs of literal '?' on the public site.
 * This suite fails if any of those corruption signatures reappear.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SCAN_EXTENSIONS = /\.(js|cjs|mjs|html|css|json|md|txt|yml|toml|xml|cff)$/;
const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'dist-mac']);

// Files where these characters are legitimate content (localized strings).
const ALLOW_ACCENTED = [/src[/\\]renderer[/\\]localization\.js$/];

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else if (SCAN_EXTENSIONS.test(entry.name)) yield p;
  }
}

function collectFiles() {
  return [...walk(ROOT)];
}

const CORRUPTION_SIGNATURES = [
  ['U+FFFD replacement char', /\uFFFD/],
  ['cp1252 mojibake lead pair', /[\u00C2\u00C3\u00E2][\u0080-\u00FF]/],
  ['mangled curly-quote/dash trio', /\u00E2\u20AC[\u009D\u201D\u00A6]/],
  ['literal question-mark runs (destroyed glyphs)', /\?{3,}/],
];

test('no file contains encoding-corruption signatures', () => {
  const offenders = [];
  for (const file of collectFiles()) {
    const rel = path.relative(ROOT, file);
    const text = fs.readFileSync(file, 'utf8');
    for (const [label, re] of CORRUPTION_SIGNATURES) {
      if (!re.test(text)) continue;
      if (label.startsWith('cp1252') && ALLOW_ACCENTED.some((re2) => re2.test(rel))) continue;
      offenders.push(`${rel}: ${label}`);
    }
  }
  assert.deepEqual(offenders, [], `Encoding corruption detected:\n${offenders.join('\n')}`);
});

test('public site pages keep their typographic separators intact', () => {
  const checks = [
    ['docs/index.html', /—/],
    ['docs/download.html', /·|—/],
    ['docs/roadmap.html', /—|©/],
  ];
  for (const [file, re] of checks) {
    const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
    assert.match(text, re, `${file} lost its typographic characters`);
    assert.doesNotMatch(text, /\?{3,}/, `${file} has destroyed-glyph runs`);
  }
});
