import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SoulEngine } from '../src/core/engine.js';
import { JsonStore } from '../src/core/store.js';
import { defaultProfile, CURRENT_SCHEMA_VERSION } from '../src/core/schema.js';
import { OfflineProvider } from '../src/providers/offline.js';
import { classifyWorkspaceIntent } from '../src/core/workspace.js';
import { builtinModules, validateModule } from '../src/core/modules.js';
import { createRuntimeRegistry, matchCustomAction, normalizeRegistry } from '../src/core/registry.js';
import { listInstalledVoices, normalizeVoiceSettings, speakText, FUTURE_VOICE_BACKEND } from '../src/core/voices.js';
import { PRESENCE_LOOKS, normalizePresence, presenceFrame } from '../src/core/presence.js';
import { canCallAssist, defaultSoulOnline, normalizeSoulOnline, requestSoulAssist } from '../src/core/soul-online.js';
import { routeKernel, startKernelSession, migrateKernel, applyPhrasing } from '../src/core/kernel.js';
import { defaultPhrasing } from '../src/core/registry.js';

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'soul-kernel-test-')); }
function make(dir) { return new SoulEngine({ store: new JsonStore({ dataDir: dir }), provider: new OfflineProvider() }); }
const read = file => fs.readFileSync(file, 'utf8');

test('kernel routing covers workspace surfaces and product help', () => {
  assert.equal(classifyWorkspaceIntent('Open settings'), 'settings');
  assert.equal(classifyWorkspaceIntent('What can you do'), 'help');
  assert.equal(classifyWorkspaceIntent('keyboard-first navigation please'), 'accessibility');
  assert.equal(classifyWorkspaceIntent('Help me prepare my gaming or streaming setup.'), 'gaming');
  const state = defaultProfile();
  startKernelSession(state);
  const help = routeKernel('What is Eidovara?', state);
  assert.equal(help.usedKnowledge, true);
  assert.match(help.knowledgeReply, /software self-model|not a claim of consciousness/i);
  const apps = routeKernel('Help me add a trusted Windows app from the Start Menu.', state);
  assert.equal(apps.intent, 'apps');
  assert.equal(apps.moduleId, 'workspace-apps');
  const brands = routeKernel('Are you Jarvis or Siri?', state);
  assert.equal(brands.intent, 'brands');
  assert.equal(brands.usedKnowledge, true);
  assert.match(brands.knowledgeReply, /first-party software names/i);
  assert.match(brands.knowledgeReply, /not Jarvis/);
  assert.doesNotMatch(brands.knowledgeReply, /I am Jarvis|Eidovara Jarvis/i);
});

test('feature registry toggles modules and matches custom actions', () => {
  const runtime = createRuntimeRegistry();
  assert.ok(runtime.list().length >= 10);
  const extra = runtime.register({ id: 'evening-focus', title: 'Evening focus', intents: ['focus'], commands: ['lights down'] });
  assert.equal(extra.id, 'evening-focus');
  assert.throws(() => validateModule({ id: 'Nope' }), /slug/i);
  const registry = normalizeRegistry({
    moduleEnabled: { 'workspace-research': false },
    customActions: [{ label: 'Evening', command: 'Plan a focused session for my current priority.' }]
  });
  assert.equal(registry.moduleEnabled['workspace-research'], false);
  assert.equal(runtime.enabled('workspace-research', registry), false);
  assert.equal(runtime.enabled('focus-session', registry), true);
  assert.equal(matchCustomAction('please Plan a focused session for my current priority. now', registry.customActions).label, 'Evening');
  const ids = new Set(builtinModules.map(mod => mod.id));
  assert.equal(ids.size, builtinModules.length);
});

test('voice persist uses voiceURI and honors mute against a mock speechSynthesis', () => {
  const voices = [
    { voiceURI: 'urn:os:voice:one', name: 'One', lang: 'en-US' },
    { voiceURI: 'urn:os:voice:two', name: 'Two', lang: 'de-DE' }
  ];
  const spoken = [];
  const synth = {
    getVoices: () => voices,
    cancel() { spoken.push('cancel'); },
    speak(utterance) { spoken.push(utterance); }
  };
  class FakeUtterance { constructor(text) { this.text = text; } }
  const saved = normalizeVoiceSettings({ voiceURI: 'urn:os:voice:two', rate: 1.4, pitch: 0.8, mute: true });
  assert.equal(saved.voiceURI, 'urn:os:voice:two');
  assert.equal(saved.mute, true);
  assert.deepEqual(listInstalledVoices(synth).map(v => v.voiceURI), ['urn:os:voice:one', 'urn:os:voice:two']);
  const muted = speakText(synth, 'hello', saved, { Utterance: FakeUtterance });
  assert.equal(muted.ok, false);
  assert.equal(muted.reason, 'muted');
  const spokenOut = speakText(synth, 'hello', { ...saved, mute: false }, { Utterance: FakeUtterance });
  assert.equal(spokenOut.ok, true);
  assert.equal(spoken.at(-1).voice.voiceURI, 'urn:os:voice:two');
  assert.equal(spoken.at(-1).rate, 1.4);
  assert.equal(FUTURE_VOICE_BACKEND.bundled, false);
  assert.match(FUTURE_VOICE_BACKEND.note, /does not ship a neural TTS engine/i);
});

