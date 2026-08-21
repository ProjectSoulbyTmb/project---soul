import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SoulEngine } from '../src/core/engine.js';
import { JsonStore } from '../src/core/store.js';
import { OfflineProvider } from '../src/providers/offline.js';
import {
  citeResearchInReply,
  HONEST_RESEARCH_COPY,
  researchInternet,
  researchOpenActions,
  sanitizeSnippet
} from '../src/providers/internet.js';
import { isExplicitInternetRequest } from '../src/core/workspace.js';

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'soul-companion-web-')); }
function make(dir, provider) {
  return new SoulEngine({ store: new JsonStore({ dataDir: dir }), provider: provider || new OfflineProvider() });
}
function hostnameOf(value) {
  try { return new URL(String(value)).hostname.toLowerCase(); } catch { return ''; }
}
function isWikipediaHost(value) {
  const host = hostnameOf(value);
  return host === 'wikipedia.org' || host.endsWith('.wikipedia.org');
}
const read = file => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

function wikiJson() {
  return {
    query: {
      pages: {
        1: {
          pageid: 1,
          index: 1,
          title: 'Saturn',
          extract: '<b>Sixth</b> planet <script>alert(1)</script> of the solar system',
          description: '<img src=x onerror=alert(1)>Gas giant',
          fullurl: 'https://en.wikipedia.org/wiki/Saturn'
        }
      }
    }
  };
}

function mockFetch(urls) {
  return async url => {
    urls.push(String(url));
    if (isWikipediaHost(url)) {
      return { ok: true, json: async () => wikiJson() };
    }
    return { ok: true, json: async () => ({ pages: [] }), text: async () => '<html></html>' };
  };
}

test('sanitizeSnippet strips markup and keeps readable text', () => {
  assert.equal(sanitizeSnippet('<b>Sixth</b> planet <script>alert(1)</script>'), 'Sixth planet');
  assert.doesNotMatch(sanitizeSnippet('<img src=x onerror=alert(1)>Gas giant'), /<|>|onerror/);
  assert.match(HONEST_RESEARCH_COPY, /not a full-internet index/i);
});

test('explicit companion/engine turn pulls sanitized titles, snippets, and hostnames', async () => {
  const urls = [];
  const original = globalThis.fetch;
  globalThis.fetch = mockFetch(urls);
  try {
    const s = make(tmp());
    const r = await s.respond('Search the internet for information about Saturn');
    assert.equal(isExplicitInternetRequest('Search the internet for information about Saturn'), true);
    assert.ok(r.webResearch);
    assert.equal(r.kernel.intent, 'research');
    assert.equal(r.kernel.webLookup, true);
    assert.equal(r.kernel.conversationsSent, false);
    const source = r.webResearch.sources[0];
    assert.equal(source.title, 'Saturn');
    assert.equal(source.hostname, 'en.wikipedia.org');
    assert.match(source.description, /Gas giant|Sixth planet/);
    assert.doesNotMatch(source.description, /<script>|<b>|onerror/i);
    assert.doesNotMatch(source.extract || '', /<script>|<b>/i);
    assert.match(r.reply, /Saturn/);
    assert.match(r.reply, /en\.wikipedia\.org/);
    assert.match(r.reply, /Gas giant|Sixth planet/);
    assert.match(r.reply, /full-internet index/i);
    assert.ok(r.kernel.actions.some(a => a.type === 'open-external' && a.url === 'https://en.wikipedia.org/wiki/Saturn' && a.auto === false));
    assert.ok(urls.some(url => isWikipediaHost(url)));
    assert.equal(urls.every(url => !url.includes('/v1/assist') && !url.includes('workers.dev')), true);
    const stored = r.state.conversations[0].messages.filter(m => m.role === 'assistant').at(-1);
    assert.ok(stored.webResearch);
    assert.ok(stored.actions.some(a => a.type === 'open-external'));
  } finally {
    globalThis.fetch = original;
  }
});

test('hello and missing internet phrases do not fetch during engine.respond', async () => {
  let called = 0;
  const original = globalThis.fetch;
  globalThis.fetch = async () => { called += 1; throw new Error('network should not run'); };
  try {
    const s = make(tmp());
    const hello = await s.respond('Hello Soul. Tell me who you are.');
    assert.equal(hello.webResearch, null);
    assert.equal(hello.kernel.intent, 'identity');
    assert.equal(await researchInternet('hello'), null);
    assert.equal(isExplicitInternetRequest('hello'), false);
    const mood = await s.respond('Find music that fits my current mood and explain why.');
    assert.equal(mood.webResearch, null);
    assert.equal(called, 0);
  } finally {
    globalThis.fetch = original;
  }
});

test('model replies without citations still get sanitized source lines', () => {
  const research = {
    query: 'Saturn',
    disclaimer: HONEST_RESEARCH_COPY,
    sources: [{
      title: 'Saturn',
      hostname: 'en.wikipedia.org',
      description: '<b>Sixth</b> planet',
      url: 'https://en.wikipedia.org/wiki/Saturn'
    }]
  };
  const cited = citeResearchInReply('Here is a short answer.', research);
  assert.match(cited, /Saturn/);
  assert.match(cited, /en\.wikipedia\.org/);
  assert.match(cited, /Sixth planet/);
  assert.doesNotMatch(cited, /<b>/);
  assert.match(cited, /full-internet index/i);
  const actions = researchOpenActions(research);
  assert.equal(actions[0].type, 'open-external');
  assert.equal(actions[0].auto, false);
  assert.equal(actions[0].hostname, 'en.wikipedia.org');
});

test('companion log renders research with textContent and confirm/openExternal chips', () => {
  const companion = read('src/renderer/companion.js');
  const renderer = read('src/renderer/renderer.js');
  const engine = read('src/core/engine.js');
  assert.match(engine, /researchInternet\(text/);
  assert.match(engine, /citeResearchInReply/);
  assert.match(companion, /companion-research-source/);
  assert.match(companion, /snip\.textContent/);
  assert.match(companion, /eidovaraOpenResearch/);
  assert.doesNotMatch(companion, /innerHTML\s*=\s*source/);
  assert.match(renderer, /noteExchange\?\.\(text, replyText, assistNote, \{ research: res\.webResearch/);
  assert.match(renderer, /window\.confirm/);
  assert.match(renderer, /openExternal/);
  assert.match(renderer, /window\.eidovaraOpenResearch\s*=\s*openResearchLink/);
  assert.match(renderer, /surface === 'companion'|surface==='companion'/);
  const respond = engine.slice(engine.indexOf('async respond'), engine.lastIndexOf('return {'));
  assert.doesNotMatch(respond, /assistQuery/);
  assert.doesNotMatch(read('src/renderer/index.html'), /dreambot333\.workers\.dev/);
});
