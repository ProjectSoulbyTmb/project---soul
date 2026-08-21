import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SoulEngine } from '../src/core/engine.js';
import { JsonStore } from '../src/core/store.js';
import { OfflineProvider } from '../src/providers/offline.js';
import {
  classifyCompanionIntent,
  soulOverlay,
  actionsForIntent
} from '../src/core/companion.js';
import { shouldUseKnowledgeReply } from '../src/core/knowledge.js';

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'eidovara-companion-')); }
function make(dir) { return new SoulEngine({ store: new JsonStore({ dataDir: dir }), provider: new OfflineProvider() }); }

test('companion routing opens workspace surfaces and keeps product facts local', () => {
  assert.equal(classifyCompanionIntent('Open Apps & Gaming'), 'apps');
  assert.equal(classifyCompanionIntent('Take me to Entertainment'), 'entertainment');
  assert.equal(classifyCompanionIntent('Open Memory'), 'memory');
  assert.equal(classifyCompanionIntent('Is Eidovara 18+?'), 'age');
  assert.equal(classifyCompanionIntent('Is the installer Authenticode-signed?'), 'unsigned');
  assert.equal(classifyCompanionIntent('Are live payments on?'), 'payments');
  assert.equal(classifyCompanionIntent('What can this workspace do?'), 'help');
  assert.equal(classifyCompanionIntent('Help me prepare my gaming or streaming setup.'), 'gaming');
  assert.equal(classifyCompanionIntent('Search the internet for current information I need.'), 'research');
  assert.equal(classifyCompanionIntent('Hello Soul. Tell me who you are.'), 'identity');
  const apps = actionsForIntent('apps');
  assert.equal(apps[0].type, 'open-view');
  assert.equal(apps[0].view, 'apps');
  assert.equal(apps[0].auto, true);
  const legal = actionsForIntent('age');
  assert.equal(legal[0].type, 'open-legal');
  assert.equal(legal[0].legal, 'age');
});

test('knowledge answers stay honest and never call fetch or /v1/assist', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async url => { throw new Error(`network forbidden: ${url}`); };
  try {
    const s = make(tmp());
    const age = await s.respond('Is Eidovara 18+?');
    assert.match(age.reply, /18/);
    assert.match(age.reply, /not independent identity/i);
    assert.equal(age.companion.localOnly, true);
    assert.equal(age.companion.network, false);
    assert.equal(age.companion.workerAssist, false);
    assert.equal(age.companion.usedKnowledge, true);
    assert.doesNotMatch(age.reply, /I am conscious|scientifically proven consciousness/i);

    const pay = await s.respond('Does Eidovara take credit cards or PCI checkout?');
    assert.match(pay.reply, /does not process payments|no live checkout/i);
    assert.equal(pay.companion.network, false);

    const hosted = await s.respond('Are conversations sent to the website helper /v1/assist?');
    assert.match(hosted.reply, /never POSTs to Worker \/v1\/assist|not sent|refuses conversation history|Conversations stay on this PC/i);
    assert.equal(hosted.companion.workerAssist, false);

    const mind = await s.respond('Are you conscious?');
    assert.match(mind.reply, /does not claim scientific consciousness|not a claim of consciousness|not bundle neural TTS/i);
    assert.equal(mind.companion.soul.sentience, false);
  } finally {
    globalThis.fetch = original;
  }
});

test('Soul overlay is honest: off until setup, never sentience', async () => {
  const s = make(tmp());
  const before = soulOverlay(s.snapshot());
  assert.equal(before.enabled, false);
  assert.match(before.label, /not Soul and is not conscious/i);
  const first = await s.respond('What is Eidovara?');
  assert.equal(first.companion.soul.enabled, false);
  s.configureSetup({ categories: ['personal'], customNeeds: 'Keep it local' });
  const after = await s.respond('What can this workspace do?');
  assert.equal(after.companion.soul.enabled, true);
  assert.equal(after.companion.soul.sentience, false);
  assert.match(after.companion.soul.label, /software self-model/i);
  assert.doesNotMatch(after.companion.soul.label, /I am alive|phenomenal consciousness is proven/i);
});

test('workspace starters still use offline Soul, not the knowledge pack', async () => {
  const s = make(tmp());
  s.configureSetup({ categories: ['studying'] });
  const r = await s.respond('Plan a focused session for my current priority.');
  assert.equal(r.companion.usedKnowledge, false);
  assert.equal(shouldUseKnowledgeReply(r.companion.intent), false);
  assert.match(r.reply, /focused session|25–50/i);
  assert.match(r.reply, /software assistant|not a person|not a claim of consciousness/i);
});

test('desktop companion and send path do not POST chat to the Worker', () => {
  const files = [
    'src/core/companion.js',
    'src/core/knowledge.js',
    'src/electron/preload.cjs'
  ].map(file => fs.readFileSync(file, 'utf8'));
  const joined = files.join('\n');
  assert.doesNotMatch(joined, /postAssistQuery|sendToService/);
  assert.doesNotMatch(fs.readFileSync('src/core/companion.js', 'utf8'), /soulOnline/);
  assert.doesNotMatch(fs.readFileSync('src/core/companion.js', 'utf8'), /method:\s*['"]POST['"]/);
  assert.match(fs.readFileSync('src/electron/main.js', 'utf8'), /soul:send[\s\S]*ensureEngine\(\)\.respond\(m/);
  assert.doesNotMatch(fs.readFileSync('src/core/service.js', 'utf8'), /serviceRequestUrl\([^)]*SERVICE_ASSIST_PATH/);
  const html = fs.readFileSync('src/renderer/index.html', 'utf8');
  assert.match(html, /id="companionPanel"/);
  assert.match(html, /id="companionForm"/);
  assert.match(html, /data-companion-nav="apps"/);
  assert.match(html, /connect-src 'none'/);
  assert.doesNotMatch(html, /media-src [^"]*'self'/);
  assert.doesNotMatch(joined, /dreambot333\.workers\.dev/);
  assert.match(fs.readFileSync('src/renderer/renderer.js', 'utf8'), /e\.key==='\/'/);
  assert.match(fs.readFileSync('src/renderer/renderer.js', 'utf8'), /surface==='companion'/);
});
