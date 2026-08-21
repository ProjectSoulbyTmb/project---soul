// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
(() => {
  const $ = s => document.querySelector(s);
  const t = (key, fallback) => window.eidovaraI18n?.t(key, fallback) || fallback || key;

  let sleepTimer = 0;
  let calcResult = null;

  function settings() {
    return window.eidovaraSettings || {};
  }

  function desktop() {
    const d = settings().desktop || {};
    return {
      trayStay: d.trayStay === true,
      alwaysOnTop: d.alwaysOnTop === true,
      openAtLogin: d.openAtLogin === true,
      pinCompanion: d.pinCompanion === true,
      notices: Array.isArray(d.notices) ? d.notices : [],
      sleepUntil: d.sleepUntil || null
    };
  }

  function persistPayload(extra = {}) {
    const s = settings();
    const next = { ...desktop(), ...extra };
    return {
      provider: s.provider || 'offline',
      endpoint: s.endpoint || '',
      model: s.model || '',
      language: s.language || 'en',
      theme: s.theme,
      companion: s.companion,
      assistOptIn: s.assistOptIn === true,
      desktop: next
    };
  }

  async function persistDesktop(extra = {}) {
    if (!window.soul?.saveSettings) return null;
    const next = await window.soul.saveSettings(persistPayload(extra));
    window.eidovaraSettings = next;
    applyPin();
    fillForm();
    renderNotices();
    tickSleep();
    return next;
  }

  function applyPin() {
    document.body.classList.toggle('companion-pinned', desktop().pinCompanion === true);
  }

  function fillForm() {
    const d = desktop();
    if ($('#trayStayInput')) $('#trayStayInput').checked = d.trayStay;
    if ($('#alwaysOnTopInput')) $('#alwaysOnTopInput').checked = d.alwaysOnTop;
    if ($('#openAtLoginInput')) $('#openAtLoginInput').checked = d.openAtLogin;
    if ($('#pinCompanionInput')) $('#pinCompanionInput').checked = d.pinCompanion;
    const login = settings().loginItem || {};
    if ($('#openAtLoginInput')) $('#openAtLoginInput').disabled = login.supported !== true;
    if ($('#openAtLoginHelp')) {
      $('#openAtLoginHelp').textContent = login.supported === true
        ? t('chromeHelp', 'Tray, on-top, and sign-in apply to this Eidovara window only. Open at login is Windows-only via Electron. Not a global hotkey into other apps.')
        : 'Open at login uses Electron\'s Windows login-item setting. It is not available on this host if you are not on Windows.';
    }
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
      box.append(Object.assign(document.createElement('p'), { className: 'empty', textContent: t('recentsEmpty', 'Nothing recent yet.') }));
      return;
    }
    for (const item of items.slice(0, 12)) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'recent-row';
      row.append(
        Object.assign(document.createElement('strong'), { textContent: item.title || item.id }),
        Object.assign(document.createElement('small'), { textContent: item.kind || 'command' })
      );
      row.addEventListener('click', () => {
        if (item.kind === 'app') window.eidovaraSetView?.('apps');
        else if (item.kind === 'media') window.eidovaraSetView?.('entertainment');
        else if (item.kind === 'memory') window.eidovaraSetView?.('memory');
        else window.eidovaraSetView?.('dashboard');
      });
      box.append(row);
    }
  }

  function renderNotices() {
    const box = $('#notifyList');
    if (!box) return;
    box.textContent = '';
    const items = desktop().notices;
    const btn = $('#notifyOpenBtn');
    if (btn) {
      btn.dataset.count = String(items.length);
      btn.classList.toggle('has-notices', items.length > 0);
    }
    if (!items.length) {
      box.append(Object.assign(document.createElement('p'), { className: 'empty', textContent: t('notifyEmpty', 'No notices yet.') }));
      return;
    }
    for (const item of items) {
      const row = document.createElement('div');
      row.className = 'notify-row';
      row.append(
        Object.assign(document.createElement('strong'), { textContent: item.title }),
        Object.assign(document.createElement('p'), { textContent: item.body || '' }),
        Object.assign(document.createElement('small'), { textContent: item.kind || 'event' })
      );
      box.append(row);
    }
  }

  function openNotices() {
    if (document.body.classList.contains('age-gated')) return;
    $('#notifyDrawer')?.classList.remove('hidden');
    renderNotices();
    $('#notifyCloseBtn')?.focus();
  }

  function closeNotices() {
    $('#notifyDrawer')?.classList.add('hidden');
  }

  async function pushNotice(notice) {
    const list = desktop().notices;
    const next = {
      id: String(notice?.id || `n-${Date.now()}`).slice(0, 40),
      title: String(notice?.title || 'Notice').slice(0, 120),
      body: String(notice?.body || '').slice(0, 280),
      at: notice?.at || new Date().toISOString(),
      kind: String(notice?.kind || 'event').slice(0, 24)
    };
    await persistDesktop({ notices: [next, ...list.filter(item => item.id !== next.id)].slice(0, 20) });
  }

  function pauseLocalMedia() {
    $('#audioPlayer')?.pause?.();
    $('#videoPlayer')?.pause?.();
  }

  function formatRemain(ms) {
    const total = Math.max(0, Math.ceil(Number(ms || 0) / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function tickSleep() {
    const remainEl = $('#sleepTimerRemain');
    const until = desktop().sleepUntil;
    if (!until) {
      if (remainEl) remainEl.textContent = '';
      if ($('#sleepTimerSelect') && document.activeElement !== $('#sleepTimerSelect')) $('#sleepTimerSelect').value = 'off';
      return;
    }
    const remain = Math.max(0, Date.parse(until) - Date.now());
    if (remainEl) remainEl.textContent = remain ? formatRemain(remain) : '';
    if (remain <= 0) {
      pauseLocalMedia();
      persistDesktop({ sleepUntil: null }).then(() => {
        pushNotice({
          id: `sleep-${Date.now()}`,
          title: 'Sleep timer',
          body: 'Local media paused. This timer only affects Eidovara playback, not other apps.',
          kind: 'sleep'
        });
      }).catch(() => {});
    }
  }

  async function setSleepPreset(preset) {
    const ms = { off: 0, '15': 15 * 60_000, '30': 30 * 60_000, '60': 60 * 60_000 }[String(preset)] || 0;
    const sleepUntil = ms ? new Date(Date.now() + ms).toISOString() : null;
    await persistDesktop({ sleepUntil });
    if (sleepUntil) {
      await pushNotice({
        id: `sleep-set-${Date.now()}`,
        title: 'Sleep timer set',
        body: 'Eidovara will pause local media when this timer ends. Other apps are not closed.',
        kind: 'sleep'
      });
    }
  }

  function paintCalc(result) {
    calcResult = result;
    let box = $('#paletteCalc');
    if (!box) {
      box = document.createElement('div');
      box.id = 'paletteCalc';
      box.className = 'palette-calc';
      $('#paletteInput')?.after(box);
    }
    box.textContent = '';
    if (!result) {
      box.classList.add('hidden');
      return;
    }
    box.classList.remove('hidden');
    const b = document.createElement('button');
    b.type = 'button';
    b.append(
      Object.assign(document.createElement('strong'), { textContent: result.title }),
      Object.assign(document.createElement('small'), { textContent: result.kind === 'convert' ? 'Local conversion · no live FX' : 'Local calculator' })
    );
    b.addEventListener('click', async () => {
      try { await navigator.clipboard?.writeText?.(String(result.result)); } catch {}
      $('#commandPalette')?.classList.add('hidden');
    });
    box.append(b);
  }

  async function onPaletteQuery(query) {
    if (!window.soul?.evalCalc) {
      paintCalc(null);
      return;
    }
    try {
      const result = await window.soul.evalCalc(String(query || '').slice(0, 200));
      paintCalc(result);
    } catch {
      paintCalc(null);
    }
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

  function recordMedia(item) {
    if (!item?.local || !item.title) return;
    const id = `media-${String(item.title).slice(0, 60)}`;
    recordRecent({ id, title: String(item.title).slice(0, 120), kind: 'media' });
  }

  function recordView(name) {
    if (name === 'memory') recordRecent({ id: 'view-memory', title: 'Memory', kind: 'memory' });
  }

  function refresh() {
    applyPin();
    fillForm();
    renderRecents();
    renderNotices();
    tickSleep();
  }

  $('#desktopChromeForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const status = $('#desktopChromeStatus');
    if (status) status.textContent = 'Saving…';
    try {
      await persistDesktop({
        trayStay: $('#trayStayInput')?.checked === true,
        alwaysOnTop: $('#alwaysOnTopInput')?.checked === true,
        openAtLogin: $('#openAtLoginInput')?.checked === true,
        pinCompanion: $('#pinCompanionInput')?.checked === true
      });
      if (status) status.textContent = 'Desktop chrome saved. Tray stay-running is Windows-only. Open at login is Windows-only via Electron.';
    } catch (err) {
      if (status) status.textContent = String(err?.message || err);
    }
  });

  $('#notifyOpenBtn')?.addEventListener('click', () => openNotices());
  $('#notifyCloseBtn')?.addEventListener('click', () => closeNotices());
  $('#notifyDrawer')?.addEventListener('click', e => { if (e.target === $('#notifyDrawer')) closeNotices(); });
  $('#notifyClearBtn')?.addEventListener('click', async () => {
    await persistDesktop({ notices: [] });
  });
  $('#sleepTimerSelect')?.addEventListener('change', e => {
    setSleepPreset(e.currentTarget.value).catch(err => {
      const remain = $('#sleepTimerRemain');
      if (remain) remain.textContent = String(err?.message || err);
    });
  });
  $('#paletteInput')?.addEventListener('input', e => {
    onPaletteQuery(e.currentTarget.value);
  });
  $('#backupBtn')?.addEventListener('click', () => {
    setTimeout(() => {
      const text = $('#backupStatus')?.textContent || '';
      if (/Created /.test(text)) {
        pushNotice({
          id: `backup-${Date.now()}`,
          title: 'Backup created',
          body: 'A local snapshot is on this PC. This is not cloud backup or telemetry.',
          kind: 'backup'
        }).catch(() => {});
      }
    }, 800);
  });

  if (!sleepTimer) sleepTimer = setInterval(() => tickSleep(), 1000);

  window.eidovaraChrome = {
    refresh,
    openNotices,
    closeNotices,
    pushNotice,
    recordMedia,
    recordView,
    recordRecent,
    paintCalc
  };

  refresh();
})();