test('presence looks stay first-party and freeze under reduced motion', () => {
  const ids = PRESENCE_LOOKS.map(look => look.id);
  for (const id of ['ambient', 'hologram', 'local-image', 'orb', 'pulse', 'silhouette', 'ribbon', 'hidden']) {
    assert.ok(ids.includes(id), id);
  }
  assert.equal(normalizePresence({ lookId: 'vrm' }).lookId, 'orb');
  assert.equal(normalizePresence({ lookId: 'hidden' }).lookId, 'hidden');
  const frame = presenceFrame('pulse', 500, { reducedMotion: true });
  assert.equal(frame.frozen, true);
  assert.equal(presenceFrame('silhouette', 9000).frozen, true);
  assert.equal(presenceFrame('hidden', 9000).frozen, true);
  assert.doesNotMatch(PRESENCE_LOOKS.map(look => look.description).join(' '), /\bis alive\b|\bis conscious\b|living person/i);
});

test('Soul-online assist is default off and never sends conversations', async () => {
  assert.equal(defaultSoulOnline().assistOptIn, false);
  assert.equal(normalizeSoulOnline({}).assistOptIn, false);
  assert.equal(canCallAssist({ optIn: false, serviceUrl: 'https://api.example.test' }).reason, 'opt-in-off');
  let called = 0;
  const skipped = await requestSoulAssist({
    base: 'https://api.example.test',
    query: 'Is Eidovara 18+?',
    optIn: false,
    fetchImpl: async () => { called += 1; throw new Error('should not fetch'); }
  });
  assert.equal(skipped.skipped, true);
  assert.equal(skipped.soul, false);
  assert.equal(skipped.conversationsSent, false);
  assert.equal(called, 0);
  const seen = [];
  const ok = await requestSoulAssist({
    base: 'https://api.example.test/v1/assist?x=1',
    query: 'Is Eidovara 18+?',
    optIn: true,
    fetchImpl: async (url, init) => {
      seen.push({ url, init });
      const body = Buffer.from(JSON.stringify({ reply: 'Adults 18+.', soul: true, history: 'nope' }));
      return {
        ok: true,
        status: 200,
        headers: { get: () => String(body.length) },
        arrayBuffer: async () => body
      };
    }
  });
  assert.equal(ok.ok, true);
  assert.equal(ok.soul, false);
  assert.equal(ok.conversationsSent, false);
  assert.equal(seen[0].url, 'https://api.example.test/v1/assist');
  assert.equal(seen[0].init.redirect, 'error');
  assert.doesNotMatch(seen[0].init.body, /history|messages|conversations/);
  const s = make(tmp());
  assert.equal(s.kernelStatus().assistOptIn, false);
  const blocked = await s.assistQuery('hello', { base: 'https://api.example.test' });
  assert.equal(blocked.reason, 'opt-in-off');
});

