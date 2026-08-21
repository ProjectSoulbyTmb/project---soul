import { isExplicitInternetRequest } from '../core/workspace.js';
import { officialSearchHandoffs } from '../core/entertainment.js';

const AGENT = 'Eidovara/0.18 (desktop research client)';
export const PAGE_BYTE_LIMIT = 512 * 1024;
export const PAGE_TIMEOUT_MS = 15_000;
export const HONEST_RESEARCH_COPY = 'Public web lookup after you ask. Not a full-internet index. Wikipedia/Wikimedia plus optional keyed search and pages you open.';
const HANDOFF_HOSTS = ['youtube.com', 'youtu.be', 'spotify.com'];
const ARCHIVE_HOSTS = ['archive.org'];

export function sanitizeSnippet(value, max = 600) {
  return String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function plain(value) {
  return sanitizeSnippet(value, 400);
}

export function readableExtract(html, max = 2000) {
  const stripped = String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<(head|svg|canvas)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n');
  return sanitizeSnippet(stripped, max);
}

function subject(text) {
  return String(text)
    .replace(/https:\/\/[^\s<>"'`]+/gi, ' ')
    .replace(/\b(?:please|can you|could you|search|look up|find|pull|get|show|play|me|from|on|the|internet|web|online|information|info|pictures?|images?|photos?|videos?|audio|music|songs?|sound|recordings?|about|of|for|and|similar|to)\b/gi, ' ')
    .replace(/[^\p{L}\p{N}\s'_-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240);
}

function sourceHost(href) {
  try { return new URL(href).hostname.toLowerCase(); } catch { return ''; }
}

function isPrivateIPv4(host) {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return false;
  const parts = m.slice(1).map(Number);
  if (parts.some(n => n > 255)) return true;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

export function isBlockedResearchHost(value) {
  try {
    const url = value instanceof URL ? value : new URL(String(value || ''));
    const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
    if (!host) return true;
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.lan')) return true;
    if (host === '::1' || host === '0.0.0.0' || host === 'metadata.google.internal') return true;
    if (host.includes(':') && (host === '::1' || host.startsWith('fe80:') || host.startsWith('fc') || host.startsWith('fd'))) return true;
    if (isPrivateIPv4(host)) return true;
    return false;
  } catch {
    return true;
  }
}

export function hostnameAllowed(href, suffixes) {
  try {
    const host = new URL(href).hostname.toLowerCase();
    return suffixes.some(suffix => host === suffix || host.endsWith(`.${suffix}`));
  } catch {
    return false;
  }
}

export function isHandoffOnlyHost(href) {
  return hostnameAllowed(href, HANDOFF_HOSTS);
}

function handoffProvider(href) {
  if (hostnameAllowed(href, ['youtube.com', 'youtu.be'])) return 'YouTube';
  if (hostnameAllowed(href, ['spotify.com'])) return 'Spotify';
  if (hostnameAllowed(href, ARCHIVE_HOSTS)) return 'Internet Archive';
  return sourceHost(href) || 'Web';
}

function asHttps(value, hostSuffixes) {
  let raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('//')) raw = `https:${raw}`;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password) return '';
    if (isBlockedResearchHost(url)) return '';
    const href = url.toString();
    if (hostSuffixes && !hostnameAllowed(href, hostSuffixes)) return '';
    return href;
  } catch {
    return '';
  }
}

export function publicHttpsUrl(value) {
  return asHttps(value);
}

export function extractHttpsUrls(text) {
  const matches = String(text || '').match(/https:\/\/[^\s<>"'`]+/gi) || [];
  const out = [];
  for (const raw of matches) {
    const href = publicHttpsUrl(raw.replace(/[),.;]+$/g, ''));
    if (href && !out.includes(href)) out.push(href);
    if (out.length >= 3) break;
  }
  return out;
}

export function classifyLookupError(err) {
  const name = err?.name || '';
  const message = String(err?.message || err || '');
  if (name === 'AbortError' || /aborted|timed out|timeout/i.test(message)) {
    return new Error('Internet lookup timed out. The workspace is still available.');
  }
  if (/blocked for in-app lookup/i.test(message)) return err instanceof Error ? err : new Error(message);
  if (/ENOTFOUND|ECONNREFUSED|ENETUNREACH|EAI_AGAIN|offline|fetch failed|network/i.test(message)) {
    return new Error('The public web lookup is unavailable (offline or blocked). The workspace is still available.');
  }
  if (/redirect/i.test(message)) return new Error('That page redirected and was not opened. The workspace is still available.');
  return err instanceof Error ? err : new Error(message);
}

async function json(url, timeoutMs = 15000, headers = {}, fetchImpl = globalThis.fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const fetcher = fetchImpl || globalThis.fetch;
  try {
    const res = await fetcher(url, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'error',
      credentials: 'omit',
      headers: { 'Api-User-Agent': AGENT, 'User-Agent': AGENT, Accept: 'application/json', ...headers }
    });
    if (!res.ok) throw new Error(`Internet source returned ${res.status}.`);
    const limit = 5 * 1024 * 1024;
    const declared = Number(res.headers?.get?.('content-length') || 0);
    if (declared > limit) throw new Error('Internet response is too large.');
    if (typeof res.arrayBuffer !== 'function') return await res.json();
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length > limit) throw new Error('Internet response is too large.');
    return JSON.parse(bytes.toString('utf8'));
  } catch (err) {
    throw classifyLookupError(err);
  } finally {
    clearTimeout(timer);
  }
}

function orderedPages(data) {
  const raw = data?.pages || data?.query?.pages || {};
  const list = Array.isArray(raw) ? raw : Object.values(raw);
  return list.sort((a, b) => (Number(a.index) || 0) - (Number(b.index) || 0));
}

function wikiUrl(page) {
  if (page?.fullurl) return asHttps(page.fullurl, ['wikipedia.org']);
  const title = String(page?.title || '').replace(/ /g, '_');
  return title ? `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}` : '';
}

function asSource(item) {
  const url = item.url || '';
  return {
    type: item.type || 'source',
    title: sanitizeSnippet(item.title, 200),
    description: sanitizeSnippet(item.description, 600),
    extract: item.extract ? sanitizeSnippet(item.extract, 2000) : '',
    url,
    hostname: item.hostname || sourceHost(url),
    provider: item.provider || '',
    thumbnail: item.thumbnail || null
  };
}

async function searchArchive(query, fetchImpl) {
  const params = new URLSearchParams();
  params.set('q', query);
  params.append('fl[]', 'identifier');
  params.append('fl[]', 'title');
  params.append('fl[]', 'description');
  params.append('fl[]', 'mediatype');
  params.set('output', 'json');
  params.set('rows', '5');
  const data = await json(`https://archive.org/advancedsearch.php?${params}`, 15000, {}, fetchImpl);
  const docs = Array.isArray(data?.response?.docs) ? data.response.docs : [];
  return docs.map(doc => {
    const identifier = String(doc.identifier || '').trim();
    const url = identifier ? asHttps(`https://archive.org/details/${encodeURIComponent(identifier)}`, ARCHIVE_HOSTS) : '';
    const kind = String(doc.mediatype || '').toLowerCase();
    return asSource({
      type: kind === 'audio' || kind === 'movies' ? 'source' : 'source',
      title: Array.isArray(doc.title) ? doc.title[0] : doc.title,
      description: Array.isArray(doc.description) ? doc.description[0] : (doc.description || doc.mediatype || 'Internet Archive'),
      url,
      provider: 'Internet Archive',
      hostname: 'archive.org'
    });
  }).filter(item => item.title && item.url).slice(0, 5);
}

async function searchArticles(query, fetchImpl) {
  const params = new URLSearchParams({ action: 'query', format: 'json', origin: '*', generator: 'search', gsrsearch: query, gsrlimit: '5', prop: 'extracts|description|pageimages|info', inprop: 'url', exintro: '1', explaintext: '1', exsentences: '3', piprop: 'thumbnail', pithumbsize: '600' });
  const data = await json(`https://en.wikipedia.org/w/api.php?${params}`, 15000, {}, fetchImpl);
  return orderedPages(data).slice(0, 5).map(p => asSource({
    type: 'source',
    title: p.title,
    description: p.description || p.extract || p.excerpt,
    extract: p.extract || p.description || '',
    url: wikiUrl(p),
    thumbnail: asHttps(p.thumbnail?.source || p.thumbnail?.url, ['upload.wikimedia.org', 'wikimedia.org', 'wikipedia.org']) || null
  })).filter(p => p.title && p.url);
}

async function searchMedia(query, kind, fetchImpl) {
  const type = kind === 'video' ? 'video' : kind === 'audio' ? 'audio' : 'bitmap';
  const params = new URLSearchParams({ action: 'query', format: 'json', origin: '*', generator: 'search', gsrnamespace: '6', gsrsearch: `${query} filetype:${type}`, gsrlimit: '6', prop: 'imageinfo', iiprop: 'url|mime', iiurlwidth: '900' });
  const data = await json(`https://commons.wikimedia.org/w/api.php?${params}`, 15000, {}, fetchImpl);
  return orderedPages(data).map(p => {
    const i = p.imageinfo?.[0] || {};
    const url = asHttps(i.thumburl || i.url, ['upload.wikimedia.org', 'wikimedia.org']);
    const sourceUrl = asHttps(i.descriptionurl, ['commons.wikimedia.org', 'wikimedia.org', 'wikipedia.org']);
    return {
      type: kind,
      title: plain(String(p.title || '').replace(/^File:/, '')),
      url,
      sourceUrl,
      hostname: sourceHost(sourceUrl || url),
      mime: i.mime
    };
  }).filter(x => x.url && x.sourceUrl).slice(0, 4);
}

async function searchBroad(query, apiKey, wantsImages, fetchImpl) {
  const params = new URLSearchParams({ q: query, count: '10', search_lang: 'en', safesearch: 'strict' });
  const headers = { 'X-Subscription-Token': apiKey };
  const web = await json(`https://api.search.brave.com/res/v1/web/search?${params}`, 15000, headers, fetchImpl);
  const sources = (web.web?.results || []).slice(0, 8).map(r => asSource({
    title: r.title,
    description: r.description,
    url: asHttps(r.url),
    thumbnail: asHttps(r.thumbnail?.src) || null
  })).filter(r => r.url);
  let media = [];
  if (wantsImages) {
    const images = await json(`https://api.search.brave.com/res/v1/images/search?${params}`, 15000, headers, fetchImpl);
    media = (images.results || []).slice(0, 6).map(r => {
      const url = asHttps(r.thumbnail?.src || r.properties?.url);
      const sourceUrl = asHttps(r.url || r.page_url);
      return { type: 'image', title: plain(r.title), url, sourceUrl, hostname: sourceHost(sourceUrl || url), mime: 'image/*' };
    }).filter(r => r.url && r.sourceUrl);
  }
  return { sources, media };
}

export async function fetchPublicPage(href, { fetchImpl = globalThis.fetch, timeoutMs = PAGE_TIMEOUT_MS } = {}) {
  const url = publicHttpsUrl(href);
  if (!url) throw new Error('Only credential-free HTTPS pages can be opened.');
  if (isBlockedResearchHost(url)) throw new Error('That host is blocked for in-app lookup.');
  if (isHandoffOnlyHost(url)) throw new Error('YouTube and Spotify stay official browser searches. Eidovara does not fetch their HTML.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'error',
      credentials: 'omit',
      headers: { 'Api-User-Agent': AGENT, 'User-Agent': AGENT, Accept: 'text/html, text/plain;q=0.9', 'Cache-Control': 'no-store' }
    });
    if (!res.ok) throw new Error(`Internet source returned ${res.status}.`);
    const type = String(res.headers?.get?.('content-type') || '').toLowerCase();
    if (type && !/(text\/html|text\/plain|application\/xhtml\+xml|application\/xml|\btext\/)/.test(type)) {
      throw new Error('That page is not readable text.');
    }
    const declared = Number(res.headers?.get?.('content-length') || 0);
    if (declared > PAGE_BYTE_LIMIT) throw new Error('Internet response is too large.');
    let raw = '';
    if (typeof res.arrayBuffer === 'function') {
      const bytes = Buffer.from(await res.arrayBuffer());
      if (bytes.length > PAGE_BYTE_LIMIT) throw new Error('Internet response is too large.');
      raw = bytes.toString('utf8');
    } else if (typeof res.text === 'function') {
      raw = await res.text();
      if (Buffer.byteLength(raw, 'utf8') > PAGE_BYTE_LIMIT) throw new Error('Internet response is too large.');
    } else {
      throw new Error('Internet source returned an unreadable body.');
    }
    const titleMatch = raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const extract = readableExtract(raw);
    return {
      url,
      hostname: sourceHost(url),
      title: sanitizeSnippet(titleMatch?.[1] || sourceHost(url), 200),
      extract,
      snippet: sanitizeSnippet(extract, 600)
    };
  } catch (err) {
    throw classifyLookupError(err);
  } finally {
    clearTimeout(timer);
  }
}

