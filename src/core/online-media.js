// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import dns from 'node:dns/promises';
import { adultAllowed } from './policy.js';
import { isBlockedResearchHost, publicHttpsUrl, hostnameAllowed, extractHttpsUrls } from '../providers/internet.js';
import { GUEST_HONEST_COPY, classifyGuestNavigation } from './guest-navigation.js';

export const LOCAL_MEDIA_SCHEME = 'eidovara-media';
export const ONLINE_MEDIA_SCHEME = 'eidovara-online';
export const GUEST_PAGE_COPY = GUEST_HONEST_COPY;
export const HLS_UNSUPPORTED_COPY = 'HLS playlists are not played in the workspace player. Open the page in the online viewing window if the site provides its own player. Eidovara does not load an HLS library from a CDN.';
export const MAX_ONLINE_REDIRECTS = 3;
export const ONLINE_HEAD_TIMEOUT_MS = 8_000;
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
  { provider: 'YouTube', suffixes: ['youtube.com', 'youtu.be', 'youtube-nocookie.com', 'googlevideo.com'], keepUserUrl: ['youtube.com', 'youtu.be'] },
  { provider: 'Spotify', suffixes: ['spotify.com', 'spotifycdn.com', 'scdn.co'], keepUserUrl: ['spotify.com'] },
  { provider: 'Internet Archive', suffixes: ['archive.org'], keepUserUrl: ['archive.org'] }
];

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

export function adultLockStopsOnline(state) {
  return adultAllowed(state) === true;
}

export function isExplicitOnlineMediaRequest(input) {
  const text = String(input || '');
  if (!text.trim()) return false;
  if (!/https:\/\//i.test(text)) return false;
  if (/\bplay\b/i.test(text)) return true;
  if (/\bopen\b[\s\S]{0,80}\b(?:youtube|spotify|archive)\b/i.test(text)) return true;
  return /\bopen\b[\s\S]{0,120}https:\/\/[^\s]+?\.(mp3|mp4|m4a|m4v|aac|flac|wav|webm|ogg|oga|ogv|opus)(?:\b|$|\?|#)/i.test(text);
}

export function catalogServiceForUrl(value) {
  const href = String(value || '');
  const host = hostnameOf(href);
  if (!host) return null;
  return CATALOG_SERVICES.find(service => hostnameAllowed(href, service.suffixes) || service.suffixes.some(suffix => host === suffix || host.endsWith(`.${suffix}`))) || null;
}

export function guestPageUrl(value) {
  const classified = classifyGuestNavigation(value, { topLevel: true });
  return classified.allow && classified.url !== 'about:blank' ? classified.url : '';
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
    const host = hostnameOf(href);
    const keep = catalog.keepUserUrl?.some(suffix => host === suffix || host.endsWith(`.${suffix}`));
    const guestUrl = keep ? (guestPageUrl(href) || href)
      : catalog.provider === 'YouTube' ? 'https://www.youtube.com/'
        : catalog.provider === 'Spotify' ? 'https://open.spotify.com/'
          : guestPageUrl(href) || href;
    return {
      kind: 'guest-page',
      playable: false,
      reason: 'guest-window',
      provider: catalog.provider,
      url: guestUrl,
      sourceUrl: href,
      copy: GUEST_PAGE_COPY
    };
  }
  const ext = extensionOf(parsed.pathname);
  if (HLS_EXTENSIONS.has(ext)) return rejected('hls-unsupported', { copy: HLS_UNSUPPORTED_COPY, guestUrl: href });
  if (DASH_EXTENSIONS.has(ext)) return rejected('dash-unsupported', { guestUrl: href });
  const fromType = mediaTypeFromContentType(contentType);
  if (fromType === 'hls') return rejected('hls-unsupported', { copy: HLS_UNSUPPORTED_COPY, guestUrl: href });
  if (fromType === 'dash') return rejected('dash-unsupported', { guestUrl: href });
  const fromExt = mediaTypeFromExtension(ext);
  const type = fromType === 'audio' || fromType === 'video' ? fromType : fromExt;
  if (!type && !DIRECT_MEDIA_EXTENSIONS.has(ext)) {
    const guest = guestPageUrl(href);
    if (guest) {
      return {
        kind: 'guest-page',
        playable: false,
        reason: 'guest-window',
        provider: hostnameOf(guest) || 'Web',
        url: guest,
        sourceUrl: href,
        copy: GUEST_PAGE_COPY
      };
    }
    return rejected('not-direct-media');
  }
  return {
    kind: 'playable',
    playable: true,
    url: href,
    hostname: parsed.hostname.toLowerCase(),
    type: type || 'audio',
    extension: ext,
    local: false
  };
}

export function describeOnlinePlayback(value, { adultLock = false, explicit = false, contentType = '' } = {}) {
  if (!explicit) return rejected('not-explicit');
  const classified = classifyOnlineMediaUrl(value, { contentType });
  if (classified.kind === 'guest-page') return classified;
  if (classified.kind === 'playable' && classified.protocol) return classified;
  if (adultLock) return rejected('adult-lock');
  if (classified.kind !== 'playable') return classified;
  return { ...classified, sourceUrl: classified.url, playbackUrl: '' };
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
  if (described.kind === 'guest-page') return described;
  if (described.kind !== 'playable') return described;
  if (described.local || described.protocol) return described;
  try {
    await lookupPublicAddresses(described.hostname, options.lookup);
  } catch (err) {
    return rejected('blocked-host', { message: String(err?.message || err) });
  }
  return described;
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
  if (onlinePlayback.kind === 'guest-page') {
    const line = `${GUEST_PAGE_COPY}\n${onlinePlayback.provider || 'Web'}: ${onlinePlayback.url}`;
    if (!text.includes(GUEST_PAGE_COPY)) text = text ? `${text}\n\n${line}` : line;
    return text;
  }
  if (onlinePlayback.kind === 'rejected') {
    const notes = {
      'adult-lock': 'Adult Mode is on, so the online viewing window is closed. Local files can still play in the workspace.',
      'not-explicit': 'Eidovara only opens remote media after you ask to play or open a specific HTTPS address.',
      'blocked-host': 'That host is blocked (private, loopback, or link-local).',
      'http-only': 'Only HTTPS addresses can open in the online viewing window.',
      'file-url': 'Remote viewing does not accept file: URLs. Use Open local media.',
      'hls-unsupported': HLS_UNSUPPORTED_COPY,
      'not-direct-media': 'That link is not a public HTTPS audio or video file the workspace player can decode. Open it in the online viewing window instead.'
    };
    const note = onlinePlayback.copy || notes[onlinePlayback.reason] || 'That media cannot play inside the workspace player.';
    if (!text.includes(note)) text = text ? `${text}\n\n${note}` : note;
  }
  if (onlinePlayback.kind === 'playable' && !text.includes('Eidovara can play that public HTTPS')) {
    text = `${text}\n\nEidovara can play that public HTTPS file in the workspace player through eidovara-online. Catalog sites such as YouTube use the separate online viewing window.`.trim();
  }
  return text;
}

export function onlinePlaybackFromInput(input, state) {
  if (!isExplicitOnlineMediaRequest(input)) return null;
  const urls = extractHttpsUrls(input);
  if (!urls.length) return rejected('not-direct-media');
  return describeOnlinePlayback(urls[0], {
    explicit: true,
    adultLock: adultLockStopsOnline(state)
  });
}
