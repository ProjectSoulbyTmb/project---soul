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
  INSTALLER_PINNED_URL
} from '../src/core/release.js';
import { DESKTOP_KNOWLEDGE_VERSION, INSTALLER_NAME as KNOWLEDGE_INSTALLER } from '../src/core/knowledge.js';
import { ASSIST_VERSION } from '../docs/knowledge.js';

const read = file => fs.readFileSync(file, 'utf8');

const PUBLISHED_SHA256 = 'F29A52F0495AB111A277780706E75ED616B6C236E25C3BDDF36E144ED5326675';
const PUBLISHED_SIZE_BYTES = 106691524;

test('v0.22.2 source and published Windows installer use the final published release bytes', () => {
  assert.equal(SOURCE_VERSION, '0.22.2');
  assert.equal(JSON.parse(read('package.json')).version, SOURCE_VERSION);
  assert.equal(DESKTOP_KNOWLEDGE_VERSION, SOURCE_VERSION);
  assert.equal(ASSIST_VERSION, SOURCE_VERSION);
  assert.equal(LIVE_INSTALLER_VERSION, '0.22.2');
  assert.equal(INSTALLER_NAME, 'Eidovara-0.22.2-Windows-x64-Setup.exe');
  assert.equal(KNOWLEDGE_INSTALLER, INSTALLER_NAME);
  assert.equal(INSTALLER_SHA256, PUBLISHED_SHA256);
  assert.equal(INSTALLER_SIZE_BYTES, PUBLISHED_SIZE_BYTES);
  assert.equal(INSTALLER_LATEST_URL, `https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/${INSTALLER_NAME}`);
  assert.equal(INSTALLER_PINNED_URL, `https://github.com/ProjectSoulbyTmb/project---soul/releases/download/v${LIVE_INSTALLER_VERSION}/${INSTALLER_NAME}`);
  assert.match(read('docs/download.html'), new RegExp(PUBLISHED_SHA256));
  assert.match(read('docs/download.html'), /106,691,524 bytes/);
  assert.match(read('docs/download.html'), /Authenticode-unsigned/);
  assert.match(read('docs/download.html'), /GitHub\/Sigstore provenance/);
  assert.match(read('CHANGELOG.md'), /## v0\.22\.2/);
  assert.match(read('src/electron/main.js'), /title: 'Eidovara v0\.22\.2'/);
});

test('Windows release workflow cannot republish a tag by overwriting its existing assets', () => {
  const workflow = read('.github/workflows/release-windows.yml');
  assert.match(workflow, /if: startsWith\(github\.ref, 'refs\/tags\/v'\)/);
  assert.match(workflow, /overwrite_files: false/);
  assert.doesNotMatch(workflow, /release\/publish-v0\.22\.2/);
  assert.match(workflow, /windows-install-smoke\.ps1/);
});