function isStructuredCatalogHost(href) {
  return hostnameAllowed(href, ['wikipedia.org', 'wikimedia.org', 'archive.org', 'api.search.brave.com']);
}

async function attachPageExtracts(sources, urls, fetchImpl) {
  const seen = new Set(sources.map(s => s.url));
  const lookups = [];
  for (const href of urls) {
    if (!href || seen.has(href) || isHandoffOnlyHost(href)) continue;
    seen.add(href);
    lookups.push(href);
    if (lookups.length >= 3) break;
  }
  for (const source of sources) {
    if (lookups.length >= 3) break;
    if (source.extract || !source.url || seen.has(`extract:${source.url}`)) continue;
    if (isStructuredCatalogHost(source.url) || isHandoffOnlyHost(source.url)) continue;
    seen.add(`extract:${source.url}`);
    lookups.push(source.url);
  }
  const extra = [];
  for (const href of lookups) {
    try {
      const page = await fetchPublicPage(href, { fetchImpl });
      const existing = sources.find(s => s.url === page.url);
      if (existing) {
        if (!existing.extract) existing.extract = page.extract;
        if (!existing.description) existing.description = page.snippet;
        if (!existing.hostname) existing.hostname = page.hostname;
      } else {
        extra.push(asSource({
          title: page.title,
          description: page.snippet,
          extract: page.extract,
          url: page.url,
          hostname: page.hostname
        }));
      }
    } catch {
      // Fail closed per URL: skip the extract, keep Wikipedia/keyed hits, workspace continues.
    }
  }
  return extra;
}

