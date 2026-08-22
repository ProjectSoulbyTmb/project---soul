// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import { isExplicitInternetRequest } from '../core/workspace.js';
import { officialSearchHandoffs } from '../core/entertainment.js';
import { SOURCE_VERSION } from '../core/release.js';

const AGENT = `Eidovara/${SOURCE_VERSION} (desktop research client)`;
export const PAGE_BYTE_LIMIT = 512 * 1024;
export const PAGE_TIMEOUT_MS = 15_000;
export const HONEST_RESEARCH_COPY =
  'Public web lookup after you ask. Not a full-internet index. Wikipedia/Wikimedia, Internet Archive, optional keyed search, pages you open, plus official YouTube/Spotify/Archive search links. Local files play in Eidovara.';
const HANDOFF_HOSTS = [
  'youtube.com',
  'youtu.be',
  'spotify.com',
  'pornhub.com',
  'xvideos.com',
  'xhamster.com',
  'spankbang.com',
  'redgifs.com',
  'xnxx.com',
  'chaturbate.com',
  'stripchat.com',
  'onlyfans.com',
  'fansly.com',
  'manyvids.com',
  'youporn.com',
  'redtube.com',
  'tube8.com',
];
const ARCHIVE_HOSTS = ['archive.org'];
const RAW_DROP_TAGS = new Set([
  'script',
  'style',
  'noscript',
  'iframe',
  'object',
  'embed',
  'textarea',
  'xmp',
  'noembed',
  'noframes',
]);
const TREE_DROP_TAGS = new Set(['head', 'svg', 'canvas']);
const BREAK_TAGS = new Set([
  'p',
  'div',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'li',
  'tr',
  'br',
  'hr',
  'blockquote',
  'ul',
  'ol',
  'table',
  'section',
  'article',
  'pre',
  'thead',
  'tbody',
  'tfoot',
  'td',
  'th',
]);
const NAMED_ENTITIES = new Map([
  ['nbsp', ' '],
  ['amp', '&'],
  ['quot', '"'],
  ['apos', "'"],
  ['lt', '<'],
  ['gt', '>'],
]);

function isWs(ch) {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f' || ch === '\v';
}

