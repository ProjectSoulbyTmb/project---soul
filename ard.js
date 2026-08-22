// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Adult Media desk — tube/creator UX patterns on Eidovara’s own library and
 * official HTTPS handoff. Inspired by popular adult platforms (category rails,
 * continue watching, related, watch later, creator bookmarks, theater cards)
 * without scraping those sites, embedding their players, capturing logins, or
 * ripping streams. Guest overlays stay closed in Adult Mode; handoff uses the
 * system browser. Appearance and queries stay 21+. Not Pornhub/OnlyFans/etc.
 */
import { adultAllowed } from './policy.js';
import { adultTextForbidden } from './adult-soul.js';
import { uid } from './schema.js';
import { WELLNESS_CARDS, FEEL_HONESTY, BOOKMARK_FOLDERS } from './adult-feel.js';

export const ADULT_MEDIA_HONESTY = 'Adult Media is a local tube-style desk plus official HTTPS searches in your system browser. Eidovara does not embed Pornhub, XVideos, OnlyFans, or cam sites, does not fetch their HTML, does not capture logins, and does not rip streams. Guest overlays stay closed in Adult Mode so Discord/browse cannot sit on top of adult media. PIN stealth, bookmark folders, and Feel Sync follow VibeMate/Vibease-style settings without pairing toys or recording the screen. Revoke Adult Mode anytime.';

const FORBIDDEN = /\b(?:child|children|minor|minors|underage|under[\s-]?age|loli|lolita|shota|shotacon|jailbait|preteen|pre-teen|toddler|infant|baby|pedophil|hebephil|schoolgirl|schoolboy|young[\s-]?teen)\b/i;

export const ADULT_MEDIA_CATEGORIES = Object.freeze([
  { id: 'for-you', title: 'For you', hint: 'Ranked from local taste, the way tubes rank a home feed' },
  { id: 'continue', title: 'Continue', hint: 'Resume what you already started on this PC' },
  { id: 'new', title: 'Newest', hint: 'Latest files opened this session' },
  { id: 'watch-later', title: 'Watch later', hint: 'Your save-for-later shelf' },
  { id: 'video', title: 'Video', hint: 'Local video through eidovara-media' },
  { id: 'audio', title: 'Audio', hint: 'Moans, beds, music you imported' },
  { id: 'favorites', title: 'Favorites', hint: 'Hearted titles' },
  { id: 'guided', title: 'Guided', hint: 'Adult Soul sessions alongside media' },
  { id: 'amateur', title: 'Amateur', hint: 'Tag inferred from titles you gave' },
  { id: 'couple', title: 'Couple', hint: 'Title-tag rail' },
  { id: 'solo', title: 'Solo', hint: 'Title-tag rail' },
  { id: 'toys', title: 'Toys', hint: 'Title-tag rail — no hardware is driven' },
  { id: 'aftercare', title: 'Aftercare', hint: 'Softer local mix' }
]);

export const ADULT_PLATFORMS = Object.freeze([
  {
    id: 'pornhub',
    title: 'Pornhub',
    host: 'pornhub.com',
    kind: 'tube',
    home: 'https://www.pornhub.com/',
    search: query => `https://www.pornhub.com/video/search?search=${encodeURIComponent(query)}`
  },
  {
    id: 'xvideos',
    title: 'XVideos',
    host: 'xvideos.com',
    kind: 'tube',
    home: 'https://www.xvideos.com/',
    search: query => `https://www.xvideos.com/?k=${encodeURIComponent(query)}`
  },
  {
    id: 'xhamster',
    title: 'xHamster',
    host: 'xhamster.com',
    kind: 'tube',
    home: 'https://xhamster.com/',
    search: query => `https://xhamster.com/search/${encodeURIComponent(query).replace(/%20/g, '+')}`
  },
  {
    id: 'spankbang',
    title: 'SpankBang',
    host: 'spankbang.com',
    kind: 'tube',
    home: 'https://spankbang.com/',
    search: query => `https://spankbang.com/s/${encodeURIComponent(query)}/`
  },
  {
    id: 'redgifs',
    title: 'RedGifs',
    host: 'redgifs.com',
    kind: 'short',
    home: 'https://www.redgifs.com/',
    search: query => `https://www.redgifs.com/browse?query=${encodeURIComponent(query)}`
  },
  {
    id: 'xnxx',
    title: 'XNXX',
    host: 'xnxx.com',
    kind: 'tube',
    home: 'https://www.xnxx.com/',
    search: query => `https://www.xnxx.com/search/${encodeURIComponent(query)}`
  },
  {
    id: 'chaturbate',
    title: 'Chaturbate',
    host: 'chaturbate.com',
    kind: 'live',
    home: 'https://chaturbate.com/',
    search: query => `https://chaturbate.com/?keywords=${encodeURIComponent(query)}`
  },
  {
    id: 'reddit',
    title: 'Reddit',
    host: 'reddit.com',
    kind: 'feed',
    home: 'https://www.reddit.com/',
    search: query => `https://www.reddit.com/search/?q=${encodeURIComponent(query)}&type=link`
  },
  {
    id: 'x',
    title: 'X',
    host: 'x.com',
    kind: 'feed',
    home: 'https://x.com/',
    search: query => `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query&f=media`
  },
  {
    id: 'manyvids',
    title: 'ManyVids',
    host: 'manyvids.com',
    kind: 'store',
    home: 'https://www.manyvids.com/',
    search: query => `https://www.manyvids.com/MVSearch/?keywords=${encodeURIComponent(query)}`
  },
  {
    id: 'onlyfans',
    title: 'OnlyFans',
    host: 'onlyfans.com',
    kind: 'creator',
    home: 'https://onlyfans.com/',
    search: null
  },
  {
    id: 'fansly',
    title: 'Fansly',
    host: 'fansly.com',
    kind: 'creator',
    home: 'https://fansly.com/',
    search: null
  }
]);

