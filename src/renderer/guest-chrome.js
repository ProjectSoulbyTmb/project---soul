// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
const params = new URLSearchParams(location.search);
const kind = params.get('kind') === 'discord' ? 'discord' : 'browse';
const $ = id => document.getElementById(id);
$('overlayTitle').textContent = kind === 'discord' ? 'Discord guest' : 'Browse overlay';
$('overlayNote').textContent =
  kind === 'discord'
    ? 'Loads discord.com in a sandboxed Eidovara window. Not an official Discord overlay. Not affiliated. Does not inject into games.'
    : 'HTTPS pages you open stay in this guest window. The workspace renderer stays locked. Does not inject into games.';
if (kind === 'discord') {
  $('overlayUrl').placeholder = 'https://discord.com/app or invite URL';
  $('overlayUrl').value = 'https://discord.com/app';
  $('discordBanner').classList.remove('hidden');
}
$('goBtn').addEventListener('click', async () => {
  try {
    const status = await window.overlay.navigate($('overlayUrl').value);
    if (status?.url && status.url !== 'about:blank') $('overlayUrl').value = status.url;
    if (status?.error) $('overlayNote').textContent = status.error;
  } catch (err) {
    $('overlayNote').textContent = String(err?.message || err);
  }
});
$('overlayUrl').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    $('goBtn').click();
  }
});
$('backBtn').addEventListener('click', () => window.overlay.history('back'));
$('forwardBtn').addEventListener('click', () => window.overlay.history('forward'));
$('reloadBtn').addEventListener('click', () => window.overlay.history('reload'));
$('topBtn').addEventListener('click', async () => {
  const status = await window.overlay.toggleTop();
  $('topBtn').classList.toggle('is-on', status.alwaysOnTop === true);
});
$('browserBtn').addEventListener('click', async () => {
  const status = await window.overlay.status();
  const url = status?.url && status.url.startsWith('https://') ? status.url : $('overlayUrl').value;
  try {
    await window.overlay.openExternal(url);
  } catch (err) {
    $('overlayNote').textContent = String(err?.message || err);
  }
});
$('closeBtn').addEventListener('click', () => window.overlay.close());
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (e.target?.closest?.('input, textarea')) return;
  e.preventDefault();
  window.overlay.close();
});
window.overlay.onStatus?.(status => {
  if (status?.url && status.url !== 'about:blank') $('overlayUrl').value = status.url;
  if (status?.error) $('overlayNote').textContent = status.error;
  if (status?.electronBlocked) $('discordBanner').classList.remove('hidden');
  $('topBtn').classList.toggle('is-on', status?.alwaysOnTop !== false);
});
void window.overlay
  .status()
  .then(status => {
    if (status?.url && status.url !== 'about:blank') $('overlayUrl').value = status.url;
    $('topBtn').classList.toggle('is-on', status?.alwaysOnTop !== false);
  })
  .catch(() => {});
