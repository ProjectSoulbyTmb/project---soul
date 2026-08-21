import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SoulEngine } from '../src/core/engine.js';
import { JsonStore } from '../src/core/store.js';
import { defaultProfile } from '../src/core/schema.js';
import { OfflineProvider } from '../src/providers/offline.js';
import { classifyWorkspaceIntent } from '../src/core/workspace.js';
import { actionsForIntent, KERNEL_ACTION_TYPES, routeKernel, suggestionsForView, soulOverlay, startKernelSession } from '../src/core/kernel.js';
import { canCallAssist, requestSoulAssist } from '../src/core/soul-online.js';
import { composeOfflineReply } from '../src/providers/offline.js';
import { buildSystemContext } from '../src/providers/context.js';

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'soul-coverage-')); }
function make(dir) { return new SoulEngine({ store: new JsonStore({ dataDir: dir }), provider: new OfflineProvider() }); }
const read = file => fs.readFileSync(file, 'utf8');

const NAV = [
  ['Open Apps & Gaming', 'apps'],
  ['Take me to Entertainment', 'entertainment'],
  ['Open Memory', 'memory'],
  ['Open identity and Adult Mode', 'identity-panel'],
  ['Open dashboard', 'dashboard'],
  ['Take me to conversation', 'conversation'],
  ['Open settings', 'settings'],
  ['Show terms', 'legal'],
  ['Configure assistant setup', 'setup'],
  ['Open service settings', 'service'],
  ['Create a backup', 'backups'],
  ['Check for updates', 'updates'],
  ['Open local media', 'local-media'],
  ['Change the accent color theme', 'theme'],
  ['What can you do here?', 'here'],
  ['forget: evening sessions', 'forget']
];

test('companion nav phrases reach every first-party workspace surface', () => {
  for (const [phrase, intent] of NAV) {
    assert.equal(classifyWorkspaceIntent(phrase), intent, phrase);
  }
  assert.equal(classifyWorkspaceIntent('Search the internet for Saturn'), 'research');
  assert.equal(classifyWorkspaceIntent('Is Eidovara 18+?'), 'general');
});

test('every advertised surface has working kernel actions the renderer handles', () => {
  const overlay = soulOverlay(defaultProfile());
  const intents = [
    'apps', 'entertainment', 'mood', 'local-media', 'memory', 'forget', 'identity', 'identity-panel',
    'settings', 'theme', 'backups', 'updates', 'service', 'status', 'setup', 'accessibility',
    'presence', 'dashboard', 'conversation', 'focus', 'study', 'create', 'talk', 'gaming',
    'research', 'here', 'hello', 'help', 'age', 'legal', 'privacy'
  ];
  for (const intent of intents) {
    const actions = actionsForIntent(intent, overlay, 'dashboard');
    assert.ok(actions.length, intent);
    for (const action of actions) {
      assert.ok(KERNEL_ACTION_TYPES.includes(action.type), `${intent} → ${action.type}`);
      assert.ok(String(action.label || '').length, `${intent} missing label`);
    }
  }
  const hereApps = suggestionsForView('apps', overlay);
  assert.ok(hereApps.some(a => a.type === 'discover-apps'));
  const hereMedia = suggestionsForView('entertainment', overlay);
  assert.ok(hereMedia.some(a => a.type === 'pick-local-media'));
  const hereSettings = suggestionsForView('settings', overlay);
  assert.ok(hereSettings.some(a => a.type === 'open-service'));
  assert.ok(hereSettings.some(a => a.type === 'open-updates'));
});

test('kernel routes companion coverage phrases and persists actions on the conversation', async () => {
  const s = make(tmp());
  const entertainment = routeKernel('Take me to Entertainment', s.snapshot());
  assert.equal(entertainment.intent, 'entertainment');
  assert.equal(entertainment.actions[0].type, 'open-view');
  assert.equal(entertainment.actions[0].view, 'entertainment');
  assert.equal(entertainment.actions[0].auto, true);
  const backups = await s.respond('Create a backup', { view: 'dashboard' });
  assert.equal(backups.kernel.intent, 'backups');
  assert.ok(backups.kernel.actions.some(a => a.panel === 'backupSection' || a.type === 'open-view'));
  const stored = backups.state.conversations[0].messages.filter(m => m.role === 'assistant').at(-1);
  assert.ok(Array.isArray(stored.actions));
  assert.ok(stored.actions.length);
  const here = await s.respond('What can you do here?', { view: 'apps' });
  assert.equal(here.kernel.intent, 'here');
  assert.ok(here.kernel.actions.some(a => a.type === 'discover-apps'));
  assert.match(here.reply, /confirm-launch|Start Menu|injection/i);
});

