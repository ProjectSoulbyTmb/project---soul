import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { classifyWorkspaceIntent } from '../src/core/workspace.js';
import { actionsForIntent, KERNEL_ACTION_TYPES, routeKernel, soulOverlay } from '../src/core/kernel.js';
import { defaultProfile } from '../src/core/schema.js';
import {
  classifyGuestNavigation,
  guestNavigateAllowed,
  overlayWindowOptions,
  resolveOverlayTarget
} from '../src/core/guest-overlay.js';
import { composeOfflineReply } from '../src/providers/offline.js';

const read = file => fs.readFileSync(file, 'utf8');

test('overlay phrases classify and emit open-overlay kernel actions', () => {
  assert.equal(classifyWorkspaceIntent('Open the Discord overlay'), 'overlay-discord');
  assert.equal(classifyWorkspaceIntent('Open the chat overlay'), 'overlay-chat');
  assert.equal(classifyWorkspaceIntent('Open the browse overlay'), 'overlay-browse');
  assert.equal(classifyWorkspaceIntent('Show overlays'), 'overlays');
  const overlay = soulOverlay(defaultProfile());
  const discord = actionsForIntent('overlay-discord', overlay);
  assert.equal(discord[0].type, 'open-overlay');
  assert.equal(discord[0].kind, 'discord');
  assert.equal(discord[0].auto, true);
  assert.ok(KERNEL_ACTION_TYPES.includes('open-overlay'));
  const routed = routeKernel('Open the Discord overlay', defaultProfile());
  assert.equal(routed.intent, 'overlay-discord');
  assert.equal(routed.actions[0].kind, 'discord');
});

test('guest overlay policy blocks private, loopback, http, file, and non-Discord hosts', () => {
  assert.equal(classifyGuestNavigation('http://example.com').ok, false);
  assert.equal(classifyGuestNavigation('http://example.com').reason, 'http');
  assert.equal(classifyGuestNavigation('file:///etc/passwd').ok, false);
  assert.equal(classifyGuestNavigation('https://localhost/admin').ok, false);
  assert.equal(classifyGuestNavigation('https://127.0.0.1/').reason, 'private-host');
  assert.equal(classifyGuestNavigation('https://169.254.169.254/latest/meta-data').reason, 'private-host');
  assert.equal(classifyGuestNavigation('https://192.168.1.1/').reason, 'private-host');
  assert.equal(classifyGuestNavigation('https://10.0.0.1/').reason, 'private-host');
  assert.equal(classifyGuestNavigation('https://[::1]/').reason, 'private-host');
  assert.equal(classifyGuestNavigation('https://user:pass@example.com/').reason, 'credentials');
  assert.equal(classifyGuestNavigation('javascript:alert(1)').ok, false);
  const ok = classifyGuestNavigation('https://example.com/path');
  assert.equal(ok.ok, true);
  assert.match(ok.url, /^https:\/\/example\.com\/path/);

  const discord = resolveOverlayTarget('discord', '');
  assert.equal(discord.ok, true);
  assert.equal(discord.url, 'https://discord.com/app');
  assert.equal(resolveOverlayTarget('discord', 'https://www.youtube.com/watch?v=dQw4w9wgGcQ').reason, 'not-discord');
  assert.equal(resolveOverlayTarget('discord', 'https://discord.gg/invite').ok, true);
  assert.equal(guestNavigateAllowed('discord', 'https://example.com').reason, 'not-discord');
  assert.equal(guestNavigateAllowed('browse', 'https://example.com').ok, true);
  assert.equal(guestNavigateAllowed('chat', 'https://example.com').ok, false);

  const chat = overlayWindowOptions('chat');
  assert.equal(chat.frame, false);
  assert.equal(chat.transparent, true);
  assert.equal(chat.nodeIntegration, false);
  assert.equal(chat.sandbox, true);
  assert.equal(overlayWindowOptions('browse').partition, 'persist:eidovara-guest-browse');
  assert.equal(overlayWindowOptions('discord').partition, 'persist:eidovara-guest-discord');
});

test('overlay HTML keeps media-src off self and the workspace renderer stays locked', () => {
  for (const file of ['src/renderer/guest-chrome.html', 'src/renderer/chat-overlay.html', 'src/renderer/index.html']) {
    const html = read(file);
    assert.doesNotMatch(html, /media-src [^"]*'self'/, file);
    assert.match(html, /connect-src 'none'/, file);
  }
  assert.match(read('src/renderer/index.html'), /media-src https: eidovara-media:/);
  assert.match(read('src/renderer/index.html'), /id="overlayPanel"/);
  assert.match(read('src/renderer/renderer.js'), /action\.type==='open-overlay'/);
  assert.match(read('src/electron/preload.cjs'), /openOverlay:/);
  const main = read('src/electron/main.js');
  assert.match(main, /createGuestOverlayManager/);
  assert.doesNotMatch(main, /CreateRemoteThread|WriteProcessMemory|dll inject/i);
  const guest = read('src/electron/guest-overlays.js');
  assert.match(guest, /nodeIntegration: false/);
  assert.match(guest, /will-navigate/);
  const createGuestBody = guest.slice(guest.indexOf('function createGuest(kind'), guest.indexOf('function wirePair'));
  assert.match(createGuestBody, /partition: opts\.partition/);
  assert.doesNotMatch(createGuestBody, /preload:/);
});

test('gaming overlay copy stays honest and guest windows are Eidovara-owned', () => {
  const reply = composeOfflineReply({ input: 'Open the Discord overlay', state: defaultProfile(), intent: 'overlay-discord' });
  assert.match(reply, /Eidovara windows/i);
  assert.match(reply, /do not inject/i);
  assert.doesNotMatch(reply, /official Discord overlay/i);
  const gaming = composeOfflineReply({ input: 'Help me prepare my gaming or streaming setup.', state: defaultProfile(), intent: 'gaming' });
  assert.match(gaming, /checklist|process injection|low-overhead/i);
  assert.match(read('src/electron/overlay-preload.cjs'), /exposeInMainWorld\('overlay'/);
  assert.match(read('src/renderer/chat-overlay.js'), /window\.soul\.send/);
});
