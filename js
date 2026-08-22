// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import { attachAdultFigure } from './adult-figure.js';
import { createAdultAmbient } from './adult-ambient.js';
import { attachFeelGamepad, stayAwake } from './runtime-chrome.js';
import {
  HAIR_STYLES, CLOTHING, BODY_PRESENTATIONS, PERSONA_STYLES, sessionCatalog, adultSoulStudioOpen
} from '../core/adult-soul.js';
import { FEEL_PATTERNS, FEEL_SYNC_MODES, FEEL_HONESTY, GAMEPAD_HONESTY } from '../core/adult-feel.js';
import { AMBIENT_HONESTY } from '../core/adult-ambient.js';
import {
  ADULT_VOICE_PRESETS, ADULT_VOICE_HONESTY, enrichInstalledVoices, speakAdultCue,
  adultPreviewLine, applyPresetToSounds, groupVoicesForPicker
} from '../core/adult-voices.js';
import { meshQualityScore, FIGURE_QUALITY } from '../core/adult-mesh.js';
import { buildAdultMesh } from '../core/adult-mesh.js';

const $ = s => document.querySelector(s);
const FIGURE_SLIDERS = [
  ['figure.height', 'Height'], ['figure.shoulders', 'Shoulders'], ['figure.bust', 'Bust'],
  ['figure.chest', 'Chest'], ['figure.waist', 'Waist'], ['figure.hips', 'Hips'],
  ['figure.thighs', 'Thighs'], ['figure.butt', 'Ass'], ['figure.belly', 'Belly'], ['figure.posture', 'Posture'],
  ['head.faceWidth', 'Face width'], ['head.jaw', 'Jaw'], ['head.lips', 'Lips'], ['head.eyeSize', 'Eyes'],
  ['explicit.nipples', 'Nipples'], ['explicit.groin', 'Groin'], ['explicit.assFocus', 'Ass focus'],
  ['motion.breath', 'Breath'], ['motion.sway', 'Sway'], ['skin.sheen', 'Skin sheen']
];

function deepSet(obj, path, value) {
  const parts = path.split('.');
  const next = structuredClone(obj);
  let cur = next;
  for (let i = 0; i < parts.length - 1; i += 1) cur = cur[parts[i]];
  cur[parts[parts.length - 1]] = value;
  return next;
}
function deepGet(obj, path) {
  return path.split('.').reduce((cur, key) => cur?.[key], obj);
}

let figure = null;
let view = null;
let sessionTimer = 0;
let lastSpoken = '';
let idleTimer = 0;
let feelPointer = false;
let ambient = null;
let gamepadCtl = null;

function adultOn() {
  const p = window.eidovaraState?.policy || {};
  return p.mode === 'adult' && p.adultSoulEnabled === true && p.adultStatusConfirmed === true && p.currentConsent === true;
}

async function refresh(status) {
  try {
    view = status || (window.soul?.adultSoulStatus ? await window.soul.adultSoulStatus() : null);
  } catch {
    view = null;
  }
  render();
}

function renderLocked() {
  const lock = $('#adultSoulLocked');
  const studio = $('#adultSoulStudio');
  if (lock) lock.classList.toggle('hidden', adultOn() && view?.open);
  if (studio) studio.classList.toggle('hidden', !(adultOn() && view?.open));
  if (lock && view?.reason) {
    const p = lock.querySelector('[data-lock-reason]');
    if (p) p.textContent = view.reason;
  }
}

function fillSelect(node, options, value) {
  if (!node) return;
  node.textContent = '';
  for (const opt of options) {
    const o = document.createElement('option');
    o.value = typeof opt === 'string' ? opt : opt.id;
    o.textContent = typeof opt === 'string' ? opt : opt.title;
    node.append(o);
  }
  if (value) node.value = value;
}

