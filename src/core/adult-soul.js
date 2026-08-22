// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import { adultAllowed } from './policy.js';
import { uid } from './schema.js';
import {
  clothingIds,
  FANTASY_FRAMEWORKS,
  SEXY_STYLES,
  ATMOSPHERE_SCENES,
  SEX_OPTIONS,
  SHOW_REACTIONS,
  SHOW_HONESTY,
  sexyStylePatch,
  frameworkSkin,
  WARDROBE,
} from './adult-show.js';
import {
  defaultAdultFeel,
  normalizeAdultFeel,
  publicStealth,
  FEEL_HONESTY,
  GAMEPAD_HONESTY,
  FEEL_PATTERNS,
  FEEL_SYNC_MODES,
  BOOKMARK_FOLDERS,
  WELLNESS_CARDS,
  classifyAdultFeelIntent,
  adultFeelReply,
} from './adult-feel.js';
import { AMBIENT_HONESTY, AMBIENT_ENGINE } from './adult-ambient.js';
import { runtimeEngineCatalog } from './runtime-engines.js';

export const ADULT_APPEARANCE_MIN_YEARS = 21;
export const ADULT_SOUL_KIND = 'adult-soul-studio';

const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value)));
const slider = value =>
  Math.round(clamp(Number.isFinite(Number(value)) ? Number(value) : 50, 0, 100));
const pick = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);

export const HAIR_STYLES = Object.freeze([
  'pixie',
  'crop',
  'shoulder',
  'long-wave',
  'high-tail',
  'loose-bun',
  'shaved-sides',
  'undercut',
  'braids',
  'fade',
  'long-straight',
  'curly-crown',
]);
export const CLOTHING = Object.freeze(clothingIds());
export const BODY_PRESENTATIONS = Object.freeze(['feminine', 'masculine', 'androgynous']);
export {
  FANTASY_FRAMEWORKS,
  SEXY_STYLES,
  ATMOSPHERE_SCENES,
  SEX_OPTIONS,
  SHOW_REACTIONS,
  SHOW_HONESTY,
  WARDROBE,
};
export const PERSONA_STYLES = Object.freeze([
  'slow-burn',
  'playful',
  'direct',
  'filthy',
  'worship',
  'aftercare',
]);
export const DISCOVERY_MOODS = Object.freeze([
  'stroke',
  'edge',
  'filthy',
  'worship',
  'audio-only',
  'aftercare',
]);
export const POWER_ROLES = Object.freeze(['switch', 'dominant', 'submissive']);
export const CAMERA_SHOTS = Object.freeze(['full', 'face', 'chest', 'hips', 'ass', 'crotch']);
export const ROLEPLAY_SCENES = Object.freeze([
  'none',
  'roommate',
  'bar-stranger',
  'after-hours',
  'long-distance',
  'cam-show',
]);
export const SESSION_KINDS = Object.freeze([
  'stroke-guide',
  'edge-hold',
  'slow-burn',
  'filthy-talk',
  'worship',
  'hands-free-audio',
  'countdown-finish',
  'aftercare',
  'striptease',
  'mutual-guide',
  'praise-kink',
  'tease-deny',
  'toy-pace',
  'ass-focus',
  'chest-focus',
  'eye-lock',
  'pillow-talk',
  'pose-play',
  'random-mix',
  'whisper-only',
  'voyeur-watch',
  'cam-night',
  'afterglow-hold',
]);

export const QUICK_COMMANDS = Object.freeze([
  { id: 'faster', title: 'Faster', hint: 'Speed the stroke / grind' },
  { id: 'slower', title: 'Slower', hint: 'Drop to a tease pace' },
  { id: 'hold', title: 'Hold / edge', hint: 'Freeze on the edge' },
  { id: 'come', title: 'Come', hint: 'Climax cue — still your body' },
  { id: 'strip', title: 'Strip a layer', hint: 'Wrapped → bare on the figure' },
  { id: 'pose', title: 'Next pose', hint: 'Cycle sexual behaviors' },
  { id: 'camera', title: 'Next camera', hint: 'Full / face / chest / hips / ass / crotch' },
  { id: 'touch-moan', title: 'React', hint: 'Short OS-voice reaction' },
  { id: 'yellow', title: 'Yellow', hint: 'Traffic-light slow-down' },
  { id: 'red', title: 'Red / safeword', hint: 'Stop the session immediately' },
]);

export const LOOK_PRESETS = Object.freeze([
  {
    id: 'hourglass',
    title: 'Hourglass adult',
    figure: {
      height: 58,
      shoulders: 46,
      bust: 78,
      chest: 44,
      waist: 28,
      hips: 82,
      thighs: 70,
      butt: 76,
      belly: 22,
      posture: 62,
    },
  },
  {
    id: 'athletic',
    title: 'Athletic adult',
    figure: {
      height: 64,
      shoulders: 70,
      bust: 48,
      chest: 72,
      waist: 42,
      hips: 58,
      thighs: 66,
      butt: 58,
      belly: 18,
      posture: 70,
    },
  },
  {
    id: 'soft-curve',
    title: 'Soft curve adult',
    figure: {
      height: 52,
      shoulders: 44,
      bust: 72,
      chest: 50,
      waist: 48,
      hips: 78,
      thighs: 74,
      butt: 80,
      belly: 46,
      posture: 48,
    },
  },
  {
    id: 'statuesque',
    title: 'Statuesque adult',
    figure: {
      height: 82,
      shoulders: 60,
      bust: 64,
      chest: 58,
      waist: 36,
      hips: 68,
      thighs: 62,
      butt: 64,
      belly: 24,
      posture: 72,
    },
  },
  {
    id: 'compact-adult',
    title: 'Compact adult',
    figure: {
      height: 36,
      shoulders: 50,
      bust: 60,
      chest: 48,
      waist: 40,
      hips: 66,
      thighs: 58,
      butt: 62,
      belly: 30,
      posture: 52,
    },
  },
  {
    id: 'broad',
    title: 'Broad adult',
    figure: {
      height: 70,
      shoulders: 82,
      bust: 42,
      chest: 78,
      waist: 58,
      hips: 64,
      thighs: 70,
      butt: 60,
      belly: 40,
      posture: 58,
    },
  },
]);

const FORBIDDEN =
  /\b(?:child|children|minor|minors|underage|under[\s-]?age|loli|lolita|shota|shotacon|jailbait|preteen|pre-teen|toddler|infant|baby|pedophil|hebephil|schoolgirl|schoolboy|young[\s-]?teen)\b/i;
const BEHAVIOR_CYCLE = Object.freeze([
  'idle-breathe',
  'eye-contact',
  'hip-sway',
  'present-body',
  'slow-undulate',
  'grind',
  'stroke-pose',
  'edge-hold',
  'on-back-present',
  'all-fours',
  'ride',
  'worship-pose',
  'hands-free',
  'striptease',
  'chest-bounce',
  'ass-present',
  'spread',
  'kiss-lean',
]);

export function adultTextForbidden(value) {
  return FORBIDDEN.test(String(value || ''));
}

export function assertAdultSafeText(value, label = 'That field') {
  const text = String(value || '').trim();
  if (adultTextForbidden(text)) {
    throw new Error(
      `${label} cannot describe minors, age-ambiguous characters, or prohibited sexualization.`
    );
  }
  return text;
}

export function defaultAdultAvatar() {
  return {
    appearanceYears: ADULT_APPEARANCE_MIN_YEARS,
    presentation: 'feminine',
    framework: 'human',
    sexyStyle: 'natural',
    figure: {
      height: 56,
      shoulders: 48,
      bust: 62,
      chest: 42,
      waist: 38,
      hips: 70,
      thighs: 64,
      butt: 68,
      belly: 28,
      posture: 55,
    },
    head: {
      faceWidth: 48,
      jaw: 42,
      cheekbones: 58,
      lips: 64,
      mouthWidth: 52,
      eyeSize: 54,
      eyeSpacing: 50,
      brow: 46,
      nose: 48,
    },
    hair: { style: 'long-wave', length: 72, color: '#2b1b14', highlight: '#6a3a28' },
    skin: { tone: '#c99578', blush: 42, sheen: 38, tan: 30 },
    presentationWear: 'lingerie',
    makeup: { lids: 40, liner: 35, blush: 45, lips: 55 },
    nails: 40,
    bodyHair: 18,
    motion: { breath: 55, sway: 48, eyeContact: 70, idle: 50 },
    explicit: { nipples: 70, groin: 55, assFocus: 60 },
    render: { quality: 'ultra', lighting: 'studio', autoRotate: true },
  };
}

export function defaultAdultSounds() {
  return {
    voiceEnabled: true,
    mute: false,
    rate: 0.92,
    pitch: 1.12,
    voiceURI: '',
    ambient: { heartbeat: true, breath: true, drone: true },
    mix: { voice: 80, clip: 70, ambient: 45 },
    clips: [],
    activeClipId: '',
    coachVoiceURI: '',
    whisperVoiceURI: '',
    presetId: 'intimate-low-fem',
    intimacy: 72,
    dualVoice: true,
    favoriteURIs: [],
  };
}

export function defaultAdultPersona() {
  return {
    name: 'Adult Soul',
    heat: 72,
    style: 'direct',
    verbal: { praise: true, filthy: true, tease: true, count: true, moanReact: true },
    discoveryMood: 'stroke',
    power: 'switch',
    nickname: '',
    roleplay: 'none',
    honestLabel:
      'Adult Soul is a separate software persona on this PC — not a person, not consciousness, and not the standard workspace Soul.',
  };
}

export function defaultAdultStage() {
  return {
    camera: 'full',
    cinematic: false,
    slowMo: false,
    mirror: false,
    behaviorOverride: '',
    arousal: 35,
    wetness: 22,
    oil: 18,
    loop: false,
    autoAftercare: true,
    autoStrip: false,
    playlist: [],
    playlistIndex: 0,
    safeword: 'red',
    lastTouch: '',
    speaking: false,
    atmosphere: 'bedroom',
    theater: false,
  };
}

export function defaultAdultStats() {
  return { sessions: 0, finishes: 0, edges: 0, strips: 0, touches: 0 };
}

export function defaultAdultSoul() {
  return {
    schema: 3,
    kind: ADULT_SOUL_KIND,
    active: false,
    avatar: defaultAdultAvatar(),
    sounds: defaultAdultSounds(),
    persona: defaultAdultPersona(),
    stage: defaultAdultStage(),
    feel: defaultAdultFeel(),
    looks: [],
    stats: defaultAdultStats(),
    session: idleSession(),
    updatedAt: null,
  };
}

