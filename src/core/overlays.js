// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0

export const OVERLAY_INVENTORY = Object.freeze([
  { kind: 'chat', title: 'Soul chat overlay', mode: 'local', partition: '', injectsGames: false },
  { kind: 'browse', title: 'Browse overlay', mode: 'guest', partition: 'persist:eidovara-guest', injectsGames: false },
  { kind: 'discord', title: 'Discord guest overlay', mode: 'guest', partition: 'persist:eidovara-guest-discord', injectsGames: false }
]);

export const OVERLAY_CHROME_HEIGHT = 56;
export const OVERLAY_DISCORD_CHROME_HEIGHT = 92;

const KINDS = new Set(OVERLAY_INVENTORY.map(item => item.kind));

function clamp(n, min, max, fallback) {
  const value = Number(n);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function defaultOverlayLayout() {
  return {
    chat: { x: 64, y: 64, width: 380, height: 520, alwaysOnTop: true },
    browse: { x: 120, y: 72, width: 760, height: 580, alwaysOnTop: true },
    discord: { x: 160, y: 80, width: 920, height: 640, alwaysOnTop: true }
  };
}

export function normalizeOverlayBounds(kind, input, fallback) {
  const id = KINDS.has(kind) ? kind : 'browse';
  const base = fallback && typeof fallback === 'object' ? fallback : defaultOverlayLayout()[id];
  const incoming = input && typeof input === 'object' ? input : {};
  return {
    x: clamp(incoming.x, -20000, 20000, base.x),
    y: clamp(incoming.y, -20000, 20000, base.y),
    width: clamp(incoming.width, 320, 2400, base.width),
    height: clamp(incoming.height, 240, 1800, base.height),
    alwaysOnTop: incoming.alwaysOnTop !== false
  };
}

export function normalizeOverlayLayout(input, prev = defaultOverlayLayout()) {
  const defaults = defaultOverlayLayout();
  const incoming = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const prior = prev && typeof prev === 'object' ? prev : defaults;
  const next = {};
  for (const kind of KINDS) {
    next[kind] = normalizeOverlayBounds(kind, incoming[kind] !== undefined ? incoming[kind] : prior[kind], defaults[kind]);
  }
  return next;
}

export function chromeHeightFor(kind) {
  return kind === 'discord' ? OVERLAY_DISCORD_CHROME_HEIGHT : OVERLAY_CHROME_HEIGHT;
}

export function shouldDestroyGuestOverlays({ adultAllowed = false, ageGateAccepted = true } = {}) {
  if (ageGateAccepted !== true) return { closeAll: true, closeGuests: true, reason: 'age-gate' };
  if (adultAllowed === true) return { closeAll: false, closeGuests: true, reason: 'adult-lock' };
  return { closeAll: false, closeGuests: false, reason: '' };
}

export function formatEidovaraProcessMetrics(proc = globalThis.process) {
  const cpu = proc && typeof proc.getCPUUsage === 'function' ? proc.getCPUUsage() : {};
  const mem = proc && typeof proc.memoryUsage === 'function' ? proc.memoryUsage() : {};
  return {
    source: 'eidovara-process',
    percentCPUUsage: Math.max(0, Number(cpu.percentCPUUsage) || 0),
    rssMb: Math.round((Number(mem.rss) || 0) / 1024 / 1024),
    heapUsedMb: Math.round((Number(mem.heapUsed) || 0) / 1024 / 1024),
    note: 'Eidovara process only. Does not read other games or apps.'
  };
}

export function overlayPaletteItems() {
  return [
    { id: 'cmd-overlay-chat', kind: 'command', title: 'Open chat overlay', keywords: ['soul', 'companion', 'popout', 'overlay'], action: { type: 'open-chat-overlay', label: 'Soul chat overlay' } },
    { id: 'cmd-overlay-browse', kind: 'command', title: 'Open browse overlay', keywords: ['https', 'guest', 'web', 'overlay'], action: { type: 'open-browse-overlay', label: 'Browse overlay' } },
    { id: 'cmd-overlay-discord', kind: 'command', title: 'Open Discord overlay', keywords: ['discord.com', 'guest', 'invite', 'overlay'], action: { type: 'open-discord-overlay', label: 'Discord guest overlay' } },
    { id: 'cmd-overlay-now-playing', kind: 'command', title: 'Now playing', keywords: ['media', 'eidovara-media', 'player'], action: { type: 'open-now-playing', label: 'Now playing' } },
    { id: 'cmd-always-on-top', kind: 'command', title: 'Keep Eidovara on top', keywords: ['always on top', 'pin window'], action: { type: 'set-always-on-top', on: true, label: 'Always on top' } }
  ];
}
