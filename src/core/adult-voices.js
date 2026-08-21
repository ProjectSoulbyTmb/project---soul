// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Adult Soul voice studio: every OS-installed speechSynthesis voice, ranked for
 * in-room coaching, plus user-imported realistic audio.
 *
 * Consumer demand (adult apps): many natural-sounding voices, genders, accents,
 * preview, favorites, separate coach vs bedroom voice, and real moan/bed audio.
 * This layer meets that on Windows by using voices the OS already installed
 * (including Microsoft Natural/OneCore neural voices when present) and by playing
 * the user's own files through eidovara-media.
 *
 * Eidovara does not ship a neural TTS engine (no Kokoro, Piper, sherpa-onnx,
 * ElevenLabs, or cloud voice API). Celebrity cloning is refused.
 */
import { listInstalledVoices, normalizeVoiceSettings, speakText } from './voices.js';

export const ADULT_VOICE_HONESTY = 'Adult Soul uses every speechSynthesis voice already on this Windows PC, including Microsoft Natural/Neural voices when Windows installed them. Realistic moans, wet sounds, and bed audio are files you import. Eidovara does not ship Kokoro, Piper, ElevenLabs, or any third-party neural TTS engine.';

const NEURAL_OS = /natural|neural|online \(natural\)|online \(neural\)|onecore|microsoft .+ neural/i;
const FEM = /\b(aria|jenny|emma|sonia|sara|zira|hazel|susan|jane|nancy|monica|linda|helen|catherine|elvira|libby|sonia|ana|elsa|marie|hortense|haruka|ayumi|heami|huihui|yaoyao)\b/i;
const MASC = /\b(guy|andrew|ryan|david|davis|james|george|mark|brian|jason|tony|richard|stefan|pablo|jorge|paul|thomas|claude|ichiro|an|kangkang)\b/i;