function isAlpha(ch) {
  const code = ch.charCodeAt(0);
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

function isNameChar(ch) {
  const code = ch.charCodeAt(0);
  return (
    (code >= 65 && code <= 90) ||
    (code >= 97 && code <= 122) ||
    (code >= 48 && code <= 57) ||
    ch === '-' ||
    ch === ':'
  );
}

function foldAscii(ch) {
  const code = ch.charCodeAt(0);
  return code >= 65 && code <= 90 ? String.fromCharCode(code + 32) : ch;
}

function matchFolded(s, index, word) {
  if (index + word.length > s.length) return false;
  for (let k = 0; k < word.length; k++) {
    if (foldAscii(s[index + k]) !== word[k]) return false;
  }
  return true;
}

function readTagName(s, index) {
  let i = index;
  let name = '';
  while (i < s.length && isNameChar(s[i])) {
    name += foldAscii(s[i]);
    i += 1;
  }
  return { name, index: i };
}

function skipQuoted(s, index) {
  const quote = s[index];
  let i = index + 1;
  while (i < s.length && s[i] !== quote) i += 1;
  return i < s.length ? i + 1 : i;
}

function skipUntilGt(s, index) {
  let i = index;
  while (i < s.length) {
    const ch = s[i];
    if (ch === '"' || ch === "'") i = skipQuoted(s, i);
    else if (ch === '>') return i + 1;
    else i += 1;
  }
  return s.length;
}

function inspectMarkup(s, index) {
  if (s.startsWith('<!--', index)) {
    const end = s.indexOf('-->', index + 4);
    return {
      kind: 'comment',
      name: '',
      closing: false,
      start: index,
      end: end < 0 ? s.length : end + 3,
    };
  }
  let i = index + 1;
  if (i < s.length && (s[i] === '!' || s[i] === '?')) {
    return { kind: 'decl', name: '', closing: false, start: index, end: skipUntilGt(s, i) };
  }
  const closing = i < s.length && s[i] === '/';
  if (closing) i += 1;
  while (i < s.length && isWs(s[i])) i += 1;
  if (i >= s.length || !isAlpha(s[i])) {
    return { kind: 'junk', name: '', closing, start: index, end: skipUntilGt(s, index + 1) };
  }
  const { name, index: afterName } = readTagName(s, i);
  return { kind: 'tag', name, closing, start: index, end: skipUntilGt(s, afterName) };
}

function findRawEnd(s, from, name) {
  let i = from;
  while (i < s.length) {
    if (s[i] === '<' && s[i + 1] === '/') {
      let j = i + 2;
      while (j < s.length && isWs(s[j])) j += 1;
      if (
        matchFolded(s, j, name) &&
        (j + name.length >= s.length || !isNameChar(s[j + name.length]))
      ) {
        return { contentEnd: i, after: skipUntilGt(s, j + name.length) };
      }
    }
    i += 1;
  }
  return { contentEnd: s.length, after: s.length };
}

function dropHtmlToText(html, { dropTrees = false, breaks = false } = {}) {
  const s = String(html || '');
  let out = '';
  let i = 0;
  while (i < s.length) {
    if (s[i] !== '<') {
      out += s[i];
      i += 1;
      continue;
    }
    const tag = inspectMarkup(s, i);
    if (
      tag.kind === 'tag' &&
      !tag.closing &&
      (RAW_DROP_TAGS.has(tag.name) || (dropTrees && TREE_DROP_TAGS.has(tag.name)))
    ) {
      i = findRawEnd(s, tag.end, tag.name).after;
      out += breaks ? '\n' : ' ';
      continue;
    }
    if (breaks && tag.kind === 'tag' && BREAK_TAGS.has(tag.name)) out += '\n';
    else out += ' ';
    i = tag.end;
  }
  return out;
}

function entityValue(body) {
  if (!body) return null;
  if (body[0] === '#') {
    const hex = body[1] === 'x' || body[1] === 'X';
    const num = hex ? Number.parseInt(body.slice(2), 16) : Number.parseInt(body.slice(1), 10);
    if (!Number.isFinite(num) || num < 1 || num > 0x10ffff) return '';
    return String.fromCodePoint(num);
  }
  let folded = '';
  for (let i = 0; i < body.length; i++) folded += foldAscii(body[i]);
  return NAMED_ENTITIES.has(folded) ? NAMED_ENTITIES.get(folded) : null;
}

function decodeHtmlEntities(value) {
  const text = String(value || '');
  let out = '';
  let i = 0;
  while (i < text.length) {
    if (text[i] === '&') {
      const semi = text.indexOf(';', i + 1);
      if (semi > i && semi - i < 12) {
        const decoded = entityValue(text.slice(i + 1, semi));
        if (decoded !== null) {
          out += decoded;
          i = semi + 1;
          continue;
        }
      }
    }
    out += text[i];
    i += 1;
  }
  return out;
}

function stripAngleBrackets(value) {
  let out = '';
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    out += ch === '<' || ch === '>' ? ' ' : ch;
  }
  return out;
}

function extractHtmlTitle(html) {
  const s = String(html || '');
  let i = 0;
  while (i < s.length) {
    if (s[i] !== '<') {
      i += 1;
      continue;
    }
    const tag = inspectMarkup(s, i);
    if (tag.kind === 'tag' && !tag.closing && RAW_DROP_TAGS.has(tag.name)) {
      i = findRawEnd(s, tag.end, tag.name).after;
      continue;
    }
    if (tag.kind === 'tag' && !tag.closing && tag.name === 'title') {
      const { contentEnd } = findRawEnd(s, tag.end, 'title');
      return s.slice(tag.end, contentEnd);
    }
    i = tag.end;
  }
  return '';
}

