// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
const clean = (value, limit = 500) => String(value || '').replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, limit);
const allowedTypes = new Set(['audio', 'video']);
const allowedEvents = new Set(['play', 'complete', 'favorite', 'skip']);

export function normalizeMediaEvent(input = {}) {
  const type = allowedTypes.has(input.type) ? input.type : 'audio';
  const event = allowedEvents.has(input.event) ? input.event : 'play';
  const title = clean(input.title, 300);
  if (!title) throw new Error('A media title is required.');
  let sourceUrl = '';
  try { const parsed = new URL(String(input.sourceUrl || '')); if (parsed.protocol === 'https:') sourceUrl = parsed.toString().slice(0, 1000); } catch {}
  return { event, type, title, sourceUrl, at: new Date().toISOString() };
}

export function recordMediaEvent(state, input) {
  const item = normalizeMediaEvent(input);
  state.entertainment ||= { favorites: [], history: [], taste: {} };
  state.entertainment.history = [...(state.entertainment.history || []), item].slice(-500);
  if (item.event === 'favorite' && !(state.entertainment.favorites || []).some(x => x.title.toLowerCase() === item.title.toLowerCase())) {
    state.entertainment.favorites = [...state.entertainment.favorites, item].slice(-200);
  }
  const key = item.title.toLowerCase();
  const weight = { play: 1, complete: 2, favorite: 4, skip: -1 }[item.event];
  state.entertainment.taste ||= {};
  state.entertainment.taste[key] = Math.max(-5, Math.min(20, Number(state.entertainment.taste[key] || 0) + weight));
  return item;
}

function displayTitle(state, key) {
  const needle = String(key || '').toLowerCase();
  const entertainment = state.entertainment || {};
  const hit = [...(entertainment.favorites || []), ...(entertainment.history || [])].find(item => String(item.title || '').toLowerCase() === needle);
  return hit?.title || key;
}

function rankedTaste(state) {
  return Object.entries(state.entertainment?.taste || {}).sort((a, b) => b[1] - a[1]).map(([title, score]) => ({ title: displayTitle(state, title), score }));
}

export function mixBriefing(state, intent = 'mood') {
  const entertainment = state.entertainment || {};
  const liked = rankedTaste(state).filter(item => item.score > 0).slice(0, 6);
  const skipped = rankedTaste(state).filter(item => item.score < 0).slice(-4).reverse().map(item => item.title);
  const favorites = [...(entertainment.favorites || [])].slice(-20).reverse().map(item => item.title);
  const recent = [...(entertainment.history || [])].slice(-30).reverse().map(item => item.title);
  const seeds = [...favorites, ...liked.map(item => item.title)].filter((title, index, all) => title && all.findIndex(item => item.toLowerCase() === title.toLowerCase()) === index).slice(0, 6);
  const seedText = seeds.slice(0, 3).join(', ');
  const ideas = {
    mood: seeds.length ? `Queue from ${seedText}, then branch with a public-source or local-file search. Favorite keepers; skip anything that does not fit.` : 'Start with one local file or a public-source search, then favorite what you want repeated.',
    favorites: favorites.length ? `Stay close to ${favorites.slice(0, 3).join(', ')}. Use Similar in the player, then open Spotify or YouTube only as an official HTTPS search.` : 'Mark a favorite from the player first. Eidovara can then suggest nearby public or local follow-ups.',
    watch: seeds.length ? `Look up a documentary, gameplay, or craft video around ${seedText} from allowlisted public sources or an official YouTube search.` : 'Name a topic in Research, or open YouTube as an official HTTPS search. Eidovara does not bypass platform playback rules.',
    gaming: seeds.length ? `Keep the mix energetic and instrumental-leaning around ${seedText}. Enable low-overhead mode in Apps & Gaming so Eidovara does not add motion while you play.` : 'Add a local soundtrack file, or search public audio. Low-overhead mode only reduces Eidovara’s own effects; it does not change another game’s process.',
    study: seeds.length ? `Prefer calm, lyric-light audio near ${seedText}. Keep the player visible and pause from the dock when you need silence.` : 'Pick one calm local track or a public-domain recording. Soul will not auto-download protected catalogs.',
    surprise: seeds.length ? `Begin from ${seedText}, skip ${skipped.slice(0, 2).join(' and ') || 'nothing yet'}, and ask for one public-source track or video you have not queued lately.` : 'Ask Soul to search public Wikimedia audio/video, or open a single local file. Surprise still stays inside lawful, sourced media.'
  };
  return {
    intent,
    seeds,
    favorites: favorites.slice(0, 8),
    recent: recent.slice(0, 8),
    skipped,
    idea: ideas[intent] || ideas.mood,
    empty: !seeds.length && !recent.length,
    handoff: 'Spotify, YouTube, and Internet Archive open official HTTPS searches in your browser. Eidovara does not capture credentials, download protected streams, inject into other players, or imply affiliation.'
  };
}

function httpsUrl(value, suffixes) {
  try {
    const url = new URL(String(value || '').trim());
    if (url.protocol !== 'https:' || url.username || url.password) return '';
    const host = url.hostname.toLowerCase();
    if (suffixes && !suffixes.some(suffix => host === suffix || host.endsWith(`.${suffix}`))) return '';
    return url.toString();
  } catch {
    return '';
  }
}