export const ADULT_HANDOFF_HOSTS = Object.freeze([
  'pornhub.com', 'xvideos.com', 'xhamster.com', 'spankbang.com', 'redgifs.com',
  'xnxx.com', 'chaturbate.com', 'stripchat.com', 'onlyfans.com', 'fansly.com',
  'manyvids.com', 'loyalfans.com', 'youporn.com', 'redtube.com', 'tube8.com',
  'x.com', 'twitter.com', 'reddit.com'
]);

export const ADULT_EMBED_BLOCK = /pornhub\.com\/embed|xvideos\.com\/embedframe|xhamster\.com\/xembed|redgifs\.com\/ifr|spankbang\.com\/embed|chaturbate\.com\/embed|xnxx\.com\/embedframe|youporn\.com\/embed|stripchat\.com\/embed/i;

const TAG_RULES = [
  ['amateur', /\bamateur|homemade|phone\b/i],
  ['couple', /\bcouple|together|two\b/i],
  ['solo', /\bsolo|only me|just me\b/i],
  ['toys', /\btoy|vibrator|dildo|wand\b/i],
  ['aftercare', /\baftercare|soft|cuddle|pillow\b/i],
  ['guided', /\bguide|coach|joi|instruction\b/i],
  ['audio', /\bmoan|audio|asmr|voice\b/i]
];

const clean = (value, limit = 200) => String(value || '').replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, limit);

export function adultMediaQueryForbidden(value) {
  return FORBIDDEN.test(String(value || '')) || adultTextForbidden(value);
}

export function isAdultHandoffHost(href) {
  try {
    const host = new URL(String(href || '')).hostname.toLowerCase();
    return ADULT_HANDOFF_HOSTS.some(suffix => host === suffix || host.endsWith(`.${suffix}`));
  } catch {
    return false;
  }
}

export function isAdultEmbedUrl(value) {
  const raw = String(value || '');
  if (!raw) return false;
  if (ADULT_EMBED_BLOCK.test(raw)) return true;
  return isAdultHandoffHost(raw) && /\/embed/i.test(raw);
}

function httpsUrl(value, host) {
  try {
    const url = new URL(String(value || '').trim());
    if (url.protocol !== 'https:' || url.username || url.password) return '';
    const h = url.hostname.toLowerCase();
    if (host && h !== host && !h.endsWith(`.${host}`)) return '';
    return url.toString().slice(0, 1000);
  } catch {
    return '';
  }
}

export function adultOfficialHandoffs(query) {
  const q = clean(query, 160);
  if (!q) return [];
  if (adultMediaQueryForbidden(q)) return [];
  const encodedOk = q.length >= 2;
  const items = [];
  for (const platform of ADULT_PLATFORMS) {
    const url = encodedOk && typeof platform.search === 'function'
      ? httpsUrl(platform.search(q), platform.host)
      : httpsUrl(platform.home, platform.host);
    if (!url) continue;
    items.push({
      provider: platform.title,
      id: platform.id,
      kind: platform.kind,
      title: platform.search && encodedOk ? `${platform.title} search: ${q}` : `Open ${platform.title}`,
      url,
      adult: true,
      embed: false
    });
  }
  return items;
}

export { classifyAdultMediaIntent } from './adult-intents.js';

