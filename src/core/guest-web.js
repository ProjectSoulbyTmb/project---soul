// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import { isBlockedResearchHost, publicHttpsUrl } from '../providers/internet.js';

export const GUEST_PARTITION = 'persist:eidovara-guest';
export const GUEST_COPY = 'Web guest loads HTTPS pages in an isolated sandbox. The main workspace renderer stays locked. Eidovara does not rip streams or inject into other apps.';

export function webGuestCapability(value) {
  return value === 'enabled' ? 'enabled' : 'disabled';
}

export function isWebGuestEnabled(stateOrCaps) {
  const caps = stateOrCaps?.assistant?.capabilities || stateOrCaps || {};
  return caps.webGuest === 'enabled';
}

export function classifyGuestUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return { ok: false, reason: 'empty' };
  let parsed;
  try { parsed = new URL(raw); } catch { return { ok: false, reason: 'invalid-url' }; }
  if (parsed.protocol === 'http:') return { ok: false, reason: 'http-only' };
  if (parsed.protocol !== 'https:') return { ok: false, reason: 'https-only' };
  if (parsed.username || parsed.password) return { ok: false, reason: 'credentials' };
  if (isBlockedResearchHost(parsed)) return { ok: false, reason: 'blocked-host' };
  const href = publicHttpsUrl(parsed.toString());
  if (!href) return { ok: false, reason: 'https-only' };
  return { ok: true, url: href, hostname: new URL(href).hostname.toLowerCase() };
}
