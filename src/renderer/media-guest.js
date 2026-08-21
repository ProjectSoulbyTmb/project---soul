// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
const $ = id => document.getElementById(id);
const api = window.eidovaraGuest;

function paintRecents(list) {
  const box = $('guestRecents');
  const empty = $('guestEmpty');
  if (!box) return;
  box.textContent = '';
  const items = Array.isArray(list) ? list : [];
  empty?.classList.toggle('hidden', items.length > 0);
  for (const item of items) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = item.title || item.url;
    btn.title = item.url;
    btn.addEventListener('click', () => api?.openUrl(item.url));
    box.append(btn);
  }
}

function paintNav(payload = {}) {
  if (payload.url && payload.url !== 'about:blank' && $('guestUrl') && document.activeElement !== $('guestUrl')) {
    $('guestUrl').value = payload.url;
  }
  if (payload.copy) $('guestCopy').textContent = payload.copy;
  if (payload.caveat) $('guestCaveat').textContent = payload.caveat;
  $('guestHomePanel')?.classList.toggle('hidden', payload.mode === 'browse');
  paintRecents(payload.recents);
}

$('guestForm').addEventListener('submit', e => {
  e.preventDefault();
  api?.openUrl($('guestUrl').value);
});
$('guestGo').addEventListener('click', () => api?.openUrl($('guestUrl').value));
$('guestBack').addEventListener('click', () => api?.back());
$('guestHome').addEventListener('click', () => api?.home());
$('guestClose').addEventListener('click', () => api?.close());
$('guestDock').addEventListener('click', () => api?.dock());
$('guestPin').addEventListener('click', () => api?.toggleAlwaysOnTop());
$('guestLocal').addEventListener('click', () => api?.playLocal());
api?.onNavigated?.(paintNav);
api?.onCaption?.(payload => {
  if ($('guestCaption')) $('guestCaption').textContent = payload.caption || payload.title || 'Online viewing';
});
api?.onBlocked?.(payload => {
  if ($('guestCopy')) $('guestCopy').textContent = `Blocked ${payload.reason || 'address'}. HTTP, file, localhost, and private hosts stay closed.`;
});
api?.recents?.().then(paintRecents).catch(() => {});
