// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0

export const LOCAL_MEDIA_SCHEME = 'eidovara-media';
export const LYRICS_UNAVAILABLE = 'No licensed lyrics in-app';
export const HANDOFF_CONFIRM = 'Opens in the browser. Eidovara does not play Spotify or YouTube in-app.';
export const MEDIA_SESSION_ACTIONS = ['play', 'pause', 'previoustrack', 'nexttrack', 'seekto', 'stop'];
export const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];
export const LOOP_MODES = ['off', 'one', 'all'];
export const SLEEP_MINUTES = [0, 15, 30, 45, 60, 90];

const BLOCKED_HOST_SUFFIXES = [
  '.youtube.com', '.youtu.be', '.youtube-nocookie.com', '.googlevideo.com',
  '.spotify.com', '.spotifycdn.com', '.scdn.co'
];
const BLOCKED_HOSTS = new Set([
  'youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be',
  'youtube-nocookie.com', 'www.youtube-nocookie.com', 'googlevideo.com',
  'open.spotify.com', 'embed.spotify.com', 'play.spotify.com', 'api.spotify.com',
  'accounts.spotify.com', 'spotify.com', 'www.spotify.com', 'spotifycdn.com', 'sdk.scdn.co'
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
    pictureInPicture: false,
    playing: false,
    reducedMotion: Boolean(input.reducedMotion),
    queue: Array.isArray(input.queue) ? input.queue.slice() : [],
    index: Number.isInteger(input.index) ? input.index : -1,
    volume: clampVolume(input.volume),
    muted: input.muted === true,
    rate: clampRate(input.rate),
    loop: LOOP_MODES.includes(input.loop) ? input.loop : 'off',
    shuffle: input.shuffle === true,
    sleepUntil: input.sleepUntil || null,
    qualityId: String(input.qualityId || 'native'),
    captionsOn: input.captionsOn === true,
    adultMode: input.adultMode === true,
    ageGated: input.ageGated === true
  };
}

export function currentItem(state = {}) {
  if (!Array.isArray(state.queue) || state.index < 0) return null;
  return state.queue[state.index] || null;
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
  if (platform === 'archive') return `https://archive.org/search?query=${q}`;
  return '';
}

