import { uid } from './schema.js';

export function addMemory(state, content, opts = {}) {
  const now = new Date().toISOString();
  const memory = {
    id: uid('mem'),
    content: String(content).trim(),
    kind: opts.kind || 'observation',
    source: opts.source || 'user',
    confidence: opts.confidence ?? 0.7,
    tags: opts.tags || [],
    active: true,
    supersedes: opts.supersedes || null,
    createdAt: now,
    updatedAt: now,
    provenance: opts.provenance || { channel: 'conversation' }
  };
  if (opts.contradictsTag) {
    for (const old of state.memories) {
      if (old.active && old.tags?.includes(opts.contradictsTag)) {
        old.active = false;
        old.supersededBy = memory.id;
        old.updatedAt = now;
      }
    }
  }
  state.memories.push(memory);
  state.audit.push({ at: now, type: 'memory.added', details: { id: memory.id, tags: memory.tags } });
  return memory;
}

export function forgetMemory(state, idOrText) {
  const now = new Date().toISOString();
  let count = 0;
  for (const memory of state.memories) {
    if (memory.id === idOrText || memory.content.toLowerCase().includes(String(idOrText).toLowerCase())) {
      memory.active = false;
      memory.forgottenAt = now;
      memory.updatedAt = now;
      count += 1;
    }
  }
  state.audit.push({ at: now, type: 'memory.forgotten', details: { idOrText, count } });
  return count;
}

export function activeMemories(state, limit = 20) {
  return state.memories.filter(m => m.active).slice(-limit).reverse();
}