export function idleSession() {
  return {
    kind: '',
    active: false,
    startedAt: null,
    durationMs: 0,
    beatIndex: 0,
    beats: [],
    note: '',
    pace: 'medium',
    heat: 45,
    behavior: 'idle-breathe',
    camera: 'full',
  };
}

export function nextClothing(wear, direction = 1) {
  const i = Math.max(0, CLOTHING.indexOf(wear));
  const next = i + (direction >= 0 ? 1 : -1);
  return CLOTHING[Math.max(0, Math.min(CLOTHING.length - 1, next))];
}

export function normalizeAdultAvatar(input = {}, prior = defaultAdultAvatar()) {
  const base = { ...defaultAdultAvatar(), ...(prior || {}) };
  const incoming = input && typeof input === 'object' ? input : {};
  const figureIn = { ...base.figure, ...(incoming.figure || {}) };
  const headIn = { ...base.head, ...(incoming.head || {}) };
  const hairIn = { ...base.hair, ...(incoming.hair || {}) };
  const skinIn = { ...base.skin, ...(incoming.skin || {}) };
  const makeupIn = { ...base.makeup, ...(incoming.makeup || {}) };
  const motionIn = { ...base.motion, ...(incoming.motion || {}) };
  const explicitIn = { ...base.explicit, ...(incoming.explicit || {}) };
  const color = (value, fallback) => {
    const raw = String(value || fallback || '').trim();
    return /^#[0-9a-fA-F]{6}$/.test(raw) ? raw.toLowerCase() : fallback;
  };
  const framework = pick(
    incoming.framework || base.framework,
    FANTASY_FRAMEWORKS.map(item => item.id),
    'human'
  );
  const sexyStyle = pick(
    incoming.sexyStyle || base.sexyStyle,
    SEXY_STYLES.map(item => item.id),
    'natural'
  );
  const presentation = pick(
    incoming.presentation || incoming.sex || base.presentation,
    BODY_PRESENTATIONS,
    'feminine'
  );
  return {
    appearanceYears: ADULT_APPEARANCE_MIN_YEARS,
    presentation,
    framework,
    sexyStyle,
    figure: {
      height: slider(figureIn.height),
      shoulders: slider(figureIn.shoulders),
      bust: slider(figureIn.bust),
      chest: slider(figureIn.chest),
      waist: slider(figureIn.waist),
      hips: slider(figureIn.hips),
      thighs: slider(figureIn.thighs),
      butt: slider(figureIn.butt),
      belly: slider(figureIn.belly),
      posture: slider(figureIn.posture),
    },
    head: {
      faceWidth: slider(headIn.faceWidth),
      jaw: slider(headIn.jaw),
      cheekbones: slider(headIn.cheekbones),
      lips: slider(headIn.lips),
      mouthWidth: slider(headIn.mouthWidth),
      eyeSize: slider(headIn.eyeSize),
      eyeSpacing: slider(headIn.eyeSpacing),
      brow: slider(headIn.brow),
      nose: slider(headIn.nose),
    },
    hair: {
      style: pick(hairIn.style, HAIR_STYLES, 'long-wave'),
      length: slider(hairIn.length),
      color: color(hairIn.color, base.hair.color),
      highlight: color(hairIn.highlight, base.hair.highlight),
    },
    skin: frameworkSkin(framework, {
      tone: color(skinIn.tone, base.skin.tone),
      blush: slider(skinIn.blush),
      sheen: slider(skinIn.sheen),
      tan: slider(skinIn.tan),
    }),
    presentationWear: pick(
      incoming.presentationWear || base.presentationWear,
      CLOTHING,
      'lingerie'
    ),
    makeup: {
      lids: slider(makeupIn.lids),
      liner: slider(makeupIn.liner),
      blush: slider(makeupIn.blush),
      lips: slider(makeupIn.lips),
    },
    nails: slider(incoming.nails ?? base.nails),
    bodyHair: slider(incoming.bodyHair ?? base.bodyHair),
    motion: {
      breath: slider(motionIn.breath),
      sway: slider(motionIn.sway),
      eyeContact: slider(motionIn.eyeContact),
      idle: slider(motionIn.idle),
    },
    explicit: {
      nipples: slider(explicitIn.nipples),
      groin: slider(explicitIn.groin),
      assFocus: slider(explicitIn.assFocus),
    },
    render: {
      quality: pick(
        (incoming.render || base.render || {}).quality,
        ['ultra', 'high', 'performance'],
        'ultra'
      ),
      lighting: pick(
        (incoming.render || base.render || {}).lighting,
        ['studio', 'club', 'soft', 'neon', 'bedroom'],
        'studio'
      ),
      autoRotate: (incoming.render || base.render || {}).autoRotate !== false,
    },
  };
}

