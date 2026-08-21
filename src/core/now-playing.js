// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import {
  CATALOG_HANDOFF_COPY,
  LOCAL_MEDIA_SCHEME,
  ONLINE_MEDIA_SCHEME,
  classifyOnlineMediaUrl,
  isPlayerProtocolUrl,
  qualityLabel
} from './online-media.js';

export { LOCAL_MEDIA_SCHEME, ONLINE_MEDIA_SCHEME, CATALOG_HANDOFF_COPY, qualityLabel };

export const LYRICS_UNAVAILABLE = 'No licensed lyrics in-app';
export const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];
export const SLEEP_MINUTES = [0, 15, 30, 45, 60];

export function prefersReducedMotion(flag) {
  return flag === true;
}

export function motionMode(reducedMotion) {
  return prefersReducedMotion(reducedMotion) ? 'instant' : 'slide';
}

export function clampVolume(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  return Math.max(0, Math.min(1, n));
}

export function clampRate(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  const nearest = PLAYBACK_RATES.reduce((best, rate) => Math.abs(rate - n) < Math.abs(best - n) ? rate : best, 1);
  return nearest;
}

export function createNowPlayingState(input = {}) {
  return {
    active: false,
    expanded: false,
    poppedOut: false,
    playing: false,
    loop: false,
    shuffle: false,
    rate: clampRate(input.rate),
    sleepUntil: null,
    reducedMotion: Boolean(input.reducedMotion),
    queue: Array.isArray(input.queue) ? input.queue.slice() : [],
    index: Number.isInteger(input.index) ? input.index : -1,
    volume: clampVolume(input.volume)
  };
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

export function isAllowedPlaybackUrl(value) {
  return isPlayerProtocolUrl(value);
}

export function officialSearchUrl(platform, query) {
  const q = encodeURIComponent(String(query || '').trim().slice(0, 200));
  if (!q) return '';
  if (platform === 'spotify') return `https://open.spotify.com/search/${q}`;
  if (platform === 'youtube') return `https://www.youtube.com/results?search_query=${q}`;
  if (platform === 'netflix') return `https://www.netflix.com/search?q=${q}`;
  return '';
}

export function normalizePlaybackItem(input = {}) {
  const type = input.type === 'video' ? 'video' : input.type === 'audio' ? 'audio' : '';
  const url = String(input.url || '');
  if (!type || !isAllowedPlaybackUrl(url)) return null;
  const classified = classifyOnlineMediaUrl(url);
  if (classified.kind === 'catalog-handoff') return null;
  const title = String(input.title || '').replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300) || 'Untitled media';
  let sourceUrl = '';
  try {
    const parsed = new URL(String(input.sourceUrl || ''));
    if (parsed.protocol === 'https:') sourceUrl = parsed.toString().slice(0, 1000);
  } catch {}
  const tracks = Array.isArray(input.tracks) ? input.tracks.filter(track => isAllowedPlaybackUrl(track?.src)).slice(0, 4) : [];
  return {
    type,
    url,
    title,
    sourceUrl,
    local: input.local === true || classified.protocol === LOCAL_MEDIA_SCHEME,
    remote: input.local !== true && classified.protocol === ONLINE_MEDIA_SCHEME,
    artist: String(input.artist || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 200),
    tracks: input.local === true ? tracks : [],
    quality: qualityLabel({ local: input.local === true })
  };
}

export function setQueue(state, items, index = 0) {
  const queue = (Array.isArray(items) ? items : []).map(normalizePlaybackItem).filter(Boolean);
  if (!queue.length) return { ...state, queue: [], index: -1, active: false, expanded: false, playing: false };
  const idx = ((Number(index) || 0) % queue.length + queue.length) % queue.length;
  return { ...state, queue, index: idx, active: true };
}

export function dropRemoteItems(state = {}) {
  const queue = (state.queue || []).filter(item => item.local);
  if (!queue.length) return { ...createNowPlayingState(state), poppedOut: false };
  const current = state.queue?.[state.index];
  const index = Math.max(0, queue.findIndex(item => item.url === current?.url));
  return { ...state, queue, index, active: true, poppedOut: false };
}

export function secondaryLabel(item) {
  if (!item) return '';
  if (item.artist) return item.artist;
  if (item.local) return item.type === 'video' ? 'Local video' : 'Local file';
  try {
    const host = new URL(item.sourceUrl || item.url).hostname;
    if (host) return `${host} · ${item.quality || 'Stream'}`;
  } catch {}
  return item.type === 'video' ? 'Video' : 'Audio';
}

export function nextIndex(state, delta = 1) {
  const queue = state.queue || [];
  if (!queue.length) return -1;
  if (state.shuffle && queue.length > 1) {
    let idx = state.index;
    let guard = 0;
    while (idx === state.index && guard < 8) {
      idx = Math.floor(Math.random() * queue.length);
      guard += 1;
    }
    return idx;
  }
  if (state.loop && delta === 1 && state.index === queue.length - 1) return 0;
  return state.index + delta;
}

export function shouldHandleSpacePlayPause(event = {}) {
  if (event.ageGated) return false;
  if (event.paletteOpen || event.overlayOpen) return false;
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  const key = event.key;
  if (key !== ' ' && key !== 'Spacebar' && event.code !== 'Space') return false;
  const tag = String(event.targetTag || '').toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return false;
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
