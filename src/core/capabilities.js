// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
export function mediaPlaybackDecision(capability, { alreadyConfirmed = false } = {}) {
  const mode = ['disabled', 'confirm', 'enabled'].includes(capability) ? capability : 'confirm';
  if (mode === 'disabled') return { allowed: false, needsConfirm: false, mode };
  if (alreadyConfirmed || mode === 'enabled') return { allowed: true, needsConfirm: false, mode };
  return { allowed: true, needsConfirm: true, mode };
}

// v0.22.2 ships as one full free Alpha. Keep the compatibility helper so older
// callers do not break, but no implemented feature is restricted by edition.
export function premiumFeatureAllowed(_edition, _feature) {
  return true;
}