export function normalizeAdultSounds(input = {}, prior = defaultAdultSounds()) {
  const base = { ...defaultAdultSounds(), ...(prior || {}) };
  const incoming = input && typeof input === 'object' ? input : {};
  const mixIn = { ...base.mix, ...(incoming.mix || {}) };
  const ambientIn = { ...base.ambient, ...(incoming.ambient || {}) };
  const clips = Array.isArray(incoming.clips) ? incoming.clips : base.clips || [];
  const cleanClips = clips
    .slice(0, 64)
    .map(clip => {
      if (!clip || typeof clip !== 'object') return null;
      const title =
        assertAdultSafeText(clip.title || 'Local clip', 'Sound clip title').slice(0, 120) ||
        'Local clip';
      const id = String(clip.id || '')
        .replace(/[^a-f0-9]/g, '')
        .slice(0, 32);
      const url = String(clip.url || '');
      if (!id || !/^eidovara-media:\/\//i.test(url)) return null;
      return { id, title, url: url.slice(0, 220), kind: 'audio' };
    })
    .filter(Boolean);
  const active = cleanClips.some(clip => clip.id === incoming.activeClipId)
    ? incoming.activeClipId
    : cleanClips[0]?.id || '';
  return {
    voiceEnabled: incoming.voiceEnabled !== false,
    mute: incoming.mute === true,
    rate: Math.round(clamp(Number(incoming.rate ?? base.rate) || 0.92, 0.5, 2) * 100) / 100,
    pitch: Math.round(clamp(Number(incoming.pitch ?? base.pitch) || 1.12, 0.5, 2) * 100) / 100,
    voiceURI: String(incoming.voiceURI ?? base.voiceURI ?? '').slice(0, 300),
    coachVoiceURI: String(
      incoming.coachVoiceURI ?? incoming.voiceURI ?? base.coachVoiceURI ?? base.voiceURI ?? ''
    ).slice(0, 300),
    whisperVoiceURI: String(incoming.whisperVoiceURI ?? base.whisperVoiceURI ?? '').slice(0, 300),
    presetId: String(incoming.presetId ?? base.presetId ?? 'intimate-low-fem').slice(0, 40),
    intimacy: slider(incoming.intimacy ?? base.intimacy ?? 72),
    dualVoice: incoming.dualVoice !== false,
    favoriteURIs: Array.isArray(incoming.favoriteURIs)
      ? incoming.favoriteURIs
          .map(item => String(item || '').slice(0, 300))
          .filter(Boolean)
          .slice(0, 40)
      : base.favoriteURIs || [],
    ambient: {
      heartbeat: ambientIn.heartbeat !== false,
      breath: ambientIn.breath !== false,
      drone: ambientIn.drone !== false,
    },
    mix: { voice: slider(mixIn.voice), clip: slider(mixIn.clip), ambient: slider(mixIn.ambient) },
    clips: cleanClips,
    activeClipId: active,
  };
}

export function normalizeAdultPersona(input = {}, prior = defaultAdultPersona()) {
  const base = { ...defaultAdultPersona(), ...(prior || {}) };
  const incoming = input && typeof input === 'object' ? input : {};
  const verbalIn = { ...base.verbal, ...(incoming.verbal || {}) };
  const name =
    assertAdultSafeText(incoming.name ?? base.name, 'Adult Soul name').slice(0, 48) || 'Adult Soul';
  const nickname = assertAdultSafeText(incoming.nickname ?? base.nickname, 'Nickname').slice(0, 32);
  return {
    name,
    heat: slider(incoming.heat ?? base.heat),
    style: pick(incoming.style || base.style, PERSONA_STYLES, 'direct'),
    verbal: {
      praise: verbalIn.praise !== false,
      filthy: verbalIn.filthy !== false,
      tease: verbalIn.tease !== false,
      count: verbalIn.count !== false,
      moanReact: verbalIn.moanReact !== false,
    },
    discoveryMood: pick(incoming.discoveryMood || base.discoveryMood, DISCOVERY_MOODS, 'stroke'),
    power: pick(incoming.power || base.power, POWER_ROLES, 'switch'),
    nickname,
    roleplay: pick(incoming.roleplay || base.roleplay, ROLEPLAY_SCENES, 'none'),
    honestLabel: defaultAdultPersona().honestLabel,
  };
}

export function normalizeAdultStage(input = {}, prior = defaultAdultStage()) {
  const base = { ...defaultAdultStage(), ...(prior || {}) };
  const incoming = input && typeof input === 'object' ? input : {};
  const playlist = Array.isArray(incoming.playlist) ? incoming.playlist : base.playlist;
  const safeword =
    assertAdultSafeText(incoming.safeword ?? base.safeword, 'Safeword')
      .slice(0, 24)
      .toLowerCase() || 'red';
  return {
    camera: pick(incoming.camera || base.camera, CAMERA_SHOTS, 'full'),
    cinematic: incoming.cinematic === true,
    slowMo: incoming.slowMo === true,
    mirror: incoming.mirror === true,
    behaviorOverride: String(incoming.behaviorOverride ?? base.behaviorOverride ?? '').slice(0, 40),
    arousal: slider(incoming.arousal ?? base.arousal),
    wetness: slider(incoming.wetness ?? base.wetness),
    oil: slider(incoming.oil ?? base.oil),
    loop: incoming.loop === true,
    autoAftercare: incoming.autoAftercare !== false,
    autoStrip: incoming.autoStrip === true,
    playlist: playlist
      .map(item => pick(item, SESSION_KINDS, ''))
      .filter(Boolean)
      .slice(0, 12),
    playlistIndex: Math.max(0, Number(incoming.playlistIndex ?? base.playlistIndex) || 0),
    safeword,
    lastTouch: String(incoming.lastTouch ?? base.lastTouch ?? '').slice(0, 24),
    speaking: incoming.speaking === true,
    atmosphere: pick(
      incoming.atmosphere || base.atmosphere,
      ATMOSPHERE_SCENES.map(item => item.id),
      'bedroom'
    ),
    theater: incoming.theater === true,
  };
}

function normalizeLooks(input) {
  const list = Array.isArray(input) ? input : [];
  return list
    .slice(0, 8)
    .map(item => {
      if (!item || typeof item !== 'object') return null;
      const title = assertAdultSafeText(item.title || 'Look', 'Look title').slice(0, 48) || 'Look';
      return {
        id: String(item.id || uid('look')).slice(0, 40),
        title,
        avatar: normalizeAdultAvatar(item.avatar),
      };
    })
    .filter(Boolean);
}

function normalizeStats(input) {
  const _base = defaultAdultStats();
  const incoming = input && typeof input === 'object' ? input : {};
  return {
    sessions: Math.max(0, Number(incoming.sessions) || 0),
    finishes: Math.max(0, Number(incoming.finishes) || 0),
    edges: Math.max(0, Number(incoming.edges) || 0),
    strips: Math.max(0, Number(incoming.strips) || 0),
    touches: Math.max(0, Number(incoming.touches) || 0),
  };
}

export function migrateAdultSoul(input) {
  const base = defaultAdultSoul();
  if (!input || typeof input !== 'object' || Array.isArray(input)) return base;
  const session =
    input.session && input.session.active === true && Array.isArray(input.session.beats)
      ? {
          kind: pick(input.session.kind, SESSION_KINDS, ''),
          active: true,
          startedAt: input.session.startedAt || null,
          durationMs: Math.max(0, Number(input.session.durationMs) || 0),
          beatIndex: Math.max(0, Number(input.session.beatIndex) || 0),
          beats: input.session.beats.slice(0, 80),
          note: String(input.session.note || '').slice(0, 280),
          pace: pick(input.session.pace, ['stop', 'slow', 'medium', 'fast'], 'medium'),
          heat: slider(input.session.heat ?? 45),
          behavior: String(input.session.behavior || 'idle-breathe').slice(0, 40),
          camera: pick(input.session.camera, CAMERA_SHOTS, 'full'),
        }
      : idleSession();
  return {
    schema: 3,
    kind: ADULT_SOUL_KIND,
    active: input.active === true,
    avatar: normalizeAdultAvatar(input.avatar, base.avatar),
    sounds: normalizeAdultSounds(input.sounds, base.sounds),
    persona: normalizeAdultPersona(input.persona, base.persona),
    stage: normalizeAdultStage(input.stage, base.stage),
    feel: normalizeAdultFeel(input.feel, base.feel),
    looks: normalizeLooks(input.looks),
    stats: normalizeStats(input.stats),
    session,
    updatedAt: input.updatedAt || null,
  };
}

export function adultSoulStudioOpen(state) {
  return adultAllowed(state) === true;
}

export function deactivateAdultSoul(state) {
  state.adultSoul = migrateAdultSoul(state.adultSoul);
  state.adultSoul.active = false;
  state.adultSoul.session = idleSession();
  state.adultSoul.sounds = { ...state.adultSoul.sounds, mute: true };
  state.adultSoul.stage = { ...state.adultSoul.stage, speaking: false, behaviorOverride: '' };
  const feel = normalizeAdultFeel(state.adultSoul.feel);
  state.adultSoul.feel = {
    ...feel,
    lastLevel: 0,
    stealth: { ...feel.stealth, locked: feel.stealth.pinEnabled === true, blanked: true },
  };
  return state.adultSoul;
}

export function configureAdultSoul(state, input = {}) {
  if (!adultSoulStudioOpen(state)) {
    throw new Error(
      'Adult Soul studio stays locked until legal-adult status, Adult Soul enablement, and current consent are all on. Revoke anytime.'
    );
  }
  const prior = migrateAdultSoul(state.adultSoul);
  const incoming = input && typeof input === 'object' ? input : {};
  if (adultTextForbidden(JSON.stringify(incoming))) {
    throw new Error(
      'Adult Soul refuses minor, age-ambiguous, or prohibited character descriptions.'
    );
  }
  state.adultSoul = {
    schema: 3,
    kind: ADULT_SOUL_KIND,
    active: incoming.active !== false,
    avatar: incoming.avatar ? normalizeAdultAvatar(incoming.avatar, prior.avatar) : prior.avatar,
    sounds: incoming.sounds ? normalizeAdultSounds(incoming.sounds, prior.sounds) : prior.sounds,
    persona: incoming.persona
      ? normalizeAdultPersona(incoming.persona, prior.persona)
      : prior.persona,
    stage: incoming.stage ? normalizeAdultStage(incoming.stage, prior.stage) : prior.stage,
    feel: incoming.feel ? normalizeAdultFeel(incoming.feel, prior.feel) : prior.feel,
    looks: incoming.looks ? normalizeLooks(incoming.looks) : prior.looks,
    stats: incoming.stats ? normalizeStats({ ...prior.stats, ...incoming.stats }) : prior.stats,
    session: prior.session,
    updatedAt: new Date().toISOString(),
  };
  return adultSoulView(state);
}

function you(persona) {
  return persona?.nickname ? persona.nickname : 'you';
}

function beat(atSec, cue, extra = {}) {
  return {
    atMs: Math.round(atSec * 1000),
    cue,
    pace: extra.pace || 'medium',
    heat: slider(extra.heat ?? 70),
    speak: extra.speak !== false,
    behavior: extra.behavior || 'idle-breathe',
    camera: extra.camera || '',
    wear: extra.wear || '',
  };
}

function sceneLead(persona) {
  const youName = you(persona);
  if (persona.roleplay === 'roommate')
    return `Adult housemates, both 21+. Door locked. ${youName}, this is still software talking.`;
  if (persona.roleplay === 'bar-stranger')
    return `Two adults after last call. No one else in this scene. ${youName}, I am still a program.`;
  if (persona.roleplay === 'after-hours')
    return `Adult coworkers staying late by choice. Consent stays revocable. ${youName} — software, not a boss with power over you.`;
  if (persona.roleplay === 'long-distance')
    return `Cam-to-cam adults. I am a local figure on this PC, not a livestream of a person.`;
  if (persona.roleplay === 'cam-show')
    return `You built this canvas body. Treat it like a cam you control. Still not a real performer.`;
  return '';
}

function styleFlavor(style, filthy, persona = defaultAdultPersona()) {
  const youName = you(persona);
  const power = persona.power || 'switch';
  const scene = sceneLead(persona);
  const prefix = scene ? `${scene} ` : '';
  if (style === 'worship')
    return (
      prefix +
      (filthy
        ? `Look at ${youName} taking it. That cock is the whole show. Stay greedy for me.`
        : `${youName} are the whole scene. Slow down and feel every inch of attention.`)
    );
  if (style === 'playful')
    return (
      prefix +
      (filthy
        ? `Grin while you stroke, ${youName}. Make a mess on purpose. I want to hear how wet your fist gets.`
        : `Keep it playful. Smile when it throbs. You are allowed to enjoy being obvious.`)
    );
  if (style === 'slow-burn')
    return (
      prefix +
      (filthy
        ? `Barely move. Just the head, spit, squeeze. Let the ache stack until you are leaking.`
        : `Barely move. Let the heat stack. No rush to finish.`)
    );
  if (style === 'aftercare')
    return prefix + 'Ease off. Breathe. Soft hands. You are done proving anything.';
  if (power === 'dominant')
    return (
      prefix +
      (filthy
        ? `Direct order: wrap your hand around your cock and work it because you asked for this. You come when I count.`
        : `Direct: use your hand, keep a steady rhythm, tell me if you need to slow down.`)
    );
  if (power === 'submissive')
    return (
      prefix +
      (filthy
        ? `Tell me how you want it, ${youName}. I’ll moan and present while you stroke. This software follows.`
        : `You set the pace. I’ll stay with you. Safeword stops everything.`)
    );
  if (style === 'filthy' || filthy)
    return (
      prefix + 'Filthy and specific: spit, squeeze, stroke, show me how badly you need to come.'
    );
  return (
    prefix +
    (filthy
      ? 'Direct: wrap your hand around your cock and work it because you asked for this.'
      : 'Direct: use your hand, keep a steady rhythm, tell me if you need to slow down.')
  );
}

export function sessionCatalog() {
  return [
    {
      id: 'stroke-guide',
      title: 'Jerk-off coach',
      summary: 'Spoken stroke pace, spit, grip, and when to speed up. Adult only.',
    },
    {
      id: 'edge-hold',
      title: 'Edge and hold',
      summary: 'Build, back off, drip, then decide. No finish until the last beats.',
    },
    {
      id: 'slow-burn',
      title: 'Slow burn',
      summary: 'Almost no stroke. Tease the head. Stay hard and hungry.',
    },
    {
      id: 'filthy-talk',
      title: 'Filthy talk',
      summary: 'Dirty coaching while you touch yourself. Software, not a person.',
    },
    {
      id: 'worship',
      title: 'Body worship',
      summary: 'Attention on cock, chest, ass, mouth — still a first-party mesh, not a real model.',
    },
    {
      id: 'hands-free-audio',
      title: 'Hands-free audio',
      summary: 'Listen. OS voice plus optional local moan/clip. You set the hands.',
    },
    {
      id: 'countdown-finish',
      title: 'Countdown finish',
      summary: 'Ten slow, then faster, then come when told — or hold if you say stop.',
    },
    {
      id: 'aftercare',
      title: 'Aftercare',
      summary: 'Soft, hydrated, no pressure. Consent stays revocable.',
    },
    {
      id: 'striptease',
      title: 'Striptease',
      summary: 'Figure drops a clothing stage on each beat. You can match or just watch.',
    },
    {
      id: 'mutual-guide',
      title: 'Mutual guide',
      summary: 'You stroke; the figure grinds and presents on the same count.',
    },
    {
      id: 'praise-kink',
      title: 'Praise',
      summary: 'Good-boy / good-girl coaching for adults. Still software.',
    },
    {
      id: 'tease-deny',
      title: 'Tease and deny',
      summary: 'Longer denial. Finish is optional and late.',
    },
    {
      id: 'toy-pace',
      title: 'Toy metronome',
      summary: 'On/off pulses for a toy or hand. No hardware is driven.',
    },
    {
      id: 'ass-focus',
      title: 'Ass focus',
      summary: 'Camera and pose on hips/ass. Adult mesh, not a scanned person.',
    },
    {
      id: 'chest-focus',
      title: 'Chest focus',
      summary: 'Bust/chest bounce and present. Your sliders, your figure.',
    },
    { id: 'eye-lock', title: 'Eye contact', summary: 'Hold the gaze. Slow talk. Hands optional.' },
    {
      id: 'pillow-talk',
      title: 'Pillow talk',
      summary: 'Close, low, after-or-instead-of a finish.',
    },
    {
      id: 'pose-play',
      title: 'Pose play',
      summary: 'Cycle sexual poses on the live figure. Click the body to react.',
    },
    {
      id: 'random-mix',
      title: 'Random mix',
      summary: 'Shuffle stroke, edge, filthy, and strip beats into one local set.',
    },
    {
      id: 'whisper-only',
      title: 'Whisper only',
      summary: 'Close audio, almost no stroke. Pillow-adjacent.',
    },
    {
      id: 'voyeur-watch',
      title: 'Voyeur watch',
      summary: 'You watch. Figure performs. Still a first-party mesh.',
    },
    {
      id: 'cam-night',
      title: 'Cam night',
      summary: 'Local canvas, not a livestream. Strip and count.',
    },
    {
      id: 'afterglow-hold',
      title: 'Afterglow hold',
      summary: 'Stay still after a finish. Soft, no more pace.',
    },
  ];
}

export function applyLookPreset(avatar, presetId) {
  const preset = LOOK_PRESETS.find(item => item.id === presetId);
  if (!preset) return normalizeAdultAvatar(avatar);
  return normalizeAdultAvatar(
    { ...avatar, figure: { ...avatar.figure, ...preset.figure } },
    avatar
  );
}

export function randomizeAdultLook(prior = defaultAdultAvatar()) {
  const roll = () => Math.round(18 + Math.random() * 70);
  const hair = HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)];
  const wear = CLOTHING[Math.floor(Math.random() * (CLOTHING.length - 1))];
  const tones = ['#c99578', '#e0b090', '#8d5a3c', '#f0c7a8', '#6b3f2a', '#d4a574'];
  return normalizeAdultAvatar(
    {
      ...prior,
      appearanceYears: ADULT_APPEARANCE_MIN_YEARS,
      figure: {
        height: roll(),
        shoulders: roll(),
        bust: roll(),
        chest: roll(),
        waist: roll(),
        hips: roll(),
        thighs: roll(),
        butt: roll(),
        belly: Math.round(Math.random() * 55),
        posture: roll(),
      },
      hair: { ...prior.hair, style: hair, length: roll() },
      skin: {
        ...prior.skin,
        tone: tones[Math.floor(Math.random() * tones.length)],
        sheen: roll(),
        blush: roll(),
      },
      presentationWear: wear,
      explicit: { nipples: roll(), groin: roll(), assFocus: roll() },
    },
    prior
  );
}