function renderSliders(avatar) {
  const box = $('#adultSliderGrid');
  if (!box || !avatar) return;
  if (!box.dataset.ready) {
    box.textContent = '';
    for (const [path, label] of FIGURE_SLIDERS) {
      const wrap = document.createElement('label');
      wrap.append(label);
      const input = document.createElement('input');
      input.type = 'range';
      input.min = '0';
      input.max = '100';
      input.dataset.path = path;
      wrap.append(input);
      box.append(wrap);
    }
    box.dataset.ready = '1';
    box.addEventListener('input', e => {
      const path = e.target?.dataset?.path;
      if (!path || !view?.avatar) return;
      const avatarNext = deepSet(view.avatar, path, Number(e.target.value));
      save({ avatar: avatarNext });
    });
  }
  box.querySelectorAll('input[data-path]').forEach(input => {
    const value = deepGet(avatar, input.dataset.path);
    if (value != null) input.value = String(value);
  });
}

function renderSessions() {
  const box = $('#adultSessionGrid');
  if (!box || box.dataset.ready) return;
  box.textContent = '';
  for (const item of sessionCatalog()) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.kind = item.id;
    const strong = document.createElement('strong');
    strong.textContent = item.title;
    const small = document.createElement('small');
    small.textContent = item.summary;
    b.append(strong, document.createElement('br'), small);
    box.append(b);
  }
  box.dataset.ready = '1';
  box.addEventListener('click', async e => {
    const kind = e.target.closest('button')?.dataset?.kind;
    if (!kind || !window.soul?.startAdultSession) return;
    view = await window.soul.startAdultSession({ kind, durationMin: 8 });
    startTicker();
    render();
  });
}

function renderVoices() {
  const list = $('#adultVoiceList');
  const presets = $('#adultVoicePreset');
  if (presets && !presets.dataset.ready) {
    fillSelect(presets, ADULT_VOICE_PRESETS, view?.sounds?.presetId);
    presets.dataset.ready = '1';
    presets.addEventListener('change', () => {
      const voices = enrichInstalledVoices(window.speechSynthesis);
      const sounds = applyPresetToSounds(view?.sounds || {}, presets.value, voices);
      save({ sounds });
      speakAdultCue(window.speechSynthesis, adultPreviewLine(presets.value), sounds, { Utterance: window.SpeechSynthesisUtterance });
    });
  }
  if (!list) return;
  const voices = enrichInstalledVoices(window.speechSynthesis);
  const groups = groupVoicesForPicker(voices);
  list.textContent = '';
  for (const group of groups) {
    const h = document.createElement('small');
    h.textContent = group.label;
    list.append(h);
    for (const voice of group.items) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'secondary';
      b.dataset.uri = voice.voiceURI;
      b.textContent = `${voice.name} · ${voice.lang || ''} · ${voice.quality === 'os-neural' ? 'Windows Natural' : 'OS'} · ${voice.sexyScore}`;
      if (voice.voiceURI === view?.sounds?.coachVoiceURI) b.setAttribute('aria-current', 'true');
      list.append(b);
    }
  }
}

function renderFeel() {
  const feel = view?.feel;
  if (!feel) return;
  const honesty = $('#adultFeelHonesty');
  if (honesty) honesty.textContent = view.feelHonesty || FEEL_HONESTY;
  const padHelp = $('#adultGamepadStatus');
  if (padHelp && !padHelp.dataset.ready) {
    padHelp.textContent = view.gamepadHonesty || GAMEPAD_HONESTY;
    padHelp.dataset.ready = '1';
  }
  fillSelect($('#adultFeelPattern'), FEEL_PATTERNS, feel.pattern);
  fillSelect($('#adultFeelSync'), FEEL_SYNC_MODES, feel.syncMode);
  const intensity = $('#adultFeelIntensity');
  const speed = $('#adultFeelSpeed');
  const sensitivity = $('#adultFeelSensitivity');
  if (intensity) intensity.value = String(feel.intensity ?? 55);
  if (speed) speed.value = String(feel.speed ?? 48);
  if (sensitivity) sensitivity.value = String(feel.sensitivity ?? 62);
  if ($('#adultFeelLoop')) $('#adultFeelLoop').checked = feel.loop !== false;
  if ($('#adultFeelFloat')) $('#adultFeelFloat').checked = feel.float === true;
  const pad = $('#adultFeelPad');
  if (pad) {
    pad.style.setProperty('--feel-x', `${feel.speed || 48}%`);
    pad.style.setProperty('--feel-y', `${100 - (feel.intensity || 55)}%`);
  }
  const level = $('#adultFeelLevel');
  if (level) level.textContent = `Level ${Math.round((feel.lastLevel || 0) * 100)} · ${feel.pattern} · ${feel.syncMode}`;
  const blank = $('#adultAutoBlank');
  if (blank) blank.value = String(feel.stealth?.autoBlankMs || 0);
  if ($('#adultHideRecents')) $('#adultHideRecents').checked = feel.stealth?.hideRecents === true;
  if ($('#adultAutoClear')) $('#adultAutoClear').checked = feel.stealth?.autoClearHistory === true;
  const lock = $('#adultStealthLock');
  const studio = $('#adultSoulStudio');
  const pinLocked = feel.stealth?.locked === true || feel.stealth?.blanked === true;
  document.body.classList.toggle('adult-blanked', pinLocked);
  if (lock) lock.classList.toggle('hidden', !pinLocked);
  if (studio && pinLocked) studio.classList.add('hidden');
}