export const ADULT_VOICE_PRESETS = Object.freeze([
  { id: 'intimate-low-fem', title: 'Intimate low (feminine)', demand: 'Bedroom whisper, slower, slightly lower pitch', gender: 'feminine', rate: 0.84, pitch: 0.92, intimacy: 78, match: /aria|jenny|emma|sonia|sara|zira|hazel|libby|ana/i, preview: 'Stay close. Slow down. I want to hear every stroke.' },
  { id: 'breathy-fem', title: 'Breathy coach (feminine)', demand: 'Soft dirty-talk with space between words', gender: 'feminine', rate: 0.78, pitch: 1.05, intimacy: 86, match: /aria|jenny|emma|nancy|monica|catherine/i, preview: 'That’s it… wetter… don’t you dare come yet.' },
  { id: 'warm-aftercare-fem', title: 'Warm aftercare (feminine)', demand: 'Soft landing after a finish', gender: 'feminine', rate: 0.88, pitch: 1.0, intimacy: 40, match: /emma|jenny|aria|susan|hazel/i, preview: 'Easy. Unclench. You did enough. Water, then rest.' },
  { id: 'playful-tease-fem', title: 'Playful tease (feminine)', demand: 'Grinning, faster teasing', gender: 'feminine', rate: 1.02, pitch: 1.18, intimacy: 64, match: /jenny|sara|zira|libby|ana/i, preview: 'Look at you leaking already. Keep going. I like you desperate.' },
  { id: 'dominant-fem', title: 'Dominant (feminine)', demand: 'Orders, countdown, edge control', gender: 'feminine', rate: 0.9, pitch: 0.88, intimacy: 70, match: /aria|sonia|nancy|catherine|hortense/i, preview: 'Fist it. Faster. You come when I count, not before.' },
  { id: 'uk-bedroom-fem', title: 'UK bedroom (feminine)', demand: 'British OS voice when installed', gender: 'feminine', rate: 0.86, pitch: 0.98, intimacy: 74, match: /hazel|libby|sonia|serena|uk|en-gb/i, preview: 'Go on then. Slow at the head. Make it filthy for me.' },
  { id: 'natural-fem-lead', title: 'Windows Natural feminine', demand: 'Highest-quality OS neural if present', gender: 'feminine', rate: 0.9, pitch: 1.02, intimacy: 72, match: /natural|neural/i, genderLock: 'feminine', preview: 'I’m the Adult Soul voice on this PC. Still software. Still going to talk you through it.' },
  { id: 'intimate-low-masc', title: 'Intimate low (masculine)', demand: 'Low, close, dirty', gender: 'masculine', rate: 0.82, pitch: 0.78, intimacy: 80, match: /guy|andrew|ryan|david|davis|george|mark/i, preview: 'Grip it. Slow. I want it wet. Don’t rush the head.' },
  { id: 'dominant-masc', title: 'Dominant (masculine)', demand: 'Coach / countdown / orders', gender: 'masculine', rate: 0.92, pitch: 0.82, intimacy: 68, match: /guy|andrew|ryan|brian|jason|tony/i, preview: 'Stroke. Faster. Hold. You don’t come until I say.' },
  { id: 'warm-aftercare-masc', title: 'Warm aftercare (masculine)', demand: 'Calm after climax', gender: 'masculine', rate: 0.86, pitch: 0.9, intimacy: 36, match: /andrew|david|james|george/i, preview: 'That’s enough. Breathe. You’re done proving anything.' },
  { id: 'playful-masc', title: 'Playful (masculine)', demand: 'Grinning filthy', gender: 'masculine', rate: 1.0, pitch: 0.95, intimacy: 60, match: /ryan|jason|guy|tony/i, preview: 'Yeah, just like that. Make a mess. I like you eager.' },
  { id: 'uk-bedroom-masc', title: 'UK bedroom (masculine)', demand: 'British OS voice when installed', gender: 'masculine', rate: 0.84, pitch: 0.8, intimacy: 74, match: /george|ryan.*uk|en-gb|united kingdom/i, preview: 'Nice and slow. Let it throb. I’ve got you.' },
  { id: 'natural-masc-lead', title: 'Windows Natural masculine', demand: 'Highest-quality OS neural if present', gender: 'masculine', rate: 0.88, pitch: 0.84, intimacy: 72, match: /natural|neural/i, genderLock: 'masculine', preview: 'Adult Soul, still a program. I’ll talk you through the strokes anyway.' },
  { id: 'androgynous-even', title: 'Even / androgynous', demand: 'Mid pitch, less gendered', gender: 'androgynous', rate: 0.9, pitch: 1.0, intimacy: 58, match: /./, preview: 'Keep a steady hand. Tell me when you’re close. I will back you off.' },
  { id: 'es-intimate', title: 'Spanish intimate', demand: 'es-* OS voices when installed', gender: 'any', rate: 0.86, pitch: 1.0, intimacy: 70, lang: /^es\b/i, preview: 'Despacio. Más mojado. No te corras todavía.' },
  { id: 'fr-intimate', title: 'French intimate', demand: 'fr-* OS voices when installed', gender: 'any', rate: 0.84, pitch: 1.02, intimacy: 70, lang: /^fr\b/i, preview: 'Plus lent. Reste au bord. Tu jouis quand je le dis.' },
  { id: 'de-intimate', title: 'German intimate', demand: 'de-* OS voices when installed', gender: 'any', rate: 0.86, pitch: 0.94, intimacy: 68, lang: /^de\b/i, preview: 'Langsamer. Fester. Komm nicht, bevor ich zähle.' },
  { id: 'stroke-metronome', title: 'Stroke metronome', demand: 'Clear counting for jerk-off pace', gender: 'any', rate: 0.95, pitch: 0.96, intimacy: 50, match: /natural|neural|aria|guy|david|zira/i, preview: 'One. Two. Three. Squeeze. Four. Five. Don’t finish.' },
  { id: 'edge-whisper', title: 'Edge whisper', demand: 'Very slow, almost whispered coaching', gender: 'any', rate: 0.72, pitch: 0.9, intimacy: 92, match: /aria|jenny|andrew|guy|natural/i, preview: 'Stop. Squeeze. Let it pulse. You’re not allowed to come.' },
  { id: 'countdown-finish', title: 'Countdown finish', demand: 'Crisp numbers for the last ten strokes', gender: 'any', rate: 0.98, pitch: 0.92, intimacy: 75, match: /neural|natural|aria|guy|ryan/i, preview: 'Ten. Nine. Faster. Three. Two. One. Come.' },
  { id: 'hands-free-bed', title: 'Hands-free bed', demand: 'Longer phrases while user audio plays', gender: 'any', rate: 0.8, pitch: 0.98, intimacy: 84, match: /natural|neural|aria|jenny|andrew/i, preview: 'Listen. Touch if you want. I’ll keep talking until you stop me.' },
  { id: 'filthy-fast', title: 'Filthy fast', demand: 'High-heat dirty talk', gender: 'any', rate: 1.06, pitch: 1.04, intimacy: 88, match: /jenny|ryan|aria|guy/i, preview: 'Spit. Fist. Faster. I want it sloppy and loud.' },
  { id: 'os-default-sexy', title: 'OS default, bedroom mix', demand: 'Whatever Windows lists first, slowed', gender: 'any', rate: 0.86, pitch: 0.94, intimacy: 62, match: /./, preview: 'This is your default Windows voice, slowed for Adult Soul. Still software.' }
]);

