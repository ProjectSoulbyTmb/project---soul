import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DEFAULT_EIDOVARA_SERVICE_BASE } from '../src/core/service.js';
import {
  DESKTOP_KNOWLEDGE_VERSION,
  INSTALLER_NAME,
  INSTALLER_SHA256,
} from '../src/core/knowledge.js';

const read = file => fs.readFileSync(file, 'utf8');
const escapeRe = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('current source keeps kernel, official api.eidovara.org, and the live installer metadata', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.version, DESKTOP_KNOWLEDGE_VERSION);
  assert.equal(INSTALLER_NAME, `Eidovara-v${DESKTOP_KNOWLEDGE_VERSION}-Windows-x64-Setup.exe`);
  assert.match(INSTALLER_SHA256, /^[0-9A-F]{64}$/);
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
});

test('historical release hashes stay in CHANGELOG; live pages advertise only the current installer', () => {
  const log = read('CHANGELOG.md');
  const v0190 = log.split('## v0.19.0')[1].split('## v0.18.3')[0];
  assert.match(v0190, /F2B0D9BB0A887294CF58A43C75DF67FA422C2120540DE03D5227A9B239D08310/);
  assert.doesNotMatch(v0190, /after the artifact exists/);
  const downloadPage = read('docs/download.html');
  assert.match(downloadPage, new RegExp(escapeRe(INSTALLER_NAME)));
  assert.match(downloadPage, new RegExp(INSTALLER_SHA256));
  assert.doesNotMatch(
    downloadPage,
    /F2B0D9BB0A887294CF58A43C75DF67FA422C2120540DE03D5227A9B239D08310/
  );
  assert.match(read('src/providers/internet.js'), /RAW_DROP_TAGS/);
  assert.match(read('tests/internet.test.js'), /<SCRIPT>steal\(\)<\/SCRIPT>/);
  assert.doesNotMatch(
    read('src/providers/internet.js'),
    /replace\(\/<(?:script|style)[\s\S]*?<\/(?:script|style)>/i
  );
});

test('tokens share one system-font language, reduced motion support, and no SF Pro', () => {
  const docsTokens = read('docs/tokens.css');
  const appTokens = read('src/renderer/tokens.css');
  for (const tokens of [docsTokens, appTokens]) {
    assert.match(tokens, /-apple-system, BlinkMacSystemFont/);
    assert.doesNotMatch(tokens, /"SF Pro Text"|"SF Pro Display"/);
    assert.match(tokens, /prefers-reduced-motion: reduce/);
  }
  assert.match(read('src/renderer/styles.css'), /prefers-reduced-motion: reduce/);
  assert.match(read('docs/site.css'), /prefers-reduced-motion/);
});