test('18+ snapshot stays a default profile until the engine starts after the gate', () => {
  const fresh = defaultProfile('default');
  assert.equal(fresh.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.equal(fresh.kernel.session.live, false);
  assert.equal(fresh.kernel.soulOnline.assistOptIn, false);
  const s = make(tmp());
  assert.equal(s.kernelStatus().live, true);
  assert.match(read('src/electron/main.js'), /function requireAgeGate/);
  assert.match(read('src/electron/main.js'), /if \(config\.ageGateAccepted === true\) ensureEngine\(\)/);
  assert.match(read('src/electron/main.js'), /acceptAgeGate[\s\S]*ensureEngine\(\)/);
  assert.match(read('src/electron/main.js'), /from '\.\.\/core\/engine\.js'/);
  assert.match(read('src/electron/main.js'), /function publicServiceUrl/);
  assert.doesNotMatch(read('src/electron/main.js'), /from '\.\.\/core\/ensureEngine\(\)\.js'/);
});

test('disabled research module skips the internet path', async () => {
  const s = make(tmp());
  s.configureKernel({ moduleEnabled: { 'workspace-research': false } });
  const r = await s.respond('Search the internet for current information I need.');
  assert.match(r.reply, /workspace-research|turned off/i);
  assert.equal(r.webResearch, null);
  assert.equal(r.kernel.enabled, false);
});

test('no workers.dev host is compiled into the desktop kernel', () => {
  const files = [
    'src/electron/main.js',
    'src/renderer/renderer.js',
    'src/renderer/companion.js',
    'src/renderer/workspace-layers.js',
    'src/core/kernel.js',
    'src/core/soul-online.js',
    'src/core/service.js',
    'src/providers/internet.js'
  ];
  for (const file of files) {
    assert.doesNotMatch(read(file), /dreambot333\.workers\.dev/);
  }
  assert.doesNotMatch(read('src/electron/main.js'), /workers\.dev/);
  assert.match(read('src/renderer/index.html'), /placeholder="https:\/\/api\.eidovara\.org"/);
  assert.doesNotMatch(read('src/renderer/index.html'), /media-src [^"]*'self'/);
  assert.match(read('src/renderer/index.html'), /img-src 'self' data: https: eidovara-media:/);
  assert.match(read('src/renderer/index.html'), /media-src https: eidovara-media:/);
  assert.match(read('src/electron/preload.cjs'), /assistQuery:/);
  assert.match(read('src/core/modules.js'), /To add a module/);
  const html = read('src/renderer/index.html');
  assert.match(html, /id="soulDock"/);
  assert.match(html, /id="commandPalette"/);
  assert.match(html, /id="shortcutSheet"/);
  assert.match(html, /id="cheatsheetOverlay"/);
  assert.match(html, /id="focusQuietBar"/);
  assert.match(html, /id="kernelCustomizeForm"/);
  assert.match(html, /id="assistOptIn"/);
  assert.match(html, /id="companionForm"/);
  assert.match(html, /id="companionInput"/);
  assert.match(html, /id="companionTalkBtn"/);
  assert.match(html, /id="dashboardQuick"/);
  assert.match(html, /id="researchView"/);
  assert.match(html, /id="researchForm"/);
  assert.match(html, /id="companionAssistThis"/);
  const settingsOpen = html.lastIndexOf('<form', html.indexOf('id="settingsForm"'));
  const settingsClose = html.indexOf('</form>', settingsOpen);
  assert.equal(html.slice(settingsOpen, settingsClose).includes('kernelCustomizeForm'), false);
  const renderer = read('src/renderer/renderer.js');
  assert.match(renderer, /function bindHoldToTalk/);
  assert.match(renderer, /pointerdown/);
  assert.match(renderer, /setView\('dashboard'\)/);
  assert.doesNotMatch(renderer, /Avatar hidden\. Save Settings/);
  assert.match(renderer, /surface === 'companion'|surface==='companion'/);
  assert.match(renderer, /system-voice preview/);
});

test('phrasing knobs change local wording only at high values and never claim sentience', async () => {
  const base = 'Local Soul is a software self-model on this device.';
  assert.equal(applyPhrasing(base, defaultPhrasing()), base);
  assert.equal(applyPhrasing(base, { wit: 40, formality: 40, brevity: 50 }), base);
  const witty = applyPhrasing(base, { wit: 90, formality: 40, brevity: 50 });
  assert.match(witty, /without pretending to be alive/);
  assert.doesNotMatch(witty, /I am conscious|I am alive|I am a person/i);
  const formal = applyPhrasing(base, { wit: 40, formality: 90, brevity: 50 });
  assert.match(formal, /not a person/i);
  const s = make(tmp());
  s.configureKernel({ phrasing: { wit: 90 } });
  const r = await s.respond('Hello Soul. Tell me who you are.');
  assert.doesNotMatch(r.reply, /I am conscious|I am alive|phenomenal consciousness is proven/i);
  assert.match(r.reply, /without pretending to be alive|software|self-model/i);
});

test('migrated profiles keep Soul-online off and a live session can start', () => {
  const migrated = defaultProfile();
  const kernel = migrateKernel({ soulOnline: { assistOptIn: 'yes' }, voice: { rate: 9 } });
  assert.equal(kernel.soulOnline.assistOptIn, true);
  assert.equal(kernel.voice.rate, 2);
  startKernelSession(migrated);
  assert.equal(migrated.kernel.session.live, true);
  assert.ok(migrated.kernel.session.heartbeatAt);
  assert.equal(migrated.kernel.session.pulseCount, 0);
});
