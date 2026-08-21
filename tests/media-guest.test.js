import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SoulEngine } from '../src/core/engine.js';
import { JsonStore } from '../src/core/store.js';
import { OfflineProvider } from '../src/providers/offline.js';
import { adultAllowed } from '../src/core/policy.js';
import {
  GUEST_HONEST_COPY,
  GUEST_PARTITION,
  GUEST_UA_CAVEAT,
  adultLockClosesGuest,
  ageGateClosesGuest,
  chromeUserAgent,
  classifyGuestNavigation,
  guestShouldClose,
  guestWebPreferences,
  guestWindowOptions,
  normalizeGuestAddress
} from '../src/core/guest-navigation.js';
import {
  LOCAL_MEDIA_SCHEME,
  ONLINE_MEDIA_SCHEME,
  adultLockStopsOnline,
  authorizePlayableMedia,
  classifyOnlineMediaUrl,
  isExplicitOnlineMediaRequest,
  isPlayerProtocolUrl,
  onlinePlaybackFromInput
} from '../src/core/online-media.js';
import {
  createNowPlayingState,
  dropRemoteItems,
  isAllowedPlaybackUrl,
  normalizePlaybackItem,
  popOutPlayer,
  setQueue,
  shouldHideFloatingWindows
} from '../src/core/now-playing.js';

const read = file => fs.readFileSync(path.join(process.cwd(), file), 'utf8');
function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'soul-media-guest-')); }
function engine(dir = tmp()) {
  return new SoulEngine({ store: new JsonStore({ dataDir: dir, profileId: 'default' }), provider: new OfflineProvider() });
}

