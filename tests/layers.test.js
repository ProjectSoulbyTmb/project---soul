import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SoulEngine } from '../src/core/engine.js';
import { JsonStore } from '../src/core/store.js';
import { defaultProfile } from '../src/core/schema.js';
import { OfflineProvider } from '../src/providers/offline.js';
import { migrateKernel, routeKernel } from '../src/core/kernel.js';
import { classifyWorkspaceIntent } from '../src/core/workspace.js';
import { canCallAssist, requestSoulAssist } from '../src/core/soul-online.js';
import {
  CHEATSHEET_ENTRIES,
  builtinPaletteItems,
  captureScratchToMemory,
  cheatsheetEntries,
  filterPalette,
  focusRemainingMs,
  isFocusStartCommand,
  pinWidget,
  reorderWidgets,
  searchWorkspace,
  visibleWidgets
} from '../src/core/layers.js';

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'soul-layers-test-')); }
function make(dir) { return new SoulEngine({ store: new JsonStore({ dataDir: dir }), provider: new OfflineProvider() }); }

test('palette routing jumps to views, legal, settings, and enabled modules', () => {
  assert.equal(classifyWorkspaceIntent('Open the command palette'), 'palette');
  const state = defaultProfile();
  const palette = routeKernel('Open the command palette', state);
  assert.equal(palette.intent, 'palette');
  assert.equal(palette.moduleId, 'command-palette');
  assert.ok(palette.actions.some(item => item.type === 'open-palette' && item.auto === true));
  const items = builtinPaletteItems({ modules: palette.modules || undefined });
  const settings = filterPalette('settings', items);
  assert.ok(settings.some(item => item.action?.type === 'open-view' && item.action.view === 'settings'), JSON.stringify(settings.map(i => i.id)));
  const legal = filterPalette('terms', items);
  assert.ok(legal.some(item => item.action?.type === 'open-legal' && item.action.legal === 'terms'));
  const focus = filterPalette('focus session', items);
  assert.ok(focus.some(item => item.action?.type === 'start-focus' || item.id.includes('focus')));
  const help = routeKernel('keyboard shortcuts cheatsheet', state);
  assert.equal(help.intent, 'cheatsheet');
  assert.ok(help.actions.some(item => item.type === 'open-cheatsheet'));
});

test('unified local search filters apps, memories, settings labels, and knowledge intents', () => {
  const hits = searchWorkspace('memory', {
    apps: [{ id: 'notepad', name: 'Notepad', path: 'C:\\Windows\\notepad.exe' }],
    memories: [{ id: 'm1', content: 'I prefer evening memory reviews', active: true, tags: ['preference'] }]
  });
  assert.ok(hits.some(item => item.kind === 'memory' && /evening memory/.test(item.title)));
  assert.ok(hits.some(item => item.kind === 'view' && item.action?.view === 'memory'));
  const apps = searchWorkspace('notepad', {
    apps: [{ id: 'notepad', name: 'Notepad', path: 'C:\\Windows\\notepad.exe' }],
    memories: []
  });
  assert.equal(apps[0].kind, 'app');
  assert.equal(apps[0].action.type, 'confirm-launch-app');
  assert.equal(apps[0].action.appId, 'notepad');
  const settings = searchWorkspace('accessibility', { apps: [], memories: [] });
  assert.ok(settings.some(item => item.kind === 'setting' && /accessibility/i.test(item.title)));
  const knowledge = searchWorkspace('unsigned', { apps: [], memories: [] });
  assert.ok(knowledge.some(item => item.kind === 'knowledge'));
  assert.doesNotMatch(JSON.stringify(hits), /\/v1\/assist/);
});

test('widget pin order persists through kernel migrate and engine save', () => {
  const dir = tmp();
  const s = make(dir);
  s.unpinWidget('scratch');
  s.pinWidget('research');
  s.reorderWidgets(['scratch', 'research', 'focus', 'apps', 'media', 'memory', 'diagnostics']);
  const first = s.kernelStatus().workspace;
  assert.equal(first.widgets.order[0], 'scratch');
  assert.ok(first.widgets.visible.includes('research'));
  const migrated = migrateKernel({ workspace: first });
  assert.equal(migrated.workspace.widgets.order[0], 'scratch');
  const restarted = make(dir);
  const again = restarted.kernelStatus().workspace.widgets;
  assert.equal(again.order[0], 'scratch');
  assert.ok(again.visible.includes('research'));
  const state = defaultProfile();
  pinWidget(state, 'research');
  reorderWidgets(state, ['memory', 'focus']);
  assert.equal(visibleWidgets(state.kernel.workspace)[0], 'memory');
});

test('planning a focus session does not start the timer; start command does', async () => {
  const s = make(tmp());
  await s.respond('Plan a focused session for my current priority.');
  assert.equal(s.kernelStatus().workspace.focus.active, false);
  await s.respond('Start a 25 minute focus session');
  assert.equal(s.kernelStatus().workspace.focus.active, true);
  assert.match((await s.respond('Stop the focus session')).reply, /stopped/i);
  assert.equal(s.kernelStatus().workspace.focus.active, false);
});

