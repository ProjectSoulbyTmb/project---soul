import { addMemory } from './memory.js';
import { clamp01 } from './schema.js';

export function processLearning(state, text) {
  const t = text.toLowerCase();
  const now = new Date().toISOString();
  const learned = [];

  const criticism = /\b(criticism|you were wrong|that was wrong|mistake|flaw|problem|error|bad response)\b/.test(t);
  if (criticism) {
    const memory = addMemory(state, text, { kind: 'criticism', confidence: 0.75, tags: ['criticism'], provenance: { channel: 'conversation', evaluation: 'pending-review' } });
    state.feedback.push({ id: memory.id, at: now, kind: 'criticism', status: 'examined-not-automatically-accepted', content: text });
    state.personality.humility = clamp01((state.personality.humility ?? 0.7) + 0.03);
    state.personality.directness = clamp01(state.personality.directness + 0.01);
    learned.push('criticism recorded as evidence for review');
  }

  const preference = text.match(/(?:remember that|from now on|going forward)\s+(.+)/i);
  if (preference?.[1]) {
    addMemory(state, preference[1], { kind: 'preference', confidence: 0.85, tags: ['preference'] });
    state.personality.adaptability = clamp01(state.personality.adaptability + 0.02);
    learned.push('preference stored');
  }

  if (/forget (that|memory|preference)/i.test(text)) {
    learned.push('forgetting request detected');
  }
  return learned;
}
