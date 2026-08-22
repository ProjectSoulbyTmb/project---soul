#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Structural invariants for repo safety-critical configuration.
 * Blocks silent reversion of guards (observed failure mode).
 */
import fs from 'node:fs';
const checks = [
  ['pnpm-lock.yaml present', () => fs.existsSync('pnpm-lock.yaml')],
  ['package-lock.json absent', () => !fs.existsSync('package-lock.json')],
  ['scripts/quality-gate.mjs present', () => fs.existsSync('scripts/quality-gate.mjs')],
  [
    'tests/known-failures.json parses',
    () => {
      try {
        return Array.isArray(JSON.parse(fs.readFileSync('tests/known-failures.json', 'utf8')));
      } catch {
        return false;
      }
    },
  ],
  [
    'ci.yml wires test:gate',
    () => fs.readFileSync('.github/workflows/ci.yml', 'utf8').includes('pnpm run test:gate'),
  ],
  [
    'ci.yml has lockfile sync guard',
    () => fs.readFileSync('.github/workflows/ci.yml', 'utf8').includes('Lockfile sync guard'),
  ],
  [
    'security.yml wires test:gate',
    () => fs.readFileSync('.github/workflows/security.yml', 'utf8').includes('pnpm run test:gate'),
  ],
  [
    'eslint.config.js has caughtErrors policy',
    () => fs.readFileSync('eslint.config.js', 'utf8').includes('caughtErrors'),
  ],
  [
    'eslint.config.js has serviceworker globals',
    () => fs.readFileSync('eslint.config.js', 'utf8').includes('docs/sw.js'),
  ],
  ['.husky/pre-push present', () => fs.existsSync('.husky/pre-push')],
  [
    'pre-push wires quality gate',
    () => fs.readFileSync('.husky/pre-push', 'utf8').includes('quality-gate'),
  ],
  ['scripts/module-load-probe.mjs present', () => fs.existsSync('scripts/module-load-probe.mjs')],
];
let bad = 0;
for (const [label, ok] of checks) {
  let pass = false;
  try {
    pass = ok();
  } catch (e) {
    console.error(`FAIL ${label}: ${e.message}`);
    bad++;
    continue;
  }
  if (!pass) {
    console.error(`FAIL ${label}`);
    bad++;
  } else console.log(`ok   ${label}`);
}
process.exit(bad ? 1 : 0);
