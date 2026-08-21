import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SoulEngine } from '../src/core/engine.js';
import { JsonStore } from '../src/core/store.js';
import { OfflineProvider } from '../src/providers/offline.js';
import { officialSearchHandoffs, discoverMedia } from '../src/core/entertainment.js';
import { isExplicitInternetRequest, isMediaDiscoveryRequest } from '../src/core/workspace.js';
import {
  researchInternet,
  fetchPublicPage,
  isHandoffOnlyHost,
  researchOpenActions,
  citeResearchInReply
} from '../src/providers/internet.js';

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'soul-media-sources-')); }
function hostnameOf(value) {
  try { return new URL(String(value)).hostname.toLowerCase(); } catch { return ''; }
}
function isWikipediaHost(value) {
  const host = hostnameOf(value);
  return host === 'wikipedia.org' || host.endsWith('.wikipedia.org');
}
function isArchiveHost(value) {
  const host = hostnameOf(value);
  return host === 'archive.org' || host.endsWith('.archive.org');
}
function jsonOk(body) {
  return { ok: true, headers: { get: () => null }, json: async () => body };
}

function wikiAndArchiveFetch(seen) {
  return async url => {
    const href = String(url);
    seen.push(href);
    if (/youtube\.com|youtu\.be|spotify\.com/i.test(href)) throw new Error(`must not fetch ${href}`);
    if (isWikipediaHost(href) && href.includes('api.php')) {
      return jsonOk({
        pages: [{
          title: 'Saturn',
          description: 'Sixth planet',
          extract: 'Sixth planet of the solar system',
          fullurl: 'https://en.wikipedia.org/wiki/Saturn'
        }]
      });
    }
    if (isArchiveHost(href)) {
      return jsonOk({
        response: {
          docs: [{
            identifier: 'saturn-public-domain',
            title: 'Saturn recordings',
            description: 'Public-domain catalog item',
            mediatype: 'audio'
          }]
        }
      });
    }
    return jsonOk({ query: { pages: {} } });
  };
}

