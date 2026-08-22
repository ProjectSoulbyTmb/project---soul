// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import { clamp01 } from './schema.js';

export function updateRelationship(state, text) {
  const t = text.toLowerCase();
  const now = new Date().toISOString();
  const changes = [];

  if (/\b(indecisive|you decide|take the lead|choose for me)\b/.test(t)) {
    state.relationship.temporaryInitiative = true;
    state.relationship.initiativeReason = 'user requested initiative or expressed indecision';
    state.personality.assertiveness = clamp01(state.personality.assertiveness + 0.07);
    changes.push('temporary initiative enabled');
  }
  if (/\b(i prefer|my preference is|i want you to be)\b/.test(t)) {
    state.relationship.establishedPreference = text;
    state.relationship.temporaryInitiative = false;
    changes.push('relationship preference stored');
  }
  if (/\b(reassurance|reassure|comfort|struggling|anxious|pressure|overwhelmed)\b/.test(t)) {
    state.personality.reassurance = clamp01(state.personality.reassurance + 0.05);
    state.relationship.comfort = clamp01(state.relationship.comfort + 0.03);
    changes.push('regulation/reassurance stance activated');
  }
  if (changes.length) {
    state.relationship.auditTrail.push({ at: now, changes });
    if (state.relationship.auditTrail.length > 500)
      state.relationship.auditTrail = state.relationship.auditTrail.slice(-500);
    state.audit.push({ at: now, type: 'relationship.updated', details: { changes } });
  }
  return changes;
}
