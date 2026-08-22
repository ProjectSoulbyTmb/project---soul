import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DEFAULT_EIDOVARA_SERVICE_BASE } from '../src/core/service.js';
import {
  INSTALLER_NAME,
  INSTALLER_MEASURED,
  INSTALLER_SHA256,
  DESKTOP_KNOWLEDGE_VERSION,
} from '../src/core/knowledge.js';

const read = file => fs.readFileSync(file, 'utf8');

test('first-run after 18+ has one Dashboard path and Assist is not Soul', () => {
  const html = read('src/renderer/index.html');
  const renderer = read('src/renderer/renderer.js');
  assert.match(html, /id="startPath"/);
  assert.match(html, /data-i18n="startPathTitle"/);
  assert.match(html, /Assist is not Soul/);
  assert.match(html, /id="welcomeDashboardBtn"/);
  assert.match(html, /You're in\. Start on the Dashboard/);
  assert.match(html, /id="companionForm"/);
  assert.match(html, /id="companionInput"/);
  assert.match(renderer, /setView\(settings\.ageGateAccepted\?'dashboard':'chat'\)/);
  assert.match(renderer, /eidovara\.startPathDismissed/);
  assert.match(html, /I confirm I am 18 or older/);
  assert.match(html, /id="ageGateAcceptBtn" disabled/);
});

test('keyboard cheatsheet and Ctrl+K palette are discoverable without stealing Ctrl+A from fields', () => {
  const html = read('src/renderer/index.html');
  const renderer = read('src/renderer/renderer.js');
  assert.match(html, /id="commandPalette"/);
  assert.match(html, /id="shortcutSheet"/);
  assert.match(html, /id="paletteBtn"/);
  assert.match(html, /aria-keyshortcuts="Control\+K"/);
  assert.match(html, /aria-keyshortcuts="Control\+\/"/);
  assert.match(html, /Ctrl\+A is admin only when you are not typing/);
  assert.match(renderer, /e\.key\.toLowerCase\(\)==='k'/);
  assert.match(renderer, /e\.key==='\/'\|\|e\.key==='\?'/);
  assert.match(renderer, /input, textarea, select, \[contenteditable="true"\]/);
  assert.match(renderer, /openPalette/);
  assert.match(renderer, /openShortcutSheet/);
  assert.match(renderer, /function bindHoldToTalk/);
  assert.match(renderer, /function focusCompanion/);
});

test('settings are grouped with short help and official overridable service default', () => {
  const html = read('src/renderer/index.html');
  assert.match(html, /class="settings-jump"/);
  assert.match(html, /id="settings-service"/);
  assert.match(html, /id="settings-voices"/);
  assert.match(html, /class="settings-help"/);
  assert.match(html, /placeholder="https:\/\/api\.eidovara\.org"/);
  assert.equal(DEFAULT_EIDOVARA_SERVICE_BASE, 'https://api.eidovara.org');
  assert.doesNotMatch(html, /workers\.dev/);
  assert.match(html, /id="assistOptIn"/);
  assert.match(html, /Default off/);
  assert.match(read('src/electron/main.js'), /assistOptIn: false/);
  assert.match(read('src/electron/main.js'), /function publicServiceUrl/);
});

test('new chrome keeps focus-visible, reduced motion, and 18+ unsigned no-payments truth', () => {
  const css = read('src/renderer/styles.css');
  const html = read('src/renderer/index.html');
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /\.truth-note/);
  assert.match(css, /\.start-path/);
  assert.match(html, /Authenticode-unsigned|not Authenticode-signed/);
  assert.match(html, /no live payment/i);
  assert.match(html, /18 or older/);
  assert.doesNotMatch(html, /media-src [^"]*'self'/);
});

test('confirm-launch and age gate tests remain in the shipped surface', () => {
  const renderer = read('src/renderer/renderer.js');
  const main = read('src/electron/main.js');
  assert.match(renderer, /alreadyConfirmed/);
  assert.match(main, /Ask Windows to open/);
  assert.match(main, /showMessageBox/);
  assert.match(main, /function requireAgeGate/);
  assert.equal(DESKTOP_KNOWLEDGE_VERSION, JSON.parse(read('package.json')).version);
  assert.equal(INSTALLER_NAME, `Eidovara-v${DESKTOP_KNOWLEDGE_VERSION}-Windows-x64-Setup.exe`);
  if (INSTALLER_MEASURED) assert.match(INSTALLER_SHA256, /^[0-9A-F]{64}$/);
  else assert.equal(INSTALLER_SHA256, null);
});
