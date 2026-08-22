// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Procedural Adult Soul beds: heartbeat, breath, and a quiet drone.
 * Oscillator math only â€” not Kokoro/Piper and not imported porn audio.
 */

function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function round3(value) {
  return Math.round(clamp01(value) * 1000) / 1000;
}

export const AMBIENT_ENGINE = Object.freeze({
  id: 'eidovara-procedural-ambient',
  bundled: true,
  neuralTts: false,
  importedLibrary: false,
  note: 'Web Audio oscillators and filtered noise. Mix is local. Files you import still play through eidovara-media.'
});

export const AMBIENT_HONESTY = 'Heartbeat, breath, and drone are generated in Chromium Web Audio on this PC. They are not a bundled neural TTS pack and not a porn sound library. Import your own moans through eidovara-media if you want realistic bed audio.';

export function ambientLevels(tMs = 0, sounds = {}, feelLevel = 0) {
  const t = Math.max(0, Number(tMs) || 0) / 1000;
  const ambient = sounds && typeof sounds === 'object' ? (sounds.ambient || {}) : {};
  const mixIn = sounds && sounds.mix ? Number(sounds.mix.ambient) : 45;
  const mix = clamp01((Number.isFinite(mixIn) ? mixIn : 45) / 100);
  const muted = sounds && (sounds.mute === true);
  const heat = clamp01(feelLevel);
  const bpm = 52 + heat * 34;
  const beatPeriod = 60 / Math.max(40, bpm);
  const phase = t % beatPeriod;
  const lub = Math.exp(-((phase - 0.06) / 0.035) * ((phase - 0.06) / 0.035));
  const dub = Math.exp(-((phase - 0.2) / 0.045) * ((phase - 0.2) / 0.045));
  const master = muted ? 0 : mix;
  return {
    heartbeat: ambient.heartbeat === false ? 0 : round3(Math.max(lub, dub * 0.72) * master),
    breath: ambient.breath === false ? 0 : round3((0.42 + 0.58 * (0.5 + 0.5 * Math.sin(t * Math.PI * 0.26))) * master * 0.55),
    drone: ambient.drone === false ? 0 : round3(master * (0.18 + heat * 0.08)),
    bpm: Math.round(bpm),
    mix: Math.round(master * 100)
  };
}

