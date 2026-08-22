import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  mimeForPath,
  mediaKindForPath,
  parseByteRange,
  rangeResponseHeaders,
  sidecarCaptionPaths,
  playbackUrlFromCommons,
  downscaleForbidden,
  isMediaId
} from '../src/core/media-protocol.js';

test('byte-range parser supports seek without reading the whole file', () => {
  assert.deepEqual(parseByteRange(null, 1000), { start: 0, end: 999, size: 1000, partial: false, length: 1000 });
  assert.deepEqual(parseByteRange('bytes=0-499', 1000), { start: 0, end: 499, size: 1000, partial: true, length: 500 });
  assert.deepEqual(parseByteRange('bytes=500-', 1000), { start: 500, end: 999, size: 1000, partial: true, length: 500 });
  assert.deepEqual(parseByteRange('bytes=-100', 1000), { start: 900, end: 999, size: 1000, partial: true, length: 100 });
  assert.equal(parseByteRange('bytes=40-20', 1000), null);
  const headers = rangeResponseHeaders('/tmp/film.mp4', parseByteRange('bytes=0-1', 40));
  assert.equal(headers.status, 206);
  assert.equal(headers.headers['Accept-Ranges'], 'bytes');
  assert.equal(headers.headers['Content-Type'], 'video/mp4');
  assert.equal(headers.headers['X-Eidovara-Decode'], 'native');
});

test('sidecar vtt/srt sit next to the media file and commons video uses the original URL', () => {
  const file = path.join('/library', 'Harbor Light.mp4');
  assert.deepEqual(sidecarCaptionPaths(file), [
    path.join('/library', 'Harbor Light.vtt'),
    path.join('/library', 'Harbor Light.srt')
  ]);
  assert.equal(mediaKindForPath(file), 'video');
  assert.equal(mimeForPath('song.flac'), 'audio/flac');
  assert.equal(isMediaId('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'), true);
  assert.equal(
    playbackUrlFromCommons({ url: 'https://upload.wikimedia.org/original.webm', thumburl: 'https://upload.wikimedia.org/thumb.jpg' }, 'video'),
    'https://upload.wikimedia.org/original.webm'
  );
  assert.equal(
    playbackUrlFromCommons({ url: 'https://upload.wikimedia.org/full.jpg', thumburl: 'https://upload.wikimedia.org/900.jpg' }, 'image'),
    'https://upload.wikimedia.org/900.jpg'
  );
  assert.equal(downscaleForbidden({ kind: 'video', iiurlwidth: 900 }), true);
  assert.equal(downscaleForbidden({ kind: 'image', iiurlwidth: 900 }), false);
});
