// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Adult Soul life layer â€” first-party vertex animation, not VRM / Mixamo / mocap.
 *
 * After 18+ and Adult Mode, the lathe figure breathes, looks, presents, and
 * performs sexual behaviors in lockstep with guided session beats. This is
 * software posing a mesh the user built. It is not a person and it is not
 * a licensed character pack.
 */

import { SESSION_KINDS } from "./adult-soul.js";

export const FIGURE_LIFE = Object.freeze({
  backend: "eidovara-first-party-deform",
  vrm: false,
  mixamo: false,
  mocap: false,
  note: "CPU vertex deform of the first-party lathe (~8k verts at ultra). Sexual behaviors follow session beats. prefers-reduced-motion damps motion to a faint breath.",
});

export const BEHAVIOR_IDS = Object.freeze([
  "idle-breathe",
  "eye-contact",
  "hip-sway",
  "present-body",
  "slow-undulate",
  "grind",
  "stroke-pose",
  "edge-hold",
  "climax",
  "aftercare",
  "on-back-present",
  "all-fours",
  "ride",
  "worship-pose",
  "hands-free",
  "striptease",
  "chest-bounce",
  "ass-present",
  "spread",
  "kiss-lean",
]);

const BEHAVIOR_SET = new Set(BEHAVIOR_IDS);

export function normalizeBehavior(id) {
  const key = String(id || "").trim();
  return BEHAVIOR_SET.has(key) ? key : "idle-breathe";
}

/**
 * Map a guided session + beat tempo onto a sexual pose id.
 */
function unit(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return n > 1 ? Math.max(0, Math.min(1, n / 100)) : Math.max(0, Math.min(1, n));
}

export function behaviorFromSession(kind, pace = "medium", heat = 0.5) {
  const k = SESSION_KINDS.includes(kind) ? kind : "slow-burn";
  const p = pace === "stop" ? "stop" : pace === "fast" ? "fast" : pace === "slow" ? "slow" : "medium";
  const h = unit(heat, 0);
  if (k === "aftercare" || k === "pillow-talk") return k === "pillow-talk" && h > 0.4 ? "kiss-lean" : "aftercare";
  if (k === "countdown-finish") return h > 0.85 ? "climax" : p === "fast" ? "grind" : "stroke-pose";
  if (k === "edge-hold" || k === "tease-deny") return p === "stop" || h > 0.7 ? "edge-hold" : "stroke-pose";
  if (k === "stroke-guide" || k === "mutual-guide") {
    if (p === "stop") return "edge-hold";
    if (p === "fast") return k === "mutual-guide" ? "ride" : "grind";
    if (p === "slow") return "slow-undulate";
    return k === "mutual-guide" ? "grind" : "stroke-pose";
  }
  if (k === "filthy-talk") return h > 0.65 ? "grind" : "present-body";
  if (k === "worship" || k === "praise-kink") return k === "praise-kink" ? "eye-contact" : "worship-pose";
  if (k === "hands-free-audio" || k === "toy-pace") return h > 0.6 ? "hands-free" : "slow-undulate";
  if (k === "striptease") return "striptease";
  if (k === "ass-focus") return p === "fast" ? "grind" : "ass-present";
  if (k === "chest-focus") return "chest-bounce";
  if (k === "eye-lock") return "eye-contact";
  if (k === "pose-play" || k === "random-mix") return p === "fast" ? "grind" : "present-body";
  if (k === "slow-burn") {
    if (h > 0.75) return "grind";
    if (h > 0.4) return "hip-sway";
    return "eye-contact";
  }
  return "idle-breathe";
}

function paceHz(pace) {
  if (pace === "stop") return 0.15;
  if (pace === "slow") return 0.55;
  if (pace === "fast") return 1.85;
  return 1.05;
}

function clonePositions(src) {
  return new Float32Array(src);
}

/**
 * Deform a lathe mesh in place-copy. Original mesh is not mutated.
 */
