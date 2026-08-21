import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DEFAULT_EIDOVARA_SERVICE_BASE } from '../src/core/service.js';
import { DESKTOP_KNOWLEDGE_VERSION, INSTALLER_NAME } from '../src/core/knowledge.js';

const read = file => fs.readFileSync(file, 'utf8');

test('v0.19.0 keeps kernel, official api.eidovara.org, and honest 18+ truth', () => {
  assert.equal(JSON.parse(read('package.json')).version, '0.19.1');
  assert.equal(DESKTOP_KNOWLEDGE_VERSION, '0.19.1');
  assert.equal(INSTALLER_NAME, 'Eidovara-0.19.0-Windows-x64-Setup.exe');
  assert.equal(DEFAULT_EIDOVARA_SERVICE_BASE, 'https://api.eidovara.org');
  const html = read('src/renderer/index.html');
  assert.match(html, /id="startPath"/);
  assert.match(html, /id="companionForm"/);
  assert.match(html, /id="focusQuietBar"/);
  assert.match(html, /href="layers\.css"/);
  assert.match(html, /src="workspace-layers\.js"/);
  assert.match(html, /I confirm I am 18 or older/);
  assert.match(html, /Assist is not Soul/);
  assert.match(html, /no live payment/i);
  assert.doesNotMatch(html, /workers\.dev/);
  assert.doesNotMatch(html, /media-src [^"]*'self'/);
  assert.match(read('src/electron/main.js'), /function publicServiceUrl/);
  assert.match(read('docs/index.html'), /v0\.19\.0/);
  assert.match(read('docs/download.html'), /Eidovara-0\.19\.0-Windows-x64-Setup\.exe/);
  assert.match(read('docs/help.html'), /v0\.19\.0/);
});

test('tokens stay identical, system fonts only, reduced motion, no SF Pro', () => {
  assert.equal(read('docs/tokens.css'), read('src/renderer/tokens.css'));
  const tokens = read('docs/tokens.css');
  assert.doesNotMatch(tokens, /"SF Pro Text"|"SF Pro Display"/);
  assert.match(tokens, /prefers-reduced-motion: reduce/);
  assert.match(read('src/renderer/styles.css'), /prefers-reduced-motion: reduce/);
  assert.match(read('docs/site.css'), /prefers-reduced-motion/);
});
