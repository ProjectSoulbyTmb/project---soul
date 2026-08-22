// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
export function mediaPlaybackDecision(capability, { alreadyConfirmed = false } = {}) {
  const mode = ['disabled', 'confirm', 'enabled'].includes(capability) ? capability : 'confirm';
  if (mode === 'disabled') return { allowed: false, needsConfirm: false, mode };
  if (alreadyConfirmed || mode === 'enabled') return { allowed: true, needsConfirm: false, mode };
  return { allowed: true, needsConfirm: true, mode };
}

export function premiumFeatureAllowed(edition, feature) {
  if (edition === 'premium') return true;
  return !['rgb', 'compatible', 'searchKey', 'unlimitedApps'].includes(feature);
}
