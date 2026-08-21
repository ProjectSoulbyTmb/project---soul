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
  CATALOG_HANDOFF_COPY,
  ONLINE_MEDIA_SCHEME,
  LOCAL_MEDIA_SCHEME,
  adultLockStopsOnline,
  authorizePlayableMedia,
  classifyOnlineMediaUrl,
  describeOnlinePlayback,
  isExplicitOnlineMediaRequest,
  isOnlineMediaEnabled,
  isPlayerProtocolUrl,
  onlinePlaybackFromInput
} from '../src/core/online-media.js';
import {
  dropRemoteItems,
  isAllowedPlaybackUrl,
  normalizePlaybackItem,
  setQueue,
  createNowPlayingState
} from '../src/core/now-playing.js';

const read = file => fs.readFileSync(path.join(process.cwd(), file), 'utf8');
function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'soul-online-media-')); }
function engine(dir = tmp()) {
  return new SoulEngine({ store: new JsonStore({ dataDir: dir, profileId: 'default' }), provider: new OfflineProvider() });
}

test('default profile does not enable remote play', () => {
  const s = engine();
  assert.equal(s.snapshot().assistant.capabilities.onlineMedia, 'disabled');
  assert.equal(isOnlineMediaEnabled(s.snapshot()), false);
  assert.equal(onlinePlaybackFromInput('play this https://example.com/clip.mp4', s.snapshot()).reason, 'online-media-off');
  assert.equal(isExplicitOnlineMediaRequest('hello'), false);
  assert.equal(isExplicitOnlineMediaRequest('How is your mood today?'), false);
});

test('explicit https media URL is allowed through the main gate', async () => {
  const classified = classifyOnlineMediaUrl('https://example.com/music/track.mp3');
  assert.equal(classified.kind, 'playable');
  assert.equal(classified.hostname, 'example.com');
  const allowed = await authorizePlayableMedia('https://upload.wikimedia.org/wikipedia/commons/a/ab/Example.webm', {
    explicit: true,
    onlineMediaEnabled: true,
    adultLock: false,
    lookup: async () => [{ address: '185.15.59.224' }]
  });
  assert.equal(allowed.kind, 'playable');
  assert.equal(allowed.wikimedia, true);
  const archive = classifyOnlineMediaUrl('https://archive.org/download/example/example.flac');
  assert.equal(archive.kind, 'playable');
  assert.equal(archive.archive, true);
});

test('http, localhost, metadata, and file URLs are rejected', () => {
  assert.equal(classifyOnlineMediaUrl('http://example.com/a.mp3').reason, 'http-only');
  assert.equal(classifyOnlineMediaUrl('https://localhost/a.mp3').reason, 'blocked-host');
  assert.equal(classifyOnlineMediaUrl('https://127.0.0.1/a.mp3').reason, 'blocked-host');
  assert.equal(classifyOnlineMediaUrl('https://169.254.169.254/latest/meta-data/').reason, 'blocked-host');
  assert.equal(classifyOnlineMediaUrl('https://192.168.1.9/clip.mp4').reason, 'blocked-host');
  assert.equal(classifyOnlineMediaUrl('file:///tmp/song.mp3').reason, 'file-url');
  assert.equal(classifyOnlineMediaUrl('https://user:pass@example.com/a.mp3').reason, 'credentials');
});

test('resolved private addresses are rejected even when the hostname is public-looking', async () => {
  const blocked = await authorizePlayableMedia('https://evil.example/clip.mp4', {
    explicit: true,
    onlineMediaEnabled: true,
    adultLock: false,
    lookup: async () => [{ address: '169.254.169.254' }]
  });
  assert.equal(blocked.reason, 'blocked-host');
});