function cleanText(value, max) {
  return String(value || '').replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function nativePlaybackUrl(item = {}) {
  const original = String(item.url || '');
  if (!isAllowedPlaybackUrl(original)) return '';
  if (item.type === 'image') return original;
  const thumb = String(item.thumbUrl || item.thumbnail || '');
  if (thumb && original === thumb && item.originalUrl && isAllowedPlaybackUrl(item.originalUrl)) {
    return item.originalUrl;
  }
  return original;
}

export function qualityChoices(item = {}) {
  const native = nativePlaybackUrl(item);
  const seen = new Set();
  const out = [];
  const push = rendition => {
    const url = isAllowedPlaybackUrl(rendition?.url) ? String(rendition.url) : '';
    if (!url || seen.has(url) || isBlockedEmbedUrl(url)) return;
    seen.add(url);
    out.push({
      id: String(rendition.id || `r${out.length}`),
      label: cleanText(rendition.label, 40) || 'Rendition',
      url,
      native: rendition.native === true
    });
  };
  if (native) push({ id: 'native', label: 'Native', url: native, native: true });
  for (const rendition of Array.isArray(item.renditions) ? item.renditions : []) push(rendition);
  return out.length >= 2 ? out : [];
}

export function selectedQualityUrl(item, qualityId = 'native') {
  const choices = qualityChoices(item);
  if (!choices.length) return nativePlaybackUrl(item);
  return (choices.find(item => item.id === qualityId) || choices.find(item => item.native) || choices[0]).url;
}

export function normalizePlaybackItem(input = {}) {
  const type = input.type === 'video' ? 'video' : input.type === 'audio' ? 'audio' : '';
  const url = nativePlaybackUrl(input);
  if (!type || !url) return null;
  const title = cleanText(input.title, 300) || 'Untitled media';
  let sourceUrl = '';
  try {
    const parsed = new URL(String(input.sourceUrl || ''));
    if (parsed.protocol === 'https:' && !isBlockedEmbedUrl(parsed.href)) sourceUrl = parsed.toString().slice(0, 1000);
  } catch {}
  const captions = (Array.isArray(input.captions) ? input.captions : []).map(track => {
    const href = String(track?.url || '');
    if (!isAllowedPlaybackUrl(href)) return null;
    return {
      url: href,
      label: cleanText(track.label, 80) || 'Captions',
      srclang: cleanText(track.srclang, 12) || 'und',
      kind: track.kind === 'captions' ? 'captions' : 'subtitles'
    };
  }).filter(Boolean);
  return {
    type,
    url,
    title,
    sourceUrl,
    local: input.local === true,
    artist: cleanText(input.artist, 200),
    mime: cleanText(input.mime, 80),
    width: Number.isFinite(Number(input.width)) ? Number(input.width) : 0,
    height: Number.isFinite(Number(input.height)) ? Number(input.height) : 0,
    renditions: Array.isArray(input.renditions) ? input.renditions : [],
    captions,
    hardwareDecode: input.hardwareDecode !== false
  };
}

export function setQueue(state, items, index = 0) {
  const queue = (Array.isArray(items) ? items : []).map(normalizePlaybackItem).filter(Boolean);
  if (!queue.length) return { ...state, queue: [], index: -1, active: false, expanded: false, playing: false, poppedOut: false, pictureInPicture: false };
  const idx = ((Number(index) || 0) % queue.length + queue.length) % queue.length;
  return { ...state, queue, index: idx, active: true };
}

export function appendQueue(state, items) {
  const extra = (Array.isArray(items) ? items : []).map(normalizePlaybackItem).filter(Boolean);
  if (!extra.length) return state;
  const queue = [...(state.queue || []), ...extra];
  return { ...state, queue, index: state.active ? state.index : (state.queue || []).length, active: true };
}

export function nextIndex(state = {}) {
  const len = state.queue?.length || 0;
  if (!len) return -1;
  if (state.loop === 'one') return state.index;
  if (state.shuffle && len > 1) {
    let next = state.index;
    while (next === state.index) next = Math.floor(Math.random() * len);
    return next;
  }
  const next = (Number(state.index) || 0) + 1;
  if (next < len) return next;
  return state.loop === 'all' ? 0 : -1;
}

export function previousIndex(state = {}) {
  const len = state.queue?.length || 0;
  if (!len) return -1;
  const prev = (Number(state.index) || 0) - 1;
  if (prev >= 0) return prev;
  return state.loop === 'all' ? len - 1 : 0;
}

export function cycleLoop(state = {}) {
  const i = LOOP_MODES.indexOf(state.loop);
  return { ...state, loop: LOOP_MODES[(i + 1) % LOOP_MODES.length] };
}

export function toggleShuffle(state = {}) {
  return { ...state, shuffle: !state.shuffle };
}

export function setRate(state, value) {
  return { ...state, rate: clampRate(value) };
}

export function armSleepTimer(state, minutes, now = Date.now()) {
  const mins = SLEEP_MINUTES.includes(Number(minutes)) ? Number(minutes) : 0;
  return { ...state, sleepUntil: mins ? now + mins * 60_000 : null };
}

export function sleepTimerDue(state, now = Date.now()) {
  return Boolean(state?.sleepUntil) && now >= state.sleepUntil;
}

export function clearSleepTimer(state = {}) {
  return { ...state, sleepUntil: null, playing: false };
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

export function shouldHideFloatingWindows(state = {}) {
  return state.ageGated === true || state.adultMode === true;
}

export function popOutPlayer(state = {}) {
  if (!state.active || shouldHideFloatingWindows(state)) {
    return { ...state, poppedOut: false, pictureInPicture: false };
  }
  return { ...state, poppedOut: true, expanded: false };
}

export function dockPlayer(state = {}) {
  return { ...state, poppedOut: false, pictureInPicture: false };
}

export function setPictureInPicture(state, on) {
  if (!on || shouldHideFloatingWindows(state) || currentItem(state)?.type !== 'video') {
    return { ...state, pictureInPicture: false };
  }
  return { ...state, pictureInPicture: true };
}

export function hardwareDecodePreferred(diagnostics = {}) {
  if (diagnostics.disableGpu === true || diagnostics.hardwareAcceleration === false) return false;
  return true;
}

export function videoPresentationFlags() {
  return {
    preload: 'auto',
    playsInline: true,
    disableRemotePlayback: false,
    controls: false,
    defaultMuted: false,
    objectFit: 'contain',
    noDownscale: true
  };
}

export function outputPickerAvailable(api = {}) {
  return typeof api.setSinkId === 'function' || typeof api.selectAudioOutput === 'function';
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
  return event.expanded === true || event.poppedOut === true;
}

export function formatClock(seconds) {
  const n = Math.max(0, Number(seconds) || 0);
  const m = Math.floor(n / 60);
  const s = Math.floor(n % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