export function defaultAdultEntertainment() {
  return {
    watchLater: [],
    playlists: [],
    creators: [],
    continueWatching: [],
    lastCategory: 'for-you',
    folders: BOOKMARK_FOLDERS.map(folder => ({ id: folder.id, title: folder.title, items: [] }))
  };
}

function normalizeClip(item) {
  if (!item || typeof item !== 'object') return null;
  const title = clean(item.title, 200);
  if (!title || adultMediaQueryForbidden(title)) return null;
  const url = String(item.url || '');
  const local = /^eidovara-media:/i.test(url);
  const sourceUrl = httpsUrl(item.sourceUrl) || '';
  if (!local && !sourceUrl) return null;
  return {
    id: String(item.id || uid('clip')).slice(0, 40),
    title,
    type: item.type === 'video' ? 'video' : 'audio',
    url: local ? url.slice(0, 400) : '',
    sourceUrl,
    playable: local,
    tags: Array.isArray(item.tags) ? item.tags.map(tag => clean(tag, 32)).filter(Boolean).slice(0, 8) : tagFromTitle(title),
    at: String(item.at || new Date().toISOString()).slice(0, 40)
  };
}

export function normalizeAdultEntertainment(input = {}, prior = defaultAdultEntertainment()) {
  const base = { ...defaultAdultEntertainment(), ...(prior && typeof prior === 'object' ? prior : {}) };
  const incoming = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const creators = (Array.isArray(incoming.creators) ? incoming.creators : base.creators).slice(0, 40).map(item => {
    if (!item || typeof item !== 'object') return null;
    const title = clean(item.title || item.name, 80);
    const url = httpsUrl(item.url);
    if (!title || !url || adultMediaQueryForbidden(title) || adultMediaQueryForbidden(url)) return null;
    return { id: String(item.id || uid('creator')).slice(0, 40), title, url };
  }).filter(Boolean);
  return {
    watchLater: (Array.isArray(incoming.watchLater) ? incoming.watchLater : base.watchLater).map(normalizeClip).filter(Boolean).slice(0, 80),
    playlists: (Array.isArray(incoming.playlists) ? incoming.playlists : base.playlists).slice(0, 12).map(list => ({
      id: String(list?.id || uid('list')).slice(0, 40),
      title: clean(list?.title, 80) || 'Collection',
      items: Array.isArray(list?.items) ? list.items.map(normalizeClip).filter(Boolean).slice(0, 40) : []
    })).filter(list => !adultMediaQueryForbidden(list.title)),
    creators,
    continueWatching: (Array.isArray(incoming.continueWatching) ? incoming.continueWatching : base.continueWatching).map(normalizeClip).filter(Boolean).slice(0, 24),
    lastCategory: ADULT_MEDIA_CATEGORIES.some(item => item.id === incoming.lastCategory) ? incoming.lastCategory : (base.lastCategory || 'for-you'),
    folders: BOOKMARK_FOLDERS.map(meta => {
      const found = (Array.isArray(incoming.folders) ? incoming.folders : base.folders).find(folder => folder && folder.id === meta.id) || {};
      const items = Array.isArray(found.items) ? found.items.map(normalizeClip).filter(Boolean).slice(0, 40) : [];
      return { id: meta.id, title: meta.title, items };
    })
  };
}

export function migrateAdultEntertainment(input) {
  return normalizeAdultEntertainment(input);
}

export function tagFromTitle(title) {
  const text = String(title || '');
  const tags = [];
  for (const [id, re] of TAG_RULES) {
    if (re.test(text)) tags.push(id);
  }
  return tags.slice(0, 6);
}

export function cardArtwork(title) {
  const s = String(title || 'adult');
  let hash = 0;
  for (let i = 0; i < s.length; i += 1) hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  const hue = Math.abs(hash) % 360;
  const hue2 = (hue + 48) % 360;
  return {
    from: `hsl(${hue} 42% 18%)`,
    to: `hsl(${hue2} 38% 8%)`,
    label: s.slice(0, 2).toUpperCase()
  };
}

function libraryFrom(state, extras = []) {
  const entertainment = state?.entertainment || {};
  const adult = normalizeAdultEntertainment(entertainment.adult);
  const seen = new Set();
  const out = [];
  const push = item => {
    const clip = normalizeClip(item);
    if (!clip) return;
    const key = (clip.url || clip.title).toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(clip);
  };
  for (const item of extras) push(item);
  for (const item of adult.watchLater) push(item);
  for (const item of adult.continueWatching) push(item);
  for (const item of entertainment.favorites || []) push(item);
  for (const item of entertainment.history || []) push(item);
  return out;
}

