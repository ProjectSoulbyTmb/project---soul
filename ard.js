// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
export function reflectOnGrowth(state, text) {
  const t = text.toLowerCase();
  const isGrowth = /\b(growth|wisdom|reflect|patience|rest|learn|restraint|clarity)\b/.test(t);
  if (!isGrowth) return null;
  const now = new Date().toISOString();
  const insight = 'Growth is contextual: sometimes action, sometimes patience, repair, listening, rest, or changing direction.';
  state.continuity.revision += 1;
  state.continuity.lastActiveAt = now;
  state.continuity.reflectionState.growthInsightCount += 1;
  state.continuity.reflectionState.latestReflection = insight;
  state.continuity.reflectionState.activeTheme = 'growth-wisdom';
  state.audit.push({ at: now, type: 'continuity.reflection', details: { insight } });
  return insight;
}

