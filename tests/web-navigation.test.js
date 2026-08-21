import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { officialSearchHandoffs } from '../src/core/entertainment.js';
import {
  WEB_PARTITION,
  classifyGuestNavigation,
  classifyWebNavigation,
  isPrivateOrLocalHostname,
  shouldDestroyWorkspaceWeb,
  webGuestPreferences,
  webNavigateAllowed
} from '../src/core/web-navigation.js';

const read = file => fs.readFileSync(file, 'utf8');

test('workspace CSP opens connect-src to HTTPS without weakening media or scripts', () => {
  const html = read('src/renderer/index.html');
  assert.match(html, /connect-src https:/);
  assert.match(html, /media-src https: eidovara-media:/);
  assert.doesNotMatch(html, /media-src [^"]*'self'/);
  assert.doesNotMatch(html, /connect-src \*/);
  assert.doesNotMatch(html, /connect-src 'none'/);
  assert.doesNotMatch(html, /script-src [^;]*unsafe-inline/);
  assert.doesNotMatch(html, /script-src [^;]*unsafe-eval/);
  assert.doesNotMatch(html, /script-src [^;]*https:/);
  assert.doesNotMatch(html, /frame-src https:/);
  assert.doesNotMatch(html, /youtube\.com\/embed/);
  assert.doesNotMatch(html, /open\.spotify\.com\/embed/);
  assert.doesNotMatch(html, /<iframe/i);
  assert.match(html, /id="webView"/);
  assert.match(html, /id="webStage"/);
  assert.match(html, /data-view="web"/);
});

test('classifyGuestNavigation rejects private, loopback, and unsafe schemes', () => {
  assert.equal(classifyGuestNavigation('http://example.com').reason, 'http');
  assert.equal(classifyGuestNavigation('file:///etc/passwd').reason, 'file');
  assert.equal(classifyGuestNavigation('javascript:alert(1)').reason, 'unsafe-scheme');
  assert.equal(classifyGuestNavigation('data:text/html,hi').reason, 'unsafe-scheme');
  assert.equal(classifyGuestNavigation('blob:https://example.com/1').reason, 'unsafe-scheme');
  assert.equal(classifyGuestNavigation('https://localhost/').reason, 'private-host');
  assert.equal(classifyGuestNavigation('https://127.0.0.1/').reason, 'private-host');
  assert.equal(classifyGuestNavigation('https://169.254.1.1/').reason, 'private-host');
  assert.equal(classifyGuestNavigation('https://10.1.2.3/').reason, 'private-host');
  assert.equal(classifyGuestNavigation('https://192.168.1.9/').reason, 'private-host');
  assert.equal(classifyGuestNavigation('https://metadata.google.internal/').reason, 'private-host');
  assert.equal(classifyGuestNavigation('https://router.internal/').reason, 'private-host');
  assert.equal(classifyGuestNavigation('').reason, 'empty');
  assert.equal(classifyGuestNavigation('https://example.com/').ok, true);
  assert.match(classifyGuestNavigation('https://example.com/').url, /^https:\/\/example\.com\//);
  assert.equal(classifyWebNavigation('about:blank').ok, true);
  assert.equal(webNavigateAllowed('example.com').ok, true);
  assert.equal(isPrivateOrLocalHostname('127.0.0.1'), true);
  assert.equal(isPrivateOrLocalHostname('example.com'), false);
});

test('workspace web guest stays sandboxed without Soul preload', () => {
  const prefs = webGuestPreferences();
  assert.equal(prefs.partition, WEB_PARTITION);
  assert.equal(prefs.partition, 'persist:eidovara-web');
  assert.equal(prefs.sandbox, true);
  assert.equal(prefs.nodeIntegration, false);
  assert.equal(prefs.contextIsolation, true);
  assert.equal(prefs.webSecurity, true);
  assert.equal(prefs.allowRunningInsecureContent, false);
  assert.equal(Object.prototype.hasOwnProperty.call(prefs, 'preload'), false);
  assert.equal(shouldDestroyWorkspaceWeb({ adultAllowed: true, ageGateAccepted: true }).destroy, true);
  assert.equal(shouldDestroyWorkspaceWeb({ adultAllowed: false, ageGateAccepted: false }).reason, 'age-gate');
  assert.equal(shouldDestroyWorkspaceWeb({ adultAllowed: false, ageGateAccepted: true }).destroy, false);
});

test('main window keeps sandbox and denies workspace navigation and webviews', () => {
  const main = read('src/electron/main.js');
  assert.match(main, /sandbox: true/);
  assert.match(main, /will-navigate', e => e\.preventDefault\(\)/);
  assert.match(main, /will-attach-webview', e => e\.preventDefault\(\)/);
  assert.match(main, /attachWorkspaceWeb/);
  assert.match(main, /workspaceWeb\?\.destroy/);
  assert.doesNotMatch(main, /webviewTag:\s*true/);
  const guest = read('src/electron/workspace-web.js');
  assert.match(guest, /persist:eidovara-web|WEB_PARTITION|webGuestPreferences/);
  assert.match(guest, /sandbox: true/);
  assert.match(guest, /nodeIntegration: false/);
  assert.match(guest, /will-attach-webview/);
  assert.doesNotMatch(guest, /preload:/);
  assert.match(read('src/electron/preload.cjs'), /webShow:/);
  assert.match(read('src/renderer/web.js'), /webShow/);
});

test('officialSearchHandoffs Saturn order is unchanged', () => {
  assert.deepEqual(officialSearchHandoffs('Saturn').map(item => item.provider), ['YouTube', 'Spotify', 'Internet Archive']);
});
