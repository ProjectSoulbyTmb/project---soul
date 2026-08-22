// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Release-consistency contract.
 *
 * Version/installer metadata historically lived in many files at once and
 * silently drifted apart (worker advertising installers that no longer exist,
 * stale test literals, mismatched certification JSON). This file makes drift
 * impossible to merge: every surface must agree with src/core/release.js.
 * To ship a new version, change release.js (+ package.json) â€” this suite then
 * forces every other surface to follow before CI goes green.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  SOURCE_VERSION,
  LIVE_INSTALLER_VERSION,
  INSTALLER_NAME,
  INSTALLER_SHA256,
  INSTALLER_SIZE_BYTES,
  INSTALLER_LATEST_URL,
  INSTALLER_PINNED_URL,
} from '../src/core/release.js';
import {
  DESKTOP_KNOWLEDGE_VERSION,
  INSTALLER_NAME as KNOWLEDGE_INSTALLER,
  INSTALLER_SHA256 as KNOWLEDGE_INSTALLER_SHA256,
} from '../src/core/knowledge.js';
import {
  LIVE_INSTALLER_VERSION as WORKER_LIVE_INSTALLER_VERSION,
  LIVE_INSTALLER as WORKER_LIVE_INSTALLER,
  LIVE_INSTALLER_SHA256 as WORKER_LIVE_INSTALLER_SHA256,
  LIVE_INSTALLER_SIZE as WORKER_LIVE_INSTALLER_SIZE,
  LIVE_INSTALLER_URL as WORKER_LIVE_INSTALLER_URL,
} from '../server/worker.js';
import { ASSIST_VERSION } from '../docs/knowledge.js';

const read = file => fs.readFileSync(file, 'utf8');
const escapeRe = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('one canonical source version across package, desktop kernel, site helper, and API', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(
    pkg.version,
    SOURCE_VERSION,
    'package.json must match src/core/release.js SOURCE_VERSION'
  );
  assert.equal(DESKTOP_KNOWLEDGE_VERSION, SOURCE_VERSION, 'desktop kernel must follow release.js');
  assert.equal(
    ASSIST_VERSION,
    SOURCE_VERSION,
    'docs/knowledge.js ASSIST_VERSION must follow release.js'
  );
});

test('worker advertises exactly the canonical installer metadata', () => {
  assert.equal(
    WORKER_LIVE_INSTALLER_VERSION,
    LIVE_INSTALLER_VERSION,
    'worker LIVE_INSTALLER_VERSION drifted from release.js'
  );
  assert.equal(
    WORKER_LIVE_INSTALLER,
    INSTALLER_NAME,
    'worker installer filename drifted from release.js'
  );
  assert.equal(
    WORKER_LIVE_INSTALLER_SHA256,
    INSTALLER_SHA256,
    'worker installer SHA-256 drifted from release.js'
  );
  assert.equal(
    WORKER_LIVE_INSTALLER_SIZE,
    INSTALLER_SIZE_BYTES,
    'worker installer size drifted from release.js'
  );
  assert.equal(
    WORKER_LIVE_INSTALLER_URL,
    INSTALLER_LATEST_URL,
    'worker installer URL drifted from release.js'
  );
});

test('installer name follows the tagged-version format and checksums are well-formed', () => {
  assert.match(LIVE_INSTALLER_VERSION, /^\d+\.\d+\.\d+(?:[-.][0-9A-Za-z.-]+)?$/);
  assert.equal(INSTALLER_NAME, `Eidovara-v${LIVE_INSTALLER_VERSION}-Windows-x64-Setup.exe`);
  assert.match(INSTALLER_SHA256, /^[0-9A-F]{64}$/);
  assert.ok(Number.isInteger(INSTALLER_SIZE_BYTES) && INSTALLER_SIZE_BYTES > 0);
  assert.equal(
    INSTALLER_LATEST_URL,
    `https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/${INSTALLER_NAME}`
  );
  assert.equal(
    INSTALLER_PINNED_URL,
    `https://github.com/ProjectSoulbyTmb/project---soul/releases/download/v${LIVE_INSTALLER_VERSION}/${INSTALLER_NAME}`
  );
});

test('ip-certification inventory matches the canonical release metadata', () => {
  const cert = JSON.parse(read('docs/ip-certification.json')).product;
  assert.equal(cert.version, SOURCE_VERSION);
  assert.equal(cert.sourceVersion, SOURCE_VERSION);
  assert.equal(cert.liveInstallerVersion, LIVE_INSTALLER_VERSION);
  assert.equal(cert.installer, INSTALLER_NAME);
  assert.equal(cert.sha256, INSTALLER_SHA256);
});

test('site helper download pointers match the canonical installer without importing app code', () => {
  const knowledgeSource = read('docs/knowledge.js');
  const latest = knowledgeSource.match(/const INSTALLER = '([^']+)'/);
  const pinned = knowledgeSource.match(/const INSTALLER_PINNED = '([^']+)'/);
  const name = knowledgeSource.match(/const INSTALLER_NAME = '([^']+)'/);
  const sha = knowledgeSource.match(/const INSTALLER_SHA256 = '([^']+)'/);
  assert.ok(
    latest && pinned && name && sha,
    'docs/knowledge.js must keep INSTALLER constants parseable'
  );
  assert.equal(name[1], INSTALLER_NAME, 'docs/knowledge.js INSTALLER_NAME drifted from release.js');
  assert.equal(
    sha[1],
    INSTALLER_SHA256,
    'docs/knowledge.js INSTALLER_SHA256 drifted from release.js'
  );
  assert.equal(
    latest[1],
    INSTALLER_LATEST_URL,
    'docs/knowledge.js INSTALLER URL drifted from release.js'
  );
  assert.equal(
    pinned[1],
    INSTALLER_PINNED_URL,
    'docs/knowledge.js pinned URL drifted from release.js'
  );
});

test('release pipeline derives artifact names from the version instead of frozen strings', () => {
  const pkgRaw = read('package.json');
  assert.match(
    pkgRaw,
    /"artifactName": "Eidovara-v\$\{version\}-Windows-\$\{arch\}-Setup\.\$\{ext\}"/,
    'NSIS artifactName must keep the v-prefixed version template'
  );
  assert.match(
    pkgRaw,
    /"artifactName": "Eidovara-v\$\{version\}-Windows-\$\{arch\}-Portable\.\$\{ext\}"/,
    'portable artifactName must keep the v-prefixed version template'
  );

  const manifestScript = read('scripts/create-update-manifest.js');
  assert.match(
    manifestScript,
    /Eidovara-v\$\{pkg\.version\}-Windows-x64-Setup\.exe/,
    'update manifest must use the v-prefixed installer name'
  );

  const smoke = read('scripts/windows-install-smoke.ps1');
  assert.match(
    smoke,
    /Filter 'Eidovara-\*-Windows-x64-Setup\.exe'/,
    'install smoke test must glob the installer instead of hardcoding a version'
  );
  assert.doesNotMatch(
    smoke,
    /Eidovara-\d+\.\d+\.\d+-Windows-x64-Setup\.exe/,
    'install smoke test must not pin an exact installer filename'
  );
});
