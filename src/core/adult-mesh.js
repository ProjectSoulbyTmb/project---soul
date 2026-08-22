// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * First-party Adult Soul figure mesh. Not VRM, not MakeHuman, not a scanned person.
 *
 * Highest quality is the ultra lathe (72Ã—112) plus painted face/makeup, clothing
 * pigment, fantasy silhouette tweaks, and hair volume shells. Artwork is generated
 * from the user's sliders â€” no stock character pack and no photo of a real person.
 */
import { normalizeAdultAvatar } from './adult-soul.js';
import { clothingTint, frameworkRadii } from './adult-show.js';

export const FIGURE_QUALITY = Object.freeze({
  ultra: {
    slices: 72,
    stacks: 112,
    hairShells: 3,
    hairStacks: 28,
    label: 'Ultra (highest first-party mesh)',
  },
  high: { slices: 56, stacks: 88, hairShells: 2, hairStacks: 20, label: 'High' },
  performance: { slices: 32, stacks: 48, hairShells: 1, hairStacks: 12, label: 'Performance' },
});

export const FIGURE_BACKEND = Object.freeze({
  kind: 'first-party-lathe',
  vrm: false,
  makeHuman: false,
  threeVrm: false,
  scannedPerson: false,
  maxSlices: FIGURE_QUALITY.ultra.slices,
  maxStacks: FIGURE_QUALITY.ultra.stacks,
  hair: true,
  facePaint: true,
  note: 'Highest quality is a first-party WebGL lathe with painted face, hair shells, clothing pigment, and studio lighting. Eidovara does not bundle VRM or MakeHuman.',
});

const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (e0, e1, x) => {
  const t = clamp01((x - e0) / Math.max(1e-6, e1 - e0));
  return t * t * (3 - 2 * t);
};
const mix3 = (a, b, c, t, u) => lerp(lerp(a, b, t), c, u);

