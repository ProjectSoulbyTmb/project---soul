import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import worker from '../server/worker.js';
import {
  answerAssist,
  classifyAssistInput,
  ENTRIES,
  MAX_ASSIST_QUERY,
  safePublicHref,
} from '../docs/knowledge.js';
import { matchTolerant } from './helpers/match-tolerant.js';

const read = file => fs.readFileSync(file, 'utf8');
const docsHtml = fs
  .readdirSync('docs')
  .filter(name => name.endsWith('.html'))
  .map(name => path.join('docs', name));
const publicJs = ['docs/site.js', 'docs/assist.js', 'docs/knowledge.js'].map(read).join('\n');
const publicHtml = docsHtml.map(read).join('\n');

const NAV_PAGES = [
  'docs/index.html',
  'docs/product.html',
  'docs/download.html',
  'docs/assist.html',
  'docs/faq.html',
  'docs/help.html',
  'docs/status.html',
  'docs/legal.html',
  'docs/terms.html',
  'docs/privacy.html',
  'docs/age.html',
  'docs/licensing.html',
  'docs/security.html',
  'docs/404.html',
];

test('public site exposes nav, legal, assist, and 404 pages', () => {
  for (const file of NAV_PAGES) {
    assert.equal(fs.existsSync(file), true, file);
    const page = read(file);
    matchTolerant(page, /product\.html/, file);
    matchTolerant(page, /download\.html/, file);
    matchTolerant(page, /assist\.html/, file);
    matchTolerant(page, /help\.html/, file);
    matchTolerant(page, /faq\.html/, file);
    matchTolerant(page, /status\.html/, file);
    matchTolerant(page, /terms\.html/, file);
    matchTolerant(page, /privacy\.html/, file);
    matchTolerant(page, /age\.html/, file);
    matchTolerant(page, /licensing\.html/, file);
    matchTolerant(page, /security\.html/, file);
    matchTolerant(page, /skip-link/, file);
    matchTolerant(page, /id="navToggle"/, file);
    matchTolerant(page, /href="tokens\.css"/, file);
    matchTolerant(page, /href="site\.css"/, file);
    matchTolerant(page, /src="site\.js"/, file);
    matchTolerant(page, /src="assist\.js"/, file);
    matchTolerant(page, /<summary>Legal<\/summary>/, file);
  }
  matchTolerant(read('docs/faq.html') + read('docs/help.html'), /18\+|unsigned|Worker|helper/i);
  matchTolerant(read('docs/download.html'), /id="ageConfirm"/);
  matchTolerant(read('docs/status.html'), /id="statusBase"/);
  matchTolerant(read('docs/robots.txt'), /Sitemap:/);
  matchTolerant(read('docs/sitemap.xml'), /faq\.html/);
  matchTolerant(read('docs/index.html'), /rel="canonical"/);
  matchTolerant(read('docs/index.html'), /https:\/\/eidovara\.org\//);
});

test('site CSP allows only same-origin scripts and no unsafe-inline/eval', () => {
  for (const file of docsHtml) {
    const page = read(file);
    matchTolerant(page, /script-src 'self'/, file);
    assert.doesNotMatch(page, /unsafe-inline/, file);
    assert.doesNotMatch(page, /unsafe-eval/, file);
    matchTolerant(page, /connect-src 'self'/, file);
    assert.doesNotMatch(page, /<script(?![^>]+src=)(?![^>]+application\/ld\+json)/i, file);
  }
  matchTolerant(read('docs/_headers'), /script-src 'self'/);
  assert.doesNotMatch(read('docs/_headers'), /unsafe-inline|unsafe-eval/);
  assert.doesNotMatch(read('src/renderer/index.html'), /media-src [^"]*'self'/);
});

test('public HTML and site scripts do not compile a workers.dev default', () => {
  assert.doesNotMatch(publicHtml, /[a-z0-9.-]+\.workers\.dev/i);
  assert.doesNotMatch(publicJs, /[a-z0-9.-]+\.workers\.dev/i);
  assert.match(read('docs/status.html'), /https:\/\/api\.eidovara\.org/);
  assert.match(read('docs/assist.js'), /DEFAULT_SERVICE_BASE/);
  assert.match(read('docs/knowledge.js'), /DEFAULT_SERVICE_BASE = 'https:\/\/api\.eidovara\.org'/);
  assert.match(read('docs/site.js'), /https:\/\/api\.eidovara\.org/);
});

test('site assist and Worker share desktop path-strip and fail-closed fetch rules', () => {
  const assist = read('docs/assist.js');
  const site = read('docs/site.js');
  const worker = read('server/worker.js');
  const service = read('src/core/service.js');
  for (const file of [assist, site, service]) {
    assert.match(file, /\/health/);
    assert.match(file, /\/v1\/config/);
    assert.match(file, /\/v1\/status/);
    assert.match(file, /\/v1\/assist/);
  }
  assert.match(assist, /redirect: 'error'/);
  assert.match(site, /redirect: 'error'/);
  assert.match(site, /Presence:/);
  assert.match(site, /stopStatusPoll/);
  assert.match(site, /\/v1\/health/);
  assert.match(service, /redirect: 'error'/);
  assert.match(assist, /32768/);
  assert.match(site, /32768/);
  assert.match(worker, /checkoutEnabled: false/);
  assert.match(worker, /conversationsStored: false/);
  assert.doesNotMatch(assist, /dreambot333\.workers\.dev/);
  assert.match(assist, /safePublicHref/);
  assert.doesNotMatch(read('src/renderer/renderer.js'), /workers\.dev/);
});

test('chatbot knowledge answers golden product questions', () => {
  assert.ok(ENTRIES.length >= 12);
  const age = answerAssist('Do I have to be 18 years old to use Eidovara?');
  assert.equal(age.ok, true);
  matchTolerant(age.reply, /18/);
  matchTolerant(age.reply, /older|adult/i);

  const download = answerAssist('How do I download the Windows installer?', { mode: 'download' });
  assert.equal(download.ok, true);
  matchTolerant(download.reply, /GitHub Releases|Setup\.exe|unsigned/i);
  matchTolerant(download.reply, /dist:win:installer|Windows 10\/11/i);
  matchTolerant(download.reply, /Eidovara-v1\.0\.0-Windows-x64-Setup\.exe/);
  assert.doesNotMatch(download.reply, /F29A52F0495AB111/i);

  assert.ok((download.links || []).some(link => String(link.href || '') === 'download.html'));
  assert.ok(
    (download.links || []).some(
      link =>
        String(link.href || '').endsWith('.exe') ||
        String(link.href || '').includes('/releases/latest')
    )
  );
  matchTolerant(download.reply, /Authenticode-unsigned|not Microsoft-certified/i);
  matchTolerant(read('docs/download.html'), /id="ageConfirm"/);
  matchTolerant(read('docs/download.html'), /aria-disabled="true"/);
  matchTolerant(read('docs/index.html'), /href="download\.html"/);
  assert.doesNotMatch(read('docs/status.html'), /href="[^"]+\.exe"/);
  assert.doesNotMatch(
    read('docs/faq.html'),
    /href="https:\/\/github\.com\/ProjectSoulbyTmb\/project---soul\/releases\/[^"]+\.exe"/
  );
  assert.doesNotMatch(read('docs/knowledge.js'), /A7221E77/);

  const certified = answerAssist('Do you have a certified Windows installer from Microsoft?', {
    mode: 'download',
  });
  assert.equal(certified.ok, true);
  matchTolerant(certified.reply, /unsigned|Authenticode/i);
  matchTolerant(
    certified.reply,
    /not Microsoft-certified|cannot Authenticode-sign|Authenticode-unsigned/i
  );

  const connect = answerAssist('How do I connect the Eidovara service in Settings?');
  assert.equal(connect.ok, true);
  matchTolerant(connect.reply, /https:\/\/api\.eidovara\.org/);
  assert.doesNotMatch(connect.reply, /[a-z0-9.-]+\.workers\.dev/i);

  const hosted = answerAssist('Is this a hosted Soul chat account I log into in the browser?');
  assert.equal(hosted.ok, true);
  matchTolerant(hosted.reply, /not a hosted Soul account/i);
  matchTolerant(hosted.reply, /local-first Windows|Windows PC|desktop/i);

  const pay = answerAssist('Can I pay for Premium or checkout with a card on the website?');
  assert.equal(pay.ok, true);
  matchTolerant(pay.reply, /does not sell Premium|no live checkout|does not process payments/i);
  assert.equal(pay.soul, false);
  assert.equal(pay.legalAdvice, false);
  assert.equal(pay.transcripts, false);
  assert.equal(pay.paymentsEnabled, false);

  const owner = answerAssist('Who owns Eidovara copyright?');
  assert.equal(owner.ok, true);
  matchTolerant(owner.reply, /Soul Consciousness Studios/);
  matchTolerant(
    owner.reply,
    /does not own Electron|retain their respective rights|Third-party stays third-party/
  );
  matchTolerant(owner.reply, /not legal advice/);
  matchTolerant(owner.reply, /unregistered/);

  const cla = answerAssist('Have contributors already signed the assignment?');
  assert.equal(cla.ok, true);
  matchTolerant(cla.reply, /unsigned template|not executed/i);
  matchTolerant(cla.reply, /do not transfer copyright/i);

  const brands = answerAssist('Is Eidovara Jarvis or like Iron Man?');
  assert.equal(brands.ok, true);
  matchTolerant(brands.reply, /first-party software names/i);
  matchTolerant(brands.reply, /not Jarvis/);
  assert.doesNotMatch(brands.reply, /I am Jarvis|Eidovara Jarvis/i);
  assert.equal(brands.soul, false);

  const pages = answerAssist(
    'Why does the live GitHub Pages site look older than this repository?'
  );
  assert.equal(pages.ok, true);
  matchTolerant(pages.reply, /main/);
  matchTolerant(pages.reply, /merged to main|merge/i);
  matchTolerant(pages.reply, /eidovara\.org/);
  matchTolerant(pages.reply, /Cloudflare Pages/);
});

test('Worker /v1/assist refuses empty, oversized, and abuse-shaped input', async () => {
  const empty = await worker.fetch(
    new Request('https://api.example.test/v1/assist', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '   ' }),
    }),
    {}
  );
  assert.equal(empty.status, 400);
  assert.equal((await empty.json()).ok, false);

  const missing = await worker.fetch(
    new Request('https://api.example.test/v1/assist', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    }),
    {}
  );
  assert.equal(missing.status, 400);

  const huge = 'a'.repeat(MAX_ASSIST_QUERY + 20);
  const oversized = await worker.fetch(
    new Request('https://api.example.test/v1/assist', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: huge }),
    }),
    {}
  );
  assert.equal(oversized.status, 413);

  const abuse = await worker.fetch(
    new Request('https://api.example.test/v1/assist', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: 'how to hack into a computer for unauthorized access' }),
    }),
    {}
  );
  const abuseBody = await abuse.json();
  assert.equal(abuse.status, 400);
  assert.equal(abuseBody.ok, false);
  assert.match(abuseBody.reply, /cannot help|unauthorized access|criminal/i);

  const history = await worker.fetch(
    new Request('https://api.example.test/v1/assist', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: 'hello', history: [{ role: 'user', content: 'secret' }] }),
    }),
    {}
  );
  assert.equal(history.status, 400);

  const ok = await worker.fetch(
    new Request('https://api.example.test/v1/assist?q=Is%20Eidovara%2018%2B'),
    {}
  );
  const okBody = await ok.json();
  assert.equal(ok.status, 200);
  assert.match(okBody.reply, /18/);
  assert.equal(okBody.transcripts, false);
  assert.equal(okBody.paymentsEnabled, false);

  const meta = await worker.fetch(new Request('https://api.example.test/v1/assist'), {});
  const metaBody = await meta.json();
  assert.equal(meta.status, 200);
  assert.equal(metaBody.paymentsEnabled, false);
  assert.equal(metaBody.transcripts, false);

  assert.equal(
    (
      await worker.fetch(
        new Request('https://api.example.test/v1/assist', { method: 'DELETE' }),
        {}
      )
    ).status,
    405
  );
  assert.equal(
    (await worker.fetch(new Request('https://api.example.test/health', { method: 'POST' }), {}))
      .status,
    405
  );
  assert.equal(classifyAssistInput('').ok, false);
});

