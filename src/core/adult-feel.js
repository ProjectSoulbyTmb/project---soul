// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Adult Feel desk â€” popular settings from Vibease-style pattern pads and
 * VibeMate-style private adult browsers, implemented first-party.
 *
 * Ships: XY intensity/speed, 11 pulse patterns, loop/float, media/fantasy
 * sync, sensitivity, PIN stealth, bookmark folders, wellness cards, idle blank.
 * Does not: pair Lovense/Vibease hardware, record the screen, auto-tip,
 * fingerprint, embed tubes, or scrape vendor HTML.
 */
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value)));
const slider = value => Math.round(clamp(Number.isFinite(Number(value)) ? Number(value) : 50, 0, 100));
const pick = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);

export const FEEL_HONESTY = 'Feel Sync is on-screen only: it maps local eidovara-media loudness and Adult Soul session beats to the figure, voice coach, and intensity pad. Eidovara does not pair Lovense, Vibease, or other toys, does not record the screen, does not auto-tip cam sites, and does not embed Pornhub. Hardware toys stay in their vendor app. PIN lock is local digits on this PC â€” not fingerprint or cloud. Revoke Adult Mode anytime.';

export const GAMEPAD_HONESTY = 'A connected Chromium-visible gamepad can steer this pad and dual-rumble that same controller. That is the Gamepad API â€” not Lovense, not XInput injection into a game, and not in-game haptics.';

export const FEEL_PATTERNS = Object.freeze([
  { id: 'pulse', title: 'Pulse', hint: 'Even on/off beats' },
  { id: 'wave', title: 'Wave', hint: 'Slow sine rise and fall' },
  { id: 'fireworks', title: 'Fireworks', hint: 'Bursts with quiet gaps' },
  { id: 'tease', title: 'Tease', hint: 'Mostly low, rare spikes' },
  { id: 'edge', title: 'Edge', hint: 'Climb, hold, drop' },
  { id: 'grind', title: 'Grind', hint: 'Heavy rolling pressure' },
  { id: 'flutter', title: 'Flutter', hint: 'Fast light taps' },
  { id: 'climb', title: 'Climb', hint: 'Keeps getting stronger' },
  { id: 'throb', title: 'Throb', hint: 'Heartbeat pairs' },
  { id: 'random', title: 'Random', hint: 'Unpredictable peaks' },
  { id: 'hold', title: 'Hold', hint: 'Constant float strength' }
]);

export const FEEL_PATTERN_IDS = Object.freeze(FEEL_PATTERNS.map(item => item.id));

export const FEEL_SYNC_MODES = Object.freeze([
  { id: 'off', title: 'Off', hint: 'Pad only â€” you drag intensity' },
  { id: 'media', title: 'Sync to local media', hint: 'Loudness of eidovara-media audio/video. Not a tube embed.' },
  { id: 'fantasy', title: 'Fantasy / session', hint: 'Adult Soul beats drive the pad, like a story-sync mode' },
  { id: 'voice', title: 'Voice coach', hint: 'Peaks when the OS voice is speaking' }
]);

export const FEEL_SYNC_IDS = Object.freeze(FEEL_SYNC_MODES.map(item => item.id));

export const FEEL_BLANK_MS = Object.freeze([0, 15000, 30000, 60000, 120000]);

export const BOOKMARK_FOLDERS = Object.freeze([
  { id: 'videos', title: 'Videos', hint: 'Local playable files and HTTPS pages you pasted' },
  { id: 'audio', title: 'Audio', hint: 'Moans, beds, stories you imported' },
  { id: 'sites', title: 'Sites', hint: 'Official HTTPS homepages â€” opens in the system browser' },
  { id: 'streamers', title: 'Streamers', hint: 'Creator pages you bookmarked. No live embed.' },
  { id: 'wellness', title: 'Wellness', hint: 'Local aftercare notes. Not medical advice.' }
]);

