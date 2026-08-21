// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Local Windows-first chrome: Now Playing, media sleep timer, in-app notices,
 * palette calculator, and login-item helpers.
 *
 * Honest limits: no Recall screenshots, no DRM rip, no VLC/Spotify/iTunes
 * process control, no global hotkeys into other apps, no lyrics dumps,
 * no live FX rates, no OS toast spam, no telemetry.
 */

export const CHROME_NOTICE_LIMIT = 20;
export const RECENTS_KINDS = Object.freeze(['app', 'media', 'memory', 'command', 'view']);
export const SLEEP_MIN_MINUTES = 5;
export const SLEEP_MAX_MINUTES = 180;
export const SLEEP_DEFAULT_MINUTES = 30;
export const SLEEP_PRESETS_MS = Object.freeze({ off: 0, '15': 15 * 60_000, '30': 30 * 60_000, '60': 60 * 60_000 });

const LENGTH_TO_M = Object.freeze({
  m: 1, meter: 1, meters: 1, metre: 1, metres: 1,
  km: 1000, kilometer: 1000, kilometers: 1000,
  cm: 0.01, mm: 0.001,
  in: 0.0254, inch: 0.0254, inches: 0.0254,
  ft: 0.3048, foot: 0.3048, feet: 0.3048,
  yd: 0.9144, yard: 0.9144, yards: 0.9144,
  mi: 1609.344, mile: 1609.344, miles: 1609.344
});
const MASS_TO_KG = Object.freeze({
  kg: 1, kilogram: 1, kilograms: 1,
  g: 0.001, gram: 0.001, grams: 0.001,
  lb: 0.45359237, lbs: 0.45359237, pound: 0.45359237, pounds: 0.45359237,
  oz: 0.028349523125, ounce: 0.028349523125, ounces: 0.028349523125
});
const TEMP = Object.freeze({ c: 'c', f: 'f', k: 'k', celsius: 'c', fahrenheit: 'f', kelvin: 'k' });

export function defaultDesktopChrome() {
  return {
    nowPlaying: null,
    sleepTimer: { active: false, startedAt: null, durationMs: SLEEP_DEFAULT_MINUTES * 60 * 1000, completedAt: null },
    notifications: []
  };
}

function clampMinutes(value, fallback = SLEEP_DEFAULT_MINUTES) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(SLEEP_MIN_MINUTES, Math.min(SLEEP_MAX_MINUTES, Math.round(n)));
}

function normalizeNotifications(list) {
  const out = [];
  for (const item of Array.isArray(list) ? list : []) {
    if (!item || typeof item !== 'object') continue;
    const id = String(item.id || '').trim().slice(0, 80);
    if (!id) continue;
    out.push({
      id,
      kind: String(item.kind || 'info').slice(0, 24),
      title: String(item.title || '').trim().slice(0, 120),
      body: String(item.body || '').trim().slice(0, 280),
      at: item.at ? String(item.at).slice(0, 40) : null,
      read: item.read === true
    });
    if (out.length >= CHROME_NOTICE_LIMIT) break;
  }
  return out;
}

export function normalizeDesktopChrome(input, prev = defaultDesktopChrome()) {
  const base = defaultDesktopChrome();
  const incoming = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const prior = prev && typeof prev === 'object' ? prev : base;
  const sleepIn = incoming.sleepTimer && typeof incoming.sleepTimer === 'object' ? incoming.sleepTimer : (prior.sleepTimer || {});
  const playIn = incoming.nowPlaying && typeof incoming.nowPlaying === 'object' ? incoming.nowPlaying : prior.nowPlaying;
  return {
    nowPlaying: playIn ? {
      title: String(playIn.title || '').trim().slice(0, 160),
      kind: playIn.kind === 'video' ? 'video' : 'audio',
      local: playIn.local === true,
      sourceUrl: String(playIn.sourceUrl || '').slice(0, 500),
      startedAt: playIn.startedAt ? String(playIn.startedAt).slice(0, 40) : null,
      paused: playIn.paused === true
    } : null,
    sleepTimer: {
      active: sleepIn.active === true,
      startedAt: sleepIn.startedAt ? String(sleepIn.startedAt).slice(0, 40) : null,
      durationMs: clampMinutes((Number(sleepIn.durationMs) || 0) / 60000, SLEEP_DEFAULT_MINUTES) * 60 * 1000,
      completedAt: sleepIn.completedAt ? String(sleepIn.completedAt).slice(0, 40) : null
    },
    notifications: normalizeNotifications(incoming.notifications !== undefined ? incoming.notifications : prior.notifications)
  };
}

function ensureChrome(state) {
  state.desktopChrome = normalizeDesktopChrome(state.desktopChrome);
  return state.desktopChrome;
}

