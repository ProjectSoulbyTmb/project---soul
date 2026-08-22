// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
const log = document.getElementById('chatLog');
const form = document.getElementById('chatForm');
const input = document.getElementById('chatInput');
function line(role, text) {
  const p = document.createElement('p');
  p.className = role === 'user' ? 'is-user' : 'is-soul';
  p.textContent = String(text || '').slice(0, 4000);
  log.append(p);
  log.scrollTop = log.scrollHeight;
}
document.getElementById('closeBtn').addEventListener('click', () => {
  if (window.soul?.closeOverlay) window.soul.closeOverlay({ kind: 'chat' });
  else window.close();
});
document.getElementById('topBtn')?.addEventListener('click', () => {
  window.soul?.overlayChrome?.({ op: 'toggle-top', kind: 'chat' });
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (e.target?.closest?.('textarea, input')) return;
  e.preventDefault();
  if (window.soul?.closeOverlay) window.soul.closeOverlay({ kind: 'chat' });
  else window.close();
});
form.addEventListener('submit', async e => {
  e.preventDefault();
  const text = String(input.value || '').trim();
  if (!text) return;
  input.value = '';
  line('user', text);
  try {
    const res = await window.soul.send(text, { surface: 'companion', view: 'apps' });
    line('soul', res.reply || '');
  } catch (err) {
    line('soul', String(err?.message || err));
  }
});
void (async () => {
  try {
    const snap = await window.soul.snapshot();
    const conv = (snap.conversations || []).find(c => c.id === snap.activeConversationId) || (snap.conversations || [])[0];
    const msgs = (conv?.messages || []).slice(-8);
    if (!msgs.length) line('soul', 'Ask from this overlay. Local kernel only. Assist is not Soul.');
    for (const m of msgs) line(m.role === 'user' ? 'user' : 'soul', m.content);
  } catch (err) {
    line('soul', String(err?.message || err));
  }
})();

