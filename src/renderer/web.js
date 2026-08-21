// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
(() => {
  const $ = s => document.querySelector(s);
  const t = (key, fallback) => window.eidovaraI18n && window.eidovaraI18n.t ? window.eidovaraI18n.t(key, fallback) : (fallback || key);
  let observer = null;
  let layoutTimer = 0;
  let active = false;

  function note(message) {
    const node = $('#webNote');
    if (node) node.textContent = message || '';
  }

  function adultOn() {
    return document.body.classList.contains('adult-mode');
  }

  function ageGated() {
    return document.body.classList.contains('age-gated');
  }

  function modalOpen() {
    return [...document.querySelectorAll('.setup-overlay')].some(node => !node.classList.contains('hidden'));
  }

  function stageBounds() {
    const stage = $('#webStage');
    if (!stage) return { x: 0, y: 0, width: 0, height: 0 };
    const box = stage.getBoundingClientRect();
    return {
      x: Math.max(0, Math.round(box.left)),
      y: Math.max(0, Math.round(box.top)),
      width: Math.max(0, Math.round(box.width)),
      height: Math.max(0, Math.round(box.height))
    };
  }

  function applyStatus(status) {
    if (!status) return;
    const url = String(status.url || '');
    const field = $('#webUrl');
    if (field && url && url !== 'about:blank') field.value = url;
    if ($('#webBackBtn')) $('#webBackBtn').disabled = status.canGoBack !== true;
    if ($('#webForwardBtn')) $('#webForwardBtn').disabled = status.canGoForward !== true;
    if (status.error) note(status.error);
  }

  async function showGuest() {
    if (!window.soul || typeof window.soul.webShow !== 'function') return;
    if (ageGated()) {
      await hideGuest();
      return;
    }
    if (adultOn()) {
      await hideGuest();
      note(t('webAdultLock', 'Adult Mode is on, so in-app HTTPS browsing stays closed.'));
      return;
    }
    if (!active) return;
    try {
      const status = await window.soul.webShow({ bounds: stageBounds(), visible: !modalOpen() });
      applyStatus(status);
      if (!status || status.visible === false) {
        if (modalOpen()) note(t('webHiddenForDialog', 'The page is paused while a dialog is open.'));
      } else if (!$('#webNote') || !$('#webNote').textContent) {
        note(t('webReady', 'Paste an HTTPS address. Isolated session persist:eidovara-web. Not a crawler.'));
      }
    } catch (err) {
      note(String(err && err.message ? err.message : err));
    }
  }

  async function hideGuest() {
    if (!window.soul || typeof window.soul.webHide !== 'function') return;
    try { await window.soul.webHide(); } catch {}
  }

  async function layoutGuest() {
    if (!active || adultOn() || ageGated() || modalOpen()) return;
    if (!window.soul || typeof window.soul.webLayout !== 'function') return;
    try { await window.soul.webLayout(stageBounds()); } catch {}
  }

  function scheduleLayout() {
    clearTimeout(layoutTimer);
    layoutTimer = setTimeout(() => { void layoutGuest(); }, 40);
  }

  async function go() {
    const raw = $('#webUrl') ? $('#webUrl').value : '';
    note('');
    try {
      const status = await window.soul.webNavigate(raw);
      applyStatus(status);
    } catch (err) {
      note(String(err && err.message ? err.message : err));
    }
  }

  function bind() {
    if (bind.done) return;
    bind.done = true;
    $('#webGoBtn') && $('#webGoBtn').addEventListener('click', () => { void go(); });
    $('#webUrl') && $('#webUrl').addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        void go();
      }
    });
    $('#webBackBtn') && $('#webBackBtn').addEventListener('click', async () => {
      try { applyStatus(await window.soul.webBack()); } catch (err) { note(String(err && err.message ? err.message : err)); }
    });
    $('#webForwardBtn') && $('#webForwardBtn').addEventListener('click', async () => {
      try { applyStatus(await window.soul.webForward()); } catch (err) { note(String(err && err.message ? err.message : err)); }
    });
    $('#webBrowserBtn') && $('#webBrowserBtn').addEventListener('click', async () => {
      const raw = $('#webUrl') ? $('#webUrl').value : '';
      try { applyStatus(await window.soul.webOpenExternal(raw)); } catch (err) { note(String(err && err.message ? err.message : err)); }
    });
    $('#webCloseBtn') && $('#webCloseBtn').addEventListener('click', async () => {
      await hideGuest();
      if (typeof window.eidovaraSetView === 'function') window.eidovaraSetView('dashboard');
    });
    window.addEventListener('resize', scheduleLayout);
    if (window.soul && typeof window.soul.onWebStatus === 'function') {
      window.soul.onWebStatus(status => applyStatus(status));
    }
    observer = new MutationObserver(() => {
      if (!active) return;
      void showGuest();
    });
    document.querySelectorAll('.setup-overlay').forEach(node => {
      observer.observe(node, { attributes: true, attributeFilter: ['class'] });
    });
    const stage = $('#webStage');
    if (stage && typeof ResizeObserver === 'function') {
      new ResizeObserver(() => scheduleLayout()).observe(stage);
    }
  }

  window.eidovaraWeb = {
    onShow: async () => {
      bind();
      active = true;
      await showGuest();
    },
    onHide: async () => {
      active = false;
      await hideGuest();
    },
    onPolicy: async () => {
      if (adultOn() || ageGated()) {
        active = currentIsWeb() ? active : false;
        await hideGuest();
        if (adultOn() && currentIsWeb()) {
          note(t('webAdultLock', 'Adult Mode is on, so in-app HTTPS browsing stays closed.'));
        }
        return;
      }
      if (active) await showGuest();
    }
  };

  function currentIsWeb() {
    return Boolean($('#webView') && $('#webView').classList.contains('active'));
  }
})();
