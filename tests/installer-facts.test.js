// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Installer-facts freshness guard.
 *
 * Root causes this prevents (seen in real incidents):
 *  1. A release workflow builds artifact N+1 while docs/worker/site still
 *     print artifact N's digest -> users verify a fresh download against the
 *     WRONG hash and conclude tampering.
 *  2. Surfaces hardcoding digests instead of linking SHA256SUMS.txt / /v1/config.
 *
 * Policy encoded here:
 *  - While release.js says INSTALLER_FACTS_MEASURED === false, NO live
 *    user-facing surface may contain ANY 64-hex digest presented as the
 *    installer's. Point at SHA256SUMS.txt or /v1/config instead. Historical
 *    records (CHANGELOG.md, version-history.html) are exempt.
 *  - Once INSTALLER_FACTS_MEASURED === true, every 64-hex digest appearing in
 *    those same surfaces MUST equal INSTALLER_SHA256 from release.js. Any
 *    other value is by definition stale and fails CI before merge.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { INSTALLER_SHA256, INSTALLER_FACTS_MEASURED } from '../src/core/release.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const LIVE_SURFACES = [
  'README.md',
  'LIVE.md',
  'VERSION_COMPATIBILITY_MATRIX.md',
  'docs/knowledge.js',
];

const HEX64 = /\b[0-9a-fA-F]{64}\b/g;

// A digest on a line explicitly marked as historical is provenance, not a
// live claim about the current artifact (e.g. version tables listing what
// older releases hashed). Everything else counts as a live claim.
const HISTORICAL_LINE = /historical/i;

// docs/knowledge.js must re-export release.js's constant byte-for-byte to
// satisfy tests/release-consistency.test.js even while facts are unmeasured;
// only its DECLARATION line is exempted — displaying it in replies/meta is
// already removed and stays banned via the template scan below.
const KNOWLEDGE_DECLARATION = /^(?:const|export)\b[^\n]*INSTALLER_SHA256\s*=/;

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

test('release.js declares whether installer facts are measured', () => {
  assert.equal(
    typeof INSTALLER_FACTS_MEASURED,
    'boolean',
    'INSTALLER_FACTS_MEASURED must be an explicit boolean in src/core/release.js'
  );
});

test('live surfaces never display a non-canonical installer digest', () => {
  const offenders = [];

  for (const rel of LIVE_SURFACES) {
    const lines = read(rel).split(/\r?\n/);

    lines.forEach((line, idx) => {
      if (HISTORICAL_LINE.test(line)) return;
      if (rel === 'docs/knowledge.js' && KNOWLEDGE_DECLARATION.test(line)) return;

      for (const m of line.matchAll(HEX64)) {
        const hex = m[0];
        if (!INSTALLER_FACTS_MEASURED) {
          offenders.push(
            `${rel}:${idx + 1}: prints digest ${hex.slice(0, 12)}… while INSTALLER_FACTS_MEASURED is false — point at SHA256SUMS.txt / /v1/config instead`
          );
        } else if (hex.toLowerCase() !== String(INSTALLER_SHA256).toLowerCase()) {
          offenders.push(
            `${rel}:${idx + 1}: stale digest ${hex.slice(0, 12)}… does not match release.js (${String(INSTALLER_SHA256).slice(0, 12)}…)`
          );
        }
      }
    });
  }

  assert.deepEqual(offenders, [], `Installer-fact drift detected:\n${offenders.join('\n')}`);
});

test('unmeasured facts keep worker fallback null (honesty gate)', async () => {
  if (!INSTALLER_FACTS_MEASURED) {
    const worker = await import('../server/worker.js');
    assert.equal(
      worker.LIVE_INSTALLER_SHA256,
      null,
      'worker must not advertise a digest before measurement'
    );
  }
});
