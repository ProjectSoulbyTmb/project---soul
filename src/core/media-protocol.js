// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import path from 'node:path';

export const LOCAL_MEDIA_SCHEME = 'eidovara-media';

const MIME = new Map([
  ['.mp3', 'audio/mpeg'],
  ['.m4a', 'audio/mp4'],
  ['.aac', 'audio/aac'],
  ['.wav', 'audio/wav'],
  ['.flac', 'audio/flac'],
  ['.ogg', 'audio/ogg'],
  ['.opus', 'audio/ogg'],
  ['.mp4', 'video/mp4'],
  ['.m4v', 'video/mp4'],
  ['.webm', 'video/webm'],
  ['.mov', 'video/quicktime'],
  ['.mkv', 'video/x-matroska'],
  ['.vtt', 'text/vtt'],
  ['.srt', 'application/x-subrip']
]);

const VIDEO_EXTS = new Set(['.mp4', '.m4v', '.webm', '.mov', '.mkv']);
const AUDIO_EXTS = new Set(['.mp3', '.m4a', '.aac', '.wav', '.flac', '.ogg', '.opus']);
const CAPTION_EXTS = ['.vtt', '.srt'];

export function mimeForPath(filePath) {
  return MIME.get(path.extname(String(filePath || '')).toLowerCase()) || 'application/octet-stream';
}

export function mediaKindForPath(filePath) {
  const ext = path.extname(String(filePath || '')).toLowerCase();
  if (VIDEO_EXTS.has(ext)) return 'video';
  if (AUDIO_EXTS.has(ext)) return 'audio';
  if (CAPTION_EXTS.includes(ext)) return 'captions';
  return '';
}

export function isMediaId(value) {
  return /^[a-f0-9]{32}$/.test(String(value || ''));
}

export function parseByteRange(header, size) {
  const n = Number(size);
  if (!Number.isFinite(n) || n < 0) return null;
  if (n === 0) return { start: 0, end: -1, size: 0, partial: false, length: 0 };
  if (!header) return { start: 0, end: n - 1, size: n, partial: false, length: n };
  const m = /^bytes=(\d*)-(\d*)$/i.exec(String(header).trim());
  if (!m) return null;
  let start;
  let end;
  if (m[1] === '' && m[2] !== '') {
    const suffix = Number(m[2]);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    start = Math.max(0, n - suffix);
    end = n - 1;
  } else {
    start = m[1] === '' ? 0 : Number(m[1]);
    end = m[2] === '' ? n - 1 : Number(m[2]);
  }
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end >= n || start > end) return null;
  return { start, end, size: n, partial: start !== 0 || end !== n - 1, length: end - start + 1 };
}

export function rangeResponseHeaders(filePath, range) {
  const mime = mimeForPath(filePath);
  const headers = {
    'Content-Type': mime,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-store',
    'X-Eidovara-Decode': 'native'
  };
  if (!range || range.size === 0) {
    headers['Content-Length'] = '0';
    return { status: 200, headers };
  }
  headers['Content-Length'] = String(range.length);
  if (range.partial) {
    headers['Content-Range'] = `bytes ${range.start}-${range.end}/${range.size}`;
    return { status: 206, headers };
  }
  return { status: 200, headers };
}

export function sidecarCaptionPaths(filePath) {
  const resolved = String(filePath || '');
  if (!resolved) return [];
  const dir = path.dirname(resolved);
  const base = path.basename(resolved, path.extname(resolved));
  return CAPTION_EXTS.map(ext => path.join(dir, `${base}${ext}`));
}