test('explicit internet lookup is not Wikipedia-only: Archive catalog plus YouTube/Spotify/Archive chips', async () => {
  const seen = [];
  const original = globalThis.fetch;
  globalThis.fetch = wikiAndArchiveFetch(seen);
  try {
    const r = await researchInternet('Search the internet for Saturn');
    const hosts = r.sources.map(s => s.hostname);
    assert.ok(r.sources.some(s => s.title === 'Saturn' && s.hostname === 'en.wikipedia.org'));
    assert.ok(r.sources.some(s => s.hostname === 'archive.org' && /Saturn recordings/.test(s.title)));
    assert.ok(hosts.some(h => h !== 'en.wikipedia.org'), 'Wikipedia must not be the only source host');
    assert.ok(r.handoffs.some(item => item.provider === 'YouTube' && /youtube\.com\/results\?search_query=/.test(item.url)));
    assert.ok(r.handoffs.some(item => item.provider === 'Spotify' && /open\.spotify\.com\/search\//.test(item.url)));
    assert.ok(r.handoffs.some(item => item.provider === 'Internet Archive' && /archive\.org\/search\?query=/.test(item.url)));
    assert.equal(seen.some(url => /youtube\.com|spotify\.com/i.test(url)), false);
    assert.ok(seen.some(url => isArchiveHost(url) && /advancedsearch\.php/.test(url)));
    const actions = researchOpenActions(r);
    assert.ok(actions.some(item => item.hostname === 'en.wikipedia.org'));
    assert.ok(actions.some(item => /youtube\.com/.test(item.hostname)));
    assert.ok(actions.some(item => /spotify\.com/.test(item.hostname)));
    assert.ok(actions.some(item => item.hostname === 'archive.org'));
    const cited = citeResearchInReply('Here is a short answer about Saturn.', r);
    assert.match(cited, /youtube\.com\/results|YouTube/);
    assert.match(cited, /open\.spotify\.com\/search|Spotify/);
  } finally {
    globalThis.fetch = original;
  }
});

test('mood and music requests stay offline: local library plus constructed search chips, no remote fetch', async () => {
  let called = 0;
  const original = globalThis.fetch;
  globalThis.fetch = async () => { called += 1; throw new Error('network should not run'); };
  try {
    assert.equal(isExplicitInternetRequest('Find music that fits my current mood and explain why.'), false);
    assert.equal(isMediaDiscoveryRequest('Find music that fits my current mood and explain why.'), true);
    assert.equal(await researchInternet('Find music that fits my current mood and explain why.'), null);
    const s = new SoulEngine({ store: new JsonStore({ dataDir: tmp() }), provider: new OfflineProvider() });
    s.setInternetOptions({
      localLibrary: [{ type: 'audio', title: 'Harbor Light', url: 'eidovara-media://abc123/' }]
    });
    const r = await s.respond('Find music that fits my current mood and explain why.');
    assert.equal(r.webResearch, null);
    assert.equal(called, 0);
    assert.ok(r.mediaDiscovery);
    assert.equal(r.mediaDiscovery.remote, false);
    assert.equal(r.mediaDiscovery.sources.length, 0);
    assert.ok(r.mediaDiscovery.local.some(item => item.title === 'Harbor Light' && item.playable));
    assert.ok(r.mediaDiscovery.handoffs.some(item => item.provider === 'YouTube' && item.url.startsWith('https://www.youtube.com/results?search_query=')));
    assert.ok(r.mediaDiscovery.handoffs.some(item => item.provider === 'Spotify' && item.url.startsWith('https://open.spotify.com/search/')));
    assert.ok(r.mediaDiscovery.handoffs.some(item => item.provider === 'Internet Archive' && item.url.startsWith('https://archive.org/search?query=')));
    assert.match(r.reply, /Harbor Light/);
    assert.match(r.reply, /YouTube|Spotify|Internet Archive|HTTPS/);
    assert.ok(r.kernel.actions.some(item => item.type === 'open-external' && /youtube\.com/.test(item.url)));
  } finally {
    globalThis.fetch = original;
  }
});

test('named local track still matches from internetOptions.localLibrary without an internet phrase', async () => {
  let called = 0;
  const original = globalThis.fetch;
  globalThis.fetch = async () => { called += 1; throw new Error('network should not run'); };
  try {
    const s = new SoulEngine({ store: new JsonStore({ dataDir: tmp() }), provider: new OfflineProvider() });
    s.setInternetOptions({
      localLibrary: [{ type: 'audio', title: 'Harbor Light', url: 'eidovara-media://harbor/' }]
    });
    const r = await s.respond('Play Harbor Light music');
    assert.equal(r.webResearch, null);
    assert.equal(called, 0);
    assert.ok(r.mediaDiscovery.local.some(item => item.title === 'Harbor Light' && item.url === 'eidovara-media://harbor/'));
    assert.match(r.reply, /Harbor Light/);
  } finally {
    globalThis.fetch = original;
  }
});

test('YouTube and Spotify stay constructed search URLs; HTML is not fetched', async () => {
  let called = 0;
  await assert.rejects(
    () => fetchPublicPage('https://www.youtube.com/results?search_query=Saturn', {
      fetchImpl: async () => { called += 1; throw new Error('must not fetch YouTube HTML'); }
    }),
    /official browser searches|does not fetch their HTML/i
  );
  await assert.rejects(
    () => fetchPublicPage('https://open.spotify.com/search/Saturn', {
      fetchImpl: async () => { called += 1; throw new Error('must not fetch Spotify HTML'); }
    }),
    /official browser searches|does not fetch their HTML/i
  );
  assert.equal(called, 0);
  assert.equal(isHandoffOnlyHost('https://www.youtube.com/results?search_query=Saturn'), true);
  assert.equal(isHandoffOnlyHost('https://open.spotify.com/search/Saturn'), true);
  assert.equal(isHandoffOnlyHost('https://archive.org/details/x'), false);
  const chips = officialSearchHandoffs('Saturn');
  assert.deepEqual(chips.map(item => item.provider), ['YouTube', 'Spotify', 'Internet Archive']);
  const seen = [];
  const original = globalThis.fetch;
  globalThis.fetch = wikiAndArchiveFetch(seen);
  try {
    const r = await researchInternet('Search the internet for https://open.spotify.com/search/Saturn and Saturn');
    assert.equal(seen.some(url => /spotify\.com|youtube\.com/i.test(url)), false);
    assert.ok(r.handoffs.some(item => item.url === 'https://open.spotify.com/search/Saturn' || /open\.spotify\.com\/search/.test(item.url)));
  } finally {
    globalThis.fetch = original;
  }
});

test('source files do not inject into Spotify or other vendors’ players', () => {
  const files = [
    'src/core/entertainment.js',
    'src/core/engine.js',
    'src/providers/internet.js',
    'src/electron/main.js',
    'src/renderer/renderer.js',
    'src/renderer/companion.js'
  ];
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(src, /spotify\.exe|Spotify\.exe|iTunes\.exe|wmplayer\.exe|vlc\.exe/i);
    assert.doesNotMatch(src, /inject(?:ion)? into (?:spotify|itunes|vlc|windows media)/i);
    assert.doesNotMatch(src, /child_process[\s\S]{0,80}spotify/i);
  }
  const discovery = discoverMedia('Find music', {
    localLibrary: [{ type: 'audio', title: 'Local Mix', url: 'eidovara-media://mix/' }]
  });
  assert.match(discovery.context, /not Spotify\/iTunes\/VLC\/Windows Media Player injection/i);
  assert.equal(discovery.local[0].playable, true);
});

test('entertainment view and companion surface library, Archive chip, and listLocalMedia', () => {
  const html = fs.readFileSync('src/renderer/index.html', 'utf8');
  const renderer = fs.readFileSync('src/renderer/renderer.js', 'utf8');
  const companion = fs.readFileSync('src/renderer/companion.js', 'utf8');
  const preload = fs.readFileSync('src/electron/preload.cjs', 'utf8');
  const main = fs.readFileSync('src/electron/main.js', 'utf8');
  assert.match(html, /id="entertainmentLibrary"/);
  assert.match(html, /id="entertainmentDiscovery"/);
  assert.match(html, /id="mediaArchiveBtn"/);
  assert.match(renderer, /handoff-chip/);
  assert.match(renderer, /eidovaraRenderDiscovery/);
  assert.match(renderer, /archive\.org\/search\?query=/);
  assert.match(companion, /eidovaraRenderDiscovery/);
  assert.match(preload, /listLocalMedia:/);
  assert.match(main, /soul:listLocalMedia/);
  assert.match(main, /sessionLocalLibrary/);
  assert.match(main, /registerSessionMedia/);
  assert.doesNotMatch(html, /media-src [^"]*'self'/);
});
