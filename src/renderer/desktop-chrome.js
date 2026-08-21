// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
(() => {
  const $ = s => document.querySelector(s);
  const t = (key, fallback) => window.eidovaraI18n?.t(key, fallback) || fallback || key;
  let sleepTick = 0;

  function settings() { return window.eidovaraSettings || {}; }

  function fillWindowChrome() {
    if ($('#alwaysOnTop')) $('#alwaysOnTop').checked = settings().alwaysOnTop === true;
    if ($('#openAtLogin')) {
      $('#openAtLogin').checked = settings().openAtLogin === true;
      const win = settings().loginItem;
      if (win && win.supported === false) $('#openAtLogin').disabled = true;
    }
  }

  async function persistWindowChrome() {
    if (!window.soul?.saveSettings) return;
    const next = await window.soul.saveSettings({
      provider: settings().provider || 'offline',
      endpoint: settings().endpoint || '',
      model: settings().model || '',
      language: settings().language || 'en',
      theme: settings().theme,
      companion: settings().companion,
      assistOptIn: settings().assistOptIn === true,
      alwaysOnTop: $('#alwaysOnTop')?.checked === true,
      openAtLogin: $('#openAtLogin')?.checked === true
    });
    window.eidovaraSettings = next;
    fillWindowChrome();
    return next;
  }

  function recents() {
    return window.eidovaraState?.kernel?.workspace?.recents
      || window.eidovaraKernel?.workspace?.recents
      || [];
  }

  function renderRecents() {
    const box = $('#recentsList');
    if (!box) return;
    box.textContent = '';
    const items = recents();
    if (!items.length) {
      box.append(Object.assign(document.createElement('p'), { className: 'empty', textContent: t('recentsEmpty', 'Nothing recent yet. Palettes, local media, and linked apps appear here.') }));
      return;
    }
    const list = document.createElement('ul');
    list.className = 'recent-list';
    for (const item of items.slice(0, 12)) {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'recent-row';
      b.append(
        Object.assign(document.createElement('strong'), { textContent: item.title || item.id }),
        Object.assign(document.createElement('small'), { textContent: item.kind || 'command' })
      );
      b.addEventListener('click', () => {
        if (item.kind === 'app') window.eidovaraSetView?.('apps');
        else if (item.kind === 'media') window.eidovaraSetView?.('entertainment');
        else if (item.kind === 'memory') window.eidovaraSetView?.('memory');
        else window.eidovaraSetView?.('dashboard');
      });
      li.append(b);
      list.append(li);
    }
    box.append(list);
  }

  function renderNowPlaying(chrome) {
    const bar = $('#nowPlayingBar');
    const label = $('#nowPlayingLabel');
    if (!bar || !label) return;
    const item = chrome?.nowPlaying;
    if (!item?.title) {
      bar.classList.add('hidden');
      label.textContent = t('nowPlayingEmpty', 'Nothing playing in Eidovara. Local files only — not Spotify, VLC, or iTunes.');
      return;
    }
    bar.classList.remove('hidden');
    label.textContent = `${item.title}${item.local ? ' · local file' : ''}`;
  }

  function renderNotices(chrome) {
    const box = $('#notifyList');
    const btn = $('#notifyBtn');
    if (btn) {
      const n = chrome?.unread || 0;
      btn.dataset.count = String(n);
      btn.classList.toggle('has-notices', n > 0);
      btn.setAttribute('aria-label', n ? `Notifications (${n} unread)` : 'Notifications');
    }
    if (!box) return;
    box.textContent = '';
    const items = chrome?.notifications || [];
    if (!items.length) {
      box.append(Object.assign(document.createElement('p'), { className: 'empty', textContent: t('notifyEmpty', 'No notices yet. Backups, focus, and the sleep timer appear here.') }));
      return;
    }
    for (const item of items) {
      const row = document.createElement('div');
      row.className = 'notify-item';
      row.append(
        Object.assign(document.createElement('strong'), { textContent: item.title }),
        Object.assign(document.createElement('p'), { textContent: item.body || '' }),
        Object.assign(document.createElement('small'), { textContent: item.kind || 'info' })
      );
      box.append(row);
    }
  }

  function formatRemain(ms) {
    const total = Math.max(0, Math.ceil(Number(ms || 0) / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function renderSleep(chrome) {
    const remain = $('#sleepTimerRemain');
    const timer = chrome?.sleepTimer;
    if (remain) remain.textContent = timer?.active ? formatRemain(timer.remainingMs || 0) : '';
    const input = $('#sleepTimerMinutes');
    if (input && document.activeElement !== input && timer?.durationMs) {
      input.value = String(Math.round((timer.durationMs || 0) / 60000) || 30);
    }
  }

  async function refreshChrome() {
    fillWindowChrome();
    renderRecents();
    if (!window.soul?.chrome) return;
    try {
      const chrome = await window.soul.chrome('view');
      renderNowPlaying(chrome);
      renderNotices(chrome);
      renderSleep(chrome);
      if (chrome?.sleepTimer?.active && (chrome.sleepTimer.remainingMs || 0) <= 0) {
        $('#audioPlayer')?.pause?.();
        $('#videoPlayer')?.pause?.();
      }
    } catch {}
  }

  function openNotices() {
    if (document.body.classList.contains('age-gated')) return;
    $('#notificationDrawer')?.classList.remove('hidden');
    refreshChrome();
    window.soul?.chrome?.('read').catch(() => {});
  }

  function closeNotices() {
    $('#notificationDrawer')?.classList.add('hidden');
  }

  async function recordRecent(item) {
    if (!window.soul?.workspace || !item?.id) return;
    try {
      const kernel = await window.soul.workspace('recent', item);
      window.eidovaraKernel = kernel;
      if (window.eidovaraState) window.eidovaraState.kernel = { ...(window.eidovaraState.kernel || {}), workspace: kernel.workspace || kernel };
      renderRecents();
    } catch {}
  }

  async function onPaletteQuery(query) {
    const box = $('#paletteCalc');
    if (!box || !window.soul?.evalCalc) return;
    try {
      const result = await window.soul.evalCalc(String(query || '').slice(0, 200));
      box.textContent = '';
      if (!result) { box.classList.add('hidden'); return; }
      box.classList.remove('hidden');
      const b = document.createElement('button');
      b.type = 'button';
      b.append(
        Object.assign(document.createElement('strong'), { textContent: result.title }),
        Object.assign(document.createElement('small'), { textContent: result.kind === 'convert' ? 'Local conversion · no live FX' : 'Local calculator' })
      );
      b.addEventListener('click', async () => {
        try { await navigator.clipboard?.writeText?.(String(result.result)); } catch {}
      });
      box.append(b);
    } catch {
      box.classList.add('hidden');
    }
  }

  $('#alwaysOnTop')?.addEventListener('change', () => persistWindowChrome().catch(() => {}));
  $('#openAtLogin')?.addEventListener('change', () => persistWindowChrome().catch(() => {}));
  $('#notifyBtn')?.addEventListener('click', () => openNotices());
  $('#notifyCloseBtn')?.addEventListener('click', () => closeNotices());
  $('#notificationDrawer')?.addEventListener('click', e => { if (e.target === $('#notificationDrawer')) closeNotices(); });
  $('#sleepTimerStart')?.addEventListener('click', async () => {
    const minutes = Number($('#sleepTimerMinutes')?.value || 30);
    try { await window.soul.chrome('sleep-start', { minutes }); await refreshChrome(); } catch {}
  });
  $('#sleepTimerStop')?.addEventListener('click', async () => {
    try { await window.soul.chrome('sleep-stop'); await refreshChrome(); } catch {}
  });
  $('#paletteInput')?.addEventListener('input', e => { onPaletteQuery(e.currentTarget.value); });
  $('#backupBtn')?.addEventListener('click', () => {
    setTimeout(() => {
      const text = $('#backupStatus')?.textContent || '';
      if (/Created /.test(text)) {
        window.soul?.chrome?.('notify', {
          kind: 'backup',
          title: 'Backup created',
          body: 'A local snapshot is on this PC. This is not cloud backup or telemetry.'
        }).then(() => refreshChrome()).catch(() => {});
      }
    }, 800);
  });

  if (!sleepTick) sleepTick = setInterval(() => refreshChrome(), 1000);

  window.eidovaraChrome = {
    refresh: refreshChrome,
    openNotices,
    closeNotices,
    recordRecent,
    recordMedia(item) {
      if (!item?.local || !item.title) return;
      recordRecent({ id: `media-${String(item.title).slice(0, 60)}`, title: String(item.title).slice(0, 120), kind: 'media' });
      window.soul?.chrome?.('now-playing', item).then(() => refreshChrome()).catch(() => {});
    },
    recordView(name) {
      if (name === 'memory') recordRecent({ id: 'view-memory', title: 'Memory', kind: 'memory' });
    }
  };

  refreshChrome();
})();
