// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import { mapGamepadButtons, mapGamepadStick, nextFeelPattern, rumbleFromLevel } from '../core/adult-feel.js';
import { probeRendererEngines } from '../core/runtime-engines.js';

export function stayAwake(on, reason) {
  if (!window.soul || typeof window.soul.stayAwake !== 'function') return Promise.resolve({ active: false });
  return window.soul.stayAwake({ on: on === true, reason: String(reason || 'app').slice(0, 40) }).catch(() => ({ active: false }));
}

export function liveEngineProbe(host = globalThis) {
  return probeRendererEngines(host);
}

export function attachFeelGamepad(opts = {}) {
  let raf = 0;
  let priorButtons = {};
  let lastSave = 0;
  const reduced = Boolean(opts.reducedMotion);

  function pads() {
    try {
      if (!navigator.getGamepads) return [];
      return [...navigator.getGamepads()].filter(Boolean);
    } catch {
      return [];
    }
  }

  function rumble(level) {
    if (reduced) return;
    const effect = rumbleFromLevel(level);
    for (const pad of pads()) {
      const actuator = pad.vibrationActuator;
      if (!actuator || typeof actuator.playEffect !== 'function') continue;
      try { actuator.playEffect('dual-rumble', effect); } catch {}
    }
  }

  function tick() {
    const list = pads();
    const pad = list[0];
    if (pad && typeof opts.onPad === 'function') {
      const stick = mapGamepadStick(pad.axes, opts.getFeel ? opts.getFeel() : {});
      const buttons = mapGamepadButtons(pad.buttons, priorButtons);
      priorButtons = {};
      (pad.buttons || []).forEach((btn, i) => { priorButtons[i] = Boolean(btn && btn.pressed); });
      if (stick.moved && typeof opts.onStick === 'function') {
        const now = Date.now();
        if (now - lastSave > 280) {
          lastSave = now;
          opts.onStick(stick);
        }
      }
      if (buttons.cyclePattern && typeof opts.onPattern === 'function') {
        const feel = opts.getFeel ? opts.getFeel() : {};
        opts.onPattern(nextFeelPattern(feel.pattern));
      }
      if (buttons.toggleFloat && typeof opts.onFloat === 'function') {
        const feel = opts.getFeel ? opts.getFeel() : {};
        opts.onFloat(!(feel.float === true));
      }
      if (buttons.stopSession && typeof opts.onStop === 'function') opts.onStop();
      opts.onPad({ connected: list.length, id: pad.id || 'gamepad' });
    } else if (typeof opts.onPad === 'function') {
      opts.onPad({ connected: 0, id: '' });
    }
    raf = requestAnimationFrame(tick);
  }

  raf = requestAnimationFrame(tick);
  return {
    rumble,
    stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }
  };
}

export { probeRendererEngines };