export const WELLNESS_CARDS = Object.freeze([
  { id: 'aftercare', title: 'Aftercare', body: 'Water, a blanket, and a pause. Adult Soul aftercare is a local session, not a clinician.' },
  { id: 'safeword', title: 'Safeword', body: 'Red / your safeword stops the session immediately. Consent stays revocable on Identity.' },
  { id: 'privacy', title: 'Discreet lock', body: 'A 4â€“8 digit PIN blanks Adult Soul and Adult Media on this PC. Not Windows Hello, not a vendor cloud lock.' },
  { id: 'hardware', title: 'Toys stay vendor-side', body: 'Pattern, speed, and sync here move the on-screen figure and coach. Pair hardware in Lovense Remote or Vibease if you own those toys.' },
  { id: 'browser', title: 'Adult search', body: 'Tube/creator chips open official HTTPS pages in your system browser. Guest overlays stay closed in Adult Mode.' }
]);

export function defaultAdultFeel() {
  return {
    intensity: 55,
    speed: 48,
    sensitivity: 62,
    pattern: 'wave',
    loop: true,
    float: false,
    syncMode: 'media',
    lastLevel: 0,
    stealth: defaultAdultStealth(),
    folders: defaultBookmarkFolders()
  };
}

export function defaultAdultStealth() {
  return {
    pinEnabled: false,
    pinSalt: '',
    pinHash: '',
    locked: false,
    autoBlankMs: 0,
    hideRecents: false,
    autoClearHistory: false,
    blanked: false
  };
}

export function defaultBookmarkFolders() {
  return BOOKMARK_FOLDERS.map(folder => ({ id: folder.id, title: folder.title, items: [] }));
}

export function publicStealth(input = {}) {
  const stealth = normalizeAdultStealth(input);
  return {
    pinEnabled: stealth.pinEnabled === true,
    locked: stealth.locked === true,
    autoBlankMs: stealth.autoBlankMs,
    hideRecents: stealth.hideRecents === true,
    autoClearHistory: stealth.autoClearHistory === true,
    blanked: stealth.blanked === true
  };
}

export function normalizeAdultStealth(input = {}, prior = defaultAdultStealth()) {
  const base = { ...defaultAdultStealth(), ...(prior && typeof prior === 'object' ? prior : {}) };
  const incoming = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const autoBlankMs = FEEL_BLANK_MS.includes(Number(incoming.autoBlankMs))
    ? Number(incoming.autoBlankMs)
    : (FEEL_BLANK_MS.includes(Number(base.autoBlankMs)) ? Number(base.autoBlankMs) : 0);
  return {
    pinEnabled: incoming.pinEnabled === true || incoming.pinEnabled === false ? incoming.pinEnabled === true : base.pinEnabled === true,
    pinSalt: String(incoming.pinSalt ?? base.pinSalt ?? '').replace(/[^a-f0-9]/gi, '').slice(0, 64),
    pinHash: String(incoming.pinHash ?? base.pinHash ?? '').replace(/[^a-f0-9]/gi, '').slice(0, 128),
    locked: incoming.locked === true,
    autoBlankMs,
    hideRecents: incoming.hideRecents === true,
    autoClearHistory: incoming.autoClearHistory === true,
    blanked: incoming.blanked === true || incoming.locked === true
  };
}

function normalizeFolderItem(item) {
  if (!item || typeof item !== 'object') return null;
  const title = String(item.title || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 120);
  if (!title) return null;
  const url = String(item.url || '');
  const local = /^eidovara-media:/i.test(url);
  let sourceUrl = '';
  try {
    const parsed = new URL(String(item.sourceUrl || url));
    if (parsed.protocol === 'https:' && !parsed.username && !parsed.password) sourceUrl = parsed.toString().slice(0, 1000);
  } catch {}
  if (!local && !sourceUrl) return null;
  return {
    id: String(item.id || `bm_${Math.random().toString(36).slice(2, 10)}`).slice(0, 40),
    title,
    url: local ? url.slice(0, 400) : '',
    sourceUrl,
    type: item.type === 'video' ? 'video' : (item.type === 'site' ? 'site' : 'audio')
  };
}

