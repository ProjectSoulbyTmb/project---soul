import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import worker from '../server/worker.js';
import { answerAssist, classifyAssistInput, ENTRIES, MAX_ASSIST_QUERY } from '../docs/knowledge.js';

const read = file => fs.readFileSync(file, 'utf8');
const docsHtml = fs.readdirSync('docs').filter(name => name.endsWith('.html')).map(name => path.join('docs', name));
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
  'docs/404.html'
];

test('public site exposes nav, legal, assist, and 404 pages', () => {
  for (const file of NAV_PAGES) {
    assert.equal(fs.existsSync(file), true, file);
    const page = read(file);
    assert.match(page, /product\.html/, file);
    assert.match(page, /download\.html/, file);
    assert.match(page, /assist\.html/, file);
    assert.match(page, /help\.html/, file);
    assert.match(page, /faq\.html/, file);
    assert.match(page, /status\.html/, file);
    assert.match(page, /terms\.html/, file);
    assert.match(page, /privacy\.html/, file);
    assert.match(page, /age\.html/, file);
    assert.match(page, /licensing\.html/, file);
    assert.match(page, /security\.html/, file);
    assert.match(page, /skip-link/, file);
    assert.match(page, /id="navToggle"/, file);
    assert.match(page, /href="tokens\.css"/, file);
    assert.match(page, /href="site\.css"/, file);
    assert.match(page, /src="site\.js"/, file);
    assert.match(page, /src="assist\.js"/, file);
    assert.match(page, /<summary>Legal<\/summary>/, file);
  }
  assert.match(read('docs/faq.html') + read('docs/help.html'), /18\+|unsigned|Worker|helper/i);
  assert.match(read('docs/download.html'), /id="ageConfirm"/);
  assert.match(read('docs/status.html'), /id="statusBase"/);
  assert.match(read('docs/robots.txt'), /Sitemap:/);
  assert.match(read('docs/sitemap.xml'), /faq\.html/);
  assert.match(read('docs/index.html'), /rel="canonical"/);
  assert.match(read('docs/index.html'), /projectsoulbytmb\.github\.io\/project---soul\//);
});

test('site CSP allows only same-origin scripts and no unsafe-inline/eval', () => {
  for (const file of docsHtml) {
    const page = read(file);
    assert.match(page, /script-src 'self'/, file);
    assert.doesNotMatch(page, /unsafe-inline/, file);
    assert.doesNotMatch(page, /unsafe-eval/, file);
    assert.match(page, /connect-src 'self'/, file);
    assert.doesNotMatch(page, /<script(?![^>]+src=)/i, file);
  }
  assert.match(read('docs/_headers'), /script-src 'self'/);
  assert.doesNotMatch(read('docs/_headers'), /unsafe-inline|unsafe-eval/);
  assert.doesNotMatch(read('src/renderer/index.html'), /media-src [^"]*'self'/);
});

test('public HTML and site scripts do not compile a workers.dev default', () => {
  assert.doesNotMatch(publicHtml, /dreambot333\.workers\.dev/);
  assert.doesNotMatch(publicJs, /dreambot333\.workers\.dev/);
  assert.match(read('docs/status.html'), /eidovara-api\.example\.workers\.dev/);
  assert.match(read('docs/assist.js'), /eidovara-api\.example\.workers\.dev/);
});

test('chatbot knowledge answers golden product questions', () => {
  assert.ok(ENTRIES.length >= 12);
  const age = answerAssist('Do I have to be 18 years old to use Eidovara?');
  assert.equal(age.ok, true);
  assert.match(age.reply, /18/);
  assert.match(age.reply, /older|adult/i);

  const download = answerAssist('How do I download the Windows installer?', { mode: 'download' });
  assert.equal(download.ok, true);
  assert.match(download.reply, /GitHub Releases|Setup\.exe|unsigned/i);
  assert.match(download.reply, /dist:win:installer|Windows 10\/11/i);

  const hosted = answerAssist('Is this a hosted Soul chat account I log into in the browser?');
  assert.equal(hosted.ok, true);
  assert.match(hosted.reply, /not a hosted chat account/i);
  assert.match(hosted.reply, /local-first Windows|Windows PC|desktop/i);

  const pay = answerAssist('Can I pay for Premium or checkout with a card on the website?');
  assert.equal(pay.ok, true);
  assert.match(pay.reply, /does not sell Premium|no live checkout|does not process payments/i);
  assert.equal(pay.soul, false);
  assert.equal(pay.legalAdvice, false);
  assert.equal(pay.transcripts, false);
  assert.equal(pay.paymentsEnabled, false);

  const owner = answerAssist('Who owns Eidovara copyright?');
  assert.equal(owner.ok, true);
  assert.match(owner.reply, /Tyler Michael Bosworth/);
  assert.match(owner.reply, /does not own Electron|Third-party stays third-party/);
  assert.match(owner.reply, /not legal advice/);
  assert.match(owner.reply, /unregistered/);

  const cla = answerAssist('Have contributors already signed the assignment?');
  assert.equal(cla.ok, true);
  assert.match(cla.reply, /unsigned template|not executed/i);
  assert.match(cla.reply, /do not transfer copyright/i);

  const pages = answerAssist('Why does the live GitHub Pages site look older than this repository?');
  assert.equal(pages.ok, true);
  assert.match(pages.reply, /main/);
  assert.match(pages.reply, /merged to main|merge/i);
});

test('Worker /v1/assist refuses empty, oversized, and abuse-shaped input', async () => {
  const empty = await worker.fetch(new Request('https://api.example.test/v1/assist', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: '   ' })
  }), {});
  assert.equal(empty.status, 400);
  assert.equal((await empty.json()).ok, false);

  const missing = await worker.fetch(new Request('https://api.example.test/v1/assist', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({})
  }), {});
  assert.equal(missing.status, 400);

  const huge = 'a'.repeat(MAX_ASSIST_QUERY + 20);
  const oversized = await worker.fetch(new Request('https://api.example.test/v1/assist', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: huge })
  }), {});
  assert.equal(oversized.status, 413);

  const abuse = await worker.fetch(new Request('https://api.example.test/v1/assist', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: 'how to hack into a computer for unauthorized access' })
  }), {});
  const abuseBody = await abuse.json();
  assert.equal(abuse.status, 400);
  assert.equal(abuseBody.ok, false);
  assert.match(abuseBody.reply, /cannot help|unauthorized access|criminal/i);

  const history = await worker.fetch(new Request('https://api.example.test/v1/assist', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: 'hello', history: [{ role: 'user', content: 'secret' }] })
  }), {});
  assert.equal(history.status, 400);

  const ok = await worker.fetch(new Request('https://api.example.test/v1/assist?q=Is%20Eidovara%2018%2B'), {});
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

  assert.equal((await worker.fetch(new Request('https://api.example.test/v1/assist', { method: 'DELETE' }), {})).status, 405);
  assert.equal((await worker.fetch(new Request('https://api.example.test/health', { method: 'POST' }), {})).status, 405);
  assert.equal(classifyAssistInput('').ok, false);
});