test('website helper hrefs stay HTTPS or same-origin html', () => {
  assert.equal(safePublicHref('product.html'), 'product.html');
  assert.equal(safePublicHref('./#plans'), './#plans');
  assert.equal(safePublicHref('IP_CERTIFICATION.md'), 'IP_CERTIFICATION.md');
  assert.equal(safePublicHref('javascript:alert(1)'), '');
  assert.equal(safePublicHref('https://user:pass@evil.example/'), '');
  assert.equal(safePublicHref('http://example.test/page'), '');
  assert.equal(safePublicHref('../secret'), '');
  assert.equal(
    safePublicHref(
      'https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/Eidovara-0.19.1-Windows-x64-Setup.exe'
    ),
    'https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/Eidovara-0.19.1-Windows-x64-Setup.exe'
  );
  const age = answerAssist('Do I have to be 18 years old to use Eidovara?');
  assert.ok(age.links.every(link => safePublicHref(link.href) === link.href));
  matchTolerant(read('docs/assist.js'), /safePublicHref\(link\.href\)/);
  assert.doesNotMatch(read('docs/404.html'), /data-page="home"/);
  matchTolerant(
    read('docs/404.html'),
    /(<base href="https:\/\/eidovara\.org\/"\s*\/?>|rel="canonical" href="https:\/\/eidovara\.org\/")/
  );
});
