import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  classifyGuestNavigation,
  guestNavigateAllowed,
  guestWebPreferences,
  GUEST_PARTITIONS,
} from '../src/core/guest-overlay.js';
import {
  formatEidovaraProcessMetrics,
  overlayPaletteItems,
  shouldDestroyGuestOverlays,
} from '../src/core/overlays.js';
import {
  actionsForIntent,
  KERNEL_ACTION_TYPES,
  soulOverlay,
  suggestionsForView,
} from '../src/core/kernel.js';
import { defaultProfile } from '../src/core/schema.js';
import { builtinPaletteItems, filterPalette } from '../src/core/layers.js';
import { matchTolerant } from './helpers/match-tolerant.js';

const read = file => fs.readFileSync(file, 'utf8');

test('guest web preferences stay sandboxed without Node', () => {
  const browse = guestWebPreferences('browse');
  assert.equal(browse.partition, GUEST_PARTITIONS.browse);
  assert.equal(browse.partition, 'persist:eidovara-guest');
  assert.equal(browse.sandbox, true);
  assert.equal(browse.nodeIntegration, false);
  assert.equal(browse.webSecurity, true);
  const discord = guestWebPreferences('discord');
  assert.equal(discord.partition, 'persist:eidovara-guest-discord');
  assert.equal(discord.sandbox, true);
  assert.equal(discord.nodeIntegration, false);
});

test('guest navigation blocks http, localhost, and metadata IPs', () => {
  assert.equal(classifyGuestNavigation('http://example.com').reason, 'http');
  assert.equal(classifyGuestNavigation('https://localhost/').reason, 'private-host');
  assert.equal(
    classifyGuestNavigation('https://169.254.169.254/latest/meta-data').reason,
    'private-host'
  );
  assert.equal(guestNavigateAllowed('browse', 'http://127.0.0.1/').ok, false);
  assert.equal(guestNavigateAllowed('browse', 'https://example.com').ok, true);
  assert.equal(classifyGuestNavigation('about:blank').ok, true);
});

test('adult lock closes guest overlays while age-gate closes all', () => {
  assert.deepEqual(
    shouldDestroyGuestOverlays({ adultAllowed: true, ageGateAccepted: true }).closeGuests,
    true
  );
  assert.equal(
    shouldDestroyGuestOverlays({ adultAllowed: true, ageGateAccepted: true }).closeAll,
    false
  );
  assert.equal(
    shouldDestroyGuestOverlays({ adultAllowed: false, ageGateAccepted: false }).closeAll,
    true
  );
  assert.equal(
    shouldDestroyGuestOverlays({ adultAllowed: false, ageGateAccepted: true }).closeGuests,
    false
  );
  const main = read('src/electron/main.js');
  assert.match(main, /closeGuests/);
  assert.match(main, /hideIfGated/);
  assert.match(
    read('src/electron/guest-overlays.js'),
    /Adult Mode is on, so guest overlays stay closed/
  );
});

test('workspace CSP is not widened and overlay HTML stays locked', () => {
  const html = read('src/renderer/index.html');
  assert.doesNotMatch(html, /media-src [^"]*'self'/);
  assert.doesNotMatch(html, /connect-src \*/);
  assert.match(html, /connect-src 'none'/);
  for (const file of ['src/renderer/guest-chrome.html', 'src/renderer/chat-overlay.html']) {
    const page = read(file);
    assert.doesNotMatch(page, /media-src [^"]*'self'/, file);
    assert.match(page, /connect-src 'none'/, file);
  }
});

test('companion overlay chips resolve and palette lists overlay commands', () => {
  const overlay = soulOverlay(defaultProfile());
  for (const type of [
    'open-chat-overlay',
    'open-browse-overlay',
    'open-discord-overlay',
    'set-always-on-top',
    'open-now-playing',
  ]) {
    assert.ok(KERNEL_ACTION_TYPES.includes(type), type);
    matchTolerant(read('src/renderer/renderer.js'), new RegExp(`action\\.type==='${type}'`));
  }
  const play = suggestionsForView('apps', overlay);
  assert.ok(play.some(item => item.type === 'open-discord-overlay'));
  const home = suggestionsForView('dashboard', overlay);
  assert.ok(home.some(item => item.type === 'open-chat-overlay'));
  assert.ok(home.some(item => item.type === 'start-focus'));
  const gaming = actionsForIntent('gaming', overlay, 'apps');
  assert.ok(gaming.some(item => item.type === 'set-always-on-top'));
  const palette = filterPalette('discord overlay', builtinPaletteItems());
  assert.ok(palette.some(item => item.id === 'cmd-overlay-discord'));
  assert.ok(overlayPaletteItems().some(item => item.action.type === 'open-browse-overlay'));
});

test('no Discord token storage helpers and process metrics stay Eidovara-only', () => {
  for (const file of [
    'src/electron/guest-overlays.js',
    'src/electron/overlay-windows.js',
    'src/electron/overlay-preload.cjs',
    'src/core/guest-overlay.js',
    'src/renderer/guest-chrome.js',
  ]) {
    const text = read(file);
    assert.doesNotMatch(
      text,
      /discordToken|botToken|Authorization:\s*['"]Bot |harvest.*token|localStorage\.setItem\(['"]token/i,
      file
    );
  }
  const metrics = formatEidovaraProcessMetrics({
    getCPUUsage: () => ({ percentCPUUsage: 1.5 }),
    memoryUsage: () => ({ rss: 20 * 1024 * 1024, heapUsed: 8 * 1024 * 1024 }),
  });
  assert.equal(metrics.source, 'eidovara-process');
  assert.match(metrics.note, /Eidovara process only/);
  assert.doesNotMatch(metrics.note, /NVIDIA overlay|scrape other games'? memory/i);
});
