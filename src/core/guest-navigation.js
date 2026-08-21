// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import { adultAllowed } from './policy.js';
import { isBlockedResearchHost } from '../providers/internet.js';

export const GUEST_PARTITION = 'persist:eidovara-media-guest';
export const GUEST_CHROME_PARTITION = 'persist:eidovara-media-chrome';
export const GUEST_HONEST_COPY = 'Online viewing uses a separate window. The workspace itself stays offline-to-the-web.';
export const GUEST_UA_CAVEAT = 'The guest session uses a Chrome user agent so public HTTPS pages can run as they do in a browser. Some sites still refuse Electron or require browser DRM that Eidovara does not ship.';
export const MAX_GUEST_RECENTS = 24;

const SUBRESOURCE_OK = new Set(['https:', 'wss:', 'blob:', 'data:', 'about:']);

function denied(reason, extra = {}) {
  return { allow: false, reason, url: '', ...extra };
}

function allowed(url, reason = 'https') {
  return { allow: true, reason, url };
}

export function prefersReducedMotion(flag) {
  return flag === true;
}

export function guestMotion(reducedMotion) {
  return prefersReducedMotion(reducedMotion) ? 'instant' : 'scale';
}

export function adultLockClosesGuest(state) {
  return adultAllowed(state) === true;
}

export function ageGateClosesGuest(configOrFlag) {
  if (configOrFlag === true || configOrFlag === false) return configOrFlag !== true;
  return configOrFlag?.ageGateAccepted !== true;
}

export function guestShouldClose({ adultLock = false, ageGated = false } = {}) {
  return adultLock === true || ageGated === true;
}

export function guestWebPreferences() {
  return {
    partition: GUEST_PARTITION,
    sandbox: true,
    nodeIntegration: false,
    contextIsolation: true,
    webSecurity: true,
    allowRunningInsecureContent: false,
    spellcheck: false
  };
}

export function guestChromeWebPreferences() {
  return {
    partition: GUEST_CHROME_PARTITION,
    sandbox: true,
    nodeIntegration: false,
    contextIsolation: true,
    webSecurity: true,
    allowRunningInsecureContent: false,
    spellcheck: false
  };
}

export function guestWindowOptions({ reducedMotion = false } = {}) {
  return {
    width: 960,
    height: 640,
    minWidth: 420,
    minHeight: 220,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: false,
    skipTaskbar: false,
    title: 'Eidovara',
    show: false,
    webPreferences: guestChromeWebPreferences(),
    motion: guestMotion(reducedMotion)
  };
}

export function chromeUserAgent(chromeVersion) {
  const version = String(chromeVersion || '').replace(/[^\d.]/g, '') || '120.0.0.0';
  return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36`;
}

export function classifyGuestNavigation(value, { topLevel = true } = {}) {
  const raw = String(value || '').trim();
  if (!raw) return denied('empty');
  let parsed;
  try { parsed = new URL(raw); } catch { return denied('invalid-url'); }
  const protocol = parsed.protocol.toLowerCase();
  if (protocol === 'javascript:') return denied('javascript');
  if (protocol === 'file:') return denied('file-url');
  if (protocol === 'http:') return denied('http-only');
  if (protocol === 'ws:') return denied('ws-only');
  if (protocol === 'data:') return topLevel ? denied('data') : allowed(parsed.toString(), 'data');
  if (protocol === 'blob:') return topLevel ? denied('blob') : allowed(parsed.toString(), 'blob');
  if (protocol === 'about:') {
    if (parsed.pathname === 'blank' || raw === 'about:blank') return allowed('about:blank', 'blank');
    return denied('about');
  }
  if (!topLevel && protocol === 'wss:') {
    if (isBlockedResearchHost(parsed)) return denied('blocked-host');
    return allowed(parsed.toString(), 'wss');
  }
  if (protocol !== 'https:') {
    if (!topLevel && SUBRESOURCE_OK.has(protocol)) return allowed(parsed.toString(), protocol.replace(':', ''));
    return denied('https-only');
  }
  if (parsed.username || parsed.password) return denied('credentials');
  if (isBlockedResearchHost(parsed)) return denied('blocked-host');
  return allowed(parsed.toString(), 'https');
}

export function normalizeGuestAddress(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) {
    const classified = classifyGuestNavigation(raw, { topLevel: true });
    return classified.allow ? classified.url : '';
  }
  if (/[\s]/.test(raw) || !raw.includes('.')) {
    const q = encodeURIComponent(raw.slice(0, 200));
    return `https://www.youtube.com/results?search_query=${q}`;
  }
  const classified = classifyGuestNavigation(`https://${raw}`, { topLevel: true });
  return classified.allow ? classified.url : '';
}

export function rememberGuestRecent(list, entry) {
  const url = classifyGuestNavigation(entry?.url || entry, { topLevel: true });
  if (!url.allow || url.url === 'about:blank') return Array.isArray(list) ? list.slice(0, MAX_GUEST_RECENTS) : [];
  const title = String(entry?.title || '').replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
  const next = [{ url: url.url, title: title || hostnameOf(url.url), at: entry?.at || new Date().toISOString() }];
  for (const item of Array.isArray(list) ? list : []) {
    if (item?.url === url.url) continue;
    if (classifyGuestNavigation(item.url).allow) next.push({ url: item.url, title: String(item.title || hostnameOf(item.url)).slice(0, 200), at: item.at || '' });
    if (next.length >= MAX_GUEST_RECENTS) break;
  }
  return next;
}

export function guestPermissionAllowed(permission, details = {}) {
  if (permission === 'fullscreen') return true;
  if (permission === 'clipboard-sanitized-write') return true;
  if (permission === 'media') return true;
  if (permission === 'pointerLock') return details?.isUserGesture === true;
  return false;
}

function hostnameOf(value) {
  try { return new URL(String(value || '')).hostname; } catch { return ''; }
}

export function guestCaption(url, title = '') {
  const host = hostnameOf(url);
  const label = String(title || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 120);
  if (label && host) return `${label} · ${host}`;
  return label || host || 'Online viewing';
}
