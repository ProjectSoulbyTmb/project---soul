// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Honest inventory of engines and frameworks Eidovara actually ships versus
 * adapters that stay document-only. Vanilla Electron ESM â€” no React/Vue/Three.js.
 */

export const ENGINE_RESEARCH_DATE = '2026-08-21';

const row = (id, title, kind, extra = {}) =>
  Object.freeze({
    id,
    title,
    kind,
    shipped: extra.shipped !== false,
    bundled: extra.bundled === true,
    blocked: extra.blocked === true,
    note: extra.note || '',
  });

const ROWS = [
  row('soul-kernel', 'Soul kernel', 'first-party', {
    bundled: true,
    note: 'In-app session kernel, module registry, and local self-model JSON. Software, not consciousness.',
  }),
  row('offline-soul', 'Offline Soul', 'first-party', {
    bundled: true,
    note: 'Local replies without a cloud account. Optional Ollama / OpenAI-compatible HTTP stay user-pasted.',
  }),
  row('webgl-lathe', 'Adult Soul WebGL lathe', 'first-party', {
    bundled: true,
    note: 'First-party WebGL2/WebGL shaders plus a canvas fallback. Not VRM, Three.js, or Babylon.',
  }),
  row('cpu-figure-life', 'Figure life deform', 'first-party', {
    bundled: true,
    note: 'CPU vertex posing of the lathe mesh. Not Mixamo, mocap, or a licensed character pack.',
  }),
  row('web-audio-feel', 'Web Audio Feel Sync', 'chromium', {
    bundled: true,
    note: 'Chromium AudioContext analyser maps eidovara-media loudness onto the Feel pad. One MediaElementSource per element.',
  }),
  row('procedural-ambient', 'Heartbeat / breath / drone', 'first-party', {
    bundled: true,
    note: 'OscillatorNode and filtered noise beds. Not a neural TTS pack and not imported moans.',
  }),
  row('chromium-html5-media', 'Chromium HTML5 media', 'chromium', {
    bundled: true,
    note: 'audio/video through eidovara-media: and https:. No ffmpeg, yt-dlp, Widevine rip, or in-process tube embeds.',
  }),
  row('media-session', 'Media Session', 'chromium', {
    bundled: true,
    note: 'Hardware media keys and now-playing metadata. Not an OS-wide hotkey into other apps.',
  }),
  row('os-speech-synthesis', 'OS speechSynthesis', 'os', {
    bundled: false,
    note: 'Voices already installed on Windows, including Microsoft Natural when the OS provided them. Eidovara does not ship a neural TTS engine.',
  }),
  row('chromium-speech-recognition', 'SpeechRecognition', 'chromium', {
    bundled: false,
    note: 'Optional hold-to-talk dictation. Microphone permission stays audio-only.',
  }),
  row('electron-power-save', 'Stay-awake', 'electron', {
    bundled: true,
    note: 'Electron powerSaveBlocker prevent-display-sleep during local playback or Adult Soul sessions. Fail closed. Not a system overlay.',
  }),
  row('gamepad-feel', 'Gamepad Feel (optional)', 'chromium', {
    bundled: false,
    note: 'Chromium Gamepad API can steer the on-screen Feel pad and dual-rumble that same controller. Not Lovense, not XInput game injection, not in-game haptics.',
  }),
  row('webgpu-probe', 'WebGPU probe', 'chromium', {
    bundled: false,
    note: 'Diagnostics only. The Adult Soul figure stays on WebGL2/WebGL. No Three.js/WebGPU scene graph.',
  }),
  row('electron-updater', 'GitHub updater', 'electron', {
    bundled: true,
    note: 'electron-updater against GitHub Releases. Authenticode-unsigned. Advertised live installer stays the tagged Setup.exe.',
  }),
  row('neural-tts', 'Neural TTS packs', 'blocked', {
    shipped: false,
    bundled: false,
    blocked: true,
    note: 'Kokoro, Piper, sherpa-onnx, ElevenLabs, and cloud voice APIs are not vendored.',
  }),
  row('vrm-makehuman', 'VRM / MakeHuman', 'blocked', {
    shipped: false,
    bundled: false,
    blocked: true,
    note: 'three-vrm, VRoid Hub, and the MakeHuman program are not bundled. Future MakeHuman CC0 exports stay a documented adapter only.',
  }),
  row('scene-frameworks', 'Three.js / Babylon / Godot / Unity / React', 'blocked', {
    shipped: false,
    bundled: false,
    blocked: true,
    note: 'The desktop workspace stays vanilla JS ESM. No UI-framework rewrite and no third-party game engine.',
  }),
  row('obs-websocket', 'OBS websocket', 'blocked', {
    shipped: false,
    bundled: false,
    blocked: true,
    note: 'Stream helper may store a planning URL. Eidovara does not control OBS.',
  }),
  row('toy-hardware', 'Lovense / Vibease hardware', 'blocked', {
    shipped: false,
    bundled: false,
    blocked: true,
    note: 'Feel Sync is on-screen (and optional Chromium gamepad rumble). Pair toys in their vendor apps.',
  }),
];

export function runtimeEngineCatalog() {
  return ROWS.map(item => ({ ...item }));
}

export function shippedEngines() {
  return runtimeEngineCatalog().filter(item => item.shipped);
}

export function blockedEngines() {
  return runtimeEngineCatalog().filter(item => item.blocked);
}

export function engineById(id) {
  return runtimeEngineCatalog().find(item => item.id === String(id || '')) || null;
}

export function probeRendererEngines(host = {}) {
  const nav = host && typeof host === 'object' && host.navigator ? host.navigator : {};
  const gamepads =
    typeof nav.getGamepads === 'function' ? [...nav.getGamepads()].filter(Boolean).length : 0;
  return {
    webAudio: Boolean(host.AudioContext || host.webkitAudioContext),
    speechSynthesis: Boolean(host.speechSynthesis),
    speechRecognition: Boolean(host.SpeechRecognition || host.webkitSpeechRecognition),
    mediaSession: Boolean(nav.mediaSession),
    gamepadApi: typeof nav.getGamepads === 'function',
    connectedGamepads: gamepads,
    wakeLock: Boolean(nav.wakeLock),
    webgpu: Boolean(nav.gpu),
    pictureInPicture: Boolean(host.document && 'pictureInPictureEnabled' in host.document),
  };
}

export const ENGINE_HONESTY =
  'Eidovara ships a first-party Soul kernel, WebGL lathe, Web Audio Feel, procedural ambient beds, Chromium HTML5 media, OS speechSynthesis, optional SpeechRecognition, Media Session, Electron stay-awake, and an optional Chromium gamepad for the Feel pad. It does not ship neural TTS, VRM, Three.js, Babylon, React, ffmpeg, OBS websocket control, or Lovense hardware.';
