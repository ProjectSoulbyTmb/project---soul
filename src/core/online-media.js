// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import dns from 'node:dns/promises';
import { adultAllowed } from './policy.js';
import { isBlockedResearchHost, publicHttpsUrl, hostnameAllowed, extractHttpsUrls } from '../providers/internet.js';

export const LOCAL_MEDIA_SCHEME = 'eidovara-media';
export const ONLINE_MEDIA_SCHEME = 'eidovara-online';
export const CATALOG_HANDOFF_COPY = 'This service can’t play inside Eidovara; it opens in your browser.';
export const ONLINE_MEDIA_COPY = 'Online media is opt-in. Eidovara plays public HTTPS audio/video files you ask for. Spotify, YouTube, Netflix, and other catalog apps open in your browser. No DRM in-process.';
export const HLS_UNSUPPORTED_COPY = 'HLS playlists are not played in-app. Desktop Chromium does not decode MPEG-TS HLS, and Eidovara does not load hls.js or Shaka from a CDN.';
export const MAX_ONLINE_REDIRECTS = 3;
export const ONLINE_HEAD_TIMEOUT_MS = 8_000;
export const ONLINE_CONNECT_TIMEOUT_MS = 20_000;
export const MAX_ONLINE_DECLARED_BYTES = 4 * 1024 * 1024 * 1024;
export const ONLINE_AGENT = 'Eidovara/0.19 (desktop media client)';

export const DIRECT_MEDIA_EXTENSIONS = new Set([
  '.mp4', '.m4v', '.webm', '.ogv', '.ogg', '.oga',
  '.mp3', '.m4a', '.aac', '.flac', '.wav', '.opus'
]);

const HLS_EXTENSIONS = new Set(['.m3u8', '.m3u']);
const DASH_EXTENSIONS = new Set(['.mpd']);

