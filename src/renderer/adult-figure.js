// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import { buildAdultMesh, hexRgb, FIGURE_BACKEND, FIGURE_QUALITY } from '../core/adult-mesh.js';
import { avatarLayout } from '../core/adult-soul.js';
import { deformAdultMesh, behaviorFromSession } from '../core/adult-life.js';

const VERT = `
attribute vec3 aPos;
attribute vec3 aNrm;
attribute vec4 aCol;
uniform mat4 uMVP;
uniform mat4 uModel;
varying vec3 vN;
varying vec3 vW;
varying vec4 vC;
void main() {
  vec4 w = uModel * vec4(aPos, 1.0);
  vW = w.xyz;
  vN = mat3(uModel) * aNrm;
  vC = aCol;
  gl_Position = uMVP * vec4(aPos, 1.0);
}`;

const FRAG = `
precision highp float;
varying vec3 vN;
varying vec3 vW;
varying vec4 vC;
uniform vec3 uEye;
uniform vec3 uKeyDir;
uniform vec3 uKeyCol;
uniform vec3 uFillDir;
uniform vec3 uFillCol;
uniform vec3 uRimDir;
uniform vec3 uRimCol;
uniform float uWrap;
uniform float uGloss;
vec3 shade(vec3 n, vec3 ldir, vec3 lcol, float wrap) {
  float ndl = dot(n, normalize(ldir));
  float diff = max(0.0, (ndl + wrap) / (1.0 + wrap));
  return lcol * diff;
}
void main() {
  vec3 n = normalize(vN);
  vec3 albedo = vC.rgb;
  vec3 eye = normalize(uEye - vW);
  vec3 col = albedo * 0.10;
  col += albedo * shade(n, uKeyDir, uKeyCol, uWrap);
  col += albedo * shade(n, uFillDir, uFillCol, uWrap * 1.4);
  float rim = pow(1.0 - max(0.0, dot(n, eye)), 2.4);
  col += uRimCol * rim * 0.55;
  vec3 halfv = normalize(normalize(uKeyDir) + eye);
  float spec = pow(max(0.0, dot(n, halfv)), mix(24.0, 72.0, uGloss)) * vC.a;
  col += vec3(1.0, 0.96, 0.92) * spec * 0.35;
  col = pow(max(col, vec3(0.0)), vec3(0.92));
  gl_FragColor = vec4(col, 1.0);
}`;

function mat4() {
  return new Float32Array(16);
}
function identity(out) {
  out.fill(0);
  out[0] = out[5] = out[10] = out[15] = 1;
  return out;
}
function perspective(out, fov, aspect, near, far) {
  identity(out);
  const f = 1 / Math.tan(fov / 2);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) / (near - far);
  out[11] = -1;
  out[14] = (2 * far * near) / (near - far);
  out[15] = 0;
  return out;
}
function multiply(out, a, b) {
  const r = new Float32Array(16);
  for (let i = 0; i < 4; i += 1) {
    for (let j = 0; j < 4; j += 1) {
      r[j * 4 + i] =
        a[i] * b[j * 4] +
        a[i + 4] * b[j * 4 + 1] +
        a[i + 8] * b[j * 4 + 2] +
        a[i + 12] * b[j * 4 + 3];
    }
  }
  out.set(r);
  return out;
}
function translate(out, x, y, z) {
  identity(out);
  out[12] = x;
  out[13] = y;
  out[14] = z;
  return out;
}
function rotateY(out, r) {
  identity(out);
  const c = Math.cos(r),
    s = Math.sin(r);
  out[0] = c;
  out[2] = s;
  out[8] = -s;
  out[10] = c;
  return out;
}
function rotateX(out, r) {
  identity(out);
  const c = Math.cos(r),
    s = Math.sin(r);
  out[5] = c;
  out[6] = s;
  out[9] = -s;
  out[10] = c;
  return out;
}

const LIGHTS = {
  studio: {
    keyDir: [0.45, 0.75, 0.5],
    keyCol: [1.0, 0.94, 0.88],
    fillDir: [-0.6, 0.2, 0.3],
    fillCol: [0.25, 0.32, 0.45],
    rimDir: [-0.2, 0.1, -1],
    rimCol: [0.55, 0.62, 0.8],
    wrap: 0.28,
  },
  soft: {
    keyDir: [0.2, 0.9, 0.4],
    keyCol: [1.0, 0.96, 0.93],
    fillDir: [-0.4, 0.5, 0.4],
    fillCol: [0.45, 0.42, 0.4],
    rimDir: [0, 0.2, -1],
    rimCol: [0.4, 0.38, 0.36],
    wrap: 0.55,
  },
  club: {
    keyDir: [0.6, 0.4, 0.4],
    keyCol: [1.0, 0.35, 0.55],
    fillDir: [-0.5, 0.3, 0.5],
    fillCol: [0.2, 0.45, 0.9],
    rimDir: [0, 0.4, -1],
    rimCol: [0.9, 0.2, 0.7],
    wrap: 0.2,
  },
  neon: {
    keyDir: [0.3, 0.6, 0.5],
    keyCol: [0.4, 0.9, 1.0],
    fillDir: [-0.7, 0.2, 0.2],
    fillCol: [0.9, 0.2, 0.85],
    rimDir: [0.2, 0.1, -1],
    rimCol: [0.2, 1.0, 0.7],
    wrap: 0.22,
  },
  bedroom: {
    keyDir: [0.15, 0.55, 0.45],
    keyCol: [1.0, 0.72, 0.55],
    fillDir: [-0.35, 0.25, 0.4],
    fillCol: [0.25, 0.12, 0.18],
    rimDir: [0.1, 0.3, -1],
    rimCol: [0.55, 0.28, 0.22],
    wrap: 0.42,
  },
};

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(sh) || 'shader');
  return sh;
}