export const CLIP_ROLES = Object.freeze(['coach-bed', 'moan', 'wet', 'breath', 'climax', 'afterglow']);

function guessGender(name, lang) {
  const n = String(name || '');
  if (FEM.test(n)) return 'feminine';
  if (MASC.test(n)) return 'masculine';
  if (/\bfemale\b|\bwoman\b/i.test(n)) return 'feminine';
  if (/\bmale\b|\bman\b/i.test(n)) return 'masculine';
  return 'unspecified';
}

function qualityOf(name, uri) {
  const blob = `${name} ${uri}`;
  if (NEURAL_OS.test(blob)) return 'os-neural';
  if (/microsoft/i.test(blob)) return 'os-microsoft';
  return 'os-standard';
}

export function enrichInstalledVoices(synthOrList) {
  const raw = Array.isArray(synthOrList)
    ? synthOrList
    : listInstalledVoices(synthOrList);
  return raw.map(voice => {
    const name = String(voice.name || '');
    const voiceURI = String(voice.voiceURI || name);
    const lang = String(voice.lang || '');
    const quality = qualityOf(name, voiceURI);
    const gender = guessGender(name, lang);
    let sexyScore = 40;
    if (quality === 'os-neural') sexyScore += 40;
    else if (quality === 'os-microsoft') sexyScore += 18;
    if (/en[-_](us|gb|au)/i.test(lang)) sexyScore += 8;
    if (gender === 'feminine' || gender === 'masculine') sexyScore += 6;
    if (/natural|neural|aria|jenny|guy|andrew|ryan|emma/i.test(name)) sexyScore += 10;
    return {
      voiceURI,
      name,
      lang,
      quality,
      gender,
      sexyScore: Math.min(100, sexyScore),
      tags: [
        quality === 'os-neural' ? 'windows-natural' : 'os-voice',
        gender,
        lang.slice(0, 2) || 'und'
      ]
    };
  }).sort((a, b) => b.sexyScore - a.sexyScore || a.name.localeCompare(b.name));
}

export function voiceMatchesPreset(voice, preset) {
  if (!voice || !preset) return false;
  if (preset.lang && !preset.lang.test(String(voice.lang || ''))) return false;
  if (preset.genderLock && voice.gender !== preset.genderLock && voice.gender !== 'unspecified') {
    if (preset.match && NEURAL_OS.test(`${voice.name} ${voice.voiceURI}`)) {
      return preset.match.test(`${voice.name} ${voice.voiceURI}`) && (voice.gender === preset.genderLock);
    }
    return false;
  }
  if (preset.lang) return true;
  return preset.match ? preset.match.test(`${voice.name} ${voice.voiceURI} ${voice.lang}`) : true;
}

export function selectVoiceForPreset(voices, presetId) {
  const preset = ADULT_VOICE_PRESETS.find(item => item.id === presetId) || ADULT_VOICE_PRESETS[0];
  const list = Array.isArray(voices) ? voices : [];
  const ranked = list.filter(voice => voiceMatchesPreset(voice, preset));
  const neural = ranked.filter(voice => voice.quality === 'os-neural');
  const pick = neural[0] || ranked[0] || list[0] || null;
  return { preset, voice: pick };
}

