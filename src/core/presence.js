// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/** First-party companion looks. Decorative interface chrome — not a living figure. */

export const PRESENCE_LOOKS = Object.freeze([
  { id: 'orb', title: 'Orb', kind: 'css', description: 'A compact light figure using the accent color. Decorative, not alive.' },
  { id: 'hologram', title: 'Hologram', kind: 'css', description: 'Scan-line silhouette chrome. Interface only — not a body and not a person.' },
  { id: 'ambient', title: 'Ambient', kind: 'css', description: 'A soft glow that follows the workspace accent. No implied anatomy.' },
  { id: 'pulse', title: 'Pulse', kind: 'canvas', description: 'A canvas heartbeat ring. Pauses when you prefer reduced motion.' },
  { id: 'silhouette', title: 'Silhouette', kind: 'css', description: 'A still outline. No implied life, voice, or consciousness.' },
  { id: 'local-image', title: 'Your image', kind: 'image', description: 'A picture you choose on this PC, shown through eidovara-media. Not a live model.' }
]);

const LOOK_IDS = new Set(PRESENCE_LOOKS.map(look => look.id));

export function defaultPresence() {
  return { lookId: 'orb', hasLocalImage: false };
}

export function normalizePresence(input = {}, prev = defaultPresence()) {
  const prior = { ...defaultPresence(), ...(prev && typeof prev === 'object' ? prev : {}) };
  const lookId = LOOK_IDS.has(input.lookId) ? input.lookId : (LOOK_IDS.has(prior.lookId) ? prior.lookId : 'orb');
  return {
    lookId,
    hasLocalImage: input.hasLocalImage === undefined ? Boolean(prior.hasLocalImage) : Boolean(input.hasLocalImage)
  };
}

export function presenceLook(id) {
  return PRESENCE_LOOKS.find(look => look.id === id) || PRESENCE_LOOKS[0];
}

export function presenceFrame(lookId, timeMs = 0, { reducedMotion = false } = {}) {
  const look = presenceLook(lookId);
  const frozen = Boolean(reducedMotion) || look.id === 'silhouette';
  const phase = frozen ? 0 : (Number(timeMs) / 1000) % (Math.PI * 2);
  const pulse = frozen ? 0.5 : 0.5 + 0.35 * Math.sin(phase);
  return {
    lookId: look.id,
    kind: look.kind,
    frozen,
    radius: 28 + pulse * 10,
    glow: 0.25 + pulse * 0.45,
    scanOffset: frozen ? 0 : (Number(timeMs) / 40) % 120,
    label: look.title
  };
}
