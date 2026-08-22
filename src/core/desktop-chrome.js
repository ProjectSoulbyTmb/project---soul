// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Next-layer desktop chrome for Eidovara (not a cloned brand).
 *
 * Tray stay-running, always-on-top, recents, in-app notices, local-media
 * sleep timer, pin companion, palette calculator/conversions, and Windows
 * open-at-login live here as pure helpers. Electron wires the OS bits.
 *
 * Honest limits: no Recall screenshots, no DRM rip, no VLC/Spotify/iTunes
 * process control, no global hotkeys into other apps, no lyrics dumps,
 * no live FX rates, no OS toast spam, no telemetry.
 */

export const CHROME_NOTICE_LIMIT = 20;
export const RECENTS_KINDS = Object.freeze(['app', 'media', 'memory', 'command']);
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
    trayStay: false,
    alwaysOnTop: false,
    openAtLogin: false,
    pinCompanion: false,
    notices: [],
    sleepUntil: null
  };
}

export function normalizeDesktopChrome(input = {}, prior = defaultDesktopChrome()) {
  const base = { ...prior, ...((input && typeof input === 'object') ? input : {}) };
  return {
    trayStay: base.trayStay === true,
    alwaysOnTop: base.alwaysOnTop === true,
    openAtLogin: base.openAtLogin === true,
    pinCompanion: base.pinCompanion === true,
    notices: normalizeNotices(base.notices),
    sleepUntil: typeof base.sleepUntil === 'string' && base.sleepUntil ? String(base.sleepUntil).slice(0, 40) : null
  };
}

export function normalizeNotices(list) {
  if (!Array.isArray(list)) return [];
  return list.slice(0, CHROME_NOTICE_LIMIT).map(item => ({
    id: String(item?.id || '').slice(0, 40),
    title: String(item?.title || '').slice(0, 120),
    body: String(item?.body || '').slice(0, 280),
    at: String(item?.at || '').slice(0, 40),
    kind: String(item?.kind || 'event').slice(0, 24)
  })).filter(item => item.id && item.title);
}

export function pushNotice(list, notice, { at } = {}) {
  const next = {
    id: String(notice?.id || `n-${Date.now()}`).slice(0, 40),
    title: String(notice?.title || 'Notice').slice(0, 120),
    body: String(notice?.body || '').slice(0, 280),
    at: at || notice?.at || new Date().toISOString(),
    kind: String(notice?.kind || 'event').slice(0, 24)
  };
  return [next, ...normalizeNotices(list).filter(item => item.id !== next.id)].slice(0, CHROME_NOTICE_LIMIT);
}

export function sleepDeadline(preset, { now = Date.now() } = {}) {
  const ms = SLEEP_PRESETS_MS[String(preset)] || 0;
  if (!ms) return null;
  return new Date(now + ms).toISOString();
}

export function sleepRemainingMs(until, { now = Date.now() } = {}) {
  if (!until) return 0;
  const t = Date.parse(until);
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, t - now);
}

export function sleepShouldStop(until, { now = Date.now() } = {}) {
  return Boolean(until) && sleepRemainingMs(until, { now }) <= 0;
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
  const text = String(query || '').trim().toLowerCase().replace(/Â°/g, '');
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
  const text = String(query || '').trim().replace(/Ã—/g, '*').replace(/Ã·/g, '/').replace(/,/g, '');
  if (!/^[-+*/().\s0-9]+$/.test(text) || !/\d/.test(text)) return null;
  if (!/[-+*/]/.test(text)) return null;
  try {
    const result = Function(`"use strict"; return (${text})`)();
    if (typeof result !== 'number' || !Number.isFinite(result)) return null;
    return { kind: 'calc', title: `${text.replace(/\s+/g, ' ').trim()} = ${round4(result)}`, result: round4(result) };
  } catch {
    return null;
  }
}

export function evaluatePaletteCalc(query) {
  return evaluateConversion(query) || evaluateArithmetic(query);
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