export function applyPresetToSounds(sounds, presetId, voices = []) {
  const { preset, voice } = selectVoiceForPreset(voices, presetId);
  return {
    ...sounds,
    presetId: preset.id,
    rate: preset.rate,
    pitch: preset.pitch,
    intimacy: preset.intimacy,
    voiceURI: voice?.voiceURI || sounds.voiceURI || '',
    coachVoiceURI: voice?.voiceURI || sounds.coachVoiceURI || sounds.voiceURI || '',
    voiceEnabled: true
  };
}

export function defaultAdultVoiceState() {
  return {
    presetId: 'intimate-low-fem',
    coachVoiceURI: '',
    whisperVoiceURI: '',
    favoriteURIs: [],
    intimacy: 72,
    speakCues: true,
    dualVoice: true
  };
}

export function normalizeAdultVoiceState(input = {}, prior = defaultAdultVoiceState()) {
  const base = { ...defaultAdultVoiceState(), ...(prior || {}) };
  const incoming = input && typeof input === 'object' ? input : {};
  const favorites = Array.isArray(incoming.favoriteURIs) ? incoming.favoriteURIs : base.favoriteURIs;
  const presetId = ADULT_VOICE_PRESETS.some(item => item.id === incoming.presetId)
    ? incoming.presetId
    : base.presetId;
  return {
    presetId,
    coachVoiceURI: String(incoming.coachVoiceURI ?? base.coachVoiceURI ?? '').slice(0, 300),
    whisperVoiceURI: String(incoming.whisperVoiceURI ?? base.whisperVoiceURI ?? '').slice(0, 300),
    favoriteURIs: [...new Set(favorites.map(item => String(item || '').slice(0, 300)).filter(Boolean))].slice(0, 40),
    intimacy: Math.max(0, Math.min(100, Number(incoming.intimacy ?? base.intimacy) || 72)),
    speakCues: incoming.speakCues !== false,
    dualVoice: incoming.dualVoice !== false
  };
}

export function adultPreviewLine(presetId) {
  const preset = ADULT_VOICE_PRESETS.find(item => item.id === presetId);
  return preset?.preview || ADULT_VOICE_PRESETS[0].preview;
}

export function speakAdultCue(synth, text, sounds = {}, extra = {}) {
  const intimacy = Math.max(0, Math.min(100, Number(sounds.intimacy ?? extra.intimacy ?? 72)));
  const pace = String(extra.pace || 'medium');
  const whisper = extra.whisper === true || pace === 'stop' || pace === 'slow';
  const uri = whisper && sounds.dualVoice !== false && sounds.whisperVoiceURI
    ? sounds.whisperVoiceURI
    : (sounds.coachVoiceURI || sounds.voiceURI || '');
  const rate = Math.max(0.5, Math.min(2, (Number(sounds.rate) || 0.9) * (whisper ? 0.88 : 1) * (1 - intimacy * 0.0015)));
  const pitch = Math.max(0.5, Math.min(2, (Number(sounds.pitch) || 1) * (whisper ? 0.94 : 1)));
  return speakText(synth, text, {
    voiceURI: uri,
    rate,
    pitch,
    mute: sounds.mute === true || sounds.voiceEnabled === false || extra.force === false && extra.muted
  }, extra);
}

export function groupVoicesForPicker(voices) {
  const list = Array.isArray(voices) ? voices : [];
  const groups = new Map();
  for (const voice of list) {
    const key = `${voice.quality}|${(voice.lang || 'und').slice(0, 5)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(voice);
  }
  return [...groups.entries()].map(([key, items]) => ({
    key,
    label: items[0]?.quality === 'os-neural' ? `Windows Natural / Neural · ${items[0].lang || ''}` : `Installed OS voices · ${items[0]?.lang || ''}`,
    items
  }));
}

export const ADULT_VOICE_SOFTWARE = Object.freeze({
  speechSynthesis: true,
  windowsNaturalWhenInstalled: true,
  userImportedAudio: true,
  proceduralAmbient: true,
  bundledNeuralEngine: false,
  celebrityCloning: false,
  cloudVoiceApi: false,
  note: ADULT_VOICE_HONESTY
});