test('optional Soul stays honest until setup; Assist never runs without opt-in', async () => {
  const s = make(tmp());
  const overlay = soulOverlay(s.snapshot());
  assert.equal(overlay.enabled, false);
  assert.match(overlay.label, /not a mind|software/i);
  const who = await s.respond('Hello Soul. Tell me who you are.');
  assert.match(who.reply, /Eidovara/);
  assert.match(who.reply, /optional Soul setup is off|workspace kernel/i);
  assert.doesNotMatch(who.reply, /I am conscious|I am alive/i);
  const ctx = buildSystemContext(s.snapshot());
  assert.match(ctx, /Optional Soul setup is off/);
  assert.doesNotMatch(ctx, /You are Soul, the optional software self-model/);
  s.configureSetup({ categories: ['personal'] });
  const after = soulOverlay(s.snapshot());
  assert.equal(after.enabled, true);
  assert.equal(after.sentience, false);
  assert.equal(canCallAssist({ optIn: false, serviceUrl: 'https://api.eidovara.org' }).reason, 'opt-in-off');
  let called = 0;
  const skipped = await s.assistQuery('Is Eidovara 18+?', {
    base: 'https://api.example.test',
    fetchImpl: async () => { called += 1; throw new Error('should not fetch'); }
  });
  assert.equal(skipped.reason, 'opt-in-off');
  assert.equal(skipped.conversationsSent, false);
  assert.equal(called, 0);
  const blocked = await requestSoulAssist({
    base: 'https://api.example.test',
    query: 'hello',
    optIn: false,
    fetchImpl: async () => { called += 1; }
  });
  assert.equal(blocked.skipped, true);
  assert.equal(called, 0);
});

test('desktop companion chrome handles every action type and keeps one composer', () => {
  const renderer = read('src/renderer/renderer.js');
  const companion = read('src/renderer/companion.js');
  const html = read('src/renderer/index.html');
  const preload = read('src/electron/preload.cjs');
  for (const type of KERNEL_ACTION_TYPES) {
    assert.match(renderer, new RegExp(`action\\.type==='${type}'`));
  }
  assert.match(renderer, /soul\.send\(text,\s*\{\s*view:/);
  assert.doesNotMatch(renderer, /if\(stayCompanion\)\{\s*setView\('dashboard'\)/);
  assert.match(renderer, /e\.key==='\/'/);
  assert.match(renderer, /appendKernelActions/);
  assert.match(companion, /syncHistory/);
  assert.match(companion, /What can you do here/);
  assert.match(companion, /eidovaraActiveConversation/);
  assert.match(html, /id="companionFollowups"/);
  assert.match(html, /id="companionForm"/);
  assert.match(html, /id="companionInput"/);
  assert.match(html, /placeholder="https:\/\/api\.eidovara\.org"/);
  assert.doesNotMatch(html, /workers\.dev/);
  assert.doesNotMatch(html, /media-src [^"]*'self'/);
  assert.match(preload, /send: \(m, opts\)/);
  assert.match(read('src/electron/main.js'), /respond\(m, opts/);
});

test('local-media and service copy stay inside constraints', () => {
  const st = defaultProfile();
  startKernelSession(st);
  const media = composeOfflineReply({ input: 'Open local media', state: st, intent: 'local-media' });
  assert.match(media, /eidovara-media/);
  assert.doesNotMatch(media, /workers\.dev/);
  const service = composeOfflineReply({ input: 'Open service settings', state: st, intent: 'service' });
  assert.match(service, /api\.eidovara\.org/);
  assert.match(service, /Assist is not Soul/i);
  assert.doesNotMatch(service, /I am alive|conscious being/i);
});
