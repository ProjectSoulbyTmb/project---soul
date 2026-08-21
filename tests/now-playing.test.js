import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  LOCAL_MEDIA_SCHEME,
  MEDIA_SESSION_ACTIONS,
  LYRICS_UNAVAILABLE,
  createNowPlayingState,
  setQueue,
  nextIndex,
  previousIndex,
  cycleLoop,
  toggleShuffle,
  setRate,
  armSleepTimer,
  sleepTimerDue,
  qualityChoices,
  selectedQualityUrl,
  nativePlaybackUrl,
  isBlockedEmbedUrl,
  isAllowedPlaybackUrl,
  shouldHideFloatingWindows,
  popOutPlayer,
  dockPlayer,
  setPictureInPicture,
  hardwareDecodePreferred,
  videoPresentationFlags,
  outputPickerAvailable,
  shouldHandleSpacePlayPause,
  shouldHandleEscapeCollapse,
  officialSearchUrl,
  expandPlayer,
  collapsePlayer
} from '../src/core/now-playing.js';

const local = { type: 'audio', title: 'Harbor Light', url: 'eidovara-media://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/', local: true };
const video = { type: 'video', title: 'Harbor Film', url: 'eidovara-media://bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/', local: true };

test('now-playing queue expands, loops, shuffles, and rates without vendor embeds', () => {
  let state = createNowPlayingState();
  state = setQueue(state, [local, video, { type: 'audio', title: 'Blocked', url: 'https://www.youtube.com/embed/dQw4' }]);
  assert.equal(state.queue.length, 2);
  assert.equal(state.active, true);
  assert.equal(expandPlayer(state).expanded, true);
  assert.equal(collapsePlayer(expandPlayer(state)).expanded, false);
  state = cycleLoop(state);
  assert.equal(state.loop, 'one');
  assert.equal(nextIndex(state), 0);
  state = cycleLoop(cycleLoop(state));
  assert.equal(state.loop, 'off');
  assert.equal(nextIndex({ ...state, index: 1, loop: 'all' }), 0);
  assert.equal(previousIndex({ ...state, index: 0, loop: 'all' }), 1);
  assert.equal(setRate(state, 1.3).rate, 1.25);
  state = toggleShuffle(state);
  assert.equal(state.shuffle, true);
  assert.equal(isBlockedEmbedUrl('https://open.spotify.com/embed/track/1'), true);
  assert.equal(isAllowedPlaybackUrl('https://www.youtube.com/embed/x'), false);
  assert.equal(isAllowedPlaybackUrl(`${LOCAL_MEDIA_SCHEME}://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/`), true);
  assert.match(officialSearchUrl('youtube', 'Harbor'), /youtube\.com\/results\?search_query=/);
  assert.match(officialSearchUrl('archive', 'Harbor'), /archive\.org\/search\?query=/);
});

test('quality menu appears only for real extra renditions on custom protocols', () => {
  const item = {
    type: 'video',
    title: 'Film',
    url: 'eidovara-media://bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/',
    local: true,
    renditions: [
      { id: '720', label: '720p', url: 'eidovara-media://cccccccccccccccccccccccccccccccc/' },
      { id: 'native', label: 'Native', url: 'eidovara-media://bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/', native: true }
    ]
  };
  assert.equal(nativePlaybackUrl(item), 'eidovara-media://bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/');
  const choices = qualityChoices(item);
  assert.ok(choices.length >= 2);
  assert.equal(selectedQualityUrl(item, '720'), 'eidovara-media://cccccccccccccccccccccccccccccccc/');
  assert.deepEqual(qualityChoices({ type: 'audio', url: 'eidovara-media://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/' }), []);
  assert.equal(isAllowedPlaybackUrl('https://upload.wikimedia.org/original.webm'), false);
  assert.equal(isAllowedPlaybackUrl('eidovara-online://dddddddddddddddddddddddddddddddd/'), true);
  assert.equal(videoPresentationFlags().noDownscale, true);
  assert.equal(videoPresentationFlags().preload, 'auto');
  assert.equal(hardwareDecodePreferred({ hardwareAcceleration: true }), true);
  assert.equal(hardwareDecodePreferred({ disableGpu: true }), false);
});

