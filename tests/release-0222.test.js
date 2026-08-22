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
} from '../src/core/knowledge.js';
import { ASSIST_VERSION } from '../docs/knowledge.js';

const read = file => fs.readFileSync(file, 'utf8');
const escapeRe = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('source and published Windows installer use one coherent set of release metadata', () => {
  assert.equal(SOURCE_VERSION, LIVE_INSTALLER_VERSION);
  assert.equal(JSON.parse(read('package.json')).version, SOURCE_VERSION);
  assert.equal(DESKTOP_KNOWLEDGE_VERSION, SOURCE_VERSION);
  assert.equal(ASSIST_VERSION, SOURCE_VERSION);
  assert.equal(INSTALLER_NAME, `Eidovara-v${LIVE_INSTALLER_VERSION}-Windows-x64-Setup.exe`);
  assert.equal(KNOWLEDGE_INSTALLER, INSTALLER_NAME);
  assert.match(INSTALLER_SHA256, /^[0-9A-F]{64}$/);
  assert.equal(INSTALLER_SIZE_BYTES, 106691524);
  assert.equal(
    INSTALLER_LATEST_URL,
    `https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/${INSTALLER_NAME}`
  );
  assert.equal(
    INSTALLER_PINNED_URL,
    `https://github.com/ProjectSoulbyTmb/project---soul/releases/download/v${LIVE_INSTALLER_VERSION}/${INSTALLER_NAME}`
  );
});

test('download page advertises exactly the canonical installer with integrity metadata', () => {
  const downloadPage = read('docs/download.html');
  assert.match(downloadPage, new RegExp(escapeRe(INSTALLER_NAME)));
  assert.match(downloadPage, new RegExp(INSTALLER_SHA256));
  assert.match(downloadPage, /Authenticode-unsigned/);
  assert.match(downloadPage, /GitHub\/Sigstore provenance/);
  assert.match(read('CHANGELOG.md'), new RegExp('## v' + escapeRe(SOURCE_VERSION)));
});

test('desktop window title derives its version from the running app, not a frozen literal', () => {
  const main = read('src/electron/main.js');
  assert.match(main, /title: `Eidovara v\$\{app\.getVersion\(\)\}`/);
});
