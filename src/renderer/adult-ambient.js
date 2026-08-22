// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import { ambientLevels } from '../core/adult-ambient.js';

function makeNoiseBuffer(ctx) {
  const seconds = 2;
  const buf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * seconds)), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * 0.35;
  return buf;
}

export function createAdultAmbient(AudioContextCtor) {
  const Ctor = AudioContextCtor || globalThis.AudioContext || globalThis.webkitAudioContext;
  let ctx = null;
  let heartOsc = null;
  let heartGain = null;
  let breathSrc = null;
  let breathFilter = null;
  let breathGain = null;
  let droneOsc = null;
  let droneGain = null;
  let master = null;
  let raf = 0;
  let origin = 0;
  let sounds = { ambient: { heartbeat: true, breath: true, drone: true }, mix: { ambient: 45 }, mute: false };
  let feelLevel = 0;
  let reduced = false;

  function connected() {
    return Boolean(ctx && heartGain && breathGain && droneGain && master);
  }

  function build() {
    if (!Ctor || connected()) return connected();
    try {
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = 0.0001;
      master.connect(ctx.destination);

      heartOsc = ctx.createOscillator();
      heartOsc.type = 'sine';
      heartOsc.frequency.value = 58;
      heartGain = ctx.createGain();
      heartGain.gain.value = 0;
      heartOsc.connect(heartGain);
      heartGain.connect(master);
      heartOsc.start();

      breathSrc = ctx.createBufferSource();
      breathSrc.buffer = makeNoiseBuffer(ctx);
      breathSrc.loop = true;
      breathFilter = ctx.createBiquadFilter();
      breathFilter.type = 'lowpass';
      breathFilter.frequency.value = 780;
      breathGain = ctx.createGain();
      breathGain.gain.value = 0;
      breathSrc.connect(breathFilter);
      breathFilter.connect(breathGain);
      breathGain.connect(master);
      breathSrc.start();

      droneOsc = ctx.createOscillator();
      droneOsc.type = 'triangle';
      droneOsc.frequency.value = 72;
      droneGain = ctx.createGain();
      droneGain.gain.value = 0;
      droneOsc.connect(droneGain);
      droneGain.connect(master);
      droneOsc.start();
      origin = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      return true;
    } catch {
      ctx = null;
      return false;
    }
  }

  function tick() {
    if (!connected()) return;
    const levels = ambientLevels((typeof performance !== 'undefined' ? performance.now() : Date.now()) - origin, sounds, feelLevel);
    const hush = reduced ? 0.4 : 1;
    const now = ctx.currentTime;
    try {
      heartGain.gain.setTargetAtTime(levels.heartbeat * 0.28 * hush, now, 0.03);
      breathGain.gain.setTargetAtTime(levels.breath * 0.1 * hush, now, 0.08);
      droneGain.gain.setTargetAtTime(levels.drone * 0.07 * hush, now, 0.12);
      master.gain.setTargetAtTime(0.9, now, 0.05);
    } catch {}
    raf = (typeof requestAnimationFrame === 'function') ? requestAnimationFrame(tick) : 0;
  }

  return {
    start(nextSounds, opts = {}) {
      sounds = nextSounds && typeof nextSounds === 'object' ? nextSounds : sounds;
      reduced = opts.reducedMotion === true;
      if (!build()) return false;
      try { if (ctx.state === 'suspended') ctx.resume(); } catch {}
      if (!raf) tick();
      return true;
    },
    setSounds(nextSounds) {
      if (nextSounds && typeof nextSounds === 'object') sounds = nextSounds;
    },
    setFeelLevel(level) {
      feelLevel = Math.max(0, Math.min(1, Number(level) || 0));
    },
    stop() {
      if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
      raf = 0;
      if (!connected()) return;
      const now = ctx.currentTime;
      try {
        heartGain.gain.setTargetAtTime(0, now, 0.05);
        breathGain.gain.setTargetAtTime(0, now, 0.05);
        droneGain.gain.setTargetAtTime(0, now, 0.05);
        master.gain.setTargetAtTime(0, now, 0.08);
      } catch {}
    }
  };
}