function bumpIdle() {
  clearTimeout(idleTimer);
  const ms = Number(view?.feel?.stealth?.autoBlankMs || 0);
  if (!ms || !view?.feel?.stealth?.pinEnabled) return;
  idleTimer = setTimeout(() => { window.soul?.lockAdultStealth?.().then(refresh); }, ms);
}

function syncRuntime() {
  const locked = view?.feel?.stealth?.locked === true || view?.feel?.stealth?.blanked === true;
  const live = adultOn() && view?.open && !locked;
  if (!live) {
    ambient?.stop();
    stayAwake(false, 'adult-session');
    return;
  }
  if (!ambient) ambient = createAdultAmbient();
  const reduced = Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  ambient.start(view.sounds, { reducedMotion: reduced });
  ambient.setFeelLevel(Number(view?.feel?.lastLevel) || 0);
  stayAwake(Boolean(view?.session?.active), 'adult-session');
}

function renderCue() {
  const cue = $('#adultSoulCue');
  if (!cue) return;
  const text = view?.session?.currentCue || view?.honestLabel || '';
  cue.textContent = text;
  if (view?.session?.active && view.sounds?.voiceEnabled !== false && text && text !== lastSpoken) {
    lastSpoken = text;
    speakAdultCue(window.speechSynthesis, text, view.sounds, { pace: 'medium', Utterance: window.SpeechSynthesisUtterance });
  }
}

function renderFigure() {
  if (!figure || !view?.avatar) return;
  figure.setAvatar(view.avatar);
  figure.setLife?.({
    behavior: view.session?.behavior || 'idle-breathe',
    pace: view.session?.pace || 'medium',
    heat: view.session?.heat ?? view.persona?.heat ?? 45,
    motion: view.avatar.motion,
    slowMo: view.stage?.slowMo === true,
    reducedMotion: Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches),
    sessionKind: view.session?.kind || ''
  });
  const meta = $('#adultFigureMeta');
  if (meta && view.avatar) {
    const mesh = buildAdultMesh(view.avatar, view.avatar.render?.quality || 'ultra');
    const q = FIGURE_QUALITY[view.avatar.render?.quality] || FIGURE_QUALITY.ultra;
    meta.textContent = `${q.label} · ${mesh.triangleCount.toLocaleString()} tris · score ${meshQualityScore(mesh)} · ${figure.backend.webgl ? (figure.backend.webgl2 ? 'WebGL2' : 'WebGL') : 'canvas'}${figure.backend.webgpu ? ' · WebGPU probed' : ''} · not VRM`;
  }
}