export function buildSessionBeats(
  kind,
  {
    heat = 72,
    style = 'direct',
    filthy = true,
    durationMin = 8,
    persona = defaultAdultPersona(),
  } = {}
) {
  const id = pick(kind, SESSION_KINDS, 'stroke-guide');
  const h = slider(heat);
  const minutes = clamp(Number(durationMin) || 8, 4, 20);
  const flavor = styleFlavor(style, filthy, persona);
  const open = `Adult Soul is software on this PC, not a lover in the room. Safeword is ${persona.safeword || 'red'} — or revoke consent anytime. ${flavor}`;
  if (id === 'aftercare') {
    return [
      beat(0, open, { pace: 'stop', heat: 20, behavior: 'aftercare', camera: 'face' }),
      beat(
        20,
        'Unclench your jaw. Drop your shoulders. If you came, keep your hand still and breathe through the pulse.',
        { pace: 'stop', heat: 15, behavior: 'aftercare' }
      ),
      beat(50, 'Water. A wipe. Soft fabric. No more instructions until you ask.', {
        pace: 'stop',
        heat: 10,
        behavior: 'aftercare',
        camera: 'full',
      }),
      beat(
        80,
        'You ran a local Adult Soul session. It is not therapy, not a relationship, and not consciousness. Rest.',
        { pace: 'stop', heat: 8, behavior: 'aftercare' }
      ),
    ];
  }
  if (id === 'slow-burn') {
    return [
      beat(0, open, {
        pace: 'slow',
        heat: Math.max(30, h - 20),
        behavior: 'eye-contact',
        camera: 'face',
      }),
      beat(
        25,
        'Pants down enough to get a hand on yourself. Do not stroke yet. Just hold. Thumb on the underside.',
        { pace: 'stop', heat: 40, behavior: 'present-body' }
      ),
      beat(55, 'Spit or lotion. One fingertip around the head. Circles. No full stroke.', {
        pace: 'slow',
        heat: 50,
        behavior: 'slow-undulate',
        camera: 'crotch',
      }),
      beat(100, 'Now two slow pulls from base to head. Stop at the top. Squeeze. Wait.', {
        pace: 'slow',
        heat: 58,
        behavior: 'stroke-pose',
      }),
      beat(
        150,
        'Again. You should be leaking or aching. If you are close, freeze. If you are not, add a twist at the head.',
        { pace: 'slow', heat: 65, behavior: 'edge-hold' }
      ),
      beat(
        210,
        'Keep denying a full rhythm. Tiny strokes only. Talk out loud: how hard you are. This software can take the filthy detail.',
        { pace: 'slow', heat: 70, behavior: 'hip-sway' }
      ),
      beat(
        minutes * 60 - 40,
        'Optional: one minute of real strokes. Or stay denied. Your call. Revoke if it is too much.',
        { pace: 'medium', heat: h, behavior: 'grind' }
      ),
    ];
  }
  if (id === 'edge-hold') {
    return [
      beat(0, open, { pace: 'medium', heat: h, behavior: 'stroke-pose' }),
      beat(
        20,
        'Get your cock out. Stroke it like you mean it — full grip, base to head, wet enough that it sounds.',
        { pace: 'medium', heat: h, behavior: 'stroke-pose', camera: 'crotch' }
      ),
      beat(50, 'Faster. Point it up. Watch the head swell. You are not allowed to come yet.', {
        pace: 'fast',
        heat: Math.min(100, h + 8),
        behavior: 'grind',
      }),
      beat(
        80,
        'Edge. Stop moving. Squeeze the base. Breathe through your teeth. Let the throb happen without a stroke.',
        { pace: 'stop', heat: 90, behavior: 'edge-hold' }
      ),
      beat(
        110,
        'Start again, slower than you want. Spit. Tight ring with finger and thumb just under the head.',
        { pace: 'slow', heat: 75, behavior: 'stroke-pose' }
      ),
      beat(
        150,
        'Build. Fast for twenty seconds. If you start to go over, slam the brakes. Edge is the point.',
        { pace: 'fast', heat: 88, behavior: 'grind' }
      ),
      beat(
        190,
        'Hold. Show yourself how close you are. Drip. Do not finish unless you choose the countdown session next.',
        { pace: 'stop', heat: 92, behavior: 'edge-hold' }
      ),
      beat(
        minutes * 60 - 30,
        'Last chance to stay denied or take ten finishing strokes. Say stop and this ends.',
        { pace: 'medium', heat: h, behavior: 'stroke-pose' }
      ),
    ];
  }
  if (id === 'filthy-talk') {
    return [
      beat(0, open, { pace: 'medium', heat: h, behavior: 'present-body' }),
      beat(
        15,
        'Fist that cock. Make it messy. I want the wet sound. You asked for Adult Soul, so take the explicit version.',
        { pace: 'medium', heat: h, behavior: 'grind', camera: 'hips' }
      ),
      beat(
        45,
        'Thumb the slit. Spread it. Stroke like you are showing off for a camera that is only this canvas body.',
        { pace: 'medium', heat: Math.min(100, h + 5), behavior: 'stroke-pose', camera: 'crotch' }
      ),
      beat(
        80,
        'Talk: how full your balls feel, how badly you want to come, what you would do if a mouth were on you. This is still software.',
        { pace: 'fast', heat: 85, behavior: 'grind' }
      ),
      beat(
        120,
        'Spit again. Faster. If you like ass in the picture, squeeze a cheek with the other hand while you jerk.',
        { pace: 'fast', heat: 90, behavior: 'ass-present', camera: 'ass' }
      ),
      beat(
        170,
        'Slow down just enough to stay on the edge of filthy instead of finishing by accident.',
        { pace: 'slow', heat: 80, behavior: 'slow-undulate' }
      ),
      beat(
        minutes * 60 - 35,
        'Finish if you want: tight, fast, aim. Or stop and sit in the ache. Consent first.',
        { pace: 'fast', heat: 95, behavior: 'climax' }
      ),
    ];
  }
  if (id === 'worship') {
    return [
      beat(0, open, {
        pace: 'slow',
        heat: Math.max(40, h - 10),
        behavior: 'worship-pose',
        camera: 'full',
      }),
      beat(
        20,
        'Look at the Adult Soul figure you built — adult, fictional, first-party mesh. Then look at your own body with the same attention.',
        { pace: 'slow', heat: 50, behavior: 'present-body' }
      ),
      beat(
        50,
        'One hand on your chest or throat, one on your cock. Slow strokes. Praise how hard you got.',
        { pace: 'slow', heat: 60, behavior: 'chest-bounce', camera: 'chest' }
      ),
      beat(
        90,
        'Turn a hip. If you want ass in the scene, pull a cheek and keep stroking. Stay adult. Stay consensual with yourself.',
        { pace: 'medium', heat: 70, behavior: 'ass-present', camera: 'ass' }
      ),
      beat(
        140,
        'Mouth open. Breathe on your own fist. Optional: lick a finger, then back to the head.',
        { pace: 'medium', heat: 78, behavior: 'kiss-lean', camera: 'face' }
      ),
      beat(
        minutes * 60 - 40,
        'Come looking at the figure you made, or stop and cover up. Either is a complete session.',
        { pace: 'medium', heat: h, behavior: 'grind' }
      ),
    ];
  }
  if (id === 'hands-free-audio') {
    return [
      beat(
        0,
        open +
          ' Hands-free: you may touch or only listen. Local clips play through eidovara-media. OS voice is not a neural moan engine.',
        { pace: 'slow', heat: h, behavior: 'hands-free' }
      ),
      beat(
        25,
        'If you are stroking, match the voice: slow pull on each sentence. If not, just get hard from the talk.',
        { pace: 'slow', heat: 60, behavior: 'slow-undulate' }
      ),
      beat(70, 'Imagine wet heat. Stroke only on the vowels if you are touching. Leave gaps.', {
        pace: 'slow',
        heat: 68,
        behavior: 'hands-free',
        camera: 'face',
      }),
      beat(
        120,
        'Optional clip: play your own audio. Eidovara did not ship porn samples. Your files, your rights.',
        { pace: 'medium', heat: 75, behavior: 'grind' }
      ),
      beat(
        180,
        'Build or stay hands-off. The software will not know which you picked. That is the point of local-first.',
        { pace: 'medium', heat: h, behavior: 'hip-sway' }
      ),
      beat(minutes * 60 - 25, 'Silence after this. Aftercare is next if you want soft.', {
        pace: 'stop',
        heat: 40,
        behavior: 'aftercare',
      }),
    ];
  }
  if (id === 'countdown-finish') {
    return [
      beat(0, open, { pace: 'medium', heat: h, behavior: 'stroke-pose' }),
      beat(
        20,
        'Stroke to get fully hard. Wet grip. You are going to come on a count unless you say stop.',
        { pace: 'medium', heat: h, behavior: 'stroke-pose', camera: 'crotch' }
      ),
      beat(50, 'Faster. Watch the head. Do not come before the count.', {
        pace: 'fast',
        heat: 85,
        behavior: 'grind',
      }),
      beat(80, 'Ten slow strokes. Count them out loud.', {
        pace: 'slow',
        heat: 80,
        behavior: 'stroke-pose',
      }),
      beat(110, 'Ten faster. You should be leaking.', {
        pace: 'fast',
        heat: 90,
        behavior: 'grind',
      }),
      beat(140, 'Five. Tight. Almost there.', { pace: 'fast', heat: 95, behavior: 'edge-hold' }),
      beat(155, 'Three. Two. One. Come. Keep stroking through it unless you revoked.', {
        pace: 'fast',
        heat: 100,
        behavior: 'climax',
      }),
      beat(175, 'Stop when it hurts. Aftercare is available. Adult Soul is still just software.', {
        pace: 'stop',
        heat: 30,
        behavior: 'aftercare',
        camera: 'face',
      }),
    ];
  }
  if (id === 'striptease') {
    return [
      beat(0, open, {
        pace: 'slow',
        heat: 40,
        behavior: 'striptease',
        camera: 'full',
        wear: 'wrapped',
      }),
      beat(18, 'Watch the figure. Wrapped for now. You can undress too or just look.', {
        pace: 'slow',
        heat: 48,
        behavior: 'hip-sway',
        wear: 'open-shirt',
        camera: 'chest',
      }),
      beat(50, 'Open shirt. Hands on your own body if you want. Slow sway.', {
        pace: 'slow',
        heat: 55,
        behavior: 'present-body',
        wear: 'slip',
      }),
      beat(90, 'Slip. Nipples if you built them. Stroke only if you are already aching.', {
        pace: 'medium',
        heat: 65,
        behavior: 'chest-bounce',
        wear: 'lingerie',
        camera: 'chest',
      }),
      beat(130, 'Lingerie. Turn. Ass in the light you picked.', {
        pace: 'medium',
        heat: 75,
        behavior: 'ass-present',
        wear: 'sheer',
        camera: 'ass',
      }),
      beat(170, 'Sheer. Almost nothing. Faster hand if you are touching.', {
        pace: 'fast',
        heat: 85,
        behavior: 'grind',
        wear: 'bare',
        camera: 'hips',
      }),
      beat(minutes * 60 - 35, 'Bare figure. Finish or cover back up. Yellow slows. Red stops.', {
        pace: 'medium',
        heat: h,
        behavior: 'present-body',
        wear: 'bare',
      }),
    ];
  }
  if (id === 'mutual-guide') {
    return [
      beat(0, open, { pace: 'medium', heat: h, behavior: 'grind' }),
      beat(
        16,
        'You stroke on the downbeat. The figure grinds on the same count. Match or ignore — it cannot feel you.',
        { pace: 'medium', heat: 60, behavior: 'grind', camera: 'hips' }
      ),
      beat(50, 'Faster together. Hips. Fist. Wet sound if you made one.', {
        pace: 'fast',
        heat: 78,
        behavior: 'ride',
      }),
      beat(
        90,
        'Hold. Both freeze. Figure trembles because the mesh is told to. You decide if you edge.',
        { pace: 'stop', heat: 88, behavior: 'edge-hold' }
      ),
      beat(
        120,
        'Ride pose. You can keep stroking or switch to a toy. Nothing here drives hardware.',
        { pace: 'medium', heat: 80, behavior: 'ride', camera: 'crotch' }
      ),
      beat(
        minutes * 60 - 40,
        'Come together in the cheap theatrical sense: you finish, the figure runs the climax deform.',
        { pace: 'fast', heat: 95, behavior: 'climax' }
      ),
    ];
  }
  if (id === 'praise-kink') {
    return [
      beat(0, open, {
        pace: 'slow',
        heat: Math.max(40, h - 15),
        behavior: 'eye-contact',
        camera: 'face',
      }),
      beat(
        20,
        `Good. ${you(persona)} showed up and asked. That is enough to start. Slow strokes. I am still software praising a choice, not a person in love.`,
        { pace: 'slow', heat: 50, behavior: 'present-body' }
      ),
      beat(
        60,
        'That’s it. Wet enough. You look hungry and that is allowed here. Keep the rhythm you can actually keep.',
        { pace: 'medium', heat: 62, behavior: 'stroke-pose' }
      ),
      beat(
        110,
        'Proud of how hard you got for a canvas body. Filthy and affectionate can coexist. Edge if you need.',
        { pace: 'medium', heat: 74, behavior: 'grind' }
      ),
      beat(
        minutes * 60 - 40,
        'Finish if you want praise at the end, or stop and still get aftercare. You do not owe a climax.',
        { pace: 'medium', heat: h, behavior: 'worship-pose' }
      ),
    ];
  }
  if (id === 'tease-deny') {
    return [
      beat(0, open, { pace: 'slow', heat: 35, behavior: 'slow-undulate' }),
      beat(
        25,
        'Touch. Stop. Touch. Stop. Denial is the toy. No coming until the last optional beat.',
        { pace: 'stop', heat: 45, behavior: 'edge-hold' }
      ),
      beat(70, 'Twenty slow pulls, then off. Squeeze. Wait for the throb to fade a little.', {
        pace: 'slow',
        heat: 58,
        behavior: 'stroke-pose',
        camera: 'crotch',
      }),
      beat(120, 'Faster just long enough to scare you, then freeze.', {
        pace: 'fast',
        heat: 80,
        behavior: 'grind',
      }),
      beat(150, 'Hands off. Look at the figure presenting. Stay denied unless you override.', {
        pace: 'stop',
        heat: 86,
        behavior: 'present-body',
      }),
      beat(
        minutes * 60 - 25,
        'Optional ten strokes to finish. Or stay aching. Yellow keeps you denied. Red ends.',
        { pace: 'medium', heat: h, behavior: 'stroke-pose' }
      ),
    ];
  }
  if (id === 'toy-pace') {
    return [
      beat(
        0,
        open +
          ' Toy metronome: this does not vibrate any device. You sync a toy or hand to the voice.',
        { pace: 'slow', heat: h, behavior: 'hands-free' }
      ),
      beat(20, 'On. Low. Count four. Off.', { pace: 'slow', heat: 50, behavior: 'slow-undulate' }),
      beat(50, 'On. Medium. Count eight. Off. Breathe.', {
        pace: 'medium',
        heat: 62,
        behavior: 'grind',
      }),
      beat(90, 'On. High. Count six. If you are close, off immediately.', {
        pace: 'fast',
        heat: 80,
        behavior: 'edge-hold',
      }),
      beat(130, 'Pattern: on-off-on. You run the toy. The figure rides the same pulse.', {
        pace: 'medium',
        heat: 75,
        behavior: 'ride',
      }),
      beat(minutes * 60 - 30, 'Last on-cycle. Finish or power down. Aftercare if you want soft.', {
        pace: 'fast',
        heat: h,
        behavior: 'climax',
      }),
    ];
  }
  if (id === 'ass-focus') {
    return [
      beat(0, open, { pace: 'medium', heat: h, behavior: 'ass-present', camera: 'ass' }),
      beat(
        18,
        'Turn the figure. Ass in studio light. Stroke yourself however you like while you look.',
        { pace: 'slow', heat: 55, behavior: 'ass-present', camera: 'ass' }
      ),
      beat(55, 'All fours deform. This is a lathe mesh folding, not mocap of a person.', {
        pace: 'medium',
        heat: 68,
        behavior: 'all-fours',
        camera: 'ass',
      }),
      beat(100, 'Grind. You can match with a hand on yourself or just watch the hips.', {
        pace: 'fast',
        heat: 82,
        behavior: 'grind',
        camera: 'hips',
      }),
      beat(
        minutes * 60 - 35,
        'Stay on the ass shot through a finish, or rotate back to full body.',
        { pace: 'medium', heat: h, behavior: 'ass-present', camera: 'ass' }
      ),
    ];
  }
  if (id === 'chest-focus') {
    return [
      beat(0, open, { pace: 'slow', heat: h, behavior: 'chest-bounce', camera: 'chest' }),
      beat(20, 'Chest / bust you dialed. Breath on. Hands on yourself optional.', {
        pace: 'slow',
        heat: 50,
        behavior: 'chest-bounce',
        camera: 'chest',
      }),
      beat(
        60,
        'Present. Arch. If you like nipples on this mesh, they are your slider, not a photo.',
        { pace: 'medium', heat: 64, behavior: 'present-body', camera: 'chest' }
      ),
      beat(110, 'Faster breath. Grind lower body. Keep the camera on the chest.', {
        pace: 'fast',
        heat: 78,
        behavior: 'grind',
        camera: 'chest',
      }),
      beat(minutes * 60 - 30, 'Finish looking here or pan out. Your call.', {
        pace: 'medium',
        heat: h,
        behavior: 'chest-bounce',
        camera: 'chest',
      }),
    ];
  }
  if (id === 'eye-lock') {
    return [
      beat(0, open, { pace: 'slow', heat: 40, behavior: 'eye-contact', camera: 'face' }),
      beat(22, 'Do not look away. Slow strokes if you are touching. I will keep the face shot.', {
        pace: 'slow',
        heat: 52,
        behavior: 'eye-contact',
        camera: 'face',
      }),
      beat(
        70,
        'Talk to the figure if you want. It will not hear you. The OS voice will still coach.',
        { pace: 'slow', heat: 60, behavior: 'kiss-lean', camera: 'face' }
      ),
      beat(
        130,
        'Hold the edge while you stare. Software cannot stare back. The pose is the trick.',
        { pace: 'stop', heat: 75, behavior: 'edge-hold', camera: 'face' }
      ),
      beat(
        minutes * 60 - 30,
        'Blink. Drop the camera to full if you want. Aftercare is face-soft.',
        { pace: 'stop', heat: 30, behavior: 'aftercare', camera: 'face' }
      ),
    ];
  }
  if (id === 'pillow-talk') {
    return [
      beat(0, open, { pace: 'stop', heat: 25, behavior: 'aftercare', camera: 'face' }),
      beat(20, 'Close. Low. You can still be hard. No countdown unless you ask.', {
        pace: 'slow',
        heat: 35,
        behavior: 'kiss-lean',
        camera: 'face',
      }),
      beat(70, 'Optional slow strokes under the blanket you imagine. The figure just breathes.', {
        pace: 'slow',
        heat: 45,
        behavior: 'idle-breathe',
      }),
      beat(140, 'If you want a finish, say come. If you want sleep, say red or stop.', {
        pace: 'stop',
        heat: 40,
        behavior: 'aftercare',
        camera: 'full',
      }),
    ];
  }
  if (id === 'pose-play') {
    const poses = [
      'present-body',
      'grind',
      'on-back-present',
      'all-fours',
      'ride',
      'ass-present',
      'spread',
      'worship-pose',
    ];
    return [
      beat(
        0,
        open +
          ' Pose play: the figure cycles sexual poses. Click the body to add a reaction. Not VRM.',
        { pace: 'medium', heat: 50, behavior: 'present-body' }
      ),
      ...poses.map((pose, i) =>
        beat(18 + i * 28, `Pose: ${pose.replace(/-/g, ' ')}. Stroke or watch.`, {
          pace: i % 2 ? 'fast' : 'medium',
          heat: 55 + i * 4,
          behavior: pose,
          camera:
            pose.includes('ass') || pose === 'all-fours'
              ? 'ass'
              : pose.includes('back')
                ? 'hips'
                : 'full',
        })
      ),
      beat(
        minutes * 60 - 20,
        'Pick a favorite pose with the pose button and stay there, or stop.',
        { pace: 'slow', heat: h, behavior: 'present-body' }
      ),
    ];
  }
  if (id === 'random-mix') {
    const pool = ['stroke-guide', 'edge-hold', 'filthy-talk', 'striptease', 'ass-focus'];
    const pickKind = pool[Math.floor(Math.random() * pool.length)] || 'stroke-guide';
    return buildSessionBeats(pickKind, { heat, style, filthy, durationMin, persona });
  }
  if (id === 'whisper-only') {
    return [
      beat(0, open + ' Whisper only. Keep volume low. Hands optional.', {
        pace: 'stop',
        heat: 22,
        behavior: 'kiss-lean',
        camera: 'face',
      }),
      beat(25, 'Breathe with the figure. If you touch, one finger, no rhythm yet.', {
        pace: 'slow',
        heat: 32,
        behavior: 'idle-breathe',
        camera: 'face',
      }),
      beat(80, 'Optional slow strokes under the blanket you imagine. Stay quiet.', {
        pace: 'slow',
        heat: 42,
        behavior: 'slow-undulate',
      }),
      beat(minutes * 60 - 30, 'Stop talking. Aftercare or sleep. Red still ends it.', {
        pace: 'stop',
        heat: 20,
        behavior: 'aftercare',
        camera: 'face',
      }),
    ];
  }
  if (id === 'voyeur-watch') {
    return [
      beat(
        0,
        open + ' Voyeur watch: you look. The mesh performs. Not a cam site and not a real person.',
        { pace: 'slow', heat: 40, behavior: 'present-body', camera: 'full' }
      ),
      beat(22, 'Figure turns. You may stroke or keep your hands still.', {
        pace: 'medium',
        heat: 55,
        behavior: 'hip-sway',
        camera: 'hips',
      }),
      beat(70, 'All fours, then ride. Still a lathe, not mocap.', {
        pace: 'medium',
        heat: 68,
        behavior: 'all-fours',
        camera: 'ass',
      }),
      beat(120, 'Hold the gaze or look at the body. Your call.', {
        pace: 'slow',
        heat: 72,
        behavior: 'eye-contact',
        camera: 'face',
      }),
      beat(
        minutes * 60 - 30,
        'Cover the figure or finish yourself. Software does not know which.',
        { pace: 'medium', heat: h, behavior: 'present-body' }
      ),
    ];
  }
  if (id === 'cam-night') {
    return [
      beat(0, open + ' Cam night is local canvas, not a livestream and not Chaturbate.', {
        pace: 'slow',
        heat: 45,
        behavior: 'striptease',
        camera: 'full',
        wear: 'lingerie',
      }),
      beat(24, 'Treat it like a private show. Slow undress. Hands on yourself optional.', {
        pace: 'slow',
        heat: 58,
        behavior: 'hip-sway',
        wear: 'sheer',
      }),
      beat(70, 'Count with the figure. Mutual if you want. Still not a real cam.', {
        pace: 'medium',
        heat: 72,
        behavior: 'grind',
        wear: 'bare',
        camera: 'hips',
      }),
      beat(130, 'Faster if you asked for filthy. Yellow slows. Red stops.', {
        pace: 'fast',
        heat: 85,
        behavior: 'ride',
      }),
      beat(minutes * 60 - 35, 'End the set. Aftercare or countdown is a separate session.', {
        pace: 'medium',
        heat: h,
        behavior: 'present-body',
        wear: 'robe',
      }),
    ];
  }
  if (id === 'afterglow-hold') {
    return [
      beat(0, open + ' Afterglow: no more pace. Stay still if you just finished.', {
        pace: 'stop',
        heat: 18,
        behavior: 'aftercare',
        camera: 'face',
      }),
      beat(20, 'Hand off. Jaw unclench. Figure breathes. You do not owe another round.', {
        pace: 'stop',
        heat: 12,
        behavior: 'idle-breathe',
      }),
      beat(70, 'Water. Soft fabric. Adult Soul is still software.', {
        pace: 'stop',
        heat: 10,
        behavior: 'aftercare',
        camera: 'full',
      }),
      beat(minutes * 60 - 20, 'Session complete. Revoke anytime. Standard mode is one command.', {
        pace: 'stop',
        heat: 8,
        behavior: 'aftercare',
      }),
    ];
  }
  return [
    beat(0, open, { pace: 'medium', heat: h, behavior: 'stroke-pose' }),
    beat(
      18,
      'Get your cock in your fist. If you are a woman using these instructions, same idea: fingers or toy, wet, and a rhythm you can keep.',
      { pace: 'slow', heat: 55, behavior: 'stroke-pose' }
    ),
    beat(
      40,
      'Spit or lube. Full strokes, base to head. Squeeze on the upstroke. This is jerk-off coaching, not a medical guide.',
      { pace: 'medium', heat: 65, behavior: 'stroke-pose', camera: 'crotch' }
    ),
    beat(
      75,
      'Faster. Let your hips help. Keep the other hand on balls, clit, or ass — whatever is yours and adult.',
      { pace: 'fast', heat: 78, behavior: 'grind' }
    ),
    beat(110, 'Slow it down. Twist under the head. You should feel stupid-sensitive. Good.', {
      pace: 'slow',
      heat: 72,
      behavior: 'slow-undulate',
    }),
    beat(
      145,
      'Build again. Wet sound. If you like being told what to do: keep stroking until the next cue, no coming yet.',
      { pace: 'fast', heat: 85, behavior: 'grind' }
    ),
    beat(
      185,
      'Edge: freeze, squeeze, breathe. Then ten more strokes at the pace you can barely stand.',
      { pace: 'medium', heat: 88, behavior: 'edge-hold' }
    ),
    beat(
      minutes * 60 - 45,
      'Finish if you want — tight, fast, messy — or stop and stay aching. Say revoke consent to kill the studio.',
      { pace: 'fast', heat: 95, behavior: 'climax' }
    ),
  ];
}

