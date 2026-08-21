import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  LOCAL_MEDIA_SCHEME,
  LYRICS_UNAVAILABLE,
  HANDOFF_CONFIRM,
  prefersReducedMotion,
  motionMode,
  createNowPlayingState,
  expandPlayer,
  collapsePlayer,
  toggleExpanded,
  isAllowedPlaybackUrl,
  isBlockedEmbedUrl,
  officialSearchUrl,
  normalizePlaybackItem,
  setQueue,
  shouldHandleSpacePlayPause,
  shouldHandleEscapeCollapse
} from '../src/core/now-playing.js';

const read = file => fs.readFileSync(file, 'utf8');

test('playback protocol stays eidovara-media and CSP never opens media-src self', () => {
  const main = read('src/electron/main.js');
  const html = read('src/renderer/index.html');
  const core = read('src/core/now-playing.js');
  assert.equal(LOCAL_MEDIA_SCHEME, 'eidovara-media');
  assert.match(main, /LOCAL_MEDIA_SCHEME = 'eidovara-media'/);
  assert.match(core, /export const LOCAL_MEDIA_SCHEME = 'eidovara-media'/);
  assert.match(html, /media-src https: eidovara-media:/);
  assert.doesNotMatch(html, /media-src [^"]*'self'/);
  assert.doesNotMatch(read('src/renderer/now-playing.js'), /media-src [^"']*'self'/);
});

test('expand and collapse are explicit state, not display-none toggles', () => {
  let state = createNowPlayingState({ reducedMotion: false });
  state = setQueue(state, [{ type: 'audio', title: 'Harbor', url: 'eidovara-media://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/' }]);
  assert.equal(state.active, true);
  assert.equal(state.expanded, false);
  state = expandPlayer(state);
  assert.equal(state.expanded, true);
  state = collapsePlayer(state);
  assert.equal(state.expanded, false);
  state = toggleExpanded(state);
  assert.equal(state.expanded, true);
  const idle = expandPlayer(createNowPlayingState());
  assert.equal(idle.expanded, false);
  const css = read('src/renderer/now-playing.css');
  assert.match(css, /eidovara-player\.is-expanded/);
  assert.match(css, /transform:/);
  assert.match(css, /opacity:/);
  const uiShell = read('src/renderer/now-playing.js');
  assert.match(uiShell, /classList\.toggle\('is-expanded'/);
  assert.doesNotMatch(uiShell, /mediaDock'\)\.classList\.add\('hidden'\)/);
  const html = read('src/renderer/index.html');
  assert.match(html, /id="nowPlayingBar"/);
  assert.match(html, /id="nowPlayingStage"/);
  assert.match(html, /data-expanded=/);
  assert.doesNotMatch(html, /class="media-dock hidden"/);
});

test('reduced-motion flag skips slide motion', () => {
  assert.equal(prefersReducedMotion(true), true);
  assert.equal(prefersReducedMotion(false), false);
  assert.equal(motionMode(true), 'instant');
  assert.equal(motionMode(false), 'slide');
  const css = read('src/renderer/now-playing.css');
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /transition:\s*none/);
  const ui = read('src/renderer/now-playing.js');
  assert.match(ui, /prefers-reduced-motion:\s*reduce/);
});

test('player src allowlist rejects Spotify and YouTube embeds', () => {
  assert.equal(isAllowedPlaybackUrl('eidovara-media://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/'), true);
  assert.equal(isAllowedPlaybackUrl('https://upload.wikimedia.org/wikipedia/commons/example.ogg'), true);
  assert.equal(isAllowedPlaybackUrl('file:///C:/Music/track.mp3'), false);
  assert.equal(isAllowedPlaybackUrl('blob:https://eidovara.local/1'), false);
  const blocked = [
    'https://www.youtube.com/embed/dQw4w9wgGcQ',
    'https://www.youtube-nocookie.com/embed/dQw4w9wgGcQ',
    'https://youtu.be/dQw4w9wgGcQ',
    'https://www.youtube.com/iframe_api',
    'https://open.spotify.com/embed/track/abc',
    'https://embed.spotify.com/?uri=spotify:track:abc',
    'https://sdk.scdn.co/spotify-player.js'
  ];
  for (const url of blocked) {
    assert.equal(isBlockedEmbedUrl(url), true, url);
    assert.equal(isAllowedPlaybackUrl(url), false, url);
    assert.equal(normalizePlaybackItem({ type: 'audio', title: 'x', url }), null, url);
  }
  const ui = read('src/renderer/now-playing.js');
  assert.match(ui, /isAllowedPlaybackUrl/);
  assert.match(ui, /el\.src = url/);
  assert.match(ui, /youtube-nocookie/);
  assert.match(ui, /BLOCKED_EMBED/);
  assert.match(ui, /spotify-web-playback/);
  assert.doesNotMatch(ui, /new YT\.Player/);
  assert.doesNotMatch(ui, /Spotify\.Player\(/);
  assert.match(ui, /iframe_api/);
  assert.doesNotMatch(read('src/renderer/index.html'), /<iframe/i);
  assert.doesNotMatch(ui, /src\s*=\s*['"]https:\/\/(www\.)?youtube\.com\/embed/);
  assert.doesNotMatch(ui, /src\s*=\s*['"]https:\/\/open\.spotify\.com\/embed/);
});

test('Spotify and YouTube handoff URLs are official searches, not player sources', () => {
  const spotify = officialSearchUrl('spotify', 'Harbor Light');
  const youtube = officialSearchUrl('youtube', 'Harbor Light');
  assert.equal(spotify, 'https://open.spotify.com/search/Harbor%20Light');
  assert.equal(youtube, 'https://www.youtube.com/results?search_query=Harbor%20Light');
  assert.match(HANDOFF_CONFIRM, /Opens in the browser/);
  assert.match(LYRICS_UNAVAILABLE, /No licensed lyrics in-app/);
  const html = read('src/renderer/index.html');
  assert.match(html, /No licensed lyrics in-app/);
  assert.match(html, /Opens in the browser/);
  const ui = read('src/renderer/now-playing.js');
  assert.match(ui, /playerHandoffConfirm/);
  assert.match(ui, /openExternal/);
  assert.doesNotMatch(ui, /Spotify Web Playback SDK|new YT\.Player/);
});

test('space play/pause ignores typing, palette, and age-gated chrome', () => {
  const base = { key: ' ', hasSession: true };
  assert.equal(shouldHandleSpacePlayPause(base), true);
  assert.equal(shouldHandleSpacePlayPause({ ...base, ageGated: true }), false);
  assert.equal(shouldHandleSpacePlayPause({ ...base, paletteOpen: true }), false);
  assert.equal(shouldHandleSpacePlayPause({ ...base, overlayOpen: true }), false);
  assert.equal(shouldHandleSpacePlayPause({ ...base, targetTag: 'TEXTAREA' }), false);
  assert.equal(shouldHandleSpacePlayPause({ ...base, targetTag: 'INPUT' }), false);
  assert.equal(shouldHandleSpacePlayPause({ ...base, contentEditable: 'true' }), false);
  assert.equal(shouldHandleSpacePlayPause({ ...base, closestField: true }), false);
  assert.equal(shouldHandleSpacePlayPause({ ...base, ctrlKey: true }), false);
  assert.equal(shouldHandleEscapeCollapse({ key: 'Escape', expanded: true }), true);
  assert.equal(shouldHandleEscapeCollapse({ key: 'Escape', expanded: true, paletteOpen: true }), false);
  assert.equal(shouldHandleEscapeCollapse({ key: 'Escape', expanded: false }), false);
});