export function officialSearchHandoffs(query) {
  const q = clean(query, 180);
  if (!q) return [];
  const encoded = encodeURIComponent(q);
  const items = [
    { provider: 'YouTube', title: `YouTube search: ${q}`, url: `https://www.youtube.com/results?search_query=${encoded}`, description: 'Opens the official YouTube search page. Eidovara does not download or rip streams.' },
    { provider: 'Spotify', title: `Spotify search: ${q}`, url: `https://open.spotify.com/search/${encoded}`, description: 'Opens the official Spotify search page. Eidovara does not download or rip streams.' },
    { provider: 'Internet Archive', title: `Internet Archive search: ${q}`, url: `https://archive.org/search?query=${encoded}`, description: 'Opens the official Internet Archive search page. Eidovara does not download or rip catalog items.' }
  ];
  return items.filter(item => {
    if (item.provider === 'YouTube') return Boolean(httpsUrl(item.url, ['youtube.com']));
    if (item.provider === 'Spotify') return Boolean(httpsUrl(item.url, ['spotify.com']));
    return Boolean(httpsUrl(item.url, ['archive.org']));
  });
}

function queryTokens(query) {
  return String(query || '').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(token => token.length > 2);
}

export function isPlayableLocalUrl(value) {
  return /^eidovara-media:/i.test(String(value || '').trim());
}

export function matchLocalLibrary(query, { entertainment, localLibrary } = {}) {
  const tokens = queryTokens(query);
  const hits = [];
  const seen = new Set();
  const push = item => {
    const title = clean(item?.title, 200);
    const key = title.toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    const url = isPlayableLocalUrl(item.url) ? String(item.url).slice(0, 400) : '';
    hits.push({
      type: item.type === 'video' ? 'video' : 'audio',
      title,
      url,
      sourceUrl: httpsUrl(item.sourceUrl) || '',
      local: true,
      playable: Boolean(url)
    });
  };
  for (const item of localLibrary || []) {
    const title = String(item.title || '').toLowerCase();
    if (!tokens.length || tokens.some(token => title.includes(token))) push(item);
  }
  const taste = entertainment || {};
  for (const item of [...(taste.favorites || []), ...(taste.history || [])]) {
    const title = String(item.title || '').toLowerCase();
    if (!title) continue;
    if (!tokens.length || tokens.some(token => title.includes(token))) push(item);
  }
  return hits.slice(0, 12);
}

export function discoveryQuery(input, entertainment) {
  const stripped = String(input || '')
    .replace(/https:\/\/[^\s<>"'`]+/gi, ' ')
    .replace(/\b(?:please|can you|could you|search|look up|find|pull|get|show|play|me|from|on|the|internet|web|online|information|info|pictures?|images?|photos?|videos?|audio|music|songs?|sound|recordings?|about|of|for|and|similar|to|fits|my|current|mood|explain|why|something|worth|watching|youtube|spotify|archive)\b/gi, ' ')
    .replace(/[^\p{L}\p{N}\s'_-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
  if (stripped) return stripped;
  const seeds = mixBriefing({ entertainment }, 'mood').seeds;
  return seeds[0] || 'music';
}

export function discoverMedia(input, { entertainment, localLibrary, query } = {}) {
  const q = clean(query, 180) || discoveryQuery(input, entertainment);
  const local = matchLocalLibrary(q, { entertainment, localLibrary });
  const handoffs = officialSearchHandoffs(q);
  const playable = local.filter(item => item.playable);
  const context = [
    local.length
      ? `Local library matches:\n${local.map((item, index) => `${index + 1}. ${item.title}${item.playable ? ' (play in Eidovara)' : ' (taste title; open the local file to play in Eidovara)'}`).join('\n')}`
      : 'No local library titles matched. Open a local audio or video file in Entertainment to play it in Eidovara (eidovara-media, never media-src \'self\').',
    `Official search links (browser handoff — not Spotify/iTunes/VLC/Windows Media Player injection, not stream ripping):\n${handoffs.map(item => `${item.provider}: ${item.url}`).join('\n')}`
  ].join('\n\n');
  return {
    query: q,
    fetchedAt: null,
    remote: false,
    sources: [],
    media: playable,
    local,
    handoffs,
    context
  };
}

export function mergeMediaDiscovery(webResearch, discovery) {
  if (!discovery) return webResearch || null;
  if (!webResearch) {
    return { ...discovery, fetchedAt: discovery.fetchedAt || null };
  }
  const local = Array.isArray(discovery.local) ? discovery.local : [];
  const playable = local.filter(item => item.playable);
  const seenMedia = new Set((webResearch.media || []).map(item => item.url || item.title));
  const media = [...playable.filter(item => !seenMedia.has(item.url || item.title)), ...(webResearch.media || [])];
  return {
    ...webResearch,
    handoffs: discovery.handoffs || webResearch.handoffs || [],
    local,
    media,
    context: [webResearch.context, discovery.context].filter(Boolean).join('\n\n')
  };
}

export function entertainmentSummary(state) {
  const entertainment = state.entertainment || {};
  return {
    favorites: [...(entertainment.favorites || [])].slice(-20).reverse(),
    recent: [...(entertainment.history || [])].slice(-30).reverse(),
    topTitles: Object.entries(entertainment.taste || {}).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([title, score]) => ({ title: displayTitle(state, title), score })),
    mix: mixBriefing(state, 'mood')
  };
}
