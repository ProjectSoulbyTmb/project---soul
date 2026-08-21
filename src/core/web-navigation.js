// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import { isBlockedResearchHost } from '../providers/internet.js';

export const WEB_PARTITION = 'persist:eidovara-web';
export const WEB_IDLE_URL = 'about:blank';

export function chromeUserAgent(chromeVersion) {
  const version = String(chromeVersion || '').replace(/[^\d.]/g, '') || '120.0.0.0';
  return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36`;
}

export function webGuestPreferences() {
  return {
    partition: WEB_PARTITION,
    sandbox: true,
    nodeIntegration: false,
    contextIsolation: true,
    webSecurity: true,
    allowRunningInsecureContent: false,
    spellcheck: false
  };
}

export function isPrivateOrLocalHostname(hostname) {
  const host = String(hostname || '').trim().toLowerCase().replace(/^\[|\]$/g, '');
  if (!host) return true;
  if (host.startsWith('::ffff:')) return isPrivateOrLocalHostname(host.slice(7));
  if (host === 'localhost' || host.endsWith('.localhost') || host === 'localhost.') return true;
  if (host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.lan')) return true;
  if (host === '0.0.0.0' || host === '::' || host === '::1' || host === '0:0:0:0:0:0:0:1') return true;
  if (host.includes(':') && (host.startsWith('fe80:') || host.startsWith('fc') || host.startsWith('fd'))) return true;
  if (host.includes('metadata.google') || host === 'metadata' || host.endsWith('.metadata.google.internal')) return true;
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const oct = ipv4.slice(1).map(Number);
    if (oct.some(n => n > 255)) return true;
    if (oct[0] === 0 || oct[0] === 10 || oct[0] === 127) return true;
    if (oct[0] === 169 && oct[1] === 254) return true;
    if (oct[0] === 192 && oct[1] === 168) return true;
    if (oct[0] === 172 && oct[1] >= 16 && oct[1] <= 31) return true;
    if (oct[0] === 100 && oct[1] >= 64 && oct[1] <= 127) return true;
  }
  return false;
}

export function classifyGuestNavigation(raw) {
  const text = String(raw || '').trim();
  if (!text) return { ok: false, reason: 'empty' };
  let parsed;
  try { parsed = new URL(text); } catch {
    try { parsed = new URL(`https://${text}`); } catch {
      return { ok: false, reason: 'invalid' };
    }
  }
  if (parsed.protocol === 'about:') {
    if (text === 'about:blank' || parsed.pathname === 'blank') {
      return { ok: true, url: WEB_IDLE_URL, hostname: '', blank: true };
    }
    return { ok: false, reason: 'about' };
  }
  if (parsed.protocol === 'https:') {
    if (parsed.username || parsed.password) return { ok: false, reason: 'credentials' };
    if (isPrivateOrLocalHostname(parsed.hostname) || isBlockedResearchHost(parsed)) {
      return { ok: false, reason: 'private-host' };
    }
    parsed.hash = '';
    return { ok: true, url: parsed.toString(), hostname: parsed.hostname.toLowerCase() };
  }
  if (parsed.protocol === 'http:') return { ok: false, reason: 'http' };
  if (parsed.protocol === 'file:') return { ok: false, reason: 'file' };
  if (parsed.protocol === 'javascript:' || parsed.protocol === 'data:' || parsed.protocol === 'blob:' || parsed.protocol === 'vbscript:') {
    return { ok: false, reason: 'unsafe-scheme' };
  }
  return { ok: false, reason: 'scheme' };
}

export const classifyWebNavigation = classifyGuestNavigation;

export function webNavigateAllowed(raw) {
  const nav = classifyGuestNavigation(raw);
  if (!nav.ok) return nav;
  if (nav.blank) return { ok: true, url: WEB_IDLE_URL, hostname: '', blank: true };
  return { ok: true, url: nav.url, hostname: nav.hostname };
}

export function resolveWebTarget(requestedUrl) {
  const raw = String(requestedUrl || '').trim();
  if (!raw) return { ok: true, url: WEB_IDLE_URL, hostname: '', blank: true };
  return webNavigateAllowed(raw);
}

export function shouldDestroyWorkspaceWeb({ adultAllowed = false, ageGateAccepted = true } = {}) {
  if (ageGateAccepted !== true) return { destroy: true, reason: 'age-gate' };
  if (adultAllowed === true) return { destroy: true, reason: 'adult-lock' };
  return { destroy: false, reason: '' };
}

export function webNavigationMessage(reason) {
  return {
    http: 'In-app browsing only loads HTTPS.',
    'private-host': 'Private, loopback, link-local, and metadata hosts are blocked.',
    file: 'file: URLs are blocked.',
    credentials: 'URLs with credentials are blocked.',
    empty: 'Need an HTTPS address.',
    invalid: 'That is not a usable URL.',
    about: 'Only about:blank is allowed as an idle page.',
    'unsafe-scheme': 'That URL scheme is blocked.',
    scheme: 'That URL scheme is blocked.',
    'age-gate': 'Confirm age 18+ before browsing the web.',
    'adult-lock': 'Adult Mode is on, so in-app HTTPS browsing stays closed.',
    missing: 'In-app HTTPS browsing needs WebContentsView in this Electron build.'
  }[reason] || 'That address is not allowed.';
}

export function normalizeWebBounds(input) {
  const incoming = input && typeof input === 'object' ? input : {};
  const x = Math.max(0, Math.round(Number(incoming.x) || 0));
  const y = Math.max(0, Math.round(Number(incoming.y) || 0));
  const width = Math.max(0, Math.round(Number(incoming.width) || 0));
  const height = Math.max(0, Math.round(Number(incoming.height) || 0));
  return { x, y, width, height };
}