export function normalizeBookmarkFolders(input) {
  const incoming = Array.isArray(input) ? input : [];
  return BOOKMARK_FOLDERS.map(meta => {
    const found = incoming.find(folder => folder && folder.id === meta.id) || {};
    const items = Array.isArray(found.items) ? found.items.map(normalizeFolderItem).filter(Boolean).slice(0, 40) : [];
    return { id: meta.id, title: meta.title, items };
  });
}

export function normalizeAdultFeel(input = {}, prior = defaultAdultFeel()) {
  const base = { ...defaultAdultFeel(), ...(prior && typeof prior === 'object' ? prior : {}) };
  const incoming = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  return {
    intensity: slider(incoming.intensity ?? base.intensity),
    speed: slider(incoming.speed ?? base.speed),
    sensitivity: slider(incoming.sensitivity ?? base.sensitivity),
    pattern: pick(incoming.pattern || base.pattern, FEEL_PATTERN_IDS, 'wave'),
    loop: incoming.loop !== false,
    float: incoming.float === true,
    syncMode: pick(incoming.syncMode || base.syncMode, FEEL_SYNC_IDS, 'media'),
    lastLevel: Math.round(clamp(Number(incoming.lastLevel ?? base.lastLevel) || 0, 0, 1) * 1000) / 1000,
    stealth: normalizeAdultStealth(incoming.stealth, base.stealth),
    folders: normalizeBookmarkFolders(incoming.folders || base.folders)
  };
}

export function migrateAdultFeel(input) {
  return normalizeAdultFeel(input);
}

function hash01(n) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function feelSample(feelInput, tMs = 0, audioLevel = 0) {
  const feel = normalizeAdultFeel(feelInput);
  const t = Math.max(0, Number(tMs) || 0) / 1000;
  const speed = 0.25 + (feel.speed / 100) * 2.4;
  const intensity = feel.intensity / 100;
  const sensitivity = 0.35 + (feel.sensitivity / 100) * 1.3;
  const audio = clamp(Number(audioLevel) || 0, 0, 1);
  const phase = t * speed;
  let wave = 0.5;
  switch (feel.pattern) {
    case 'pulse':
      wave = (phase % 1) < 0.45 ? 1 : 0.12;
      break;
    case 'wave':
      wave = 0.5 + 0.5 * Math.sin(phase * Math.PI * 2);
      break;
    case 'fireworks':
      wave = Math.pow(Math.max(0, Math.sin(phase * Math.PI * 2)), 8) * 0.85 + 0.08;
      break;
    case 'tease':
      wave = 0.16 + (hash01(Math.floor(phase * 3)) > 0.82 ? 0.7 : 0.05 * Math.sin(phase * 9));
      break;
    case 'edge': {
      const cycle = phase % 4;
      if (cycle < 2.2) wave = cycle / 2.2;
      else if (cycle < 3.1) wave = 1;
      else wave = Math.max(0.08, 1 - (cycle - 3.1) * 1.1);
      break;
    }
    case 'grind':
      wave = 0.45 + 0.35 * Math.sin(phase * Math.PI) + 0.12 * Math.sin(phase * Math.PI * 4);
      break;
    case 'flutter':
      wave = 0.2 + 0.55 * Math.abs(Math.sin(phase * Math.PI * 8));
      break;
    case 'climb':
      wave = 0.12 + 0.88 * ((phase / 8) % 1);
      break;
    case 'throb':
      wave = 0.18 + 0.82 * Math.pow(Math.max(0, Math.sin(phase * Math.PI * 2)), 2);
      break;
    case 'random':
      wave = 0.1 + 0.9 * hash01(Math.floor(phase * 6) + feel.intensity);
      break;
    case 'hold':
      wave = 1;
      break;
    default:
      wave = 0.5;
  }
  if (feel.float || feel.pattern === 'hold') wave = 1;
  if (feel.loop !== true && feel.pattern === 'climb' && phase > 8) wave = 1;
  let level = clamp(wave * intensity, 0, 1);
  if (feel.syncMode === 'media' || feel.syncMode === 'voice') {
    level = clamp(level * (0.25 + audio * sensitivity), 0, 1);
  } else if (feel.syncMode === 'fantasy') {
    level = clamp(level * (0.45 + audio * 0.7), 0, 1);
  }
  return Math.round(level * 1000) / 1000;
}