export async function researchInternet(input, { searchApiKey = '', fetchImpl } = {}) {
  if (!isExplicitInternetRequest(input)) return null;
  const pageFetch = fetchImpl || globalThis.fetch;
  const userUrls = extractHttpsUrls(input);
  const pageUrls = userUrls.filter(href => !isHandoffOnlyHost(href));
  const query = subject(input) || pageUrls.map(href => sourceHost(href)).filter(Boolean).join(' ');
  if (!query && !userUrls.length) throw new Error('Tell me what you want me to search for.');
  const wantsImages = /\b(picture|image|photo)s?\b/i.test(input);
  const wantsVideos = /\bvideos?\b/i.test(input);
  const wantsAudio = /\b(audio|music|song|sound|recording|listen|play)\b/i.test(input);
  const jobs = [];
  if (query) jobs.push(searchArticles(query, pageFetch));
  if (query && wantsImages) jobs.push(searchMedia(query, 'image', pageFetch));
  if (query && wantsVideos) jobs.push(searchMedia(query, 'video', pageFetch));
  if (query && wantsAudio) jobs.push(searchMedia(query, 'audio', pageFetch));
  if (query) jobs.push(searchArchive(query, pageFetch));
  if (query && searchApiKey) jobs.push(searchBroad(query, searchApiKey, wantsImages, pageFetch));
  const settled = jobs.length ? await Promise.allSettled(jobs) : [];
  const sources = [];
  const media = [];
  const lookupErrors = [];
  let index = 0;
  if (query) {
    if (settled[index]?.status === 'fulfilled') sources.push(...settled[index].value);
    else if (settled[index]?.status === 'rejected') lookupErrors.push(String(settled[index].reason?.message || settled[index].reason));
    index += 1;
  }
  if (query && wantsImages) {
    if (settled[index]?.status === 'fulfilled') media.push(...settled[index].value);
    index += 1;
  }
  if (query && wantsVideos) {
    if (settled[index]?.status === 'fulfilled') media.push(...settled[index].value);
    index += 1;
  }
  if (query && wantsAudio) {
    if (settled[index]?.status === 'fulfilled') media.push(...settled[index].value);
    index += 1;
  }
  if (query) {
    if (settled[index]?.status === 'fulfilled') sources.push(...settled[index].value);
    index += 1;
  }
  const broad = query && searchApiKey ? settled.at(-1) : null;
  if (broad?.status === 'fulfilled') {
    sources.unshift(...broad.value.sources);
    media.unshift(...broad.value.media);
  } else if (broad?.status === 'rejected') {
    lookupErrors.push(String(broad.reason?.message || broad.reason));
  }
  const pageSources = await attachPageExtracts(sources, pageUrls, pageFetch);
  sources.unshift(...pageSources);
  if (!sources.length && !media.length) {
    const first = lookupErrors[0];
    if (first) throw classifyLookupError(new Error(first));
    throw new Error('No usable internet results were returned. The workspace is still available.');
  }
  const handoffs = officialSearchHandoffs(query || 'media');
  for (const href of userUrls.filter(isHandoffOnlyHost)) {
    if (!handoffs.some(item => item.url === href)) {
      handoffs.push({ provider: handoffProvider(href), title: sourceHost(href), url: href });
    }
  }
  const context = [
    ...sources.map((s, i) => `[${i + 1}] ${s.title}${s.hostname ? ` (${s.hostname})` : ''}: ${s.description}\n${s.url}`),
    ...handoffs.map(item => `${item.provider} search (browser handoff): ${item.url}`)
  ].join('\n\n');
  return {
    query,
    fetchedAt: new Date().toISOString(),
    sources,
    media,
    handoffs,
    local: [],
    context,
    lookupErrors,
    disclaimer: HONEST_RESEARCH_COPY
  };
}

