// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import { uid } from './schema.js';

export function addMemory(state, content, opts = {}) {
  const now = new Date().toISOString();
  const normalized = String(content || '').trim().slice(0, 4000);
  if (!normalized) throw new Error('Memory cannot be empty.');
  const memory = {
    id: uid('mem'),
    content: normalized,
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
  // Keep adaptation durable without allowing an unbounded local profile or
  // remote-provider context surface. Older inactive records are discarded first.
  if (state.memories.length > 2000) {
    const active = state.memories.filter(item => item.active);
    const inactive = state.memories.filter(item => !item.active);
    state.memories = [...inactive.slice(-Math.max(0, 2000 - active.length)), ...active.slice(-2000)];
  }
  state.audit.push({ at: now, type: 'memory.added', details: { id: memory.id, tags: memory.tags } });
  return memory;
}

export function forgetMemory(state, idOrText) {
  const now = new Date().toISOString();
  const needle = String(idOrText || '').trim();
  if (!needle) return 0;
  let count = 0;
  const lower = needle.toLowerCase();
  for (const memory of state.memories) {
    const idHit = memory.id === needle;
    const textHit = needle.length >= 3 && memory.content.toLowerCase().includes(lower);
    if (idHit || textHit) {
      memory.active = false;
      memory.forgottenAt = now;
      memory.updatedAt = now;
      count += 1;
    }
  }
  state.audit.push({ at: now, type: 'memory.forgotten', details: { idOrText: needle, count } });
  return count;
}

export function activeMemories(state, limit = 20) {
  return state.memories.filter(m => m.active).slice(-limit).reverse();
}