export function deformAdultMesh(mesh, options = {}) {
  if (!mesh?.positions) return mesh;
  const timeMs = Number(options.timeMs) || 0;
  const t = timeMs / 1000;
  const behavior = normalizeBehavior(options.behavior);
  const pace = options.pace === "stop" || options.pace === "slow" || options.pace === "fast" ? options.pace : "medium";
  const heat = unit(options.heat, 0.45);
  const motion = options.motion && typeof options.motion === "object" ? options.motion : { breath: 0.45, sway: 0.4 };
  const reduced = Boolean(options.reducedMotion);
  const amp = reduced ? 0.12 : 1;
  const breathAmt = unit(motion.breath, 0.45) * amp;
  const swayAmt = unit(motion.sway, 0.4) * amp;
  const hz = paceHz(pace);
  const out = {
    ...mesh,
    positions: clonePositions(mesh.positions),
    normals: mesh.normals ? clonePositions(mesh.normals) : mesh.normals,
    extraYaw: 0,
    extraPitch: 0,
    extraRoll: 0,
    behavior,
  };
  const p = out.positions;
  const n = p.length / 3;
  const phase = t * Math.PI * 2;

  for (let i = 0; i < n; i++) {
    const i3 = i * 3;
    let x = p[i3];
    let y = p[i3 + 1];
    let z = p[i3 + 2];
    const yn = (y + 1.05) / 2.1;
    const radial = Math.hypot(x, z) || 0.0001;
    const ang = Math.atan2(x, z);

    const chest = yn > 0.52 && yn < 0.78;
    const belly = yn > 0.38 && yn < 0.55;
    const hips = yn > 0.22 && yn < 0.48;
    const ass = hips && z < 0;
    const thighs = yn > 0.05 && yn < 0.28;
    const groin = yn > 0.28 && yn < 0.42 && Math.abs(x) < 0.18 && z > -0.05;
    const head = yn > 0.88;

    // Always breathe.
    const breath = Math.sin(phase * 0.35) * 0.028 * breathAmt;
    if (chest) {
      x *= 1 + breath * 0.9;
      z += breath * 0.55 * (z >= 0 ? 1 : 0.35);
    }
    if (belly) z += breath * 0.22;

    const sway = Math.sin(phase * 0.42) * 0.055 * swayAmt;
    if (!head) {
      x += sway * (1 - yn * 0.45);
      z += Math.sin(phase * 0.21) * 0.012 * swayAmt;
    }

    if (behavior === "eye-contact") {
      out.extraYaw = Math.sin(phase * 0.12) * 0.08;
      if (head) {
        z += 0.02;
        y += 0.008 * Math.sin(phase * 0.5);
      }
    }

    if (behavior === "hip-sway" || behavior === "slow-undulate") {
      const w = Math.sin(phase * hz * 0.55) * (0.07 + heat * 0.05);
      if (hips || thighs) {
        x += w * (hips ? 1.15 : 0.7);
        z += Math.cos(phase * hz * 0.55) * 0.03 * (ass ? 1.3 : 0.6);
      }
      if (behavior === "slow-undulate" && chest) {
        z += Math.sin(phase * 0.7) * 0.035 * heat;
      }
    }

    if (behavior === "present-body" || behavior === "worship-pose") {
      if (chest) {
        z += 0.07 + Math.sin(phase * 0.8) * 0.02;
        y += 0.01;
      }
      if (ass) z -= 0.05;
      if (behavior === "worship-pose" && yn > 0.15 && yn < 0.5) {
        y -= 0.04;
        z += 0.04;
      }
      out.extraPitch = -0.12;
    }

    if (behavior === "grind" || behavior === "ride" || behavior === "hands-free") {
      const g = Math.sin(phase * hz) * (0.08 + heat * 0.07);
      const g2 = Math.cos(phase * hz * 2) * 0.025 * heat;
      if (hips || groin || ass) {
        z += g * (ass ? 1.25 : 0.85);
        y += Math.abs(g) * 0.035;
        x += g2 * 0.4;
      }
      if (thighs) {
        x += Math.sin(ang + phase * hz) * 0.02;
        y += g * 0.02;
      }
      if (behavior === "ride") {
        y += Math.abs(Math.sin(phase * hz)) * 0.09;
        if (chest) z += Math.sin(phase * hz) * 0.04;
      }
      if (behavior === "hands-free" && chest) {
        z += Math.sin(phase * hz * 0.5) * 0.05;
      }
      out.extraPitch = 0.06 * Math.sin(phase * hz);
    }

    if (behavior === "stroke-pose") {
      const s = Math.sin(phase * hz) * (0.055 + heat * 0.04);
      if (groin || hips) {
        z += s * 0.7;
        y += s * 0.03;
      }
      if (chest) z += Math.sin(phase * 0.9) * 0.025;
      if (head) y += Math.sin(phase * hz) * 0.012;
      out.extraPitch = 0.08;
    }

    if (behavior === "edge-hold") {
      const tremor = Math.sin(phase * 9.5) * 0.012 * heat * amp;
      const hold = Math.sin(phase * 0.4) * 0.02;
      if (hips || groin || thighs) {
        x += tremor;
        z += hold + tremor * 0.4;
        y += Math.abs(tremor) * 0.4;
      }
      if (chest) z += 0.03 + tremor * 0.3;
      out.extraPitch = 0.1;
    }

    if (behavior === "climax") {
      const burst = Math.sin(phase * 7.2) * (0.05 + heat * 0.06) * amp;
      const lift = Math.abs(Math.sin(phase * 3.6)) * 0.045;
      x += burst * (1 - yn * 0.3);
      y += lift;
      if (chest || hips) z += burst * 0.8;
      if (head) {
        y += 0.03;
        z -= 0.02;
      }
      out.extraPitch = -0.18;
      out.extraYaw = burst * 0.8;
    }

    if (behavior === "aftercare") {
      const rest = Math.sin(phase * 0.22) * 0.018 * breathAmt;
      y += rest * 0.3;
      if (head) z += 0.03;
      x *= 0.99;
      out.extraPitch = 0.16;
    }

    if (behavior === "on-back-present") {
      // Rotate the figure toward supine presentation via extra pitch + flatten hips up.
      out.extraPitch = 1.05;
      out.extraRoll = 0.04 * Math.sin(phase * 0.5);
      if (hips || ass) {
        z += 0.12;
        y += 0.06;
      }
      if (chest) z += 0.08 + Math.sin(phase * 0.7) * 0.02;
      if (thighs) {
        x *= 1.08;
        y -= 0.04;
      }
    }

    if (behavior === "all-fours") {
      out.extraPitch = 0.72;
      y -= 0.18 * (1 - yn);
      if (ass) {
        z -= 0.14;
        y += 0.08;
      }
      if (chest) {
        z += 0.1;
        y -= 0.06;
      }
      if (head) {
        y -= 0.12;
        z += 0.08;
      }
      if (hips) z += Math.sin(phase * hz) * 0.05 * heat;
    }

    if (behavior === "striptease") {
      const s = Math.sin(phase * 0.55) * 0.04;
      if (hips) x += s;
      if (chest) z += 0.05 + Math.sin(phase * 0.9) * 0.03;
      out.extraYaw = s * 0.8;
    }

    if (behavior === "chest-bounce") {
      if (chest) {
        z += 0.06 + Math.sin(phase * hz * 1.4) * (0.04 + heat * 0.04);
        y += Math.sin(phase * hz * 1.4) * 0.012;
      }
      out.extraPitch = -0.08;
    }

    if (behavior === "ass-present") {
      if (ass) {
        z -= 0.1 + Math.sin(phase * hz) * 0.04 * heat;
        y += 0.03;
      }
      if (hips) x += Math.sin(phase * 0.5) * 0.03;
      out.extraYaw = Math.PI * 0.12;
      out.extraPitch = 0.18;
    }

    if (behavior === "spread") {
      if (thighs) x += Math.sign(x || 1) * (0.05 + heat * 0.03);
      if (groin) z += 0.04;
      out.extraPitch = 0.2;
    }

    if (behavior === "kiss-lean") {
      if (head) {
        z += 0.06;
        y -= 0.02;
      }
      if (chest) z += 0.03;
      out.extraPitch = -0.22;
    }

    p[i3] = x;
    p[i3 + 1] = y;
    p[i3 + 2] = z;
  }

  // Cheap normal refresh from deformed positions (flat-ish).
  if (out.normals && mesh.indices) {
    out.normals.fill(0);
    const idx = mesh.indices;
    for (let t = 0; t < idx.length; t += 3) {
      const a = idx[t] * 3;
      const b = idx[t + 1] * 3;
      const c = idx[t + 2] * 3;
      const ax = p[a];
      const ay = p[a + 1];
      const az = p[a + 2];
      const e1x = p[b] - ax;
      const e1y = p[b + 1] - ay;
      const e1z = p[b + 2] - az;
      const e2x = p[c] - ax;
      const e2y = p[c + 1] - ay;
      const e2z = p[c + 2] - az;
      const nx = e1y * e2z - e1z * e2y;
      const ny = e1z * e2x - e1x * e2z;
      const nz = e1x * e2y - e1y * e2x;
      out.normals[a] += nx;
      out.normals[a + 1] += ny;
      out.normals[a + 2] += nz;
      out.normals[b] += nx;
      out.normals[b + 1] += ny;
      out.normals[b + 2] += nz;
      out.normals[c] += nx;
      out.normals[c + 1] += ny;
      out.normals[c + 2] += nz;
    }
    for (let i = 0; i < out.normals.length; i += 3) {
      const lx = out.normals[i];
      const ly = out.normals[i + 1];
      const lz = out.normals[i + 2];
      const len = Math.hypot(lx, ly, lz) || 1;
      out.normals[i] = lx / len;
      out.normals[i + 1] = ly / len;
      out.normals[i + 2] = lz / len;
    }
  }

  return out;
}

export function adultLifeStatus(profile) {
  const soul = profile?.adultSoul;
  const session = soul?.session;
  const kind = session?.active && session.kind ? session.kind : null;
  const pace = session?.pace || session?.beats?.[session.beatIndex]?.pace || "medium";
  const heat = session?.heat ?? session?.beats?.[session.beatIndex]?.heat ?? 0.45;
  const override = soul?.stage?.behaviorOverride;
  return {
    backend: FIGURE_LIFE.backend,
    vrm: false,
    live: Boolean(soul?.active && kind),
    behavior: override || (kind ? behaviorFromSession(kind, pace, heat) : "idle-breathe"),
    sessionKind: kind,
    pace,
    heat: unit(heat, 0.45),
  };
}