test('floating windows hide in Adult Mode and before 18+, Pop out/Dock otherwise', () => {
  let state = setQueue(createNowPlayingState(), [video]);
  state = popOutPlayer(state);
  assert.equal(state.poppedOut, true);
  state = dockPlayer(state);
  assert.equal(state.poppedOut, false);
  assert.equal(shouldHideFloatingWindows({ adultMode: true }), true);
  assert.equal(shouldHideFloatingWindows({ ageGated: true }), true);
  assert.equal(popOutPlayer({ ...state, adultMode: true }).poppedOut, false);
  assert.equal(setPictureInPicture({ ...state, adultMode: true }, true).pictureInPicture, false);
  assert.equal(setPictureInPicture(state, true).pictureInPicture, true);
  assert.equal(outputPickerAvailable({ setSinkId: async () => {} }), true);
  assert.equal(outputPickerAvailable({}), false);
});

test('sleep timer, media keys, space/escape, and sidecar captions stay first-party', () => {
  const now = 1_000_000;
  const armed = armSleepTimer(createNowPlayingState(), 15, now);
  assert.equal(armed.sleepUntil, now + 15 * 60_000);
  assert.equal(sleepTimerDue(armed, now + 14 * 60_000), false);
  assert.equal(sleepTimerDue(armed, now + 16 * 60_000), true);
  assert.ok(MEDIA_SESSION_ACTIONS.includes('previoustrack'));
  assert.equal(shouldHandleSpacePlayPause({ key: ' ', hasSession: true, targetTag: 'DIV' }), true);
  assert.equal(shouldHandleSpacePlayPause({ key: ' ', hasSession: true, targetTag: 'TEXTAREA' }), false);
  assert.equal(shouldHandleEscapeCollapse({ key: 'Escape', expanded: true }), true);
  assert.match(LYRICS_UNAVAILABLE, /No licensed lyrics/);
});

test('player sources stay eidovara-media/eidovara-online, never media-src self, embeds, Hi-Res logos, or ffmpeg', () => {
  const files = [
    'src/renderer/index.html',
    'src/renderer/player.js',
    'src/renderer/now-playing.css',
    'src/electron/main.js',
    'src/electron/player-windows.js',
    'src/electron/guest-window.js',
    'src/core/now-playing.js',
    'src/core/online-media.js'
  ];
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(text, /media-src [^"']*'self'/);
    assert.doesNotMatch(text, /youtube\.com\/embed|spotify\.com\/embed/i);
    assert.doesNotMatch(text, /Hi-?Res|MQA|Dolby Atmos logo/i);
    assert.doesNotMatch(text, /ffmpeg/i);
    assert.doesNotMatch(text, /workers\.dev/);
  }
  const html = fs.readFileSync('src/renderer/index.html', 'utf8');
  assert.match(html, /media-src eidovara-media: eidovara-online:/);
  assert.doesNotMatch(html, /media-src https:/);
  assert.match(html, /id="eidovaraPlayer"/);
  assert.match(html, /id="mediaPopOutBtn"/);
  assert.match(fs.readFileSync('src/electron/main.js', 'utf8'), /LOCAL_MEDIA_SCHEME = 'eidovara-media'/);
  assert.match(fs.readFileSync('src/electron/main.js', 'utf8'), /parseByteRange/);
  assert.doesNotMatch(fs.readFileSync('src/electron/main.js', 'utf8'), /disableHardwareAcceleration\(/);
  assert.doesNotMatch(fs.readFileSync('src/electron/main.js', 'utf8'), /appendSwitch\(['"]disable-gpu['"]\)/);
});
