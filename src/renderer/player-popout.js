// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
const $ = id => document.getElementById(id);
let item = null;

function current() {
  return item?.type === 'video' ? $('popVideo') : $('popAudio');
}

function load(payload) {
  item = payload?.item || null;
  const video = $('popVideo');
  const audio = $('popAudio');
  audio.pause();
  video.pause();
  if (!item?.url || !/^eidovara-media:|^eidovara-online:/i.test(item.url)) {
    $('popTitle').textContent = 'Nothing playing';
    return;
  }
  $('popTitle').textContent = item.title || 'Eidovara';
  $('popKind').textContent = item.local ? `Local ${item.type}` : (item.type || '');
  const player = item.type === 'video' ? video : audio;
  video.classList.toggle('hidden', item.type !== 'video');
  audio.classList.toggle('hidden', item.type === 'video');
  if (item.type !== 'video') video.removeAttribute('src');
  else audio.removeAttribute('src');
  player.preload = 'auto';
  player.src = item.url;
  player.playbackRate = Number(payload.rate) || 1;
  player.play().catch(() => {});
}

$('popPlay').addEventListener('click', () => {
  const player = current();
  if (!player) return;
  player.paused ? player.play().catch(() => {}) : player.pause();
});
$('popPrev').addEventListener('click', () => window.soul?.playerCommand?.('previous'));
$('popNext').addEventListener('click', () => window.soul?.playerCommand?.('next'));
$('popDock').addEventListener('click', () => window.soul?.dockPlayer?.());
if (window.soul?.onPlayerPopout) window.soul.onPlayerPopout(load);