function bindAttrib(gl, program, name, size, stride, offset) {
  const loc = gl.getAttribLocation(program, name);
  if (loc < 0) return;
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offset);
}

export function attachAdultFigure(canvas) {
  if (!canvas)
    return { setAvatar() {}, destroy() {}, backend: { webgl: false, ...FIGURE_BACKEND } };
  const gl =
    canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: false }) ||
    canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false });
  let avatar = null;
  let yaw = 0.35;
  let dragging = false;
  let lastX = 0;
  let raf = 0;
  let mesh = null;
  let restMesh = null;
  let buffers = null;
  let program = null;
  let destroyed = false;
  let start = typeof performance !== 'undefined' ? performance.now() : 0;
  let life = {
    behavior: 'idle-breathe',
    pace: 'medium',
    heat: 45,
    slowMo: false,
    reducedMotion: false,
    motion: { breath: 55, sway: 48 },
  };

  function resize() {
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const w = Math.max(320, canvas.clientWidth || 480);
    const h = Math.max(420, canvas.clientHeight || 640);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function drawCanvasFallback() {
    const ctx = canvas.getContext('2d');
    if (!ctx || !avatar) return;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const w = canvas.width;
    const h = canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const layout = avatarLayout(avatar);
    const scale = (h / 420) * dpr;
    const cx = w / 2;
    const skin = hexRgb(avatar.skin.tone);
    const grd = ctx.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, 'rgba(20,12,18,0.9)');
    grd.addColorStop(1, 'rgba(6,4,8,1)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(cx, h * 0.08);
    ctx.scale(scale, scale);
    const body = new Path2D();
    const hip = layout.hip,
      waist = layout.waist,
      bust = layout.bust,
      shoulder = layout.shoulder;
    body.moveTo(0, 20);
    body.bezierCurveTo(layout.headR, 20, layout.headR, 70, 0, 80);
    body.bezierCurveTo(-layout.headR, 70, -layout.headR, 20, 0, 20);
    ctx.fillStyle = `rgb(${Math.round(skin.r * 255)},${Math.round(skin.g * 255)},${Math.round(skin.b * 255)})`;
    ctx.fill(body);
    const torso = new Path2D();
    torso.moveTo(-shoulder, layout.shoulderY);
    torso.quadraticCurveTo(-bust - 8, layout.bustY, -waist, layout.waistY);
    torso.quadraticCurveTo(-hip, layout.hipY, -layout.thigh, layout.crotchY + 20);
    torso.lineTo(-layout.thigh * 0.7, layout.kneeY);
    torso.lineTo(layout.thigh * 0.7, layout.kneeY);
    torso.lineTo(layout.thigh, layout.crotchY + 20);
    torso.quadraticCurveTo(hip, layout.hipY, waist, layout.waistY);
    torso.quadraticCurveTo(bust + 8, layout.bustY, shoulder, layout.shoulderY);
    torso.closePath();
    const tg = ctx.createLinearGradient(-hip, layout.shoulderY, hip, layout.hipY);
    tg.addColorStop(0, 'rgba(255,255,255,0.18)');
    tg.addColorStop(
      0.45,
      `rgb(${Math.round(skin.r * 255)},${Math.round(skin.g * 255)},${Math.round(skin.b * 255)})`
    );
    tg.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = tg;
    ctx.fill(torso);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `${12 * dpr}px ui-sans-serif, system-ui`;
    ctx.fillText('Canvas fallback · first-party figure · not VRM', 16 * dpr, h - 16 * dpr);
  }

  function ensureProgram() {
    if (!gl || program) return program;
    program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(program) || 'link');
    return program;
  }

  function upload(next) {
    restMesh = next;
    mesh = next;
    if (!gl || !mesh) return;
    buffers = buffers || {};
    const use32 = mesh.indices instanceof Uint32Array;
    const make = (key, data, target = gl.ARRAY_BUFFER) => {
      buffers[key] = buffers[key] || gl.createBuffer();
      gl.bindBuffer(target, buffers[key]);
      gl.bufferData(target, data, gl.DYNAMIC_DRAW);
    };
    make('pos', mesh.positions);
    make('nrm', mesh.normals);
    make('col', mesh.colors);
    make('idx', mesh.indices, gl.ELEMENT_ARRAY_BUFFER);
    buffers.indexType = use32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
    buffers.count = mesh.indices.length;
  }

  function liveMesh(now) {
    if (!restMesh) return null;
    const scale = life.slowMo ? 0.45 : 1;
    const behavior = life.behavior || behaviorFromSession(life.sessionKind, life.pace, life.heat);
    return deformAdultMesh(restMesh, {
      timeMs: Math.max(0, (now - start) * scale),
      behavior,
      pace: life.pace,
      heat: life.heat,
      motion: life.motion || avatar?.motion,
      reducedMotion: life.reducedMotion,
    });
  }

  function lights() {
    return LIGHTS[avatar?.render?.lighting] || LIGHTS.studio;
  }

  function drawGl(now) {
    if (!gl || !mesh || !buffers) return;
    const prog = ensureProgram();
    gl.useProgram(prog);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.clearColor(0.035, 0.02, 0.04, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const live = liveMesh(now) || mesh;
    if (live && buffers?.pos && live.positions) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.pos);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, live.positions);
      if (live.normals && buffers.nrm) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.nrm);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, live.normals);
      }
    }
    const extraYaw = Number(live?.extraYaw) || 0;
    const extraPitch = Number(live?.extraPitch) || 0;
    const aspect = canvas.width / Math.max(1, canvas.height);
    const proj = perspective(mat4(), (38 * Math.PI) / 180, aspect, 0.1, 20);
    const rot = multiply(mat4(), rotateY(mat4(), yaw + extraYaw), rotateX(mat4(), extraPitch));
    const model = multiply(mat4(), translate(mat4(), 0, -0.05, 0), rot);
    const view = translate(mat4(), 0, 0, -2.35);
    const mvp = multiply(mat4(), multiply(mat4(), proj, view), model);
    gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uMVP'), false, mvp);
    gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uModel'), false, model);
    const L = lights();
    gl.uniform3fv(gl.getUniformLocation(prog, 'uEye'), [0, 0.2, 2.35]);
    gl.uniform3fv(gl.getUniformLocation(prog, 'uKeyDir'), L.keyDir);
    gl.uniform3fv(gl.getUniformLocation(prog, 'uKeyCol'), L.keyCol);
    gl.uniform3fv(gl.getUniformLocation(prog, 'uFillDir'), L.fillDir);
    gl.uniform3fv(gl.getUniformLocation(prog, 'uFillCol'), L.fillCol);
    gl.uniform3fv(gl.getUniformLocation(prog, 'uRimDir'), L.rimDir);
    gl.uniform3fv(gl.getUniformLocation(prog, 'uRimCol'), L.rimCol);
    gl.uniform1f(gl.getUniformLocation(prog, 'uWrap'), L.wrap);
    gl.uniform1f(gl.getUniformLocation(prog, 'uGloss'), (avatar?.skin?.sheen || 40) / 100);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.pos);
    bindAttrib(gl, prog, 'aPos', 3, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.nrm);
    bindAttrib(gl, prog, 'aNrm', 3, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.col);
    bindAttrib(gl, prog, 'aCol', 4, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.idx);
    gl.drawElements(gl.TRIANGLES, buffers.count, buffers.indexType, 0);
    if (avatar?.render?.autoRotate !== false && !dragging) yaw += 0.004;
  }

  function frame(now) {
    if (destroyed) return;
    resize();
    if (gl && (mesh || restMesh)) drawGl(now);
    else if (!gl) drawCanvasFallback();
    raf = requestAnimationFrame(frame);
  }

  function setAvatar(next) {
    avatar = next;
    if (!next) return;
    try {
      upload(buildAdultMesh(next, next.render?.quality || 'ultra'));
    } catch {
      mesh = null;
      restMesh = null;
    }
  }

  function setLife(next = {}) {
    life = { ...life, ...(next && typeof next === 'object' ? next : {}) };
  }

  canvas.addEventListener('pointerdown', e => {
    dragging = true;
    lastX = e.clientX;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointerup', () => {
    dragging = false;
  });
  canvas.addEventListener('pointermove', e => {
    if (!dragging) return;
    yaw += (e.clientX - lastX) * 0.01;
    lastX = e.clientX;
  });

  resize();
  raf = requestAnimationFrame(frame);
  return {
    setAvatar,
    setLife,
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
    },
    backend: {
      webgl: Boolean(gl),
      webgl2: Boolean(
        gl && typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext
      ),
      webgpu: Boolean(globalThis.navigator && globalThis.navigator.gpu),
      maxQuality: 'ultra',
      ...FIGURE_BACKEND,
      qualityPresets: FIGURE_QUALITY,
    },
  };
}