function scoreTitle(state, title) {
  const key = String(title || '').toLowerCase();
  return Number(state?.entertainment?.taste?.[key] || 0);
}

export function relatedLocalMedia(item, library, limit = 8) {
  const seed = normalizeClip(item);
  if (!seed) return [];
  const tags = new Set(seed.tags || tagFromTitle(seed.title));
  const tokens = seed.title.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(t => t.length > 2);
  return library
    .filter(other => other.title.toLowerCase() !== seed.title.toLowerCase())
    .map(other => {
      const ot = new Set(other.tags || tagFromTitle(other.title));
      let score = 0;
      for (const tag of tags) if (ot.has(tag)) score += 3;
      if (other.type === seed.type) score += 1;
      const title = other.title.toLowerCase();
      for (const token of tokens) if (title.includes(token)) score += 1;
      return { item: other, score };
    })
    .filter(row => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(row => row.item);
}

export function railsForLibrary(state, library) {
  const adult = normalizeAdultEntertainment(state?.entertainment?.adult);
  const ranked = [...library].sort((a, b) => scoreTitle(state, b.title) - scoreTitle(state, a.title));
  const newest = [...library].sort((a, b) => String(b.at).localeCompare(String(a.at)));
  const byTag = id => library.filter(item => (item.tags || tagFromTitle(item.title)).includes(id) || item.type === id);
  return [
    { id: 'continue', title: 'Continue watching', items: adult.continueWatching.filter(item => item.playable).slice(0, 12) },
    { id: 'for-you', title: 'For you', items: ranked.filter(item => item.playable && scoreTitle(state, item.title) > 0).slice(0, 12) },
    { id: 'new', title: 'Newest', items: newest.filter(item => item.playable).slice(0, 12) },
    { id: 'watch-later', title: 'Watch later', items: adult.watchLater.filter(item => item.playable).slice(0, 12) },
    { id: 'video', title: 'Video', items: library.filter(item => item.type === 'video' && item.playable).slice(0, 12) },
    { id: 'audio', title: 'Audio', items: library.filter(item => item.type === 'audio' && item.playable).slice(0, 12) },
    { id: 'amateur', title: 'Amateur', items: byTag('amateur').slice(0, 12) },
    { id: 'couple', title: 'Couple', items: byTag('couple').slice(0, 12) },
    { id: 'solo', title: 'Solo', items: byTag('solo').slice(0, 12) },
    { id: 'toys', title: 'Toys', items: byTag('toys').slice(0, 12) },
    { id: 'aftercare', title: 'Aftercare', items: byTag('aftercare').slice(0, 12) },
    { id: 'videos-folder', title: 'Videos folder', items: (adult.folders || []).find(folder => folder.id === 'videos')?.items || [] },
    { id: 'audio-folder', title: 'Audio folder', items: (adult.folders || []).find(folder => folder.id === 'audio')?.items || [] }
  ].filter(rail => rail.items.length);
}

export function rememberContinue(state, item) {
  const adult = normalizeAdultEntertainment(state.entertainment?.adult);
  const clip = normalizeClip({ ...item, at: new Date().toISOString() });
  if (!clip || !clip.playable) return adult;
  const rest = adult.continueWatching.filter(row => row.title.toLowerCase() !== clip.title.toLowerCase());
  return { ...adult, continueWatching: [clip, ...rest].slice(0, 24) };
}

export function toggleWatchLater(state, item) {
  const adult = normalizeAdultEntertainment(state.entertainment?.adult);
  const clip = normalizeClip(item);
  if (!clip) return adult;
  const exists = adult.watchLater.some(row => row.title.toLowerCase() === clip.title.toLowerCase());
  const watchLater = exists
    ? adult.watchLater.filter(row => row.title.toLowerCase() !== clip.title.toLowerCase())
    : [clip, ...adult.watchLater].slice(0, 80);
  return { ...adult, watchLater };
}

export function addAdultCreator(state, input = {}) {
  const adult = normalizeAdultEntertainment(state.entertainment?.adult);
  const title = clean(input.title || input.name, 80);
  const url = httpsUrl(input.url);
  if (!title || !url) throw new Error('Creator bookmarks need a name and an https:// page.');
  if (adultMediaQueryForbidden(title) || adultMediaQueryForbidden(url)) {
    throw new Error('Creator bookmarks cannot describe minors or prohibited sexualization.');
  }
  if (!isAdultHandoffHost(url) && !/^https:\/\//i.test(url)) throw new Error('Only HTTPS creator pages.');
  const next = { id: uid('creator'), title, url };
  const creators = [next, ...adult.creators.filter(row => row.url !== url)].slice(0, 40);
  return { ...adult, creators };
}

export function configureAdultMedia(state, input = {}) {
  if (!adultAllowed(state)) {
    throw new Error('Adult Media stays locked until legal-adult status, Adult Soul enablement, and current consent are on.');
  }
  const incoming = input && typeof input === 'object' ? input : {};
  state.entertainment ||= { favorites: [], history: [], taste: {} };
  if (incoming.watchLaterItem) {
    state.entertainment.adult = toggleWatchLater(state, incoming.watchLaterItem);
  } else if (incoming.creator) {
    state.entertainment.adult = addAdultCreator(state, incoming.creator);
  } else if (incoming.continueItem) {
    state.entertainment.adult = rememberContinue(state, incoming.continueItem);
  } else if (incoming.adult) {
    state.entertainment.adult = normalizeAdultEntertainment(incoming.adult, state.entertainment.adult);
  } else {
    state.entertainment.adult = normalizeAdultEntertainment(state.entertainment.adult);
  }
  return buildAdultMediaDesk(state, { library: incoming.library || [], query: incoming.query || '' });
}

export function buildAdultMediaDesk(state, { library = [], query = '' } = {}) {
  const open = adultAllowed(state) === true;
  const q = clean(query, 160);
  if (!open) {
    return {
      open: false,
      locked: true,
      reason: 'Adult Media stays locked until legal-adult status, Adult Soul enablement, and current consent are on.',
      honesty: ADULT_MEDIA_HONESTY,
      categories: ADULT_MEDIA_CATEGORIES,
      platforms: [],
      rails: [],
      handoffs: [],
      embed: false,
      scrape: false
    };
  }
  if (q && adultMediaQueryForbidden(q)) {
    return {
      open: true,
      locked: false,
      blocked: true,
      reason: 'That search is refused. Adult Media will not look up minors or prohibited terms on any platform.',
      honesty: ADULT_MEDIA_HONESTY,
      categories: ADULT_MEDIA_CATEGORIES,
      platforms: ADULT_PLATFORMS.map(({ id, title, kind, home }) => ({ id, title, kind, home })),
      rails: [],
      handoffs: [],
      embed: false,
      scrape: false
    };
  }
  const clips = libraryFrom(state, library);
  const filtered = q
    ? clips.filter(item => item.title.toLowerCase().includes(q.toLowerCase()) || (item.tags || []).some(tag => tag.includes(q.toLowerCase())))
    : clips;
  const adult = normalizeAdultEntertainment(state.entertainment?.adult);
  return {
    open: true,
    locked: false,
    blocked: false,
    honesty: ADULT_MEDIA_HONESTY,
    query: q,
    categories: ADULT_MEDIA_CATEGORIES,
    platforms: ADULT_PLATFORMS.map(({ id, title, kind, home }) => ({ id, title, kind, home })),
    rails: railsForLibrary(state, filtered.length ? filtered : clips),
    library: filtered.slice(0, 48).map(item => ({ ...item, art: cardArtwork(item.title) })),
    watchLater: adult.watchLater,
    creators: adult.creators,
    playlists: adult.playlists,
    folders: adult.folders,
    wellness: WELLNESS_CARDS,
    feelHonesty: FEEL_HONESTY,
    handoffs: q ? adultOfficialHandoffs(q) : ADULT_PLATFORMS.map(platform => ({
      provider: platform.title,
      id: platform.id,
      kind: platform.kind,
      title: `Open ${platform.title}`,
      url: platform.home,
      adult: true,
      embed: false
    })).filter(item => httpsUrl(item.url)),
    embed: false,
    scrape: false,
    guestOverlay: false,
    related: filtered[0] ? relatedLocalMedia(filtered[0], clips) : []
  };
}

export function adultMediaReply(input, state, desk) {
  const view = desk || buildAdultMediaDesk(state, {});
  if (!view.open) {
    return 'Adult Media stays locked. Confirm legal-adult status, enable Adult Soul, and grant current consent on Identity. Then the tube-style desk and official HTTPS searches unlock. Guest overlays stay closed in Adult Mode. This is not an in-app Pornhub player.';
  }
  if (view.blocked) {
    return 'No. Adult Media will not search for minors or prohibited terms on any site.';
  }
  const names = (view.handoffs || []).slice(0, 6).map(item => item.provider).join(', ');
  const local = (view.library || []).filter(item => item.playable).length;
  return `Adult Media is on. ${local} local playable title${local === 1 ? '' : 's'} on this PC. Official searches (${names || 'tube/creator sites'}) open in your system browser after you confirm — Eidovara does not embed those players or fetch their HTML. ${ADULT_MEDIA_HONESTY}`;
}