function collapsePlainText(value, max) {
  return String(value || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export function sanitizeSnippet(value, max = 600) {
  let text = String(value || '');
  for (let n = 0; n < 3; n++) {
    text = dropHtmlToText(decodeHtmlEntities(text));
  }
  return collapsePlainText(stripAngleBrackets(text), max);
}

function plain(value) {
  return sanitizeSnippet(value, 400);
}

export function readableExtract(html, max = 2000) {
  return sanitizeSnippet(dropHtmlToText(html, { dropTrees: true, breaks: true }), max);
}

function subject(text) {
  return String(text)
    .replace(/https:\/\/[^\s<>"'`]+/gi, ' ')
    .replace(
      /\b(?:please|can you|could you|search|look up|find|pull|get|show|play|me|from|on|the|internet|web|online|information|info|pictures?|images?|photos?|videos?|audio|music|songs?|sound|recordings?|about|of|for|and|similar|to)\b/gi,
      ' '
    )
    .replace(/[^\p{L}\p{N}\s'_-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240);
}

function sourceHost(href) {
  try {
    return new URL(href).hostname.toLowerCase();
  } catch {
    return '';
  }
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
    if (
      host === 'localhost' ||
      host.endsWith('.localhost') ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      host.endsWith('.lan')
    )
      return true;
    if (host === '::1' || host === '0.0.0.0' || host === 'metadata.google.internal') return true;
    if (
      host.includes(':') &&
      (host === '::1' || host.startsWith('fe80:') || host.startsWith('fc') || host.startsWith('fd'))
    )
      return true;
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
  if (/blocked for in-app lookup/i.test(message))
    return err instanceof Error ? err : new Error(message);
  if (/ENOTFOUND|ECONNREFUSED|ENETUNREACH|EAI_AGAIN|offline|fetch failed|network/i.test(message)) {
    return new Error(
      'The public web lookup is unavailable (offline or blocked). The workspace is still available.'
    );
  }
  if (/redirect/i.test(message))
    return new Error('That page redirected and was not opened. The workspace is still available.');
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
      headers: {
        'Api-User-Agent': AGENT,
        'User-Agent': AGENT,
        Accept: 'application/json',
        ...headers,
      },
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
    thumbnail: item.thumbnail || null,
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
  return docs
    .map(doc => {
      const identifier = String(doc.identifier || '').trim();
      const url = identifier
        ? asHttps(`https://archive.org/details/${encodeURIComponent(identifier)}`, ARCHIVE_HOSTS)
        : '';
      const kind = String(doc.mediatype || '').toLowerCase();
      return asSource({
        type: kind === 'audio' || kind === 'movies' ? 'source' : 'source',
        title: Array.isArray(doc.title) ? doc.title[0] : doc.title,
        description: Array.isArray(doc.description)
          ? doc.description[0]
          : doc.description || doc.mediatype || 'Internet Archive',
        url,
        provider: 'Internet Archive',
        hostname: 'archive.org',
      });
    })
    .filter(item => item.title && item.url)
    .slice(0, 5);
}

async function searchArticles(query, fetchImpl) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrsearch: query,
    gsrlimit: '5',
    prop: 'extracts|description|pageimages|info',
    inprop: 'url',
    exintro: '1',
    explaintext: '1',
    exsentences: '3',
    piprop: 'thumbnail',
    pithumbsize: '600',
  });
  const data = await json(`https://en.wikipedia.org/w/api.php?${params}`, 15000, {}, fetchImpl);
  return orderedPages(data)
    .slice(0, 5)
    .map(p =>
      asSource({
        type: 'source',
        title: p.title,
        description: p.description || p.extract || p.excerpt,
        extract: p.extract || p.description || '',
        url: wikiUrl(p),
        thumbnail:
          asHttps(p.thumbnail?.source || p.thumbnail?.url, [
            'upload.wikimedia.org',
            'wikimedia.org',
            'wikipedia.org',
          ]) || null,
      })
    )
    .filter(p => p.title && p.url);
}

async function searchMedia(query, kind, fetchImpl) {
  const type = kind === 'video' ? 'video' : kind === 'audio' ? 'audio' : 'bitmap';
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrnamespace: '6',
    gsrsearch: `${query} filetype:${type}`,
    gsrlimit: '6',
    prop: 'imageinfo',
    iiprop: 'url|mime|size',
  });
  if (kind === 'image') params.set('iiurlwidth', '900');
  const data = await json(
    `https://commons.wikimedia.org/w/api.php?${params}`,
    15000,
    {},
    fetchImpl
  );
  return orderedPages(data)
    .map(p => {
      const i = p.imageinfo?.[0] || {};
      const original = asHttps(i.url, ['upload.wikimedia.org', 'wikimedia.org']);
      const thumb = asHttps(i.thumburl, ['upload.wikimedia.org', 'wikimedia.org']);
      const url = kind === 'image' ? thumb || original : original || thumb;
      const sourceUrl = asHttps(i.descriptionurl, [
        'commons.wikimedia.org',
        'wikimedia.org',
        'wikipedia.org',
      ]);
      return {
        type: kind,
        title: plain(String(p.title || '').replace(/^File:/, '')),
        url,
        originalUrl: original,
        sourceUrl,
        hostname: sourceHost(sourceUrl || url),
        mime: i.mime,
      };
    })
    .filter(x => x.url && x.sourceUrl)
    .slice(0, 4);
}

async function searchBroad(query, apiKey, wantsImages, fetchImpl) {
  const params = new URLSearchParams({
    q: query,
    count: '10',
    search_lang: 'en',
    safesearch: 'strict',
  });
  const headers = { 'X-Subscription-Token': apiKey };
  const web = await json(
    `https://api.search.brave.com/res/v1/web/search?${params}`,
    15000,
    headers,
    fetchImpl
  );
  const sources = (web.web?.results || [])
    .slice(0, 8)
    .map(r =>
      asSource({
        title: r.title,
        description: r.description,
        url: asHttps(r.url),
        thumbnail: asHttps(r.thumbnail?.src) || null,
      })
    )
    .filter(r => r.url);
  let media = [];
  if (wantsImages) {
    const images = await json(
      `https://api.search.brave.com/res/v1/images/search?${params}`,
      15000,
      headers,
      fetchImpl
    );
    media = (images.results || [])
      .slice(0, 6)
      .map(r => {
        const url = asHttps(r.thumbnail?.src || r.properties?.url);
        const sourceUrl = asHttps(r.url || r.page_url);
        return {
          type: 'image',
          title: plain(r.title),
          url,
          sourceUrl,
          hostname: sourceHost(sourceUrl || url),
          mime: 'image/*',
        };
      })
      .filter(r => r.url && r.sourceUrl);
  }
  return { sources, media };
}

export async function fetchPublicPage(
  href,
  { fetchImpl = globalThis.fetch, timeoutMs = PAGE_TIMEOUT_MS } = {}
) {
  let parsed;
  try {
    parsed = new URL(String(href || ''));
  } catch {
    throw new Error('Only credential-free HTTPS pages can be opened.');
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
    throw new Error('Only credential-free HTTPS pages can be opened.');
  }
  if (isBlockedResearchHost(parsed)) throw new Error('That host is blocked for in-app lookup.');
  const url = publicHttpsUrl(href);
  if (!url) throw new Error('Only credential-free HTTPS pages can be opened.');
  if (isHandoffOnlyHost(url))
    throw new Error(
      'YouTube and Spotify stay official browser searches. Eidovara does not fetch their HTML.'
    );
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'error',
      credentials: 'omit',
      headers: {
        'Api-User-Agent': AGENT,
        'User-Agent': AGENT,
        Accept: 'text/html, text/plain;q=0.9',
        'Cache-Control': 'no-store',
      },
    });
    if (!res.ok) throw new Error(`Internet source returned ${res.status}.`);
    const type = String(res.headers?.get?.('content-type') || '').toLowerCase();
    if (
      type &&
      !/(text\/html|text\/plain|application\/xhtml\+xml|application\/xml|\btext\/)/.test(type)
    ) {
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
      if (Buffer.byteLength(raw, 'utf8') > PAGE_BYTE_LIMIT)
        throw new Error('Internet response is too large.');
    } else {
      throw new Error('Internet source returned an unreadable body.');
    }
    const extract = readableExtract(raw);
    return {
      url,
      hostname: sourceHost(url),
      title: sanitizeSnippet(extractHtmlTitle(raw) || sourceHost(url), 200),
      extract,
      snippet: sanitizeSnippet(extract, 600),
    };
  } catch (err) {
    throw classifyLookupError(err);
  } finally {
    clearTimeout(timer);
  }
}