export function researchOpenActions(webResearch) {
  const fromSources = (webResearch?.sources || []).slice(0, 6).map(source => {
    const url = publicHttpsUrl(source.url);
    if (!url) return null;
    let hostname = String(source.hostname || '').toLowerCase();
    if (!hostname) {
      try { hostname = new URL(url).hostname.toLowerCase(); } catch { hostname = ''; }
    }
    if (!hostname) return null;
    const title = sanitizeSnippet(source.title || hostname, 80);
    return {
      type: 'open-external',
      url,
      hostname,
      snippet: sanitizeSnippet(source.description || source.extract || '', 180),
      label: `${title} · ${hostname}`.slice(0, 80),
      auto: false
    };
  }).filter(Boolean);
  const fromHandoffs = (webResearch?.handoffs || []).map(item => {
    const url = publicHttpsUrl(item.url);
    if (!url) return null;
    const hostname = sourceHost(url);
    return {
      type: 'open-external',
      url,
      hostname,
      snippet: sanitizeSnippet(item.title || item.provider || '', 180),
      label: `${item.provider || 'Search'} · ${hostname}`.slice(0, 80),
      auto: false
    };
  }).filter(Boolean);
  return [...fromSources, ...fromHandoffs];
}

export function citeResearchInReply(reply, webResearch, internetError) {
  let text = String(reply || '');
  const errorNote = String(internetError || '').trim();
  if (errorNote && !text.includes(errorNote)) text = text ? `${text}\n\n${errorNote}` : errorNote;
  const sources = Array.isArray(webResearch?.sources) ? webResearch.sources : [];
  const handoffs = Array.isArray(webResearch?.handoffs) ? webResearch.handoffs : [];
  const local = Array.isArray(webResearch?.local) ? webResearch.local : [];
  if (!sources.length && !handoffs.length && !local.length) return text;
  const cited = sources.slice(0, 3).every(source => {
    const title = source.title || '';
    const host = source.hostname || '';
    const hasTitle = !title || text.includes(title);
    const hasHost = !host || text.includes(host) || text.includes(source.url || '');
    return hasTitle && hasHost;
  });
  const handoffsCited = !handoffs.length || handoffs.some(item => text.includes(item.url) || text.includes(item.provider));
  const disclaimer = webResearch?.disclaimer || HONEST_RESEARCH_COPY;
  if (sources.length && !cited) {
    const block = sources.slice(0, 4).map((source, index) => {
      const host = source.hostname ? ` (${source.hostname})` : '';
      const snippet = sanitizeSnippet(source.description || source.extract || '', 240);
      return `${index + 1}. ${source.title || 'Source'}${host}${snippet ? ` — ${snippet}` : ''}`;
    }).join('\n');
    text = `${text}\n\n${disclaimer}\n${block}`.trim();
  } else if (disclaimer && sources.length && !/full-internet index/i.test(text)) {
    text = `${text}\n\n${disclaimer}`;
  }
  if (handoffs.length && !handoffsCited) {
    text = `${text}\n\nOfficial search links (browser handoff, not in-app players):\n${handoffs.map(item => `${item.provider}: ${item.url}`).join('\n')}`;
  }
  if (local.length && !local.some(item => text.includes(item.title))) {
    text = `${text}\n\nLocal library: ${local.map(item => item.title).join(', ')}. Play matching files in Eidovara.`;
  }
  return text;
}
