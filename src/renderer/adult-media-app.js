// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
const $ = s => document.querySelector(s);

function adultOn() {
  const p = window.eidovaraState?.policy || {};
  return (
    p.mode === 'adult' &&
    p.adultSoulEnabled === true &&
    p.adultStatusConfirmed === true &&
    p.currentConsent === true
  );
}

function cardButton(item, { later = false } = {}) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'adult-card';
  b.style.setProperty('--art-from', item.art?.from || '#3a2030');
  b.style.setProperty('--art-to', item.art?.to || '#12080c');
  const strong = document.createElement('strong');
  strong.textContent = item.title || 'Untitled';
  const small = document.createElement('small');
  small.textContent = later ? 'Watch later' : item.type || 'media';
  b.append(strong, small);
  b.addEventListener('click', () => {
    if (item.playable && item.url && window.eidovaraPlayMedia) {
      window.eidovaraPlayMedia([item], 0, { alreadyConfirmed: true });
      return;
    }
    if (item.sourceUrl && window.soul?.openExternal) {
      if (
        window.confirm(
          `Open ${item.title} in your system browser? Eidovara does not embed this player.`
        )
      ) {
        window.soul.openExternal(item.sourceUrl);
      }
    }
  });
  return b;
}

async function refresh(query = '') {
  const desk = $('#adultMediaDesk');
  if (!desk) return;
  const open = adultOn() && Boolean(window.eidovaraAdminSession?.());
  desk.classList.toggle('hidden', !open);
  if (!open || !window.soul?.adultMediaDesk) return;
  let view;
  try {
    view = await window.soul.adultMediaDesk({
      query,
      library: window.eidovaraSessionLibrary || [],
    });
  } catch {
    desk.classList.add('hidden');
    return;
  }
  const honesty = $('#adultMediaHonesty');
  if (honesty) honesty.textContent = view.honesty || view.reason || '';
  const chips = $('#adultMediaHandoffs');
  if (chips) {
    chips.textContent = '';
    for (const item of view.handoffs || []) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'secondary';
      b.textContent = item.title || item.provider;
      b.addEventListener('click', async () => {
        if (
          !window.confirm(
            `Open ${item.provider} in your system browser? Eidovara does not fetch that siteâ€™s HTML or embed its player.`
          )
        )
          return;
        await window.soul.openExternal(item.url);
      });
      chips.append(b);
    }
  }
  const rails = $('#adultMediaRails');
  if (rails) {
    rails.textContent = '';
    for (const rail of view.rails || []) {
      const wrap = document.createElement('div');
      wrap.className = 'adult-rail';
      const h = document.createElement('h4');
      h.textContent = rail.title;
      const row = document.createElement('div');
      row.className = 'adult-rail-row';
      for (const item of rail.items)
        row.append(
          cardButton({
            ...item,
            art: item.art || view.library?.find(x => x.title === item.title)?.art,
          })
        );
      wrap.append(h, row);
      rails.append(wrap);
    }
  }
  const folders = $('#adultMediaFolders');
  if (folders) {
    folders.textContent = '';
    folders.className = 'adult-folder-list';
    for (const folder of view.folders || []) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'secondary';
      b.textContent = `${folder.title} (${(folder.items || []).length})`;
      folders.append(b);
    }
  }
  const wellness = $('#adultMediaWellness');
  if (wellness) {
    wellness.textContent = '';
    wellness.className = 'adult-wellness';
    for (const card of view.wellness || []) {
      const article = document.createElement('article');
      const h = document.createElement('h5');
      h.textContent = card.title;
      const p = document.createElement('p');
      p.className = 'settings-help';
      p.textContent = card.body;
      article.append(h, p);
      wellness.append(article);
    }
  }
  const creators = $('#adultMediaCreators');
  if (creators) {
    creators.textContent = '';
    for (const item of view.creators || []) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'secondary';
      b.textContent = item.title;
      b.addEventListener('click', () => {
        if (window.confirm(`Open ${item.title} in your system browser?`))
          window.soul.openExternal(item.url);
      });
      creators.append(b);
    }
  }
}

function bind() {
  $('#adultMediaSearchForm')?.addEventListener('submit', e => {
    e.preventDefault();
    refresh($('#adultMediaQuery')?.value || '');
  });
  $('#openAdultMediaFromIdentity')?.addEventListener('click', () => {
    if (window.eidovaraAdminSession?.()) {
      window.eidovaraSetView?.('entertainment');
      $('#adultMediaDesk')?.scrollIntoView({ block: 'start' });
      return;
    }
    window.eidovaraOpenAdmin?.();
  });
}

window.eidovaraAdultMedia = {
  refresh,
  onShow() {
    refresh($('#adultMediaQuery')?.value || '');
  },
};
bind();
void refresh();