test('focus session start/stop tracks remaining time and does not claim process control', () => {
  assert.equal(isFocusStartCommand('Start a 25 minute focus session'), true);
  assert.equal(isFocusStartCommand('Plan a focused session for my current priority.'), false);
  const dir = tmp();
  const s = make(dir);
  const startMs = Date.now() - 10 * 60 * 1000;
  const start = new Date(startMs).toISOString();
  const kernel = s.startFocusSession({ minutes: 25, label: 'Ship palette', at: start });
  assert.equal(kernel.workspace.focus.active, true);
  assert.equal(kernel.workspace.focus.durationMs, 25 * 60 * 1000);
  const remain = focusRemainingMs(kernel.workspace.focus, startMs + 10 * 60 * 1000);
  assert.equal(remain, 15 * 60 * 1000);
  const stopped = s.stopFocusSession({ at: new Date(startMs + 12 * 60 * 1000).toISOString() });
  assert.equal(stopped.workspace.focus.active, false);
  const live = s.startFocusSession({ minutes: 5, at: new Date().toISOString() });
  assert.match(JSON.stringify(s.snapshot().audit.filter(item => String(item.type || '').startsWith('workspace.focus'))), /killsOtherProcesses":false/);
  assert.equal(live.workspace.focus.quiet, true);
});

test('scratch capture writes a local memory note', () => {
  const dir = tmp();
  const s = make(dir);
  s.saveScratchpad('Ship the command palette on this PC');
  const result = s.captureScratchpad();
  assert.ok(result.memory);
  assert.match(result.memory.content, /command palette/);
  assert.equal(result.memory.kind, 'note');
  assert.equal(result.memory.source, 'scratchpad');
  assert.equal(result.kernel.workspace.scratchpad.text, '');
  const snap = s.snapshot();
  assert.ok(snap.memories.some(item => item.active && item.content.includes('command palette')));
  const st = defaultProfile();
  st.kernel.workspace = { scratchpad: { text: 'direct', updatedAt: null } };
  const mem = captureScratchToMemory(st);
  assert.equal(mem.content, 'direct');
});

test('workspace layers do not POST /v1/assist unless existing opt-in flags are set', async () => {
  assert.equal(canCallAssist({ optIn: false, serviceUrl: 'https://api.example.test' }).reason, 'opt-in-off');
  const dir = tmp();
  const s = make(dir);
  let called = 0;
  const fetchImpl = async url => {
    called += 1;
    throw new Error(`unexpected fetch ${url}`);
  };
  s.searchWorkspace('settings', { apps: [{ id: 'a', name: 'Alpha', path: 'C:\\a.exe' }] });
  s.paletteItems('legal');
  s.pinWidget('research');
  s.startFocusSession({ minutes: 10, at: new Date().toISOString() });
  s.saveScratchpad('local only');
  s.captureScratchpad();
  s.stopFocusSession();
  const blocked = await s.assistQuery('Is Eidovara 18+?', { base: 'https://api.example.test', fetchImpl });
  assert.equal(blocked.reason, 'opt-in-off');
  assert.equal(called, 0);
  s.configureKernel({ assistOptIn: true });
  s.searchWorkspace('apps');
  s.startFocusSession({ minutes: 5 });
  assert.equal(called, 0);
  const skipped = await requestSoulAssist({
    base: 'https://api.example.test',
    query: 'hello',
    optIn: false,
    fetchImpl
  });
  assert.equal(skipped.skipped, true);
  assert.equal(called, 0);
  await s.assistQuery('Is Eidovara 18+?', {
    base: 'https://api.example.test',
    fetchImpl: async (url, init) => {
      called += 1;
      assert.match(String(url), /\/v1\/assist$/);
      assert.equal(init.method, 'POST');
      const body = Buffer.from(JSON.stringify({ reply: 'Adults 18+.', soul: false }));
      return { ok: true, status: 200, headers: { get: () => String(body.length) }, arrayBuffer: async () => body };
    }
  });
  assert.equal(called, 1);
});

test('cheatsheet lists Ctrl+K, Ctrl+/, and Ctrl+A without claiming hold-to-talk unless present', () => {
  const keys = CHEATSHEET_ENTRIES.map(item => item.keys).join(' ');
  assert.match(keys, /Ctrl\+K/);
  assert.match(keys, /Ctrl\+\//);
  assert.match(keys, /Ctrl\+A/);
  const quiet = cheatsheetEntries({ voiceInput: false }).map(item => item.id);
  assert.ok(!quiet.includes('dictate'));
  const voiced = cheatsheetEntries({ voiceInput: true }).map(item => item.id);
  assert.ok(voiced.includes('dictate'));
  const html = fs.readFileSync('src/renderer/index.html', 'utf8');
  assert.match(html, /id="commandPalette"/);
  assert.match(html, /id="cheatsheetOverlay"/);
  assert.match(html, /id="focusQuietBar"/);
  assert.doesNotMatch(html, /media-src [^"]*'self'/);
  assert.match(fs.readFileSync('src/electron/preload.cjs', 'utf8'), /workspace:/);
  assert.match(fs.readFileSync('src/electron/main.js', 'utf8'), /soul:workspace/);
});
