import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SoulEngine } from '../src/core/engine.js';
import { JsonStore } from '../src/core/store.js';
import { OfflineProvider } from '../src/providers/offline.js';
import { classifyGuestUrl, GUEST_PARTITION, isWebGuestEnabled } from '../src/core/guest-web.js';

const read = file => fs.readFileSync(path.join(process.cwd(), file), 'utf8');
function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'soul-guest-')); }
function engine(dir = tmp()) {
  return new SoulEngine({ store: new JsonStore({ dataDir: dir, profileId: 'default' }), provider: new OfflineProvider() });
}

test('web guest is off by default and only allows public HTTPS pages', () => {
  const s = engine();
  assert.equal(s.snapshot().assistant.capabilities.webGuest, 'disabled');
  assert.equal(isWebGuestEnabled(s.snapshot()), false);
  s.configureAssistant({ webGuest: 'enabled' });
  assert.equal(isWebGuestEnabled(s.snapshot()), true);
  assert.equal(classifyGuestUrl('https://example.com/watch').ok, true);
  assert.equal(classifyGuestUrl('http://example.com/').reason, 'http-only');
  assert.equal(classifyGuestUrl('https://127.0.0.1/').reason, 'blocked-host');
  assert.equal(classifyGuestUrl('https://user:pass@example.com/').reason, 'credentials');
  assert.equal(classifyGuestUrl('file:///tmp/page.html').reason, 'https-only');
});

test('guest window is an isolated sandboxed partition and the main workspace stays locked', () => {
  const guest = read('src/electron/guest-window.js');
  const core = read('src/core/guest-web.js');
  const main = read('src/electron/main.js');
  const html = read('src/renderer/index.html');
  assert.match(guest, /partition: GUEST_PARTITION/);
  assert.match(core, /persist:eidovara-guest/);
  assert.equal(GUEST_PARTITION, 'persist:eidovara-guest');
  assert.match(guest, /sandbox: true/);
  assert.match(guest, /nodeIntegration: false/);
  assert.match(guest, /contextIsolation: true/);
  assert.match(guest, /will-navigate/);
  assert.match(guest, /will-attach-webview/);
  assert.match(guest, /soul:openGuest/);
  assert.match(main, /attachGuestWindow/);
  assert.match(main, /will-navigate, e => e.preventDefault\(\)/);
  assert.match(html, /id="webGuestForm"/);
  assert.match(html, /id="webGuestPolicy"/);
  assert.doesNotMatch(html, /media-src [^"]*'self'/);
  assert.doesNotMatch(html, /media-src https:/);
  assert.doesNotMatch([guest, main, html].join('\n'), /yt-dlp|youtube-dl|widevine/i);
});