export function feelToPace(level) {
  const n = clamp(Number(level) || 0, 0, 1);
  if (n < 0.08) return 'stop';
  if (n < 0.34) return 'slow';
  if (n < 0.72) return 'medium';
  return 'fast';
}

export function nextFeelPattern(id) {
  const current = String(id || '');
  const index = FEEL_PATTERN_IDS.indexOf(current);
  const next = index < 0 ? 0 : (index + 1) % FEEL_PATTERN_IDS.length;
  return FEEL_PATTERN_IDS[next];
}

export function mapGamepadStick(axes, prior = {}) {
  const ax = Number(axes && axes[0]) || 0;
  const ay = Number(axes && axes[1]) || 0;
  const speedPrior = Math.round(clamp(Number(prior.speed) || 48, 0, 100));
  const intensityPrior = Math.round(clamp(Number(prior.intensity) || 55, 0, 100));
  if (Math.hypot(ax, ay) < 0.2) {
    return { speed: speedPrior, intensity: intensityPrior, moved: false };
  }
  return {
    speed: Math.round(clamp((ax + 1) * 50, 0, 100)),
    intensity: Math.round(clamp((1 - ay) * 50, 0, 100)),
    moved: true
  };
}

export function mapGamepadButtons(buttons, priorPressed = {}) {
  const down = index => Boolean(buttons && buttons[index] && buttons[index].pressed);
  const was = index => Boolean(priorPressed && priorPressed[index]);
  return {
    cyclePattern: down(0) && !was(0),
    toggleFloat: down(1) && !was(1),
    stopSession: down(9) && !was(9)
  };
}

export function rumbleFromLevel(level) {
  const n = clamp(Number(level) || 0, 0, 1);
  return {
    duration: 140,
    strongMagnitude: Math.round(n * 0.72 * 1000) / 1000,
    weakMagnitude: Math.round(n * 0.42 * 1000) / 1000
  };
}

export function addBookmarkToFolder(feelInput, folderId, item) {
  const feel = normalizeAdultFeel(feelInput);
  const clip = normalizeFolderItem(item);
  if (!clip) throw new Error('Bookmark needs a title and a local eidovara-media file or https:// page.');
  const folders = feel.folders.map(folder => {
    if (folder.id !== folderId) return folder;
    const rest = folder.items.filter(row => (row.url || row.sourceUrl) !== (clip.url || clip.sourceUrl));
    return { ...folder, items: [clip, ...rest].slice(0, 40) };
  });
  return { ...feel, folders };
}

export function classifyAdultFeelIntent(input) {
  const t = String(input || '').toLowerCase();
  if (!t.trim()) return '';
  if (/\b(?:feel pad|vibe pad|pattern pad|toy metronome|pulse pattern|sync to (?:video|audio|music|media)|adult pin|stealth lock|discreet lock|bookmark folder|adult wellness)\b/.test(t)) {
    return 'adult-soul';
  }
  if (/\b(?:vibemate|vibease|lovense)\b/.test(t) && /\b(?:setting|sync|pattern|pin|bookmark|browser)\b/.test(t)) {
    return 'adult-soul';
  }
  return '';
}

export function adultFeelReply(feelInput) {
  const feel = normalizeAdultFeel(feelInput);
  const pattern = FEEL_PATTERNS.find(item => item.id === feel.pattern)?.title || feel.pattern;
  return `Feel Sync is ${feel.syncMode === 'off' ? 'manual' : feel.syncMode}. Pattern ${pattern}, intensity ${feel.intensity}, speed ${feel.speed}, sensitivity ${feel.sensitivity}. ${FEEL_HONESTY}`;
}

