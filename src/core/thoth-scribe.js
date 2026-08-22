// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0

/**
 * THOTH — Scribe and Protector.
 *
 * Thoth is Eidovara's documentation steward. Two duties, no more:
 *
 *   SCRIBE  — records what the project is right now: module inventory,
 *             script catalog, test census, and the current version.
 *             Reads only public repository files at runtime; never guesses.
 *
 *   PROTECTOR — watches the structural guards that keep this project's
 *             legal posture intact. If any guard file goes missing or a
 *             required export disappears from the guards index, Thoth
 *             reports it as a breach so the developer can act before CI does.
 *
 * Both duties are read-only. Thoth never mutates project state.
 */

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');

// ---------------------------------------------------------------------------
// Scribe
// ---------------------------------------------------------------------------

export function scribeInventory() {
  const coreDir = path.join(ROOT, 'src', 'core');
  const modules = fs.existsSync(coreDir)
    ? fs.readdirSync(coreDir).filter((f) => f.endsWith('.js')).sort()
    : [];

  const testDir = path.join(ROOT, 'tests');
  const tests = fs.existsSync(testDir)
    ? fs.readdirSync(testDir).filter((f) => f.endsWith('.test.js')).length
    : 0;

  const scriptsDir = path.join(ROOT, 'scripts');
  const scripts = fs.existsSync(scriptsDir)
    ? fs.readdirSync(scriptsDir).filter((f) => f.endsWith('.js') || f.endsWith('.mjs')).sort()
    : [];

  let pkgVersion = 'unknown';
  try {
    pkgVersion = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
  } catch {}

  return { modules, scripts, tests, version: pkgVersion };
}

// ---------------------------------------------------------------------------
// Protector
// ---------------------------------------------------------------------------

const REQUIRED_GUARD_EXPORTS = [
  'runAllStructuralGuards',
  'runGuardsForContext',
  'validateLegalCompliance',
];

const GUARD_INDEX = path.join(ROOT, 'src', 'core', 'guards', 'index.js');

const PROTECTED_PATHS = [
  'src/core/guards/index.js',
  'src/core/guards/age-gate.js',
  'src/core/guards/license-guard.js',
  'src/core/guards/relicense-guard.js',
  'src/core/guards/consciousness-guard.js',
  '.github/workflows/security.yml',
  '.github/workflows/codeql.yml',
  '.github/workflows/scorecards.yml',
];

export function protectorAudit() {
  const breaches = [];
  const healthy = [];

  for (const rel of PROTECTED_PATHS) {
    const abs = path.join(ROOT, rel);
    if (fs.existsSync(abs)) {
      healthy.push(rel);
    } else {
      breaches.push({ path: rel, issue: 'missing' });
    }
  }

  if (fs.existsSync(GUARD_INDEX)) {
    try {
      const src = fs.readFileSync(GUARD_INDEX, 'utf8');
      for (const name of REQUIRED_GUARD_EXPORTS) {
        if (!src.includes(name)) {
          breaches.push({ path: 'src/core/guards/index.js', issue: `export "${name}" absent` });
        }
      }
    } catch {}
  }

  return { healthy: healthy.length, breaches };
}