function render() {
  renderLocked();
  if (!(adultOn() && view?.open)) {
    syncRuntime();
    return;
  }
  renderSliders(view.avatar);
  renderSessions();
  renderVoices();
  renderCue();
  renderFeel();
  renderFigure();
  fillSelect($('#adultHairStyle'), HAIR_STYLES, view.avatar?.hair?.style);
  fillSelect($('#adultClothing'), CLOTHING, view.avatar?.presentationWear);
  fillSelect($('#adultSoulPresentation'), BODY_PRESENTATIONS, view.avatar?.presentation);
  fillSelect($('#adultPersonaStyle'), PERSONA_STYLES, view.persona?.style);
  fillSelect($('#adultRenderQuality'), [
    { id: 'ultra', title: 'Ultra (highest first-party mesh)' },
    { id: 'high', title: 'High' },
    { id: 'performance', title: 'Performance' }
  ], view.avatar?.render?.quality);
  fillSelect($('#adultLighting'), [
    { id: 'studio', title: 'Studio' }, { id: 'soft', title: 'Soft wrap' },
    { id: 'club', title: 'Club' }, { id: 'neon', title: 'Neon' },
    { id: 'bedroom', title: 'Bedroom' }
  ], view.avatar?.render?.lighting);
  const name = $('#adultSoulName');
  if (name && view.persona?.name) name.value = view.persona.name;
  const heat = $('#adultHeat');
  if (heat) heat.value = String(view.persona?.heat ?? 72);
  const honesty = $('#adultVoiceHonesty');
  if (honesty) honesty.textContent = ADULT_VOICE_HONESTY;
  const ambientHelp = $('#adultAmbientHonesty');
  if (ambientHelp) ambientHelp.textContent = view.ambientHonesty || AMBIENT_HONESTY;
  const ambientState = view.sounds && view.sounds.ambient ? view.sounds.ambient : {};
  const mixState = view.sounds && view.sounds.mix ? view.sounds.mix : {};
  if ($('#adultAmbientHeartbeat')) $('#adultAmbientHeartbeat').checked = ambientState.heartbeat !== false;
  if ($('#adultAmbientBreath')) $('#adultAmbientBreath').checked = ambientState.breath !== false;
  if ($('#adultAmbientDrone')) $('#adultAmbientDrone').checked = ambientState.drone !== false;
  if ($('#adultAmbientMix')) $('#adultAmbientMix').value = String(Number.isFinite(Number(mixState.ambient)) ? mixState.ambient : 45);
  syncRuntime();
  bumpIdle();
}

async function save(patch) {
  if (!window.soul?.configureAdultSoul) return;
  try {
    view = await window.soul.configureAdultSoul(patch);
    render();
  } catch (err) {
    alert(String(err?.message || err));
  }
}

function startTicker() {
  clearInterval(sessionTimer);
  sessionTimer = setInterval(async () => {
    if (!view?.session?.active || !view.session.startedAt) return;
    const elapsed = Date.now() - new Date(view.session.startedAt).getTime();
    if (window.soul?.tickAdultSession) {
      view = await window.soul.tickAdultSession(elapsed);
      renderCue();
      if (view.done) clearInterval(sessionTimer);
    }
  }, 400);
}

