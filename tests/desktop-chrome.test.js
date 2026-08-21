import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SoulEngine } from '../src/core/engine.js';
import { JsonStore } from '../src/core/store.js';
import { OfflineProvider } from '../src/providers/offline.js';
import { INSTALLER_SHA256 } from '../src/core/knowledge.js';
import {
  evaluateArithmetic,
  evaluateConversion,
  evaluatePaletteCalc,
  expireSleepIfNeeded,
  loginItemPayload,
  pushNotice,
  recentEntry,
  RECENTS_KINDS,
  sleepDeadline,
  sleepRemainingMs,
  sleepShouldStop
} from '../src/core/desktop-chrome.js';

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'soul-chrome-')); }
function make(dir) { return new SoulEngine({ store: new JsonStore({ dataDir: dir }), provider: new OfflineProvider() }); }
const read = file => fs.readFileSync(file, 'utf8');

test('now playing is local in-app only and sleep timer does not claim other-app control', () => {
  const s = make(tmp());
  const playing = s.setNowPlaying({ title: 'Harbor Light', type: 'audio', local: true, sourceUrl: '' });
  assert.equal(playing.nowPlaying.local, true);
  assert.equal(playing.nowPlaying.title, 'Harbor Light');
  const sleep = s.startSleepTimer(15);
  assert.equal(sleep.sleepTimer.active, true);
  assert.equal(sleep.sleepTimer.durationMs, 15 * 60 * 1000);
  const remain = sleepRemainingMs(sleep.sleepTimer, Date.parse(sleep.sleepTimer.startedAt) + 5 * 60 * 1000);
  assert.equal(remain, 10 * 60 * 1000);
  const st = s.snapshot();
  const expired = expireSleepIfNeeded(st, Date.parse(sleep.sleepTimer.startedAt) + 16 * 60 * 1000);
  assert.equal(expired.expired, true);
  assert.match(JSON.stringify(expired.chrome.notifications), /does not stop Spotify, VLC/);
  assert.doesNotMatch(JSON.stringify(s.snapshot()), /inject into Spotify|Windows Recall|lyrics dump/i);
});

test('in-app notifications stay on device and recents persist through kernel', () => {
  const s = make(tmp());
  s.notify({ kind: 'backup', title: 'Backup created', body: 'Stored in this Windows profile folder.' });
  s.recordPaletteUse({ id: 'view-apps', title: 'Apps & Gaming', kind: 'view' });
  const chrome = s.desktopChrome();
  assert.ok(chrome.notifications.some(item => item.title === 'Backup created'));
  assert.equal(s.kernelStatus().workspace.recents[0].id, 'view-apps');
  const html = read('src/renderer/index.html');
  const main = read('src/electron/main.js');
  assert.match(html, /id="notificationDrawer"/);
  assert.match(html, /id="nowPlayingBar"/);
  assert.match(html, /id="sleepTimerMinutes"/);
  assert.match(html, /id="alwaysOnTop"/);
  assert.match(html, /id="openAtLogin"/);
  assert.match(html, /id="recentsCard"/);
  assert.match(html, /desktop-chrome\.js/);
  assert.match(html, /12 ft in m/);
  assert.match(main, /Tray/);
  assert.match(main, /setAlwaysOnTop/);
  assert.match(main, /openAtLogin/);
  assert.match(main, /setLoginItemSettings/);
  assert.match(main, /soul:evalCalc/);
  assert.doesNotMatch(main, /globalShortcut/);
  assert.doesNotMatch(main, /workers\.dev/);
});

test('palette calculator and conversions stay local with no live FX', () => {
  const add = evaluatePaletteCalc('12 + 7');
  assert.equal(add.kind, 'calc');
  assert.equal(add.result, 19);
  const length = evaluateConversion('12 ft in m');
  assert.equal(length.unitKind, 'length');
  assert.equal(length.result, 3.6576);
  const temp = evaluateConversion('32 f to c');
  assert.equal(temp.result, 0);
  const mass = evaluateConversion('1 kg to lb');
  assert.ok(mass.result > 2.2 && mass.result < 2.3);
  assert.equal(evaluatePaletteCalc('alert(1)'), null);
  assert.equal(evaluatePaletteCalc('100 usd to eur'), null);
  assert.equal(evaluateArithmetic(''), null);
  const now = Date.parse('2026-08-21T12:00:00.000Z');
  const until = sleepDeadline('15', { now });
  assert.equal(Date.parse(until) - now, 15 * 60_000);
  assert.equal(sleepShouldStop(until, { now: now + 15 * 60_000 }), true);
  const recent = recentEntry({ id: 'app-1', title: 'Notepad', kind: 'app' }, { at: '2026-08-21T12:00:00.000Z' });
  assert.equal(recent.kind, 'app');
  assert.ok(RECENTS_KINDS.includes(recent.kind));
  assert.equal(recentEntry({ title: 'no-id' }), null);
  const notices = pushNotice([], { title: 'Focus session ended', body: 'Local timer.', kind: 'focus' });
  assert.equal(notices[0].title, 'Focus session ended');
  const win = loginItemPayload(true, { platform: 'win32' });
  assert.equal(win.supported, true);
  assert.equal(win.name, 'Eidovara');
  const linux = loginItemPayload(true, { platform: 'linux' });
  assert.equal(linux.supported, false);
  assert.equal(INSTALLER_SHA256, 'F2B0D9BB0A887294CF58A43C75DF67FA422C2120540DE03D5227A9B239D08310');
  assert.match(read('src/renderer/tokens.css'), /--eidovara-visual:\s*sleek-c180/);
  assert.equal(read('docs/tokens.css'), read('src/renderer/tokens.css'));
});

test('desktop chrome renderer and preload stay honest', () => {
  const chrome = read('src/renderer/desktop-chrome.js');
  const preload = read('src/electron/preload.cjs');
  const renderer = read('src/renderer/renderer.js');
  assert.match(preload, /evalCalc:/);
  assert.match(preload, /send: \(m, opts\)/);
  assert.match(preload, /chrome:/);
  assert.match(renderer, /eidovaraChrome/);
  assert.match(chrome, /sleepTimerMinutes/);
  assert.match(chrome, /pause\?\./);
  assert.doesNotMatch(chrome + renderer, /Spotify Web API|iTunes|VLC control/);
  assert.doesNotMatch(chrome, /globalShortcut|RegisterHotKey/);
});