const AUDIO_EXTENSIONS = new Set(['.mp3', '.m4a', '.aac', '.flac', '.wav', '.opus', '.oga', '.ogg']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.m4v', '.webm', '.ogv']);

const AUDIO_TYPES = [
  'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/aac', 'audio/flac', 'audio/x-flac',
  'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/webm', 'audio/opus'
];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
const HLS_TYPES = ['application/vnd.apple.mpegurl', 'application/x-mpegurl', 'audio/mpegurl'];
const DASH_TYPES = ['application/dash+xml'];

export const CATALOG_SERVICES = [
  { provider: 'YouTube', suffixes: ['youtube.com', 'youtu.be', 'youtube-nocookie.com', 'googlevideo.com'], home: 'https://www.youtube.com/', keepUserUrl: ['youtube.com', 'youtu.be'] },
  { provider: 'Spotify', suffixes: ['spotify.com', 'spotifycdn.com', 'scdn.co'], home: 'https://open.spotify.com/', keepUserUrl: ['spotify.com'] },
  { provider: 'Netflix', suffixes: ['netflix.com'], home: 'https://www.netflix.com/', keepUserUrl: ['netflix.com'] },
  { provider: 'Disney+', suffixes: ['disneyplus.com'], home: 'https://www.disneyplus.com/', keepUserUrl: ['disneyplus.com'] },
  { provider: 'Prime Video', suffixes: ['primevideo.com'], home: 'https://www.primevideo.com/', keepUserUrl: ['primevideo.com'] },
  { provider: 'Max', suffixes: ['max.com', 'hbomax.com'], home: 'https://www.max.com/', keepUserUrl: ['max.com', 'hbomax.com'] },
  { provider: 'Hulu', suffixes: ['hulu.com'], home: 'https://www.hulu.com/', keepUserUrl: ['hulu.com'] },
  { provider: 'Apple TV', suffixes: ['tv.apple.com'], home: 'https://tv.apple.com/', keepUserUrl: ['tv.apple.com'] },
  { provider: 'Apple Music', suffixes: ['music.apple.com'], home: 'https://music.apple.com/', keepUserUrl: ['music.apple.com'] },
  { provider: 'Tidal', suffixes: ['tidal.com'], home: 'https://tidal.com/', keepUserUrl: ['tidal.com'] },
  { provider: 'Deezer', suffixes: ['deezer.com'], home: 'https://www.deezer.com/', keepUserUrl: ['deezer.com'] },
  { provider: 'Twitch', suffixes: ['twitch.tv'], home: 'https://www.twitch.tv/', keepUserUrl: ['twitch.tv'] }
];

const ARCHIVE_FILE_HOSTS = ['archive.org'];
const WIKIMEDIA_FILE_HOSTS = ['upload.wikimedia.org', 'wikimedia.org'];

function hostnameOf(value) {
  try { return new URL(String(value || '')).hostname.toLowerCase(); } catch { return ''; }
}

function extensionOf(pathname) {
  const base = String(pathname || '').split('/').pop() || '';
  const clean = base.split('?')[0].split('#')[0];
  const dot = clean.lastIndexOf('.');
  if (dot < 0) return '';
  return clean.slice(dot).toLowerCase();
}

function mediaTypeFromExtension(ext) {
  if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  if (AUDIO_EXTENSIONS.has(ext)) return 'audio';
  if (ext === '.ogg') return 'audio';
  return '';
}

function mediaTypeFromContentType(value) {
  const type = String(value || '').split(';')[0].trim().toLowerCase();
  if (!type) return '';
  if (HLS_TYPES.includes(type) || type.endsWith('mpegurl')) return 'hls';
  if (DASH_TYPES.includes(type)) return 'dash';
  if (AUDIO_TYPES.includes(type) || type.startsWith('audio/')) return 'audio';
  if (VIDEO_TYPES.includes(type) || type.startsWith('video/')) return 'video';
  return '';
}

function rejected(reason, extra = {}) {
  return { kind: 'rejected', reason, playable: false, ...extra };
}

export function isPlayerProtocolUrl(value) {
  const raw = String(value || '').trim();
  return new RegExp(`^(${LOCAL_MEDIA_SCHEME}|${ONLINE_MEDIA_SCHEME}):`, 'i').test(raw);
}

export function isLocalPlayerUrl(value) {
  return new RegExp(`^${LOCAL_MEDIA_SCHEME}:`, 'i').test(String(value || '').trim());
}

export function isOnlinePlayerUrl(value) {
  return new RegExp(`^${ONLINE_MEDIA_SCHEME}:`, 'i').test(String(value || '').trim());
}

export function onlineMediaCapability(value) {
  return value === 'enabled' ? 'enabled' : 'disabled';
}

export function isOnlineMediaEnabled(stateOrCaps) {
  const caps = stateOrCaps?.assistant?.capabilities || stateOrCaps || {};
  return caps.onlineMedia === 'enabled';
}

export function adultLockStopsOnline(state) {
  return adultAllowed(state) === true;
}

export function isExplicitOnlineMediaRequest(input) {
  const text = String(input || '');
  if (!text.trim()) return false;
  if (!/https:\/\//i.test(text)) return false;
  if (/\bplay\b/i.test(text)) return true;
  return /\bopen\b[\s\S]{0,120}https:\/\/[^\s]+?\.(mp3|mp4|m4a|m4v|aac|flac|wav|webm|ogg|oga|ogv|opus)(?:\b|$|\?|#)/i.test(text);
}

export function catalogServiceForUrl(value) {
  const href = String(value || '');
  const host = hostnameOf(href);
  if (!host) return null;
  return CATALOG_SERVICES.find(service => hostnameAllowed(href, service.suffixes) || service.suffixes.some(suffix => host === suffix || host.endsWith(`.${suffix}`))) || null;
}

export function catalogHandoffTarget(value) {
  const service = catalogServiceForUrl(value);
  if (!service) return '';
  const href = publicHttpsUrl(value);
  const host = hostnameOf(href);
  if (href && service.keepUserUrl?.some(suffix => host === suffix || host.endsWith(`.${suffix}`))) return href;
  return service.home;
}

export function isArchiveFileUrl(value) {
  try {
    const url = new URL(String(value || ''));
    if (!hostnameAllowed(url.href, ARCHIVE_FILE_HOSTS)) return false;
    const path = url.pathname.toLowerCase();
    return path.includes('/download/') || path.includes('/items/') || DIRECT_MEDIA_EXTENSIONS.has(extensionOf(path));
  } catch {
    return false;
  }
}

export function isWikimediaFileUrl(value) {
  try {
    const url = new URL(String(value || ''));
    if (!hostnameAllowed(url.href, WIKIMEDIA_FILE_HOSTS)) return false;
    return DIRECT_MEDIA_EXTENSIONS.has(extensionOf(url.pathname));
  } catch {
    return false;
  }
}

export function classifyOnlineMediaUrl(value, { contentType = '' } = {}) {
  const raw = String(value || '').trim();
  if (!raw) return rejected('empty');
  let parsed;
  try { parsed = new URL(raw); } catch { return rejected('invalid-url'); }
  if (parsed.protocol === `${LOCAL_MEDIA_SCHEME}:` || parsed.protocol === `${ONLINE_MEDIA_SCHEME}:`) {
    return { kind: 'playable', playable: true, protocol: parsed.protocol.replace(':', ''), url: parsed.toString(), local: parsed.protocol === `${LOCAL_MEDIA_SCHEME}:` };
  }
  if (parsed.protocol === 'file:') return rejected('file-url');
  if (parsed.protocol === 'http:') return rejected('http-only');
  if (parsed.protocol !== 'https:') return rejected('https-only');
  if (parsed.username || parsed.password) return rejected('credentials');
  if (isBlockedResearchHost(parsed)) return rejected('blocked-host');
  const href = publicHttpsUrl(parsed.toString());
  if (!href) return rejected('https-only');
  parsed = new URL(href);
  const catalog = catalogServiceForUrl(href);
  if (catalog) {
    return {
      kind: 'catalog-handoff',
      playable: false,
      reason: 'catalog-drm',
      provider: catalog.provider,
      url: catalogHandoffTarget(href),
      sourceUrl: href,
      copy: CATALOG_HANDOFF_COPY
    };
  }
  const ext = extensionOf(parsed.pathname);
  if (HLS_EXTENSIONS.has(ext)) return rejected('hls-unsupported', { copy: HLS_UNSUPPORTED_COPY });
  if (DASH_EXTENSIONS.has(ext)) return rejected('dash-unsupported');
  const fromType = mediaTypeFromContentType(contentType);
  if (fromType === 'hls') return rejected('hls-unsupported', { copy: HLS_UNSUPPORTED_COPY });
  if (fromType === 'dash') return rejected('dash-unsupported');
  const fromExt = mediaTypeFromExtension(ext);
  const type = fromType === 'audio' || fromType === 'video' ? fromType : fromExt;
  const archiveFile = isArchiveFileUrl(href);
  const wikiFile = isWikimediaFileUrl(href);
  if (!type && !archiveFile && !wikiFile) return rejected('not-direct-media');
  if (!type && (archiveFile || wikiFile) && !DIRECT_MEDIA_EXTENSIONS.has(ext) && !fromType) {
    return rejected('not-direct-media');
  }
  return {
    kind: 'playable',
    playable: true,
    url: href,
    hostname: parsed.hostname.toLowerCase(),
    type: type || 'audio',
    extension: ext,
    archive: archiveFile,
    wikimedia: wikiFile,
    local: false
  };
}

export function describeOnlinePlayback(value, { onlineMediaEnabled = false, adultLock = false, explicit = false, contentType = '' } = {}) {
  if (!explicit) return rejected('not-explicit');
  const classified = classifyOnlineMediaUrl(value, { contentType });
  if (classified.kind === 'catalog-handoff') return classified;
  if (classified.kind === 'playable' && classified.protocol) return classified;
  if (adultLock) return rejected('adult-lock');
  if (!onlineMediaEnabled) return rejected('online-media-off');
  if (classified.kind !== 'playable') return classified;
  return {
    ...classified,
    sourceUrl: classified.url,
    playbackUrl: ''
  };
}

export async function lookupPublicAddresses(hostname, lookup) {
  const host = String(hostname || '').replace(/^\[|\]$/g, '').toLowerCase();
  if (!host) throw new Error('That host is blocked for in-app playback.');
  if (isBlockedResearchHost(`https://${host}/`)) throw new Error('That host is blocked for in-app playback.');
  const impl = lookup || ((name) => dns.lookup(name, { all: true }));
  const result = await impl(host);
  const list = Array.isArray(result) ? result : [result];
  for (const item of list) {
    const address = typeof item === 'string' ? item : item?.address;
    if (!address) continue;
    if (isBlockedResearchHost(`https://${address}/`)) throw new Error('That host is blocked for in-app playback.');
  }
  return list;
}

export async function authorizePlayableMedia(value, options = {}) {
  const described = describeOnlinePlayback(value, options);
  if (described.kind !== 'playable') return described;
  if (described.local || described.protocol) return described;
  try {
    await lookupPublicAddresses(described.hostname, options.lookup);
  } catch (err) {
    return rejected('blocked-host', { message: String(err?.message || err) });
  }
  const fetchImpl = options.fetchImpl;
  if (!fetchImpl) return described;
  try {
    const inspected = await inspectMediaHeaders(described.url, { fetchImpl, timeoutMs: options.timeoutMs || ONLINE_HEAD_TIMEOUT_MS });
    if (inspected.kind !== 'playable') return inspected;
    return { ...described, ...inspected, url: inspected.url || described.url, hostname: hostnameOf(inspected.url || described.url) };
  } catch (err) {
    if (described.extension && DIRECT_MEDIA_EXTENSIONS.has(described.extension)) return described;
    return rejected('inspect-failed', { message: String(err?.message || err) });
  }
}

export async function inspectMediaHeaders(url, { fetchImpl, timeoutMs = ONLINE_HEAD_TIMEOUT_MS, hops = 0 } = {}) {
  if (hops > MAX_ONLINE_REDIRECTS) return rejected('redirect-limit');
  const classified = classifyOnlineMediaUrl(url);
  if (classified.kind !== 'playable') return classified;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(classified.url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'manual',
      credentials: 'omit',
      headers: { 'User-Agent': ONLINE_AGENT, Accept: 'audio/*,video/*,application/ogg', 'Cache-Control': 'no-store' }
    });
    const status = Number(res?.status || 0);
    if ([301, 302, 303, 307, 308].includes(status)) {
      const location = res.headers?.get?.('location');
      if (!location) return rejected('redirect-limit');
      const next = new URL(location, classified.url).toString();
      const nextClass = classifyOnlineMediaUrl(next);
      if (nextClass.kind !== 'playable') return nextClass;
      return inspectMediaHeaders(next, { fetchImpl, timeoutMs, hops: hops + 1 });
    }
    if (status === 405 || status === 501) return classified;
    if (!res?.ok && status !== 206) return classified.extension ? classified : rejected('http-status');
    const declared = Number(res.headers?.get?.('content-length') || 0);
    if (declared > MAX_ONLINE_DECLARED_BYTES) return rejected('too-large');
    const contentType = res.headers?.get?.('content-type') || '';
    return classifyOnlineMediaUrl(classified.url, { contentType });
  } finally {
    clearTimeout(timer);
  }
}

export function followRedirectUrl(current, location) {
  if (!location) return '';
  try {
    return new URL(String(location), current).toString();
  } catch {
    return '';
  }
}

export function requestHeadersForOnlineMedia(request) {
  const headers = { 'User-Agent': ONLINE_AGENT, Accept: 'audio/*,video/*,application/ogg', 'Cache-Control': 'no-store' };
  const range = request?.headers?.get?.('range') || request?.headers?.get?.('Range');
  if (range) headers.Range = range;
  return headers;
}

export function citeOnlinePlayback(reply, onlinePlayback) {
  let text = String(reply || '');
  if (!onlinePlayback) return text;
  if (onlinePlayback.kind === 'catalog-handoff') {
    const line = `${CATALOG_HANDOFF_COPY}\n${onlinePlayback.provider || 'Catalog'}: ${onlinePlayback.url}`;
    if (!text.includes(CATALOG_HANDOFF_COPY)) text = text ? `${text}\n\n${line}` : line;
    return text;
  }
  if (onlinePlayback.kind === 'rejected') {
    const notes = {
      'online-media-off': 'Online media is off. Enable it in Settings to play a public HTTPS audio or video file in Eidovara. Spotify, YouTube, and Netflix still open in your browser.',
      'adult-lock': 'Adult Mode is on, so remote playback is stopped. Local files can still play.',
      'not-explicit': 'Eidovara only fetches remote media after you ask to play a specific HTTPS file.',
      'blocked-host': 'That host is blocked for in-app playback (private, loopback, or link-local).',
      'http-only': 'Only HTTPS media files can play in Eidovara.',
      'file-url': 'Remote playback does not accept file: URLs. Use Open local media.',
      'hls-unsupported': HLS_UNSUPPORTED_COPY,
      'catalog-drm': CATALOG_HANDOFF_COPY,
      'not-direct-media': 'That link is not a public HTTPS audio or video file Eidovara can decode.'
    };
    const note = onlinePlayback.copy || notes[onlinePlayback.reason] || 'That media cannot play inside Eidovara.';
    if (!text.includes(note)) text = text ? `${text}\n\n${note}` : note;
  }
  if (onlinePlayback.kind === 'playable' && !text.includes('Eidovara can play that public HTTPS')) {
    text = `${text}\n\nEidovara can play that public HTTPS file in the in-app player after the main-process gate. Quality is whatever the stream already is — there is no fake 4K menu.`.trim();
  }
  return text;
}

export function onlinePlaybackFromInput(input, state) {
  if (!isExplicitOnlineMediaRequest(input)) return null;
  const urls = extractHttpsUrls(input);
  if (!urls.length) return rejected('not-direct-media');
  return describeOnlinePlayback(urls[0], {
    explicit: true,
    onlineMediaEnabled: isOnlineMediaEnabled(state),
    adultLock: adultLockStopsOnline(state)
  });
}

export function qualityLabel(item) {
  if (!item) return '';
  if (item.local) return 'Native';
  return 'Stream';
}

export function remoteFeatureAllowed(feature, item) {
  if (!item) return false;
  if (item.local) return true;
  if (feature === 'sidecar') return false;
  if (feature === 'quality-menu') return false;
  return ['rate', 'loop', 'shuffle', 'fullscreen', 'sleep'].includes(feature);
}