export function hexRgb(hex) {
  const raw = String(hex || '#c99578').replace('#', '');
  const n = parseInt(
    raw.length === 3
      ? raw
          .split('')
          .map(ch => ch + ch)
          .join('')
      : raw.padEnd(6, '0').slice(0, 6),
    16
  );
  if (!Number.isFinite(n)) return { r: 0.79, g: 0.58, b: 0.47 };
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

function band(t, a, b) {
  return smooth(a, (a + b) / 2, t) * (1 - smooth((a + b) / 2, b, t));
}

function gauss(x, mu, sigma) {
  const d = (x - mu) / Math.max(1e-4, sigma);
  return Math.exp(-0.5 * d * d);
}

export function hairCoverage(style, length) {
  const L = clamp01((Number(length) || 50) / 100);
  const base =
    {
      pixie: 0.07,
      crop: 0.09,
      fade: 0.1,
      'shaved-sides': 0.1,
      undercut: 0.16,
      'loose-bun': 0.15,
      'curly-crown': 0.18,
      'high-tail': 0.22,
      shoulder: 0.26,
      braids: 0.34,
      'long-wave': 0.4,
      'long-straight': 0.46,
    }[style] || 0.22;
  return base * (0.55 + L * 0.75);
}

export function bodyRadii(avatar, t) {
  const f = avatar.figure;
  const p = avatar.presentation;
  const bust = (p === 'masculine' ? f.chest : f.bust) / 100;
  const chest = f.chest / 100;
  const waist = f.waist / 100;
  const hips = f.hips / 100;
  const butt = f.butt / 100;
  const thighs = f.thighs / 100;
  const shoulders = f.shoulders / 100;
  const belly = f.belly / 100;
  const groin = avatar.explicit.groin / 100;
  const nipples = avatar.explicit.nipples / 100;

  const head = 0.11 + avatar.head.faceWidth / 900;
  const neck = 0.055 + avatar.head.jaw / 2200;
  const shoulderR = 0.16 + shoulders * 0.14;
  const bustFront = 0.12 + bust * 0.16 + nipples * 0.03;
  const chestFront = 0.11 + chest * 0.08;
  const waistR = 0.09 + waist * 0.07 + belly * 0.05;
  const hipR = 0.13 + hips * 0.12;
  const buttBack = 0.12 + butt * 0.16 + avatar.explicit.assFocus / 400;
  const thighR = 0.09 + thighs * 0.09;
  const calfR = 0.055 + thighs * 0.03;
  const ankle = 0.038;
  const groinFront = 0.04 + groin * 0.05;

  const front = mix3(head, neck, shoulderR, smooth(0.0, 0.1, t), smooth(0.1, 0.18, t));
  let fR = front;
  fR = lerp(fR, p === 'masculine' ? chestFront : bustFront, band(t, 0.18, 0.34));
  fR = lerp(fR, waistR, band(t, 0.32, 0.44));
  fR = lerp(fR, hipR + groinFront, band(t, 0.42, 0.55));
  fR = lerp(fR, thighR, band(t, 0.52, 0.74));
  fR = lerp(fR, calfR, band(t, 0.72, 0.9));
  fR = lerp(fR, ankle, smooth(0.88, 1, t));

  let sR = lerp(head * 0.92, shoulderR * 1.12, smooth(0.08, 0.2, t));
  sR = lerp(sR, waistR * 0.95, band(t, 0.3, 0.44));
  sR = lerp(sR, hipR * 1.05, band(t, 0.42, 0.55));
  sR = lerp(sR, thighR * 1.02, band(t, 0.52, 0.74));
  sR = lerp(sR, calfR, band(t, 0.72, 0.9));
  sR = lerp(sR, ankle, smooth(0.88, 1, t));

  let bR = lerp(head, neck, smooth(0.0, 0.12, t));
  bR = lerp(bR, shoulderR * 0.9, band(t, 0.14, 0.24));
  bR = lerp(bR, waistR * 0.92, band(t, 0.3, 0.42));
  bR = lerp(bR, buttBack, band(t, 0.4, 0.56));
  bR = lerp(bR, thighR, band(t, 0.54, 0.74));
  bR = lerp(bR, calfR, band(t, 0.72, 0.9));
  bR = lerp(bR, ankle, smooth(0.88, 1, t));

  return { front: fR, side: sR, back: bR };
}

export function radiusAt(avatar, t, theta) {
  const radii = frameworkRadii(avatar.framework, t, theta, bodyRadii(avatar, t));
  const c = Math.cos(theta);
  const s = Math.abs(Math.sin(theta));
  if (c >= 0) return radii.front * c * c + radii.side * s * s;
  return radii.back * c * c + radii.side * s * s;
}

export function qualitySpec(quality) {
  return FIGURE_QUALITY[quality] || FIGURE_QUALITY.ultra;
}

function paintSkin(avatar, t, theta, skin, tan, blush) {
  const front = Math.max(0, Math.cos(theta));
  const side = Math.abs(Math.sin(theta));
  const makeup = avatar.makeup || {};
  const lipsAmt = (makeup.lips || 0) / 100;
  const lidAmt = (makeup.lids || 0) / 100;
  const linerAmt = (makeup.liner || 0) / 100;
  const cheekAmt = (makeup.blush || 0) / 100;
  const chestBand = band(t, 0.2, 0.34);
  const hipBand = band(t, 0.42, 0.56);
  let r = Math.min(1, skin.r * (1 - tan * 0.25) + blush * 0.12 * chestBand + hipBand * 0.04);
  let g = Math.min(1, skin.g * (1 - tan * 0.2) * (1 - blush * 0.08 * chestBand));
  let b = Math.min(1, skin.b * (1 - tan * 0.15));

  const lip = gauss(t, 0.068, 0.012) * front * front * lipsAmt;
  r = lerp(r, 0.62, lip * 0.85);
  g = lerp(g, 0.18, lip * 0.85);
  b = lerp(b, 0.24, lip * 0.7);

  const lid = gauss(t, 0.042, 0.01) * front * lidAmt;
  r = lerp(r, 0.28, lid * 0.45);
  g = lerp(g, 0.16, lid * 0.45);
  b = lerp(b, 0.18, lid * 0.4);

  const eyeL = gauss(t, 0.046, 0.007) * gauss(Math.sin(theta), 0.42, 0.12) * front;
  const eyeR = gauss(t, 0.046, 0.007) * gauss(Math.sin(theta), -0.42, 0.12) * front;
  const eye = Math.max(eyeL, eyeR);
  r = lerp(r, 0.08, eye * 0.92);
  g = lerp(g, 0.1, eye * 0.92);
  b = lerp(b, 0.14, eye * 0.92);
  const liner = eye * linerAmt * 0.55;
  r = lerp(r, 0.04, liner);
  g = lerp(g, 0.03, liner);
  b = lerp(b, 0.04, liner);

  const brow = gauss(t, 0.032, 0.006) * (eyeL + eyeR) * 0.8 * ((avatar.head.brow || 50) / 100);
  r = lerp(r, 0.12, brow);
  g = lerp(g, 0.08, brow);
  b = lerp(b, 0.06, brow);

  const cheek =
    gauss(t, 0.072, 0.02) * gauss(side, 0.55, 0.22) * front * (cheekAmt * 0.5 + blush * 0.25);
  r = Math.min(1, r + cheek * 0.18);
  g = Math.max(0, g - cheek * 0.04);

  const bodyHair = (avatar.bodyHair || 0) / 100;
  if (bodyHair > 0.08) {
    const zone = band(t, 0.22, 0.4) * 0.45 + band(t, 0.5, 0.82) * 0.7;
    const dark = bodyHair * zone * (avatar.presentation === 'feminine' ? 0.35 : 1);
    r *= 1 - dark * 0.28;
    g *= 1 - dark * 0.28;
    b *= 1 - dark * 0.22;
  }
  return { r, g, b };
}

function appendLathe(target, avatar, spec, opts) {
  const { positions, uvs, colors, indices } = target;
  const slices = spec.slices;
  const stacks = opts.stacks;
  const height = opts.height;
  const posture = opts.posture;
  const vertexOffset = positions.length / 3;
  const hair = hexRgb(avatar.hair.color);
  const hi = hexRgb(avatar.hair.highlight);
  const skin = hexRgb(avatar.skin.tone);
  const blush = avatar.skin.blush / 100;
  const tan = avatar.skin.tan / 100;
  const sheen = avatar.skin.sheen / 100;
  const wear = avatar.presentationWear;
  const kind = opts.kind || 'body';

  for (let y = 0; y < stacks; y += 1) {
    const t = y / Math.max(1, stacks - 1);
    const bodyT = opts.bodyT ? opts.bodyT(t) : t;
    const yy = (0.5 - bodyT) * height + (opts.yShift || 0);
    const xOff = posture * (0.5 - bodyT) * 0.2;
    for (let x = 0; x <= slices; x += 1) {
      const theta = (x / slices) * Math.PI * 2;
      let r = radiusAt(avatar, bodyT, theta) * (opts.radiusScale || 1) + (opts.radiusAdd || 0);
      if (kind === 'hair') {
        const wave = Math.sin(theta * (opts.wave || 3) + t * 6) * 0.012 * (opts.shell + 1);
        r += wave;
        if (avatar.hair.style === 'loose-bun' && t > 0.55 && Math.cos(theta) < 0) r += 0.05;
        if (avatar.hair.style === 'high-tail' && t > 0.4 && Math.cos(theta) < -0.2) r += 0.03;
        if (avatar.hair.style === 'shaved-sides' && Math.abs(Math.sin(theta)) > 0.72) r *= 0.35;
      }
      positions.push(Math.sin(theta) * r + xOff, yy, Math.cos(theta) * r);
      uvs.push(x / slices, bodyT);
      if (kind === 'hair') {
        const mixHi = 0.25 + 0.35 * Math.max(0, Math.sin(theta * 2 + t));
        colors.push(
          lerp(hair.r, hi.r, mixHi),
          lerp(hair.g, hi.g, mixHi),
          lerp(hair.b, hi.b, mixHi),
          0.55 + sheen * 0.2
        );
      } else {
        const painted = paintSkin(avatar, bodyT, theta, skin, tan, blush);
        const cloth = clothingTint(wear, bodyT);
        const mix = cloth.mix || 0;
        colors.push(
          painted.r * (1 - mix) + (cloth.r || 0) * mix,
          painted.g * (1 - mix) + (cloth.g || 0) * mix,
          painted.b * (1 - mix) + (cloth.b || 0) * mix,
          Math.max(0, Math.min(1, 0.32 + sheen * 0.5 + (cloth.sheen || cloth.gloss || 0) * mix))
        );
      }
    }
  }

  const stride = slices + 1;
  for (let y = 0; y < stacks - 1; y += 1) {
    for (let x = 0; x < slices; x += 1) {
      const a = vertexOffset + y * stride + x;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
}

function computeNormals(positions, indices) {
  const normals = new Array(positions.length).fill(0);
  for (let i = 0; i < indices.length; i += 3) {
    const ia = indices[i] * 3,
      ib = indices[i + 1] * 3,
      ic = indices[i + 2] * 3;
    const ax = positions[ia],
      ay = positions[ia + 1],
      az = positions[ia + 2];
    const bx = positions[ib],
      by = positions[ib + 1],
      bz = positions[ib + 2];
    const cx = positions[ic],
      cy = positions[ic + 1],
      cz = positions[ic + 2];
    const ux = bx - ax,
      uy = by - ay,
      uz = bz - az;
    const vx = cx - ax,
      vy = cy - ay,
      vz = cz - az;
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    normals[ia] += nx;
    normals[ia + 1] += ny;
    normals[ia + 2] += nz;
    normals[ib] += nx;
    normals[ib + 1] += ny;
    normals[ib + 2] += nz;
    normals[ic] += nx;
    normals[ic + 1] += ny;
    normals[ic + 2] += nz;
  }
  for (let i = 0; i < normals.length; i += 3) {
    const nx = normals[i],
      ny = normals[i + 1],
      nz = normals[i + 2];
    const len = Math.hypot(nx, ny, nz) || 1;
    normals[i] = nx / len;
    normals[i + 1] = ny / len;
    normals[i + 2] = nz / len;
  }
  return normals;
}

export function buildAdultMesh(avatarInput = {}, quality = 'ultra') {
  const avatar = normalizeAdultAvatar(avatarInput);
  const spec = qualitySpec(quality);
  const height = 1.62 + avatar.figure.height / 280;
  const posture = (avatar.figure.posture - 50) / 400;
  const positions = [];
  const uvs = [];
  const colors = [];
  const indices = [];
  const target = { positions, uvs, colors, indices };

  appendLathe(target, avatar, spec, {
    kind: 'body',
    stacks: spec.stacks,
    height,
    posture,
  });

  const coverage = hairCoverage(avatar.hair.style, avatar.hair.length);
  if (coverage > 0.04 && spec.hairShells > 0) {
    for (let shell = 0; shell < spec.hairShells; shell += 1) {
      appendLathe(target, avatar, spec, {
        kind: 'hair',
        stacks: spec.hairStacks,
        height,
        posture,
        shell,
        radiusScale: 1.04 + shell * 0.035,
        radiusAdd: 0.012 + shell * 0.01,
        yShift: 0.02 + shell * 0.006,
        wave: avatar.hair.style === 'curly-crown' || avatar.hair.style === 'long-wave' ? 5 : 3,
        bodyT: t => t * coverage,
      });
    }
  }

  const normals = computeNormals(positions, indices);
  return {
    quality: spec,
    vertexCount: positions.length / 3,
    triangleCount: indices.length / 3,
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    colors: new Float32Array(colors),
    indices: vertexCountToIndex(positions.length / 3, indices),
    vrm: false,
    makeHuman: false,
    artwork: { facePaint: true, hairShells: spec.hairShells, clothing: true },
  };
}

function vertexCountToIndex(count, indices) {
  return count > 65535 ? new Uint32Array(indices) : new Uint16Array(indices);
}

export function meshQualityScore(mesh) {
  if (!mesh) return 0;
  const verts = mesh.vertexCount || 0;
  const tris = mesh.triangleCount || 0;
  const ultra =
    FIGURE_QUALITY.ultra.slices *
    (FIGURE_QUALITY.ultra.stacks +
      FIGURE_QUALITY.ultra.hairStacks * FIGURE_QUALITY.ultra.hairShells);
  return Math.min(100, Math.round((verts / Math.max(1, ultra)) * 70 + Math.min(30, tris / 2500)));
}