function bind() {
  const canvas = $('#adultFigureCanvas');
  if (canvas && !figure) figure = attachAdultFigure(canvas);
  $('#adultHairStyle')?.addEventListener('change', e => save({ avatar: { ...view.avatar, hair: { ...view.avatar.hair, style: e.target.value } } }));
  $('#adultClothing')?.addEventListener('change', e => save({ avatar: { ...view.avatar, presentationWear: e.target.value } }));
  $('#adultSoulPresentation')?.addEventListener('change', e => save({ avatar: { ...view.avatar, presentation: e.target.value } }));
  $('#adultPersonaStyle')?.addEventListener('change', e => save({ persona: { ...view.persona, style: e.target.value } }));
  $('#adultRenderQuality')?.addEventListener('change', e => save({ avatar: { ...view.avatar, render: { ...view.avatar.render, quality: e.target.value } } }));
  $('#adultLighting')?.addEventListener('change', e => save({ avatar: { ...view.avatar, render: { ...view.avatar.render, lighting: e.target.value } } }));
  $('#adultSoulName')?.addEventListener('change', e => save({ persona: { ...view.persona, name: e.target.value } }));
  $('#adultHeat')?.addEventListener('input', e => save({ persona: { ...view.persona, heat: Number(e.target.value) } }));
  const patchFeel = extra => save({ feel: { ...(view?.feel || {}), ...extra } });
  $('#adultFeelIntensity')?.addEventListener('input', e => patchFeel({ intensity: Number(e.target.value) }));
  $('#adultFeelSpeed')?.addEventListener('input', e => patchFeel({ speed: Number(e.target.value) }));
  $('#adultFeelSensitivity')?.addEventListener('input', e => patchFeel({ sensitivity: Number(e.target.value) }));
  $('#adultFeelPattern')?.addEventListener('change', e => patchFeel({ pattern: e.target.value }));
  $('#adultFeelSync')?.addEventListener('change', e => patchFeel({ syncMode: e.target.value }));
  $('#adultFeelLoop')?.addEventListener('change', e => patchFeel({ loop: e.target.checked }));
  $('#adultFeelFloat')?.addEventListener('change', e => patchFeel({ float: e.target.checked }));
  $('#adultAutoBlank')?.addEventListener('change', e => patchFeel({ stealth: { ...(view?.feel?.stealth || {}), autoBlankMs: Number(e.target.value) } }));
  $('#adultHideRecents')?.addEventListener('change', e => patchFeel({ stealth: { ...(view?.feel?.stealth || {}), hideRecents: e.target.checked } }));
  $('#adultAutoClear')?.addEventListener('change', e => patchFeel({ stealth: { ...(view?.feel?.stealth || {}), autoClearHistory: e.target.checked } }));
  const pad = $('#adultFeelPad');
  const padMove = ev => {
    if (!feelPointer && ev.type === 'pointermove') return;
    const box = pad.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (ev.clientX - box.left) / box.width));
    const y = Math.max(0, Math.min(1, (ev.clientY - box.top) / box.height));
    patchFeel({ speed: Math.round(x * 100), intensity: Math.round((1 - y) * 100) });
  };
  pad?.addEventListener('pointerdown', ev => { feelPointer = true; pad.setPointerCapture?.(ev.pointerId); padMove(ev); });
  pad?.addEventListener('pointermove', padMove);
  pad?.addEventListener('pointerup', () => { feelPointer = false; });
  $('#adultPinSetBtn')?.addEventListener('click', async () => {
    try {
      view = await window.soul.setAdultPin($('#adultPinInput')?.value, $('#adultPinConfirm')?.value);
      if ($('#adultPinInput')) $('#adultPinInput').value = '';
      if ($('#adultPinConfirm')) $('#adultPinConfirm').value = '';
      render();
    } catch (err) { alert(String(err?.message || err)); }
  });
  $('#adultPinLockBtn')?.addEventListener('click', async () => { view = await window.soul.lockAdultStealth(); render(); });
  $('#adultPinUnlockBtn')?.addEventListener('click', async () => {
    try {
      view = await window.soul.unlockAdultStealth($('#adultPinUnlock')?.value);
      if ($('#adultPinUnlock')) $('#adultPinUnlock').value = '';
      render();
    } catch (err) { alert(String(err?.message || err)); }
  });
  window.addEventListener('eidovara-feel-level', async ev => {
    const level = Number(ev.detail?.level || 0);
    if (!window.soul?.applyFeelLevel || !adultOn()) return;
    const sample = await window.soul.applyFeelLevel(level, Date.now());
    if (view.feel) view.feel.lastLevel = sample.level;
    ambient?.setFeelLevel(sample.level || 0);
    gamepadCtl?.rumble(sample.level || 0);
    const line = $('#adultFeelLevel');
    if (line && sample) line.textContent = `Level ${Math.round((sample.level || 0) * 100)} · ${sample.pattern} · ${sample.syncMode}`;
    if (figure && view) {
      figure.setLife?.({
        behavior: view.session?.behavior || 'idle-breathe',
        pace: sample.pace || view.session?.pace || 'medium',
        heat: Math.round((sample.level || 0) * 100),
        motion: view.avatar?.motion,
        sessionKind: view.session?.kind || ''
      });
    }
  });
  window.addEventListener('keydown', ev => {
    if (ev.key === '`' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(ev.target?.tagName)) {
      ev.preventDefault();
      window.soul?.lockAdultStealth?.().then(status => { view = status; render(); });
    }
  });
  window.addEventListener('pointerdown', bumpIdle);
  window.addEventListener('keydown', bumpIdle);
  $('#adultImportSoundBtn')?.addEventListener('click', async () => {
    if (!window.soul?.selectAdultSound) return;
    view = await window.soul.selectAdultSound();
    render();
  });
  $('#adultStopSessionBtn')?.addEventListener('click', async () => {
    if (window.soul?.stopAdultSession) view = await window.soul.stopAdultSession();
    lastSpoken = '';
    window.speechSynthesis?.cancel?.();
    ambient?.stop();
    stayAwake(false, 'adult-session');
    render();
  });
  $('#adultPreviewVoiceBtn')?.addEventListener('click', () => {
    speakAdultCue(window.speechSynthesis, adultPreviewLine(view?.sounds?.presetId), view?.sounds, { Utterance: window.SpeechSynthesisUtterance });
  });
  const patchAmbient = extra => {
    const prior = view?.sounds || {};
    const ambientNext = { ...(prior.ambient || {}), ...(extra.ambient || {}) };
    const mixNext = { ...(prior.mix || {}), ...(extra.mix || {}) };
    save({ sounds: { ...prior, ambient: ambientNext, mix: mixNext } });
  };
  $('#adultAmbientHeartbeat')?.addEventListener('change', e => patchAmbient({ ambient: { heartbeat: e.target.checked } }));
  $('#adultAmbientBreath')?.addEventListener('change', e => patchAmbient({ ambient: { breath: e.target.checked } }));
  $('#adultAmbientDrone')?.addEventListener('change', e => patchAmbient({ ambient: { drone: e.target.checked } }));
  $('#adultAmbientMix')?.addEventListener('input', e => patchAmbient({ mix: { ambient: Number(e.target.value) } }));
  if (!gamepadCtl) {
    gamepadCtl = attachFeelGamepad({
      reducedMotion: Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches),
      getFeel: () => view?.feel || {},
      onStick: stick => {
        if (!(adultOn() && view?.open)) return;
        save({ feel: { ...(view?.feel || {}), speed: stick.speed, intensity: stick.intensity } });
      },
      onPattern: id => {
        if (!(adultOn() && view?.open)) return;
        save({ feel: { ...(view?.feel || {}), pattern: id } });
      },
      onFloat: on => {
        if (!(adultOn() && view?.open)) return;
        save({ feel: { ...(view?.feel || {}), float: on } });
      },
      onStop: async () => {
        if (window.soul?.stopAdultSession) view = await window.soul.stopAdultSession();
        lastSpoken = '';
        ambient?.stop();
        stayAwake(false, 'adult-session');
        render();
      },
      onPad: info => {
        const line = $('#adultGamepadStatus');
        if (!line) return;
        line.textContent = info.connected
          ? `${info.connected} gamepad connected · ${view?.gamepadHonesty || GAMEPAD_HONESTY}`
          : (view?.gamepadHonesty || GAMEPAD_HONESTY);
      }
    });
  }
  $('#adultVoiceList')?.addEventListener('click', e => {
    const uri = e.target.closest('button')?.dataset?.uri;
    if (!uri) return;
    save({ sounds: { ...view.sounds, voiceURI: uri, coachVoiceURI: uri } });
    speakAdultCue(window.speechSynthesis, adultPreviewLine(view?.sounds?.presetId), { ...view.sounds, coachVoiceURI: uri }, { Utterance: window.SpeechSynthesisUtterance });
  });
  $('#openAdultSoulFromIdentity')?.addEventListener('click', () => {
    if (window.eidovaraAdminSession?.()) window.eidovaraSetView?.('adultSoul');
    else window.eidovaraOpenAdmin?.();
  });
  $('#adultUnlockIdentityBtn')?.addEventListener('click', () => window.eidovaraOpenAdmin?.() || window.eidovaraSetView?.('identity'));
  if (window.speechSynthesis) {
    window.speechSynthesis.addEventListener?.('voiceschanged', () => renderVoices());
  }
}

window.eidovaraAdultSoul = {
  refresh,
  isOpen: adultSoulStudioOpen,
  onShow() { refresh(); }
};

bind();
void refresh();