export function setNowPlaying(state, item, { at } = {}) {
  const chrome = ensureChrome(state);
  if (!item) {
    chrome.nowPlaying = null;
    return chrome;
  }
  chrome.nowPlaying = {
    title: String(item.title || 'Local media').trim().slice(0, 160),
    kind: item.type === 'video' || item.kind === 'video' ? 'video' : 'audio',
    local: item.local === true,
    sourceUrl: String(item.sourceUrl || '').slice(0, 500),
    startedAt: at || new Date().toISOString(),
    paused: item.paused === true
  };
  return chrome;
}

export function startSleepTimer(state, minutes, { at } = {}) {
  const chrome = ensureChrome(state);
  const mins = clampMinutes(minutes);
  const stamp = at || new Date().toISOString();
  chrome.sleepTimer = {
    active: true,
    startedAt: stamp,
    durationMs: mins * 60 * 1000,
    completedAt: null
  };
  return chrome.sleepTimer;
}

export function stopSleepTimer(state, { at } = {}) {
  const chrome = ensureChrome(state);
  chrome.sleepTimer.active = false;
  chrome.sleepTimer.completedAt = at || new Date().toISOString();
  return chrome.sleepTimer;
}

export function sleepRemainingMs(timer, now = Date.now()) {
  const session = timer && typeof timer === 'object' ? timer : {};
  if (session.active !== true || !session.startedAt) return 0;
  const start = Date.parse(session.startedAt);
  if (!Number.isFinite(start)) return 0;
  return Math.max(0, start + (Number(session.durationMs) || 0) - now);
}

export function sleepDeadline(preset, { now = Date.now() } = {}) {
  const ms = SLEEP_PRESETS_MS[String(preset)] || 0;
  if (!ms) return null;
  return new Date(now + ms).toISOString();
}

export function sleepShouldStop(until, { now = Date.now() } = {}) {
  if (until && typeof until === 'object') return sleepRemainingMs(until, now) <= 0 && until.active === true;
  if (!until) return false;
  const t = Date.parse(until);
  if (!Number.isFinite(t)) return false;
  return t <= now;
}

export function expireSleepIfNeeded(state, now = Date.now()) {
  const chrome = ensureChrome(state);
  if (chrome.sleepTimer.active === true && sleepRemainingMs(chrome.sleepTimer, now) <= 0) {
    chrome.sleepTimer.active = false;
    chrome.sleepTimer.completedAt = new Date(now).toISOString();
    notifyDesktop(state, {
      kind: 'sleep',
      title: 'Sleep timer finished',
      body: 'The in-app player can pause now. Eidovara does not stop Spotify, VLC, or other apps.',
      at: chrome.sleepTimer.completedAt
    });
    return { expired: true, chrome: state.desktopChrome };
  }
  return { expired: false, chrome: state.desktopChrome };
}

export function notifyDesktop(state, input = {}) {
  const chrome = ensureChrome(state);
  const stamp = input.at || new Date().toISOString();
  const id = String(input.id || `note-${stamp}-${Math.random().toString(36).slice(2, 8)}`).slice(0, 80);
  const next = {
    id,
    kind: String(input.kind || 'info').slice(0, 24),
    title: String(input.title || 'Eidovara').trim().slice(0, 120),
    body: String(input.body || '').trim().slice(0, 280),
    at: stamp,
    read: false
  };
  chrome.notifications = [next, ...chrome.notifications.filter(item => item.id !== id)].slice(0, CHROME_NOTICE_LIMIT);
  return next;
}

export function pushNotice(list, notice, { at } = {}) {
  const next = {
    id: String(notice?.id || `n-${Date.now()}`).slice(0, 40),
    title: String(notice?.title || 'Notice').slice(0, 120),
    body: String(notice?.body || '').slice(0, 280),
    at: at || notice?.at || new Date().toISOString(),
    kind: String(notice?.kind || 'event').slice(0, 24)
  };
  return [next, ...normalizeNotifications(list).filter(item => item.id !== next.id)].slice(0, CHROME_NOTICE_LIMIT);
}

export function markNotificationsRead(state) {
  const chrome = ensureChrome(state);
  chrome.notifications = chrome.notifications.map(item => ({ ...item, read: true }));
  return chrome.notifications;
}

export function desktopChromeView(chrome, now = Date.now()) {
  const layers = normalizeDesktopChrome(chrome);
  return {
    nowPlaying: layers.nowPlaying,
    sleepTimer: {
      ...layers.sleepTimer,
      remainingMs: layers.sleepTimer.active ? sleepRemainingMs(layers.sleepTimer, now) : 0
    },
    notifications: layers.notifications,
    unread: layers.notifications.filter(item => !item.read).length
  };
}

