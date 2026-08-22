import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  defaultDesktopChrome,
  evaluateArithmetic,
  evaluateConversion,
  evaluatePaletteCalc,
  loginItemPayload,
  normalizeDesktopChrome,
  pushNotice,
  recentEntry,
  RECENTS_KINDS,
  sleepDeadline,
  sleepRemainingMs,
  sleepShouldStop,
} from '../src/core/desktop-chrome.js';

const read = file => fs.readFileSync(file, 'utf8');

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
});

test('sleep timer remaining and recents kinds stay bounded', () => {
  const now = Date.parse('2026-08-21T12:00:00.000Z');
  const until = sleepDeadline('15', { now });
  assert.equal(sleepRemainingMs(until, { now }), 15 * 60_000);
  assert.equal(sleepShouldStop(until, { now: now + 15 * 60_000 }), true);
  assert.equal(sleepDeadline('off', { now }), null);
  const recent = recentEntry(
    { id: 'app-1', title: 'Notepad', kind: 'app' },
    { at: '2026-08-21T12:00:00.000Z' }
  );
  assert.equal(recent.kind, 'app');
  assert.ok(RECENTS_KINDS.includes(recent.kind));
  assert.equal(recentEntry({ title: 'no-id' }), null);
  const notices = pushNotice([], {
    title: 'Focus session ended',
    body: 'Local timer.',
    kind: 'focus',
  });
  assert.equal(notices[0].title, 'Focus session ended');
  const chrome = normalizeDesktopChrome({ trayStay: true, pinCompanion: 1, notices });
  assert.equal(chrome.trayStay, true);
  assert.equal(chrome.pinCompanion, false);
  assert.equal(defaultDesktopChrome().openAtLogin, false);
});

test('open-at-login payload is Windows-only via Electron settings', () => {
  const win = loginItemPayload(true, { platform: 'win32' });
  assert.equal(win.supported, true);
  assert.equal(win.openAtLogin, true);
  assert.equal(win.name, 'Eidovara');
  const linux = loginItemPayload(true, { platform: 'linux' });
  assert.equal(linux.supported, false);
  assert.equal(linux.openAtLogin, false);
});

test('desktop chrome is wired in the shipped Electron surface', () => {
  const html = read('src/renderer/index.html');
  const main = read('src/electron/main.js');
  const renderer = read('src/renderer/renderer.js');
  const chrome = read('src/renderer/desktop-chrome.js');
  const preload = read('src/electron/preload.cjs');
  assert.match(html, /id="desktopChromeForm"/);
  assert.match(html, /id="trayStayInput"/);
  assert.match(html, /id="alwaysOnTopInput"/);
  assert.match(html, /id="openAtLoginInput"/);
  assert.match(html, /id="pinCompanionInput"/);
  assert.match(html, /id="recentsCard"/);
  assert.match(html, /id="notifyDrawer"/);
  assert.match(html, /id="sleepTimerSelect"/);
  assert.match(html, /id="nowPlayingLabel"/);
  assert.match(html, /desktop-chrome\.js/);
  assert.match(html, /12 ft in m/);
  assert.match(main, /Tray/);
  assert.match(main, /setLoginItemSettings/);
  assert.match(main, /setAlwaysOnTop/);
  assert.match(main, /soul:evalCalc/);
  assert.match(main, /trayStay/);
  assert.match(preload, /evalCalc:/);
  assert.match(preload, /send: \(m, opts\)/);
  assert.match(renderer, /eidovaraChrome/);
  assert.match(chrome, /sleepTimerSelect/);
  assert.match(chrome, /pauseLocalMedia/);
  assert.doesNotMatch(html, /workers\.dev/);
  assert.doesNotMatch(html, /media-src [^"]*'self'/);
  assert.doesNotMatch(main + html + chrome, /Spotify Web API|iTunes|VLC/);
  assert.doesNotMatch(main + chrome, /globalShortcut|RegisterHotKey/);
});
