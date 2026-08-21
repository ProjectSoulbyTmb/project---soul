// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SoulEngine } from '../src/core/engine.js';
import { JsonStore } from '../src/core/store.js';
import {
  blockedEngines, engineById, ENGINE_HONESTY, probeRendererEngines, runtimeEngineCatalog, shippedEngines
} from '../src/core/runtime-engines.js';
import { ambientLevels, AMBIENT_ENGINE, AMBIENT_HONESTY } from '../src/core/adult-ambient.js';
import { FUTURE_VOICE_BACKEND } from '../src/core/voices.js';
import { FIGURE_BACKEND } from '../src/core/adult-mesh.js';
import { officialSearchHandoffs } from '../src/core/entertainment.js';

const read = file => fs.readFileSync(file, 'utf8');
function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'eidovara-engines-')); }

test('runtime catalog ships first-party Chromium engines and keeps blocked adapters off', () => {
  const catalog = runtimeEngineCatalog();
  const ids = catalog.map(item => item.id);
  for (const id of [
    'soul-kernel', 'webgl-lathe', 'cpu-figure-life', 'web-audio-feel', 'procedural-ambient',
    'chromium-html5-media', 'media-session', 'os-speech-synthesis', 'electron-power-save',
    'gamepad-feel', 'webgpu-probe'
  ]) {
    assert.ok(ids.includes(id), id);
    assert.equal(engineById(id).blocked, false, id);
  }
  assert.ok(shippedEngines().length >= 10);
  for (const id of ['neural-tts', 'vrm-makehuman', 'scene-frameworks', 'obs-websocket', 'toy-hardware']) {
    const row = engineById(id);
    assert.equal(row.shipped, false, id);
    assert.equal(row.bundled, false, id);
    assert.equal(row.blocked, true, id);
  }
  assert.equal(FUTURE_VOICE_BACKEND.bundled, false);
  assert.match(FUTURE_VOICE_BACKEND.note, /does not ship a neural TTS engine/i);
  assert.equal(FIGURE_BACKEND.vrm, false);
  assert.equal(FIGURE_BACKEND.makeHuman, false);
  assert.equal(AMBIENT_ENGINE.neuralTts, false);
  assert.match(ENGINE_HONESTY, /does not ship neural TTS/i);
  assert.match(AMBIENT_HONESTY, /Web Audio/i);
  assert.equal(blockedEngines().every(item => item.bundled === false), true);
});

test('renderer engine probe is fail-closed without browser hosts', () => {
  const empty = probeRendererEngines({});
  assert.equal(empty.webAudio, false);
  assert.equal(empty.webgpu, false);
  assert.equal(empty.connectedGamepads, 0);
  const fake = probeRendererEngines({
    AudioContext: function AudioContext() {},
    speechSynthesis: {},
    SpeechRecognition: function SpeechRecognition() {},
    document: { pictureInPictureEnabled: true },
    navigator: {
      mediaSession: {},
      wakeLock: {},
      gpu: {},
      getGamepads: () => [{ id: 'pad' }, null]
    }
  });
  assert.equal(fake.webAudio, true);
  assert.equal(fake.speechSynthesis, true);
  assert.equal(fake.speechRecognition, true);
  assert.equal(fake.mediaSession, true);
  assert.equal(fake.wakeLock, true);
  assert.equal(fake.webgpu, true);
  assert.equal(fake.connectedGamepads, 1);
});

test('kernel status exposes the engine catalog', () => {
  const s = new SoulEngine({ store: new JsonStore({ dataDir: tmp() }) });
  const kernel = s.kernelStatus();
  assert.ok(Array.isArray(kernel.engines));
  assert.equal(kernel.engines.find(item => item.id === 'neural-tts').bundled, false);
  assert.equal(kernel.futureVoiceBackend.bundled, false);
  assert.match(kernel.engineHonesty, /Soul kernel/);
});

test('procedural ambient envelopes stay in 0–1 and honor mute', () => {
  const live = ambientLevels(800, { ambient: { heartbeat: true, breath: true, drone: true }, mix: { ambient: 80 }, mute: false }, 0.6);
  assert.ok(live.heartbeat >= 0 && live.heartbeat <= 1);
  assert.ok(live.breath >= 0 && live.breath <= 1);
  assert.ok(live.drone >= 0 && live.drone <= 1);
  assert.ok(live.bpm >= 52 && live.bpm <= 90);
  const muted = ambientLevels(800, { ambient: { heartbeat: true, breath: true, drone: true }, mix: { ambient: 80 }, mute: true }, 0.6);
  assert.equal(muted.heartbeat, 0);
  assert.equal(muted.breath, 0);
  assert.equal(muted.drone, 0);
  const off = ambientLevels(400, { ambient: { heartbeat: false, breath: false, drone: false }, mix: { ambient: 100 } }, 1);
  assert.equal(off.heartbeat, 0);
  assert.equal(off.breath, 0);
  assert.equal(off.drone, 0);
});

test('Saturn official search handoffs stay YouTube, Spotify, Archive', () => {
  assert.deepEqual(officialSearchHandoffs('Saturn').map(item => item.provider), ['YouTube', 'Spotify', 'Internet Archive']);
});

test('blocked engines are not imported and stay-awake uses Electron powerSaveBlocker', () => {
  const pkg = read('package.json');
  const imports = [
    'src/core/runtime-engines.js', 'src/core/adult-ambient.js', 'src/renderer/adult-ambient.js',
    'src/renderer/runtime-chrome.js', 'src/electron/main.js', 'src/renderer/adult-soul-app.js'
  ].map(read).join('\n');
  assert.doesNotMatch(imports, /\bimport\s+.+from\s+['"]three['"]|\bimport\s+.+from\s+['"]@pixiv\/three-vrm|\bimport\s+.+from\s+['"]babylonjs|\bimport\s+.+from\s+['"]kokoro|\brequire\(['"]ffmpeg/);
  assert.match(read('src/core/voices.js'), /does not ship a neural TTS engine/i);
  assert.match(read('src/electron/main.js'), /powerSaveBlocker\.start\('prevent-display-sleep'\)/);
  assert.match(read('src/electron/preload.cjs'), /stayAwake:/);
  assert.match(read('src/renderer/index.html'), /id="adultAmbientHeartbeat"/);
  assert.match(read('src/renderer/index.html'), /id="adultGamepadStatus"/);
  assert.match(pkg, /"version": "0\.19\.1"/);
  assert.doesNotMatch(pkg, /"react"|"vue"|"three"|"babylonjs"/);
});