function stampBeat(session, index = 0) {
  const beatNow = session.beats[index] || session.beats[0] || {};
  session.beatIndex = index;
  session.pace = beatNow.pace || 'medium';
  session.heat = beatNow.heat ?? 45;
  session.behavior = beatNow.behavior || 'idle-breathe';
  if (beatNow.camera) session.camera = beatNow.camera;
  return beatNow;
}

export function startAdultSession(state, { kind, durationMin } = {}) {
  if (!adultSoulStudioOpen(state)) {
    throw new Error('Guided Adult Soul sessions stay locked until the triple gate is on.');
  }
  const soul = migrateAdultSoul(state.adultSoul);
  const chosen = pick(
    kind,
    SESSION_KINDS,
    soul.stage.playlist[soul.stage.playlistIndex] || 'stroke-guide'
  );
  const beats = buildSessionBeats(chosen, {
    heat: soul.persona.heat,
    style: soul.persona.style,
    filthy: soul.persona.verbal.filthy,
    durationMin,
    persona: { ...soul.persona, safeword: soul.stage.safeword },
  });
  const durationMs = (beats[beats.length - 1]?.atMs || 0) + 15000;
  const session = {
    kind: chosen,
    active: true,
    startedAt: new Date().toISOString(),
    durationMs,
    beatIndex: 0,
    beats,
    note: sessionCatalog().find(item => item.id === chosen)?.summary || '',
    pace: 'medium',
    heat: soul.persona.heat,
    behavior: 'idle-breathe',
    camera: soul.stage.camera,
  };
  stampBeat(session, 0);
  state.adultSoul = {
    ...soul,
    active: true,
    stats: { ...soul.stats, sessions: soul.stats.sessions + 1 },
    session,
    updatedAt: new Date().toISOString(),
  };
  const firstWear = beats[0]?.wear;
  if (firstWear)
    state.adultSoul.avatar = normalizeAdultAvatar(
      { ...soul.avatar, presentationWear: firstWear },
      soul.avatar
    );
  if (session.camera) state.adultSoul.stage = { ...soul.stage, camera: session.camera };
  return adultSoulView(state);
}