test('workspace renderer CSP still forbids media-src self and connect-src web', () => {
  const html = read('src/renderer/index.html');
  assert.match(html, /connect-src 'none'/);
  assert.doesNotMatch(html, /media-src [^"]*'self'/);
  assert.doesNotMatch(html, /connect-src [^"]*https/);
  assert.doesNotMatch(html, /default-src \*/);
  assert.match(html, /media-src eidovara-media: eidovara-online:/);
  assert.doesNotMatch(html, /media-src [^"]*\bhttps:/);
  assert.match(html, /id="mediaPopOutBtn"/);
  assert.match(html, /Online viewing uses a separate window/);
});

test('guest window options use an isolated partition, sandbox, and no nodeIntegration', () => {
  const prefs = guestWebPreferences();
  assert.equal(prefs.partition, GUEST_PARTITION);
  assert.equal(prefs.sandbox, true);
  assert.equal(prefs.nodeIntegration, false);
  assert.equal(prefs.contextIsolation, true);
  assert.equal(prefs.webSecurity, true);
  const win = guestWindowOptions();
  assert.equal(win.frame, false);
  assert.equal(win.transparent, true);
  assert.equal(win.webPreferences.sandbox, true);
  assert.equal(win.webPreferences.nodeIntegration, false);
  const guest = read('src/electron/media-guest.js');
  const preload = read('src/electron/media-guest-preload.cjs');
  const main = read('src/electron/main.js');
  assert.match(guest, /partition: GUEST_PARTITION|persist:eidovara-media-guest/);
  assert.match(guest, /sandbox: true/);
  assert.match(guest, /nodeIntegration: false/);
  assert.match(guest, /WebContentsView/);
  assert.match(guest, /destroyGuest/);
  assert.match(guest, /setUserAgent\(chromeUserAgent/);
  assert.match(guest, /will-navigate/);
  assert.match(guest, /setWindowOpenHandler/);
  assert.match(preload, /eidovaraGuest/);
  assert.doesNotMatch(preload, /soul:send|getSettings|encryptedApiKey/);
  assert.match(main, /attachMediaGuest/);
  assert.match(main, /ONLINE_MEDIA_SCHEME/);
  assert.match(main, /credentials: 'omit'/);
  assert.match(main, /parseByteRange/);
  assert.doesNotMatch(main, /disableHardwareAcceleration\(/);
});

test('guest navigation blocks http, localhost, and metadata IPs', () => {
  assert.equal(classifyGuestNavigation('http://example.com/a.mp3').reason, 'http-only');
  assert.equal(classifyGuestNavigation('https://localhost/watch').reason, 'blocked-host');
  assert.equal(classifyGuestNavigation('https://127.0.0.1/a').reason, 'blocked-host');
  assert.equal(classifyGuestNavigation('https://169.254.169.254/latest/meta-data/').reason, 'blocked-host');
  assert.equal(classifyGuestNavigation('https://192.168.1.9/clip.mp4').reason, 'blocked-host');
  assert.equal(classifyGuestNavigation('file:///tmp/song.mp3').reason, 'file-url');
  assert.equal(classifyGuestNavigation('javascript:alert(1)').reason, 'javascript');
  assert.equal(classifyGuestNavigation('data:text/html,hi').reason, 'data');
  assert.equal(classifyGuestNavigation('https://www.youtube.com/watch?v=dQw4w9wgGcQ').allow, true);
  assert.equal(classifyGuestNavigation('https://open.spotify.com/').allow, true);
  assert.equal(normalizeGuestAddress('https://archive.org/').startsWith('https://'), true);
  assert.match(chromeUserAgent('144.0.6668.58'), /Chrome\/144/);
  assert.doesNotMatch(chromeUserAgent('144.0.6668.58'), /Electron|Eidovara/);
});

test('http, localhost, metadata, and file URLs are rejected for workspace proxy too', () => {
  assert.equal(classifyOnlineMediaUrl('http://example.com/a.mp3').reason, 'http-only');
  assert.equal(classifyOnlineMediaUrl('https://localhost/a.mp3').reason, 'blocked-host');
  assert.equal(classifyOnlineMediaUrl('https://127.0.0.1/a.mp3').reason, 'blocked-host');
  assert.equal(classifyOnlineMediaUrl('https://169.254.169.254/latest/meta-data/').reason, 'blocked-host');
  assert.equal(classifyOnlineMediaUrl('https://192.168.1.9/clip.mp4').reason, 'blocked-host');
  assert.equal(classifyOnlineMediaUrl('file:///tmp/song.mp3').reason, 'file-url');
});

test('resolved private addresses are rejected even when the hostname is public-looking', async () => {
  const blocked = await authorizePlayableMedia('https://evil.example/clip.mp4', {
    explicit: true,
    adultLock: false,
    lookup: async () => [{ address: '169.254.169.254' }]
  });
  assert.equal(blocked.reason, 'blocked-host');
});

test('YouTube and Spotify open as guest pages, not workspace player src', () => {
  const yt = classifyOnlineMediaUrl('https://www.youtube.com/watch?v=dQw4w9wgGcQ');
  assert.equal(yt.kind, 'guest-page');
  assert.equal(yt.provider, 'YouTube');
  assert.equal(yt.playable, false);
  assert.match(yt.copy, /separate window/i);
  const sp = classifyOnlineMediaUrl('https://open.spotify.com/track/abc');
  assert.equal(sp.kind, 'guest-page');
  assert.equal(isAllowedPlaybackUrl(yt.url), false);
  assert.equal(normalizePlaybackItem({ type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9wgGcQ' }), null);
  assert.equal(isPlayerProtocolUrl(`${LOCAL_MEDIA_SCHEME}://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/`), true);
  assert.equal(isPlayerProtocolUrl(`${ONLINE_MEDIA_SCHEME}://bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/`), true);
});

test('Adult Mode lock closes guest and drops remote queue items', async () => {
  const s = engine();
  await s.respond('adult status confirmed');
  await s.respond('enable adult soul');
  await s.respond('I consent');
  assert.equal(adultAllowed(s.snapshot()), true);
  assert.equal(adultLockClosesGuest(s.snapshot()), true);
  assert.equal(adultLockStopsOnline(s.snapshot()), true);
  assert.equal(guestShouldClose({ adultLock: true }), true);
  assert.equal(ageGateClosesGuest({ ageGateAccepted: false }), true);
  assert.equal(shouldHideFloatingWindows({ adultMode: true }), true);
  const r = await s.respond('play this https://www.youtube.com/watch?v=dQw4w9wgGcQ');
  assert.equal(r.onlinePlayback.kind, 'guest-page');
  const queued = setQueue(createNowPlayingState(), [
    { type: 'audio', title: 'Local', url: `${LOCAL_MEDIA_SCHEME}://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/`, local: true },
    { type: 'audio', title: 'Remote', url: `${ONLINE_MEDIA_SCHEME}://bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/`, local: false }
  ]);
  const locked = dropRemoteItems(queued);
  assert.equal(locked.queue.length, 1);
  assert.equal(locked.queue[0].local, true);
  assert.equal(popOutPlayer({ ...queued, adultMode: true }).poppedOut, false);
  const guest = read('src/electron/media-guest.js');
  const main = read('src/electron/main.js');
  assert.match(guest, /hideIfAdult/);
  assert.match(guest, /destroyGuest/);
  assert.match(main, /mediaGuest\?\.hideIfAdult/);
  assert.match(main, /mediaGuest\?\.destroyGuest/);
  assert.match(read('src/renderer/renderer.js'), /dockMediaGuest/);
});

test('engine offers the guest window after an explicit play URL', async () => {
  const s = engine();
  assert.equal(isExplicitOnlineMediaRequest('hello'), false);
  const hello = await s.respond('hello');
  assert.equal(hello.onlinePlayback, null);
  const yt = await s.respond('play this https://www.youtube.com/watch?v=dQw4w9wgGcQ');
  assert.equal(yt.onlinePlayback.kind, 'guest-page');
  assert.match(yt.reply, /separate window/i);
  assert.ok(yt.kernel.actions.some(action => action.type === 'open-guest' && /youtube/i.test(action.url || '')));
  const file = await s.respond('play this https://example.com/song.mp3');
  assert.equal(file.onlinePlayback.kind, 'playable');
  assert.ok(file.kernel.actions.some(action => action.type === 'play-online'));
});

test('workspace HTML/CSP is unchanged toward star and piracy tools stay out', () => {
  const html = read('src/renderer/index.html');
  const guestHtml = read('src/renderer/media-guest.html');
  assert.doesNotMatch(html, /media-src [^"]*'self'/);
  assert.doesNotMatch(html, /default-src \*/);
  assert.match(html, /connect-src 'none'/);
  assert.doesNotMatch(guestHtml, /media-src [^"]*'self'/);
  assert.match(guestHtml, /connect-src 'none'/);
  const scanned = [
    'src/core/online-media.js',
    'src/core/now-playing.js',
    'src/core/guest-navigation.js',
    'src/electron/main.js',
    'src/electron/media-guest.js',
    'src/renderer/renderer.js',
    'package.json'
  ].map(read).join('\n');
  assert.doesNotMatch(scanned, /youtube-dl|yt-dlp|invidious|piped|shaka-player|hls\.js/i);
  assert.doesNotMatch(scanned, /widevine|web playback sdk/i);
  assert.match(read('src/core/guest-navigation.js'), new RegExp(GUEST_HONEST_COPY.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(read('src/core/guest-navigation.js'), new RegExp(GUEST_UA_CAVEAT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});
