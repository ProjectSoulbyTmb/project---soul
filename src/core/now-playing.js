// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0

export const LOCAL_MEDIA_SCHEME = 'eidovara-media';
export const LYRICS_UNAVAILABLE = 'No licensed lyrics in-app';
export const HANDOFF_CONFIRM = 'Opens in the browser. Eidovara does not play Spotify or YouTube in-app.';

const BLOCKED_HOST_SUFFIXES = [
  '.youtube.com',
  '.youtu.be',
  '.youtube-nocookie.com',
  '.googlevideo.com',
  '.spotify.com',
  '.spotifycdn.com',
  '.scdn.co'
];

const BLOCKED_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'googlevideo.com',
  'open.spotify.com',
  'embed.spotify.com',
  'play.spotify.com',
  'api.spotify.com',
  'accounts.spotify.com',
  'spotify.com',
  'www.spotify.com',
  'spotifycdn.com',
  'sdk.scdn.co'
]);

const BLOCKED_EMBED = /youtube\.com\/embed|youtube-nocookie|\/\/youtu\.be\/|spotify\.com\/embed|open\.spotify\.com\/embed|sdk\.scdn\.co|spotify-web-playback|iframe_api|www\.youtube\.com\/iframe_api/i;

function hostnameOf(value) {
  try { return new URL(String(value || '')).hostname.toLowerCase(); } catch { return ''; }
}

export function prefersReducedMotion(flag) {
  return flag === true;
}

export function motionMode(reducedMotion) {
  return prefersReducedMotion(reducedMotion) ? 'instant' : 'slide';
}

export function createNowPlayingState(input = {}) {
  return {
    active: false,
    expanded: false,
    playing: false,
    reducedMotion: Boolean(input.reducedMotion),
    queue: Array.isArray(input.queue) ? input.queue.slice() : [],
    index: Number.isInteger(input.index) ? input.index : -1,
    volume: clampVolume(input.volume)
  };
}

export function clampVolume(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  return Math.max(0, Math.min(1, n));
}

export function expandPlayer(state = {}) {
  if (!state.active) return { ...createNowPlayingState(state), expanded: false };
  return { ...state, expanded: true };
}

export function collapsePlayer(state = {}) {
  return { ...state, expanded: false };
}

export function toggleExpanded(state = {}) {
  return state.expanded ? collapsePlayer(state) : expandPlayer(state);
}

export function isBlockedEmbedUrl(value) {
  const raw = String(value || '');
  if (!raw) return false;
  if (BLOCKED_EMBED.test(raw)) return true;
  const host = hostnameOf(raw);
  if (!host) return false;
  if (BLOCKED_HOSTS.has(host)) return true;
  return BLOCKED_HOST_SUFFIXES.some(suffix => host === suffix.slice(1) || host.endsWith(suffix));
}

export function isAllowedPlaybackUrl(value) {
  let parsed;
  try { parsed = new URL(String(value || '')); } catch { return false; }
  if (parsed.protocol === `${LOCAL_MEDIA_SCHEME}:`) return true;
  if (parsed.protocol !== 'https:') return false;
  if (isBlockedEmbedUrl(parsed.href)) return false;
  return true;
}

export function officialSearchUrl(platform, query) {
  const q = encodeURIComponent(String(query || '').trim().slice(0, 200));
  if (!q) return '';
  if (platform === 'spotify') return `https://open.spotify.com/search/${q}`;
  if (platform === 'youtube') return `https://www.youtube.com/results?search_query=${q}`;
  return '';
}

export function normalizePlaybackItem(input = {}) {
  const type = input.type === 'video' ? 'video' : input.type === 'audio' ? 'audio' : '';
  const url = String(input.url || '');
  if (!type || !isAllowedPlaybackUrl(url)) return null;
  const title = String(input.title || '').replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300) || 'Untitled media';
  let sourceUrl = '';
  try {
    const parsed = new URL(String(input.sourceUrl || ''));
    if (parsed.protocol === 'https:' && !isBlockedEmbedUrl(parsed.href)) sourceUrl = parsed.toString().slice(0, 1000);
  } catch {}
  return {
    type,
    url,
    title,
    sourceUrl,
    local: input.local === true,
    artist: String(input.artist || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 200)
  };
}

export function setQueue(state, items, index = 0) {
  const queue = (Array.isArray(items) ? items : []).map(normalizePlaybackItem).filter(Boolean);
  if (!queue.length) return { ...state, queue: [], index: -1, active: false, expanded: false, playing: false };
  const idx = ((Number(index) || 0) % queue.length + queue.length) % queue.length;
  return { ...state, queue, index: idx, active: true };
}

export function appendQueue(state, items, playIndexInAdded = 0) {
  const extra = (Array.isArray(items) ? items : []).map(normalizePlaybackItem).filter(Boolean);
  if (!extra.length) return state;
  const queue = [...(state.queue || []), ...extra];
  const start = Math.max(0, (state.queue || []).length + playIndexInAdded);
  return { ...state, queue, index: Math.min(start, queue.length - 1), active: true };
}

export function secondaryLabel(item) {
  if (!item) return '';
  if (item.artist) return item.artist;
  if (item.local) return item.type === 'video' ? 'Local video' : 'Local file';
  try {
    const host = new URL(item.sourceUrl || item.url).hostname;
    if (host) return host;
  } catch {}
  return item.type === 'video' ? 'Video' : 'Audio';
}

export function shouldHandleSpacePlayPause(event = {}) {
  if (event.ageGated) return false;
  if (event.paletteOpen || event.overlayOpen) return false;
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  const key = event.key;
  if (key !== ' ' && key !== 'Spacebar' && event.code !== 'Space') return false;
  const tag = String(event.targetTag || '').toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON' || tag === 'A') return false;
  if (event.contentEditable === true || event.contentEditable === 'true') return false;
  if (event.closestField) return false;
  if (event.hasSession === false) return false;
  return true;
}

export function shouldHandleEscapeCollapse(event = {}) {
  if (event.ageGated) return false;
  if (event.paletteOpen || event.overlayOpen) return false;
  if (event.key !== 'Escape') return false;
  return event.expanded === true;
}
