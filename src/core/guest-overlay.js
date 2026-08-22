// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import { isBlockedResearchHost } from '../providers/internet.js';

export const OVERLAY_KINDS = Object.freeze(['chat', 'browse', 'discord']);
export const DISCORD_HOME = 'https://discord.com/app';
export const DISCORD_LOGIN = 'https://discord.com/login';
export const GUEST_PARTITIONS = Object.freeze({
  browse: 'persist:eidovara-guest',
  discord: 'persist:eidovara-guest-discord'
});

export function chromeUserAgent(chromeVersion) {
  const version = String(chromeVersion || '').replace(/[^\d.]/g, '') || '120.0.0.0';
  return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36`;
}

export function guestWebPreferences(kind) {
  const id = normalizeOverlayKind(kind);
  return {
    partition: id && id !== 'chat' ? GUEST_PARTITIONS[id] : undefined,
    sandbox: true,
    nodeIntegration: false,
    contextIsolation: true,
    webSecurity: true,
    allowRunningInsecureContent: false,
    spellcheck: id === 'discord'
  };
}

export function overlayWindowOptions(kind) {
  const id = normalizeOverlayKind(kind);
  return {
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: id === 'chat',
    sandbox: true,
    nodeIntegration: false,
    contextIsolation: true,
    webSecurity: true,
    backgroundColor: '#00000000',
    partition: id === 'chat' ? '' : GUEST_PARTITIONS[id]
  };
}

export function normalizeOverlayKind(kind) {
  const id = String(kind || '').trim().toLowerCase();
  return OVERLAY_KINDS.includes(id) ? id : '';
}

export function isPrivateOrLocalHostname(hostname) {
  const host = String(hostname || '').trim().toLowerCase().replace(/^\[|\]$/g, '');
  if (!host) return true;
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

export function isDiscordHostname(hostname) {
  const host = String(hostname || '').trim().toLowerCase();
  if (!host) return false;
  return (
    host === 'discord.com'
    || host.endsWith('.discord.com')
    || host === 'discord.gg'
    || host.endsWith('.discord.gg')
    || host === 'discordapp.com'
    || host.endsWith('.discordapp.com')
    || host === 'discordapp.net'
    || host.endsWith('.discordapp.net')
  );
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
      return { ok: true, url: 'about:blank', hostname: '', blank: true };
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

export function resolveOverlayTarget(kind, requestedUrl) {
  const id = normalizeOverlayKind(kind);
  if (!id) return { ok: false, reason: 'kind' };
  if (id === 'chat') return { ok: true, kind: id, mode: 'local', file: 'chat-overlay.html' };
  const raw = String(requestedUrl || '').trim();
  if (id === 'discord') {
    if (!raw) return { ok: true, kind: id, mode: 'guest', url: DISCORD_HOME, hostname: 'discord.com' };
    const nav = classifyGuestNavigation(raw);
    if (!nav.ok) return { ...nav, kind: id };
    if (!isDiscordHostname(nav.hostname)) return { ok: false, reason: 'not-discord', kind: id };
    return { ok: true, kind: id, mode: 'guest', url: nav.url, hostname: nav.hostname };
  }
  if (!raw) return { ok: true, kind: id, mode: 'guest', url: '', blank: true };
  const nav = classifyGuestNavigation(raw);
  if (!nav.ok) return { ...nav, kind: id };
  return { ok: true, kind: id, mode: 'guest', url: nav.url, hostname: nav.hostname };
}

export function guestNavigateAllowed(kind, raw) {
  const id = normalizeOverlayKind(kind);
  if (id === 'chat') return { ok: false, reason: 'local-only' };
  const nav = classifyGuestNavigation(raw);
  if (!nav.ok) return { ...nav, kind: id };
  if (nav.blank) return { ok: true, kind: id, url: 'about:blank', hostname: '' };
  if (id === 'discord' && !isDiscordHostname(nav.hostname)) return { ok: false, reason: 'not-discord', kind: id };
  return { ok: true, kind: id, url: nav.url, hostname: nav.hostname };
}

export function rememberOverlayRecent(list, entry, limit = 12) {
  const url = String(entry?.url || '').slice(0, 500);
  const kind = normalizeOverlayKind(entry?.kind) || 'browse';
  if (!url.startsWith('https://')) return Array.isArray(list) ? list.slice(0, limit) : [];
  const next = [{ url, kind, title: String(entry?.title || url).slice(0, 80), at: String(entry?.at || new Date().toISOString()).slice(0, 40) }];
  for (const item of Array.isArray(list) ? list : []) {
    if (String(item?.url) === url) continue;
    next.push({
      url: String(item.url || '').slice(0, 500),
      kind: normalizeOverlayKind(item.kind) || 'browse',
      title: String(item.title || item.url || '').slice(0, 80),
      at: String(item.at || '').slice(0, 40)
    });
    if (next.length >= limit) break;
  }
  return next;
}

