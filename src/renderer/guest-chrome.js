// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
const params = new URLSearchParams(location.search);
const kind = params.get('kind') === 'discord' ? 'discord' : 'browse';
const $ = id => document.getElementById(id);
$('overlayTitle').textContent = kind === 'discord' ? 'Discord guest' : 'Browse overlay';
$('overlayNote').textContent = kind === 'discord'
  ? 'Loads discord.com in a sandboxed Eidovara window. Not an official Discord overlay. Not affiliated. Does not inject into games.'
  : 'HTTPS pages you open stay in this guest window. The workspace renderer stays locked. Does not inject into games.';
if (kind === 'discord') {
  $('overlayUrl').placeholder = 'https://discord.com/app';
  $('overlayUrl').value = 'https://discord.com/app';
}
$('goBtn').addEventListener('click', async () => {
  try {
    const status = await window.overlay.navigate($('overlayUrl').value);
    if (status?.url) $('overlayUrl').value = status.url;
    $('overlayNote').textContent = status?.error || $('overlayNote').textContent;
  } catch (err) {
    $('overlayNote').textContent = String(err?.message || err);
  }
});
$('overlayUrl').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('goBtn').click(); } });
$('topBtn').addEventListener('click', async () => {
  const status = await window.overlay.toggleTop();
  $('topBtn').classList.toggle('is-on', status.alwaysOnTop === true);
});
$('browserBtn').addEventListener('click', async () => {
  const status = await window.overlay.status();
  if (status?.url && status.url.startsWith('https://')) await window.overlay.openExternal(status.url);
});
$('closeBtn').addEventListener('click', () => window.overlay.close());
window.overlay.onStatus?.(status => {
  if (status?.url && status.url !== 'about:blank') $('overlayUrl').value = status.url;
  if (status?.error) {
    $('overlayNote').textContent = kind === 'discord'
      ? `${status.error} Discord may refuse this guest Chromium. Use Browser to open discord.com in your system browser. Not an official overlay.`
      : status.error;
  }
});
void window.overlay.status().then(status => {
  if (status?.url && status.url !== 'about:blank') $('overlayUrl').value = status.url;
  $('topBtn').classList.toggle('is-on', status?.alwaysOnTop !== false);
}).catch(() => {});