test('YouTube and Spotify URLs do not become player src', () => {
  const yt = classifyOnlineMediaUrl('https://www.youtube.com/watch?v=dQw4w9wgGcQ');
  assert.equal(yt.kind, 'catalog-handoff');
  assert.equal(yt.provider, 'YouTube');
  assert.equal(yt.playable, false);
  assert.match(yt.copy, /can’t play inside Eidovara/i);
  const gv = classifyOnlineMediaUrl('https://r1---sn-abc.googlevideo.com/videoplayback?id=1');
  assert.equal(gv.kind, 'catalog-handoff');
  assert.equal(gv.url, 'https://www.youtube.com/');
  const sp = classifyOnlineMediaUrl('https://open.spotify.com/track/abc');
  assert.equal(sp.kind, 'catalog-handoff');
  assert.equal(sp.provider, 'Spotify');
  const nf = classifyOnlineMediaUrl('https://www.netflix.com/watch/123');
  assert.equal(nf.kind, 'catalog-handoff');
  assert.equal(isAllowedPlaybackUrl(yt.url), false);
  assert.equal(isAllowedPlaybackUrl('https://www.youtube.com/watch?v=dQw4w9wgGcQ'), false);
  assert.equal(normalizePlaybackItem({ type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9wgGcQ' }), null);
});

test('HLS is refused without adding hls.js', () => {
  const hls = classifyOnlineMediaUrl('https://example.com/live/index.m3u8');
  assert.equal(hls.reason, 'hls-unsupported');
  assert.equal(classifyOnlineMediaUrl('https://example.com/a.mp4', { contentType: 'application/vnd.apple.mpegurl' }).reason, 'hls-unsupported');
});

test('renderer playback URLs are only custom protocols', () => {
  assert.equal(isPlayerProtocolUrl(`${LOCAL_MEDIA_SCHEME}://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/`), true);
  assert.equal(isPlayerProtocolUrl(`${ONLINE_MEDIA_SCHEME}://bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/`), true);
  assert.equal(isAllowedPlaybackUrl('https://example.com/a.mp3'), false);
  assert.equal(isAllowedPlaybackUrl('blob:https://example.com/1'), false);
  const item = normalizePlaybackItem({
    type: 'audio',
    title: 'Public clip',
    url: `${ONLINE_MEDIA_SCHEME}://bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/`,
    sourceUrl: 'https://example.com/a.mp3',
    local: false
  });
  assert.equal(item.remote, true);
  assert.equal(item.quality, undefined);
});

test('Adult Mode lock rejects remote playback and drops remote queue items', async () => {
  const s = engine();
  await s.respond('adult status confirmed');
  await s.respond('enable adult soul');
  await s.respond('I consent');
  assert.equal(adultAllowed(s.snapshot()), true);
  assert.equal(adultLockStopsOnline(s.snapshot()), true);
  s.configureAssistant({ onlineMedia: 'enabled' });
  const r = await s.respond('play this https://example.com/clip.mp4');
  assert.equal(r.onlinePlayback.reason, 'adult-lock');
  const queued = setQueue(createNowPlayingState(), [
    { type: 'audio', title: 'Local', url: `${LOCAL_MEDIA_SCHEME}://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/`, local: true },
    { type: 'audio', title: 'Remote', url: `${ONLINE_MEDIA_SCHEME}://bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/`, local: false }
  ]);
  const locked = dropRemoteItems(queued);
  assert.equal(locked.queue.length, 1);
  assert.equal(locked.queue[0].local, true);
  assert.equal(locked.poppedOut, false);
});

test('engine hands explicit play URLs to the player only after the gate', async () => {
  const s = engine();
  const hello = await s.respond('hello');
  assert.equal(hello.onlinePlayback, null);
  const disabled = await s.respond('play this https://example.com/song.mp3');
  assert.equal(disabled.onlinePlayback.reason, 'online-media-off');
  assert.equal(disabled.onlinePlayback.playbackUrl, undefined);
  s.configureAssistant({ onlineMedia: 'enabled' });
  const play = await s.respond('play this https://example.com/song.mp3');
  assert.equal(play.onlinePlayback.kind, 'playable');
  assert.equal(play.onlinePlayback.sourceUrl, 'https://example.com/song.mp3');
  assert.equal(play.onlinePlayback.playbackUrl, '');
  const yt = await s.respond('play this https://www.youtube.com/watch?v=dQw4w9wgGcQ');
  assert.equal(yt.onlinePlayback.kind, 'catalog-handoff');
  assert.match(yt.reply, /can’t play inside Eidovara/i);
  assert.ok(yt.kernel.actions.some(action => action.type === 'open-external' && action.catalog));
  assert.ok(!yt.kernel.actions.some(action => action.type === 'play-online' && /youtube/i.test(action.url || '')));
  const off = engine();
  const ytOff = await off.respond('play this https://www.youtube.com/watch?v=dQw4w9wgGcQ');
  assert.equal(ytOff.onlinePlayback.kind, 'catalog-handoff');
  assert.equal(ytOff.onlinePlayback.playable, false);
});

test('media-src is never self or https and piracy tool names stay out', () => {
  const html = read('src/renderer/index.html');
  const floatHtml = read('src/renderer/player-popout.html');
  const main = read('src/electron/main.js');
  const renderer = read('src/renderer/player.js');
  const preload = read('src/electron/preload.cjs');
  for (const page of [html, floatHtml]) {
    assert.doesNotMatch(page, /media-src [^"]*'self'/);
    assert.doesNotMatch(page, /media-src https:/);
    assert.match(page, /media-src eidovara-media: eidovara-online:/);
    assert.match(page, /connect-src 'none'/);
  }
  assert.match(main, /ONLINE_MEDIA_SCHEME/);
  assert.match(main, /\{ scheme: ONLINE_MEDIA_SCHEME/);
  assert.match(main, /protocol\.handle\(ONLINE_MEDIA_SCHEME/);
  assert.match(main, /credentials: 'omit'/);
  assert.match(main, /nodeIntegration: false/);
  assert.match(main, /sandbox: true/);
  assert.match(preload, /resolveOnlineMedia/);
  assert.match(renderer, /eidovara-media:/);
  assert.match(renderer, /eidovara-online:/);
  assert.doesNotMatch(renderer, /player\.src\s*=\s*['"]https:/);
  const scanned = [
    'src/core/online-media.js',
    'src/core/now-playing.js',
    'src/electron/main.js',
    'src/renderer/player.js',
    'src/renderer/player-popout.js',
    'package.json'
  ].map(read).join('\n');
  assert.doesNotMatch(scanned, /youtube-dl|yt-dlp|invidious|piped|shaka-player|hls\.js/i);
  assert.doesNotMatch(scanned, /widevine|web playback sdk/i);
  assert.match(read('src/core/online-media.js'), new RegExp(CATALOG_HANDOFF_COPY.replace(/[’']/g, "[’']")));
});