function isStructuredCatalogHost(href) {
  return hostnameAllowed(href, [
    'wikipedia.org',
    'wikimedia.org',
    'archive.org',
    'api.search.brave.com',
  ]);
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
        extra.push(
          asSource({
            title: page.title,
            description: page.snippet,
            extract: page.extract,
            url: page.url,
            hostname: page.hostname,
          })
        );
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
  const query =
    subject(input) ||
    pageUrls
      .map(href => sourceHost(href))
      .filter(Boolean)
      .join(' ');
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
    else if (settled[index]?.status === 'rejected')
      lookupErrors.push(String(settled[index].reason?.message || settled[index].reason));
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
    const pastedHandoffs = userUrls.filter(isHandoffOnlyHost);
    if (!pastedHandoffs.length) {
      const first = lookupErrors[0];
      if (first) throw classifyLookupError(new Error(first));
      throw new Error(
        'No usable internet results were returned. The workspace is still available.'
      );
    }
  }
  const handoffs = officialSearchHandoffs(query || 'media');
  for (const href of userUrls.filter(isHandoffOnlyHost)) {
    if (!handoffs.some(item => item.url === href)) {
      handoffs.push({ provider: handoffProvider(href), title: sourceHost(href), url: href });
    }
  }
  const context = [
    ...sources.map(
      (s, i) =>
        `[${i + 1}] ${s.title}${s.hostname ? ` (${s.hostname})` : ''}: ${s.description}\n${s.url}`
    ),
    ...handoffs.map(item => `${item.provider} search (browser handoff): ${item.url}`),
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
    disclaimer: HONEST_RESEARCH_COPY,
  };
}