export function stopAdultSession(state) {
  state.adultSoul = migrateAdultSoul(state.adultSoul);
  state.adultSoul.session = idleSession();
  state.adultSoul.stage = { ...state.adultSoul.stage, speaking: false };
  state.adultSoul.updatedAt = new Date().toISOString();
  return adultSoulView(state);
}

export function tickAdultSession(state, atMs = 0) {
  const soul = migrateAdultSoul(state.adultSoul);
  if (!adultSoulStudioOpen(state) || soul.session.active !== true) {
    return { ...adultSoulView(state), beat: null, done: true };
  }
  const elapsed = Math.max(0, Number(atMs) || 0);
  let index = 0;
  for (let i = 0; i < soul.session.beats.length; i += 1) {
    if (soul.session.beats[i].atMs <= elapsed) index = i;
  }
  const beatNow = stampBeat(soul.session, index);
  if (beatNow.wear && soul.avatar.presentationWear !== beatNow.wear) {
    soul.avatar = normalizeAdultAvatar(
      { ...soul.avatar, presentationWear: beatNow.wear },
      soul.avatar
    );
    soul.stats = { ...soul.stats, strips: soul.stats.strips + 1 };
  }
  if (beatNow.camera) soul.stage = { ...soul.stage, camera: beatNow.camera };
  const arousalBump = Math.min(100, soul.stage.arousal + Math.round((beatNow.heat || 0) * 0.02));
  const wetBump = Math.min(100, soul.stage.wetness + (beatNow.pace === 'fast' ? 1 : 0));
  soul.stage = { ...soul.stage, arousal: arousalBump, wetness: wetBump, camera: soul.stage.camera };
  if (beatNow.behavior === 'edge-hold' && soul.session.pace === 'stop') {
    soul.stats = { ...soul.stats, edges: soul.stats.edges + 0 }; // counted on command
  }
  let done = elapsed > (soul.session.durationMs || 0);
  if (done && soul.stage.loop === true) {
    soul.session.startedAt = new Date().toISOString();
    stampBeat(soul.session, 0);
    done = false;
  } else if (done && soul.stage.playlist.length > 1) {
    const next = (soul.stage.playlistIndex + 1) % soul.stage.playlist.length;
    soul.stage = { ...soul.stage, playlistIndex: next };
    state.adultSoul = soul;
    return startAdultSession(state, { kind: soul.stage.playlist[next] });
  } else if (done && soul.stage.autoAftercare && soul.session.kind !== 'aftercare') {
    if (soul.session.kind === 'countdown-finish')
      soul.stats = { ...soul.stats, finishes: soul.stats.finishes + 1 };
    state.adultSoul = soul;
    return startAdultSession(state, { kind: 'aftercare', durationMin: 4 });
  }
  state.adultSoul = soul;
  return { ...adultSoulView(state), beat: beatNow, elapsedMs: elapsed, done };
}

