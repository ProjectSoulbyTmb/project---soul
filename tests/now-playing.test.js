import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LOCAL_MEDIA_SCHEME,
  ONLINE_MEDIA_SCHEME,
  clampRate,
  collapsePlayer,
  createNowPlayingState,
  expandPlayer,
  isAllowedPlaybackUrl,
  nextIndex,
  officialSearchUrl,
  qualityLabel,
  setQueue,
  shouldHandleEscapeCollapse,
  shouldHandleSpacePlayPause
} from '../src/core/now-playing.js';

test('now-playing expands only when active and honors reduced-motion helpers', () => {
  const idle = createNowPlayingState();
  assert.equal(expandPlayer(idle).expanded, false);
  const active = setQueue(createNowPlayingState(), [{
    type: 'audio',
    title: 'Take',
    url: `${LOCAL_MEDIA_SCHEME}://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/`,
    local: true
  }]);
  assert.equal(active.active, true);
  assert.equal(expandPlayer(active).expanded, true);
  assert.equal(collapsePlayer(expandPlayer(active)).expanded, false);
  assert.equal(qualityLabel({ local: true }), 'Native');
  assert.equal(qualityLabel({ local: false }), 'Stream');
  assert.equal(clampRate(1.3), 1.25);
});

test('space toggles playback outside fields and escape collapses the stage', () => {
  assert.equal(shouldHandleSpacePlayPause({ key: ' ', hasSession: true, targetTag: 'DIV' }), true);
  assert.equal(shouldHandleSpacePlayPause({ key: ' ', hasSession: true, targetTag: 'INPUT' }), false);
  assert.equal(shouldHandleEscapeCollapse({ key: 'Escape', expanded: true }), true);
  assert.equal(isAllowedPlaybackUrl(`${ONLINE_MEDIA_SCHEME}://bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/`), true);
  assert.match(officialSearchUrl('youtube', 'saturn'), /youtube\.com\/results/);
  const looped = { queue: [1, 2], index: 1, loop: true, shuffle: false };
  assert.equal(nextIndex(looped, 1), 0);
});