export function researchOpenActions(webResearch) {
  const fromSources = (webResearch?.sources || [])
    .slice(0, 6)
    .map(source => {
      const url = publicHttpsUrl(source.url);
      if (!url) return null;
      let hostname = String(source.hostname || '').toLowerCase();
      if (!hostname) {
        try {
          hostname = new URL(url).hostname.toLowerCase();
        } catch {
          hostname = '';
        }
      }
      if (!hostname) return null;
      const title = sanitizeSnippet(source.title || hostname, 80);
      return {
        type: 'open-external',
        url,
        hostname,
        snippet: sanitizeSnippet(source.description || source.extract || '', 180),
        label: `${title} · ${hostname}`.slice(0, 80),
        auto: false,
      };
    })
    .filter(Boolean);
  const fromHandoffs = (webResearch?.handoffs || [])
    .map(item => {
      const url = publicHttpsUrl(item.url);
      if (!url) return null;
      const hostname = sourceHost(url);
      return {
        type: 'open-external',
        url,
        hostname,
        snippet: sanitizeSnippet(item.title || item.provider || '', 180),
        label: `${item.provider || 'Search'} · ${hostname}`.slice(0, 80),
        auto: false,
      };
    })
    .filter(Boolean);
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
  const handoffsCited =
    !handoffs.length ||
    handoffs.some(item => text.includes(item.url) || text.includes(item.provider));
  const disclaimer = webResearch?.disclaimer || HONEST_RESEARCH_COPY;
  if (sources.length && !cited) {
    const block = sources
      .slice(0, 4)
      .map((source, index) => {
        const host = source.hostname ? ` (${source.hostname})` : '';
        const snippet = sanitizeSnippet(source.description || source.extract || '', 240);
        return `${index + 1}. ${source.title || 'Source'}${host}${snippet ? ` — ${snippet}` : ''}`;
      })
      .join('\n');
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