export function applyAdultCommand(state, command = '') {
  if (!adultSoulStudioOpen(state)) {
    throw new Error('Adult Soul commands stay locked until the triple gate is on.');
  }
  const soul = migrateAdultSoul(state.adultSoul);
  const raw = String(command || '')
    .trim()
    .toLowerCase();
  const safeword = String(soul.stage.safeword || 'red').toLowerCase();
  if (!raw) return adultSoulView(state);
  if (raw === safeword || raw === 'red' || raw === 'stop session') {
    return stopAdultSession(state);
  }
  if (raw === 'yellow' || raw === 'slower') {
    if (soul.session.active) {
      soul.session.pace = 'slow';
      soul.session.behavior = 'slow-undulate';
    }
    soul.stage = { ...soul.stage, slowMo: true };
  } else if (raw === 'faster' || raw === 'green') {
    if (soul.session.active) {
      soul.session.pace = 'fast';
      soul.session.behavior = 'grind';
    }
    soul.stage = { ...soul.stage, slowMo: false };
  } else if (raw === 'hold' || raw === 'edge') {
    if (soul.session.active) {
      soul.session.pace = 'stop';
      soul.session.behavior = 'edge-hold';
    }
    soul.stats = { ...soul.stats, edges: soul.stats.edges + 1 };
  } else if (raw === 'come' || raw === 'climax') {
    soul.session.behavior = 'climax';
    soul.session.pace = 'fast';
    soul.session.heat = 100;
    soul.stats = { ...soul.stats, finishes: soul.stats.finishes + 1 };
  } else if (raw === 'strip') {
    const wear = nextClothing(soul.avatar.presentationWear, 1);
    soul.avatar = normalizeAdultAvatar({ ...soul.avatar, presentationWear: wear }, soul.avatar);
    soul.stats = { ...soul.stats, strips: soul.stats.strips + 1 };
    soul.session.behavior = 'striptease';
  } else if (raw === 'dress') {
    soul.avatar = normalizeAdultAvatar(
      { ...soul.avatar, presentationWear: nextClothing(soul.avatar.presentationWear, -1) },
      soul.avatar
    );
  } else if (raw === 'pose' || raw === 'next pose') {
    const i = Math.max(
      0,
      BEHAVIOR_CYCLE.indexOf(soul.stage.behaviorOverride || soul.session.behavior)
    );
    const next = BEHAVIOR_CYCLE[(i + 1) % BEHAVIOR_CYCLE.length];
    soul.stage = { ...soul.stage, behaviorOverride: next };
    soul.session.behavior = next;
  } else if (raw === 'camera' || raw === 'next camera') {
    const i = Math.max(0, CAMERA_SHOTS.indexOf(soul.stage.camera));
    soul.stage = { ...soul.stage, camera: CAMERA_SHOTS[(i + 1) % CAMERA_SHOTS.length] };
    soul.session.camera = soul.stage.camera;
  } else if (raw.startsWith('camera:')) {
    soul.stage = {
      ...soul.stage,
      camera: pick(raw.slice(7).trim(), CAMERA_SHOTS, soul.stage.camera),
    };
  } else if (raw.startsWith('pose:')) {
    const pose = raw.slice(5).trim();
    soul.stage = { ...soul.stage, behaviorOverride: pose };
    soul.session.behavior = pose;
  } else if (raw === 'cinematic') {
    soul.stage = { ...soul.stage, cinematic: !soul.stage.cinematic };
  } else if (raw === 'mirror') {
    soul.stage = { ...soul.stage, mirror: !soul.stage.mirror };
  } else if (raw === 'loop') {
    soul.stage = { ...soul.stage, loop: !soul.stage.loop };
  } else if (raw.startsWith('touch:')) {
    soul.stage = { ...soul.stage, lastTouch: raw.slice(6).trim().slice(0, 24) };
    soul.stats = { ...soul.stats, touches: soul.stats.touches + 1 };
    if (soul.stage.lastTouch === 'chest') soul.session.behavior = 'chest-bounce';
    else if (soul.stage.lastTouch === 'ass') soul.session.behavior = 'ass-present';
    else if (soul.stage.lastTouch === 'groin') soul.session.behavior = 'grind';
    else if (soul.stage.lastTouch === 'face') soul.session.behavior = 'kiss-lean';
    else soul.session.behavior = 'present-body';
  } else if (raw === 'random-look') {
    soul.avatar = randomizeAdultLook(soul.avatar);
  } else if (raw.startsWith('look:')) {
    soul.avatar = applyLookPreset(soul.avatar, raw.slice(5).trim());
  } else if (raw.startsWith('atmosphere:')) {
    const atmosphere = pick(
      raw.slice(11).trim(),
      ATMOSPHERE_SCENES.map(item => item.id),
      soul.stage.atmosphere
    );
    const scene = ATMOSPHERE_SCENES.find(item => item.id === atmosphere);
    soul.stage = { ...soul.stage, atmosphere };
    if (scene?.lighting) {
      soul.avatar = normalizeAdultAvatar(
        { ...soul.avatar, render: { ...soul.avatar.render, lighting: scene.lighting } },
        soul.avatar
      );
    }
  } else if (raw === 'theater') {
    soul.stage = { ...soul.stage, theater: !soul.stage.theater };
  } else if (raw.startsWith('style:')) {
    const styleId = pick(
      raw.slice(6).trim(),
      SEXY_STYLES.map(item => item.id),
      soul.avatar.sexyStyle
    );
    const patch = sexyStylePatch(styleId);
    soul.avatar = normalizeAdultAvatar(
      {
        ...soul.avatar,
        sexyStyle: styleId,
        ...patch,
        makeup: { ...soul.avatar.makeup, ...patch.makeup },
        skin: { ...soul.avatar.skin, ...patch.skin },
        figure: { ...soul.avatar.figure, ...patch.figure },
        motion: { ...soul.avatar.motion, ...patch.motion },
      },
      soul.avatar
    );
  } else if (raw === 'female' || raw === 'sex:feminine') {
    soul.avatar = normalizeAdultAvatar({ ...soul.avatar, presentation: 'feminine' }, soul.avatar);
  } else if (raw === 'male' || raw === 'sex:masculine') {
    soul.avatar = normalizeAdultAvatar({ ...soul.avatar, presentation: 'masculine' }, soul.avatar);
  } else if (raw.startsWith('framework:')) {
    soul.avatar = normalizeAdultAvatar(
      { ...soul.avatar, framework: raw.slice(10).trim() },
      soul.avatar
    );
  }
  state.adultSoul = { ...soul, updatedAt: new Date().toISOString() };
  return adultSoulView(state);
}

export function recordAdultTouch(state, zone) {
  return applyAdultCommand(state, `touch:${zone}`);
}

export function saveAdultLook(state, title = 'Look') {
  if (!adultSoulStudioOpen(state))
    throw new Error('Adult Soul looks stay locked until the triple gate is on.');
  const soul = migrateAdultSoul(state.adultSoul);
  const looks = [
    ...soul.looks,
    {
      id: uid('look'),
      title: assertAdultSafeText(title, 'Look title').slice(0, 48) || 'Look',
      avatar: soul.avatar,
    },
  ].slice(-8);
  return configureAdultSoul(state, { looks });
}

