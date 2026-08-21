// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
(() => {
  document.getElementById('mediaDockBtn')?.addEventListener('click', async () => {
    const snap = window.eidovaraNowPlaying?.snapshot?.() || {};
    window.eidovaraNowPlaying?.pause?.();
    await window.soul?.dockPlayer?.(snap);
  });
})();