export function recentEntry(item, { at } = {}) {
  const kind = RECENTS_KINDS.includes(item?.kind) ? item.kind : 'command';
  const id = String(item?.id || '').trim().slice(0, 80);
  if (!id) return null;
  return {
    id,
    title: String(item.title || id).trim().slice(0, 120),
    kind,
    at: at || item.at || new Date().toISOString()
  };
}

export function loginItemPayload(openAtLogin, { platform = process.platform } = {}) {
  if (platform !== 'win32') {
    return { supported: false, openAtLogin: false, reason: 'windows-only' };
  }
  return {
    supported: true,
    openAtLogin: openAtLogin === true,
    name: 'Eidovara',
    openAsHidden: false
  };
}

function round4(n) {
  return Math.round(Number(n) * 10000) / 10000;
}

function convertLength(value, from, to) {
  const a = LENGTH_TO_M[from];
  const b = LENGTH_TO_M[to];
  if (!a || !b) return null;
  return round4(value * a / b);
}

function convertMass(value, from, to) {
  const a = MASS_TO_KG[from];
  const b = MASS_TO_KG[to];
  if (!a || !b) return null;
  return round4(value * a / b);
}

function convertTemp(value, from, to) {
  const a = TEMP[from];
  const b = TEMP[to];
  if (!a || !b) return null;
  let c = value;
  if (a === 'f') c = (value - 32) * 5 / 9;
  if (a === 'k') c = value - 273.15;
  let out = c;
  if (b === 'f') out = c * 9 / 5 + 32;
  if (b === 'k') out = c + 273.15;
  return round4(out);
}

export function evaluateConversion(query) {
  const text = String(query || '').trim().toLowerCase().replace(/°/g, '');
  const match = text.match(/^(-?\d+(?:\.\d+)?)\s*([a-z]+)\s+(?:in|to|as)\s+([a-z]+)$/i);
  if (!match) return null;
  const value = Number(match[1]);
  const from = match[2];
  const to = match[3];
  if (!Number.isFinite(value)) return null;
  if (LENGTH_TO_M[from] && LENGTH_TO_M[to]) {
    const result = convertLength(value, from, to);
    return result == null ? null : { kind: 'convert', title: `${value} ${from} = ${result} ${to}`, result, from, to, unitKind: 'length' };
  }
  if (MASS_TO_KG[from] && MASS_TO_KG[to]) {
    const result = convertMass(value, from, to);
    return result == null ? null : { kind: 'convert', title: `${value} ${from} = ${result} ${to}`, result, from, to, unitKind: 'mass' };
  }
  if (TEMP[from] && TEMP[to]) {
    const result = convertTemp(value, from, to);
    return result == null ? null : { kind: 'convert', title: `${value} ${from} = ${result} ${to}`, result, from, to, unitKind: 'temperature' };
  }
  return null;
}

export function evaluateArithmetic(query) {
  const text = String(query || '').trim().replace(/×/g, '*').replace(/÷/g, '/').replace(/,/g, '');
  if (!/^[-+*/().\s0-9]+$/.test(text) || !/\d/.test(text)) return null;
  if (!/[-+*/]/.test(text)) return null;
  const src = text.replace(/\s+/g, '');
  let i = 0;
  const peek = () => src[i];
  const eat = expected => { if (peek() !== expected) return false; i += 1; return true; };
  const parseNumber = () => {
    const start = i;
    while (peek() && ((peek() >= '0' && peek() <= '9') || peek() === '.')) i += 1;
    if (start === i) return null;
    const n = Number(src.slice(start, i));
    return Number.isFinite(n) ? n : null;
  };
  const parseFactor = () => {
    if (eat('+')) return parseFactor();
    if (eat('-')) {
      const v = parseFactor();
      return v == null ? null : -v;
    }
    if (eat('(')) {
      const v = parseExpr();
      if (v == null || !eat(')')) return null;
      return v;
    }
    return parseNumber();
  };
  const parseTerm = () => {
    let left = parseFactor();
    if (left == null) return null;
    while (peek() === '*' || peek() === '/') {
      const op = peek();
      i += 1;
      const right = parseFactor();
      if (right == null) return null;
      left = op === '*' ? left * right : left / right;
    }
    return left;
  };
  const parseExpr = () => {
    let left = parseTerm();
    if (left == null) return null;
    while (peek() === '+' || peek() === '-') {
      const op = peek();
      i += 1;
      const right = parseTerm();
      if (right == null) return null;
      left = op === '+' ? left + right : left - right;
    }
    return left;
  };
  const result = parseExpr();
  if (result == null || i !== src.length || !Number.isFinite(result)) return null;
  return { kind: 'calc', title: `${text.replace(/\s+/g, ' ').trim()} = ${round4(result)}`, result: round4(result) };
}

export function evaluatePaletteCalc(query) {
  return evaluateConversion(query) || evaluateArithmetic(query);
}