export function adultSoulView(state) {
  const open = adultSoulStudioOpen(state);
  const soul = migrateAdultSoul(state?.adultSoul);
  if (!open) {
    return {
      open: false,
      locked: true,
      kind: ADULT_SOUL_KIND,
      reason:
        'Adult Soul studio needs the 18+ app gate plus Adult Mode triple gates. Until a later release, enablement is only in the private administrator panel (Ctrl+A). Revoke and Standard mode stay on Identity.',
      sentience: false,
      vrm: false,
      neuralTts: false,
      catalog: sessionCatalog(),
      cameras: CAMERA_SHOTS,
      commands: QUICK_COMMANDS,
      looks: LOOK_PRESETS,
      wardrobe: WARDROBE,
      frameworks: FANTASY_FRAMEWORKS,
      sexyStyles: SEXY_STYLES,
      atmospheres: ATMOSPHERE_SCENES,
      reactions: SHOW_REACTIONS,
      showHonesty: SHOW_HONESTY,
      feelHonesty: FEEL_HONESTY,
      gamepadHonesty: GAMEPAD_HONESTY,
      ambientHonesty: AMBIENT_HONESTY,
      ambientEngine: AMBIENT_ENGINE,
      engines: runtimeEngineCatalog(),
      patterns: FEEL_PATTERNS,
      syncModes: FEEL_SYNC_MODES,
      folders: BOOKMARK_FOLDERS,
      wellness: WELLNESS_CARDS,
      honestLabel: defaultAdultPersona().honestLabel,
    };
  }
  return {
    open: true,
    locked: false,
    kind: ADULT_SOUL_KIND,
    active: soul.active,
    avatar: soul.avatar,
    sounds: {
      ...soul.sounds,
      clips: soul.sounds.clips.map(({ id, title, url }) => ({ id, title, url })),
    },
    persona: soul.persona,
    stage: soul.stage,
    looks: soul.looks,
    stats: soul.stats,
    session: {
      kind: soul.session.kind,
      active: soul.session.active,
      startedAt: soul.session.startedAt,
      durationMs: soul.session.durationMs,
      beatIndex: soul.session.beatIndex,
      beatCount: soul.session.beats.length,
      currentCue: soul.session.beats[soul.session.beatIndex]?.cue || '',
      pace: soul.session.pace,
      heat: soul.session.heat,
      behavior: soul.stage.behaviorOverride || soul.session.behavior,
      camera: soul.stage.camera || soul.session.camera,
      note: soul.session.note,
    },
    catalog: sessionCatalog(),
    cameras: CAMERA_SHOTS,
    commands: QUICK_COMMANDS,
    lookPresets: LOOK_PRESETS,
    behaviors: BEHAVIOR_CYCLE,
    clothing: CLOTHING,
    wardrobe: WARDROBE,
    frameworks: FANTASY_FRAMEWORKS,
    sexyStyles: SEXY_STYLES,
    atmospheres: ATMOSPHERE_SCENES,
    sexOptions: SEX_OPTIONS,
    reactions: SHOW_REACTIONS,
    showHonesty: SHOW_HONESTY,
    sentience: false,
    vrm: false,
    neuralTts: false,
    mixamo: false,
    appearanceMinYears: ADULT_APPEARANCE_MIN_YEARS,
    honestLabel: soul.persona.honestLabel,
    feel: {
      ...soul.feel,
      stealth: publicStealth(soul.feel.stealth),
    },
    feelHonesty: FEEL_HONESTY,
    gamepadHonesty: GAMEPAD_HONESTY,
    ambientHonesty: AMBIENT_HONESTY,
    ambientEngine: AMBIENT_ENGINE,
    engines: runtimeEngineCatalog(),
    patterns: FEEL_PATTERNS,
    syncModes: FEEL_SYNC_MODES,
    folders: BOOKMARK_FOLDERS,
    wellness: WELLNESS_CARDS,
  };
}

export function avatarLayout(avatarInput = {}) {
  const avatar = normalizeAdultAvatar(avatarInput);
  const f = avatar.figure;
  const p = avatar.presentation;
  const cx = 160;
  const scale = 0.85 + f.height / 400;
  const shoulder = 36 + f.shoulders * 0.22;
  const hip = 34 + f.hips * 0.28;
  const waist = 22 + f.waist * 0.16;
  const bust = p === 'masculine' ? 8 + f.chest * 0.12 : 10 + f.bust * 0.22;
  const butt = 16 + f.butt * 0.18;
  const thigh = 16 + f.thighs * 0.14;
  return {
    cx,
    scale,
    headR: 22 + avatar.head.faceWidth * 0.08,
    neckY: 86,
    shoulderY: 108,
    bustY: 138,
    waistY: 178,
    hipY: 214,
    crotchY: 236,
    kneeY: 300,
    footY: 368,
    shoulder,
    bust,
    waist,
    hip,
    butt,
    thigh,
    belly: f.belly * 0.12,
    wear: avatar.presentationWear,
    hair: avatar.hair,
    skin: avatar.skin.tone,
    explicit: avatar.explicit,
    presentation: p,
    lips: avatar.head.lips,
    eyes: avatar.head.eyeSize,
  };
}

export function touchReactionLine(zone, persona = defaultAdultPersona()) {
  const filthy = persona.verbal?.filthy !== false;
  const youName = you(persona);
  if (zone === 'face')
    return filthy
      ? `Mmm. Eyes on ${youName}. Kiss the air if you want. Still a mesh.`
      : 'Face. Slow. Software, not a mouth.';
  if (zone === 'chest')
    return filthy
      ? 'Yes. Hands on the chest you built. Pinch if you want — it is geometry.'
      : 'Chest. Breath picks up because the deform says so.';
  if (zone === 'groin')
    return filthy
      ? 'There. Grind. Stroke yourself while you poke the mesh. I cannot feel it.'
      : 'Groin zone. You set the pace on your own body.';
  if (zone === 'ass')
    return filthy
      ? 'Ass out. Squeeze your own if you want. This one is vertices.'
      : 'Hips back. Adult figure, not a person.';
  if (zone === 'thighs') return filthy ? 'Spread a little. Keep stroking.' : 'Thighs. Stay adult.';
  return filthy ? 'Touch recorded. Keep going or say red.' : 'Touch recorded. Safeword stops this.';
}

export function adultSoulReply(input, state) {
  const text = String(input || '')
    .replace(/\s+/g, ' ')
    .trim();
  const open = adultSoulStudioOpen(state);
  const soul = migrateAdultSoul(state?.adultSoul);
  const name = soul.persona.name;
  if (!open) {
    return {
      reply:
        'Adult Soul stays locked. Confirm legal-adult status, enable Adult Soul, and grant current consent on Identity. Then the studio, live 3D figure, local sexy audio, and jerk-off coaching unlock. Revoke anytime. This is software, not a person.',
      locked: true,
    };
  }
  if (adultTextForbidden(text)) {
    return {
      reply:
        'No. Adult Soul will not play along with minors, age-ambiguous characters, or that kind of request. The local safety rules stay on even in filthy mode.',
      locked: false,
      blocked: true,
    };
  }
  const filthy = soul.persona.verbal.filthy;
  const heat = soul.persona.heat;
  if (
    /\b(jerk off|jerk-off|masturbat|stroke(?:\s+it)?|edge me|make me come|dirty talk|striptease|pose play)\b/i.test(
      text
    )
  ) {
    return {
      reply: `${name} here — still a program on this PC. ${filthy ? 'Get your cock (or clit, or toy) in hand.' : 'Start touching yourself at a pace you can keep.'} I can run stroke-guide, edge-hold, filthy-talk, striptease, mutual-guide, countdown-finish, pose-play, or aftercare. The figure will grind, present, strip, and climax-deform with the beats. Heat is ${heat}. Safeword ${soul.stage.safeword}. Say stop or revoke consent and I drop it immediately.`,
      locked: false,
      suggest: adultSessionKindFromInput(text),
    };
  }
  if (
    /\b(avatar|body|tits|cock on (?:the )?figure|make (?:them|her|him) naked|3d|pose)\b/i.test(text)
  ) {
    return {
      reply: `The Adult Soul figure is a local first-party WebGL lathe you shape with sliders — not VRM, not MakeHuman, not a photo of a real person. It breathes, sways, and runs sexual behaviors (grind, ride, all-fours, climax shudder). Appearance is locked adult (${ADULT_APPEARANCE_MIN_YEARS}+). Open the Adult Soul studio.`,
      locked: false,
    };
  }
  if (/\b(sound|moan|audio|voice|heartbeat)\b/i.test(text)) {
    return {
      reply:
        'Sexy audio here is: (1) Windows speechSynthesis reading the coaching lines, including Natural/Neural voices when Windows already installed them, (2) a generated heartbeat/breath/drone, (3) audio files you pick that play through eidovara-media. No bundled neural TTS pack. No bundled porn library.',
      locked: false,
    };
  }
  if (
    classifyAdultFeelIntent(text) ||
    /\b(?:feel|vibe|pattern|sync|pin|stealth|vibemate|vibease)\b/i.test(text)
  ) {
    return { reply: adultFeelReply(soul.feel), locked: false };
  }
  return {
    reply: `${name} is the separate Adult Soul layer: live 3D figure, local sounds, jerk-off / edge / filthy / strip / pose sessions, camera shots, Feel Sync pad, and click-to-touch reactions. ${soul.persona.honestLabel} Open the Adult Soul view. Heat ${heat}, style ${soul.persona.style}.`,
    locked: false,
  };
}

export { classifyAdultSoulIntent } from './adult-intents.js';

export function adultSessionKindFromInput(input) {
  const t = String(input || '').toLowerCase();
  if (/\baftercare\b/.test(t)) return 'aftercare';
  if (/\bstrip/.test(t)) return 'striptease';
  if (/\bpose play|poses?\b/.test(t)) return 'pose-play';
  if (/\bmutual\b/.test(t)) return 'mutual-guide';
  if (/\bpraise\b/.test(t)) return 'praise-kink';
  if (/\bdeny|denial\b/.test(t)) return 'tease-deny';
  if (/\btoy\b/.test(t)) return 'toy-pace';
  if (/\bass\b/.test(t)) return 'ass-focus';
  if (/\b(chest|tits|bust)\b/.test(t)) return 'chest-focus';
  if (/\beye contact|stare\b/.test(t)) return 'eye-lock';
  if (/\bpillow\b/.test(t)) return 'pillow-talk';
  if (/\bwhisper\b/.test(t)) return 'whisper-only';
  if (/\bvoyeur\b/.test(t)) return 'voyeur-watch';
  if (/\bcam night\b/.test(t)) return 'cam-night';
  if (/\bafterglow\b/.test(t)) return 'afterglow-hold';
  if (/\brandom mix\b/.test(t)) return 'random-mix';
  if (/\bedg/.test(t)) return 'edge-hold';
  if (/\bcountdown|make me come|finish\b/.test(t)) return 'countdown-finish';
  if (/\bfilthy|dirty talk\b/.test(t)) return 'filthy-talk';
  if (/\bworship\b/.test(t)) return 'worship';
  if (/\bhands[\s-]?free|audio only\b/.test(t)) return 'hands-free-audio';
  if (/\bslow burn\b/.test(t)) return 'slow-burn';
  return 'stroke-guide';
}

export function addAdultClip(state, clip) {
  if (!adultSoulStudioOpen(state))
    throw new Error('Adult Soul audio stays locked until the triple gate is on.');
  const sounds = normalizeAdultSounds({
    ...(state.adultSoul?.sounds || {}),
    clips: [
      ...(state.adultSoul?.sounds?.clips || []),
      {
        id: clip.id || uid('clip').replace(/\W/g, '').slice(0, 32),
        title: clip.title,
        url: clip.url,
      },
    ],
  });
  return configureAdultSoul(state, {
    sounds: { ...sounds, activeClipId: sounds.clips.at(-1)?.id || '' },
  });
}
