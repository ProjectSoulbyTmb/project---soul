import { isExplicitInternetRequest } from '../core/workspace.js';

const AGENT = 'Eidovara/0.18 (desktop research client)';

function plain(value) {
  return String(value || '').replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}
function subject(text) { return String(text).replace(/\b(?:please|can you|could you|search|look up|find|pull|get|show|play|me|from|on|the|internet|web|online|information|info|pictures?|images?|photos?|videos?|audio|music|songs?|sound|recordings?|about|of|for|and|similar|to)\b/gi, ' ').replace(/[^\p{L}\p{N}\s'_-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 240); }
async function json(url, timeoutMs = 15000, headers = {}) {
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { const res = await fetch(url, { signal: controller.signal, redirect: 'error', headers: { 'Api-User-Agent': AGENT, 'User-Agent': AGENT, Accept: 'application/json', ...headers } }); if (!res.ok) throw new Error(`Internet source returned ${res.status}.`); const limit=5*1024*1024; const declared=Number(res.headers?.get?.('content-length')||0); if(declared>limit)throw new Error('Internet response is too large.'); if(typeof res.arrayBuffer!=='function')return await res.json(); const bytes=Buffer.from(await res.arrayBuffer()); if(bytes.length>limit)throw new Error('Internet response is too large.'); return JSON.parse(bytes.toString('utf8')); }
  finally { clearTimeout(timer); }
}
function orderedPages(data) {
  const raw = data?.pages || data?.query?.pages || {};
  const list = Array.isArray(raw) ? raw : Object.values(raw);
  return list.sort((a, b) => (Number(a.index) || 0) - (Number(b.index) || 0));
}
function hostnameAllowed(href, suffixes) {
  try {
    const host = new URL(href).hostname.toLowerCase();
    return suffixes.some(suffix => host === suffix || host.endsWith(`.${suffix}`));
  } catch {
    return false;
  }
}
function asHttps(value, hostSuffixes) {
  let raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('//')) raw = `https:${raw}`;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password) return '';
    const href = url.toString();
    if (hostSuffixes && !hostnameAllowed(href, hostSuffixes)) return '';
    return href;
  } catch {
    return '';
  }
}
function wikiUrl(page) {
  if (page?.fullurl) return asHttps(page.fullurl, ['wikipedia.org']);
  const title = String(page?.title || '').replace(/ /g, '_');
  return title ? `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}` : '';
}
async function searchArticles(query) {
  const params = new URLSearchParams({ action: 'query', format: 'json', origin: '*', generator: 'search', gsrsearch: query, gsrlimit: '5', prop: 'extracts|description|pageimages|info', inprop: 'url', exintro: '1', explaintext: '1', exsentences: '3', piprop: 'thumbnail', pithumbsize: '600' });
  const data = await json(`https://en.wikipedia.org/w/api.php?${params}`);
  return orderedPages(data).slice(0, 5).map(p => ({
    type: 'source', title: plain(p.title), description: plain(p.description || p.extract || p.excerpt),
    url: wikiUrl(p),
    thumbnail: asHttps(p.thumbnail?.source || p.thumbnail?.url, ['upload.wikimedia.org', 'wikimedia.org', 'wikipedia.org']) || null
  })).filter(p => p.title && p.url);
}
async function searchMedia(query, kind) {
  const type = kind === 'video' ? 'video' : kind === 'audio' ? 'audio' : 'bitmap';
  const params = new URLSearchParams({ action: 'query', format: 'json', origin: '*', generator: 'search', gsrnamespace: '6', gsrsearch: `${query} filetype:${type}`, gsrlimit: '6', prop: 'imageinfo', iiprop: 'url|mime', iiurlwidth: '900' });
  const data = await json(`https://commons.wikimedia.org/w/api.php?${params}`);
  return orderedPages(data).map(p => { const i = p.imageinfo?.[0] || {}; return { type: kind, title: plain(String(p.title || '').replace(/^File:/, '')), url: asHttps(i.thumburl || i.url, ['upload.wikimedia.org', 'wikimedia.org']), sourceUrl: asHttps(i.descriptionurl, ['commons.wikimedia.org', 'wikimedia.org', 'wikipedia.org']), mime: i.mime }; }).filter(x => x.url && x.sourceUrl).slice(0, 4);
}
async function searchBroad(query, apiKey, wantsImages) {
  const params = new URLSearchParams({ q: query, count: '10', search_lang: 'en', safesearch: 'strict' });
  const headers = { 'X-Subscription-Token': apiKey };
  const web = await json(`https://api.search.brave.com/res/v1/web/search?${params}`, 15000, headers);
  const sources = (web.web?.results || []).slice(0, 8).map(r => ({ type: 'source', title: plain(r.title), description: plain(r.description), url: asHttps(r.url), thumbnail: asHttps(r.thumbnail?.src) || null })).filter(r => r.url);
  let media = [];
  if (wantsImages) {
    const images = await json(`https://api.search.brave.com/res/v1/images/search?${params}`, 15000, headers);
    media = (images.results || []).slice(0, 6).map(r => ({ type: 'image', title: plain(r.title), url: asHttps(r.thumbnail?.src || r.properties?.url), sourceUrl: asHttps(r.url || r.page_url), mime: 'image/*' })).filter(r => r.url && r.sourceUrl);
  }
  return { sources, media };
}

export async function researchInternet(input, { searchApiKey = '' } = {}) {
  if (!isExplicitInternetRequest(input)) return null;
  const query = subject(input);
  if (!query) throw new Error('Tell me what you want me to search for.');
  const wantsImages = /\b(picture|image|photo)s?\b/i.test(input);
  const wantsVideos = /\bvideos?\b/i.test(input);
  const wantsAudio = /\b(audio|music|song|sound|recording|listen|play)\b/i.test(input);
  const jobs = [searchArticles(query), ...(wantsImages ? [searchMedia(query, 'image')] : []), ...(wantsVideos ? [searchMedia(query, 'video')] : []), ...(wantsAudio ? [searchMedia(query, 'audio')] : []), ...(searchApiKey ? [searchBroad(query, searchApiKey, wantsImages)] : [])];
  const settled = await Promise.allSettled(jobs);
  const sources = settled[0].status === 'fulfilled' ? settled[0].value : [];
  let index = 1; const media = [];
  if (wantsImages) { if (settled[index]?.status === 'fulfilled') media.push(...settled[index].value); index++; }
  if (wantsVideos && settled[index]?.status === 'fulfilled') media.push(...settled[index].value);
  if (wantsVideos) index++;
  if (wantsAudio && settled[index]?.status === 'fulfilled') media.push(...settled[index].value);
  const broad = searchApiKey ? settled.at(-1) : null;
  if (broad?.status === 'fulfilled') { sources.unshift(...broad.value.sources); media.unshift(...broad.value.media); }
  if (!sources.length && !media.length) throw new Error('No usable internet results were returned.');
  const context = sources.map((s, i) => `[${i + 1}] ${s.title}: ${s.description}\n${s.url}`).join('\n\n');
  return { query, fetchedAt: new Date().toISOString(), sources, media, context };
}
