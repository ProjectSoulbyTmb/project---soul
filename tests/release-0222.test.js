import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  SOURCE_VERSION,
  LIVE_INSTALLER_VERSION,
  INSTALLER_NAME,
  INSTALLER_SHA256,
  INSTALLER_LATEST_URL,
  INSTALLER_PINNED_URL
} from '../src/core/release.js';
import { DESKTOP_KNOWLEDGE_VERSION, INSTALLER_NAME as KNOWLEDGE_INSTALLER } from '../src/core/knowledge.js';
import { ASSIST_VERSION } from '../docs/knowledge.js';

const read = file => fs.readFileSync(file, 'utf8');

test('source 0.22.2 does not invent a 0.22.2 Setup.exe or move live 0.19.1', () => {
  assert.equal(SOURCE_VERSION, '0.22.2');
  assert.equal(JSON.parse(read('package.json')).version, SOURCE_VERSION);
  assert.equal(DESKTOP_KNOWLEDGE_VERSION, SOURCE_VERSION);
  assert.equal(ASSIST_VERSION, SOURCE_VERSION);
  assert.equal(LIVE_INSTALLER_VERSION, '0.19.1');
  assert.equal(INSTALLER_NAME, 'Eidovara-0.19.1-Windows-x64-Setup.exe');
  assert.equal(KNOWLEDGE_INSTALLER, INSTALLER_NAME);
  assert.equal(INSTALLER_SHA256, '72F4D09ADA17593F0391438A5375ABC9351041DA8ABB252E68271B8FDACCA7D8');
  assert.equal(INSTALLER_LATEST_URL, `https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/${INSTALLER_NAME}`);
  assert.equal(INSTALLER_PINNED_URL, `https://github.com/ProjectSoulbyTmb/project---soul/releases/download/v${LIVE_INSTALLER_VERSION}/${INSTALLER_NAME}`);
  assert.doesNotMatch(read('docs/download.html'), /Eidovara-0\.22\.2-Windows-x64-Setup\.exe/);
  assert.match(read('docs/download.html'), /Eidovara-0\.19\.1-Windows-x64-Setup\.exe/);
  assert.match(read('docs/download.html'), /72F4D09ADA17593F0391438A5375ABC9351041DA8ABB252E68271B8FDACCA7D8/);
  assert.match(read('CHANGELOG.md'), /## v0\.22\.2/);
  assert.match(read('src/electron/main.js'), /title: 'Eidovara v0\.22\.2'/);
});
