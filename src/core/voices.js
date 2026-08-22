// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/** OS-installed speechSynthesis voices. Eidovara does not ship a neural TTS engine. */

export function defaultVoiceSettings() {
  return { voiceURI: '', rate: 1, pitch: 1, mute: false };
}

export function normalizeVoiceSettings(input = {}, prev = defaultVoiceSettings()) {
  const prior = { ...defaultVoiceSettings(), ...(prev && typeof prev === 'object' ? prev : {}) };
  const rate = Number(input.rate);
  const pitch = Number(input.pitch);
  const uri = input.voiceURI !== undefined ? input.voiceURI : (input.voiceName !== undefined ? input.voiceName : prior.voiceURI);
  const mute = input.mute !== undefined ? Boolean(input.mute) : (input.voiceEnabled !== undefined ? !input.voiceEnabled : Boolean(prior.mute));
  return {
    voiceURI: String(uri || '').trim().slice(0, 300),
    rate: Number.isFinite(rate) ? Math.max(0.5, Math.min(2, rate)) : prior.rate,
    pitch: Number.isFinite(pitch) ? Math.max(0.5, Math.min(2, pitch)) : prior.pitch,
    mute
  };
}

export function listInstalledVoices(synth) {
  if (!synth || typeof synth.getVoices !== 'function') return [];
  try {
    return (synth.getVoices() || []).map(voice => ({
      voiceURI: String(voice?.voiceURI || voice?.name || ''),
      name: String(voice?.name || ''),
      lang: String(voice?.lang || '')
    })).filter(voice => voice.voiceURI || voice.name);
  } catch {
    return [];
  }
}

export function resolveVoice(synth, voiceURI) {
  const wanted = String(voiceURI || '');
  if (!wanted) return null;
  return listInstalledVoices(synth).find(voice => voice.voiceURI === wanted || voice.name === wanted) || null;
}

export function speakText(synth, text, settings = {}, { force = false, Utterance = globalThis.SpeechSynthesisUtterance } = {}) {
  if (!synth || typeof synth.speak !== 'function') return { ok: false, reason: 'unavailable' };
  const voice = normalizeVoiceSettings(settings);
  if (!force && voice.mute) return { ok: false, reason: 'muted' };
  if (typeof Utterance !== 'function') return { ok: false, reason: 'no-utterance' };
  const content = String(text || '').slice(0, 8000);
  if (!content.trim()) return { ok: false, reason: 'empty' };
  try { if (typeof synth.cancel === 'function') synth.cancel(); } catch {}
  const utterance = new Utterance(content);
  utterance.rate = voice.rate;
  utterance.pitch = voice.pitch;
  const match = resolveVoice(synth, voice.voiceURI);
  if (match && typeof synth.getVoices === 'function') {
    const raw = (synth.getVoices() || []).find(item => item.voiceURI === match.voiceURI || item.name === match.name);
    if (raw) utterance.voice = raw;
  }
  synth.speak(utterance);
  return { ok: true, voiceURI: match?.voiceURI || voice.voiceURI || '' };
}

export const FUTURE_VOICE_BACKEND = Object.freeze({
  id: 'neural-tts',
  bundled: false,
  available: false,
  note: 'Eidovara does not ship a neural TTS engine. Playback uses speechSynthesis voices already installed on this OS. A future backend may plug in here; Piper, ElevenLabs, and similar engines are not vendored.'
});

