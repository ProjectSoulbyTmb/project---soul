(() => {
  const $ = s => document.querySelector(s);
  const t = (key, fallback) => window.eidovaraI18n?.t(key, fallback) || fallback || key;
  const reducedMotion = () => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
  const inField = target => Boolean(target?.closest?.('input, textarea, select, [contenteditable="true"]'));
  const overlayOpen = id => { const n = $(id); return n && !n.classList.contains('hidden'); };

  let paletteItems = [];
  let paletteIndex = 0;
  let paletteTimer = 0;
  let focusTimer = 0;
  let lastScratch = '';

  function kernelWorkspace() {
    return window.eidovaraState?.kernel?.workspace || window.eidovaraKernel?.workspace || {};
  }

  function formatRemain(ms) {
    const total = Math.max(0, Math.ceil(Number(ms || 0) / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function remainingFrom(focus) {
    if (!focus?.active || !focus.startedAt) return 0;
    const start = Date.parse(focus.startedAt);
    if (!Number.isFinite(start)) return 0;
    return Math.max(0, start + (Number(focus.durationMs) || 0) - Date.now());
  }

  function closeOverlays() {
    $('#commandPalette')?.classList.add('hidden');
    $('#cheatsheetOverlay')?.classList.add('hidden');
  }

  async function refreshKernel() {
    if (!window.soul?.kernelStatus || !window.eidovaraSettings?.ageGateAccepted) return null;
    try {
      const kernel = await window.soul.kernelStatus();
      window.eidovaraKernel = kernel;
      if (window.eidovaraState) window.eidovaraState.kernel = { ...(window.eidovaraState.kernel || {}), ...kernel, workspace: kernel.workspace };
      renderFocusBar();
      return kernel;
    } catch {
      return null;
    }
  }

  function renderFocusBar() {
    const bar = $('#focusQuietBar');
    if (!bar) return;
    const focus = kernelWorkspace().focus || {};
    const remain = remainingFrom(focus);
    const live = focus.active === true && remain > 0;
    bar.classList.toggle('hidden', !live);
    document.body.classList.toggle('focus-quiet', live);
    if ($('#focusQuietRemaining')) $('#focusQuietRemaining').textContent = formatRemain(remain);
    if ($('#focusQuietLabel')) $('#focusQuietLabel').textContent = focus.label || t('focusQuiet', 'Focus session');
    if (!live) {
      clearInterval(focusTimer);
      focusTimer = 0;
      return;
    }
    if (!focusTimer) focusTimer = setInterval(() => renderFocusBar(), 1000);
  }

  function tileDefs(ctx) {
    const state = ctx.state || {};
    const settings = ctx.settings || {};
    const roles = (state.setup?.categories || []);
    const memories = (state.memories || []).filter(x => x.active).length;
    const apps = (settings.apps || []).length;
    const taste = Object.keys(state.entertainment?.taste || {}).length;
    const focus = kernelWorkspace().focus || {};
    const remain = remainingFrom(focus);
    return {
      focus: {
        label: t('dashFocus', 'Focus'),
        value: focus.active && remain > 0 ? formatRemain(remain) : (state.assistant?.preferences?.focusMode || 'general'),
        next: focus.active ? t('focusStop', 'Stop') : t('focusStart', 'Start 25 minutes'),
        run: () => {
          if (focus.active) window.eidovaraLayers.stopFocus();
          else window.eidovaraLayers.startFocus(25);
        }
      },
      apps: {
        label: t('dashApps', 'Apps'),
        value: `${apps} linked`,
        next: t('nextAddApps', 'Add a trusted app'),
        run: () => ctx.setView('apps')
      },
      media: {
        label: t('dashMedia', 'Entertainment'),
        value: taste ? `${taste} taste signals` : 'none yet',
        next: t('nextEntertainment', 'Open Entertainment'),
        run: () => ctx.setView('entertainment')
      },
      research: {
        label: t('research', 'Research'),
        value: t('offlineFirst', 'offline-first'),
        next: t('research', 'Research'),
        run: () => { ctx.setView('chat'); ctx.send('Search the internet for current information I need.'); }
      },
      memory: {
        label: t('dashMemory', 'Memory'),
        value: `${memories} active`,
        next: t('nextMemory', 'Review memory'),
        run: () => ctx.setView('memory')
      },
      diagnostics: {
        label: t('dashHealth', 'Diagnostics'),
        value: settings.encryptionAvailable ? 'OS-protected' : 'local files',
        next: t('nextDiagnostics', 'Show diagnostics'),
        run: () => { ctx.setView('settings'); $('#diagnosticsBtn')?.click(); }
      },
      scratch: {
        label: t('scratchTitle', 'Scratchpad'),
        value: t('scratchHint', 'Stays on this PC'),
        next: t('scratchCapture', 'Capture to Memory'),
        scratch: true,
        run: () => window.eidovaraLayers.captureScratch()
      }
    };
  }

  function renderDashboard(ctx) {
    const box = $('#dashboardGrid');
    if (!box) return;
    box.textContent = '';
    const workspace = (ctx.state?.kernel?.workspace) || kernelWorkspace();
    const order = workspace.widgets?.order || ['focus', 'apps', 'media', 'memory', 'scratch', 'diagnostics'];
    const hidden = new Set(workspace.widgets?.hidden || ['research']);
    const defs = tileDefs(ctx);
    const visible = order.filter(id => defs[id] && !hidden.has(id));
    for (const id of visible) {
      const item = defs[id];
      const card = document.createElement(item.scratch ? 'div' : 'button');
      card.className = 'dashboard-card' + (item.scratch ? ' scratch-tile' : '');
      if (!item.scratch) card.type = 'button';
      card.append(Object.assign(document.createElement('small'), { textContent: item.label }));
      card.append(Object.assign(document.createElement('strong'), { textContent: item.value }));
      if (item.scratch) {
        const area = document.createElement('textarea');
        area.id = 'scratchpadInput';
        area.maxLength = 4000;
        area.placeholder = t('scratchPlaceholder', 'Quick capture. Stays on this device.');
        area.value = workspace.scratchpad?.text || lastScratch || '';
        area.addEventListener('click', e => e.stopPropagation());
        area.addEventListener('change', () => window.eidovaraLayers.saveScratch(area.value));
        card.append(area);
        const capture = document.createElement('button');
        capture.type = 'button';
        capture.className = 'next';
        capture.textContent = item.next;
        capture.addEventListener('click', e => { e.preventDefault(); item.run(); });
        card.append(capture);
      } else {
        card.append(Object.assign(document.createElement('span'), { className: 'next', textContent: item.next }));
        card.addEventListener('click', item.run);
      }
      const controls = document.createElement('div');
      controls.className = 'widget-controls';
      const unpin = document.createElement('button');
      unpin.type = 'button';
      unpin.textContent = t('unpinWidget', 'Unpin');
      unpin.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); window.eidovaraLayers.unpin(id); });
      const up = document.createElement('button');
      up.type = 'button';
      up.textContent = '↑';
      up.setAttribute('aria-label', t('moveUp', 'Move tile up'));
      up.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); window.eidovaraLayers.move(id, -1); });
      const down = document.createElement('button');
      down.type = 'button';
      down.textContent = '↓';
      down.setAttribute('aria-label', t('moveDown', 'Move tile down'));
      down.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); window.eidovaraLayers.move(id, 1); });
      controls.append(up, down, unpin);
      card.append(controls);
      box.append(card);
    }
    const hiddenIds = order.filter(id => defs[id] && hidden.has(id));
    if (hiddenIds.length) {
      const extra = document.createElement('div');
      extra.className = 'dashboard-card';
      extra.append(Object.assign(document.createElement('small'), { textContent: t('pinWidget', 'Pin a tile') }));
      for (const id of hiddenIds) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'next';
        b.textContent = defs[id].label;
        b.addEventListener('click', () => window.eidovaraLayers.pin(id));
        extra.append(b);
      }
      box.append(extra);
    }
    const roles = document.createElement('button');
    roles.type = 'button';
    roles.className = 'dashboard-card';
    const setup = ctx.state?.setup?.categories || [];
    roles.append(
      Object.assign(document.createElement('small'), { textContent: t('dashRoles', 'Roles') }),
      Object.assign(document.createElement('strong'), { textContent: setup.length ? setup.join(', ') : t('notConfigured', 'not configured') }),
      Object.assign(document.createElement('span'), { className: 'next', textContent: t('nextConfigure', 'Configure roles') })
    );
    roles.addEventListener('click', () => ctx.openSetup(true));
    box.append(roles);
    renderFocusBar();
  }

  function paintPalette(selected) {
    const box = $('#paletteResults');
    if (!box) return;
    box.textContent = '';
    paletteIndex = Math.max(0, Math.min(selected, Math.max(0, paletteItems.length - 1)));
    if (!paletteItems.length) {
      box.append(Object.assign(document.createElement('li'), { textContent: t('paletteEmpty', 'No local matches. Search stays on this PC.') }));
      return;
    }
    paletteItems.forEach((item, index) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.id = `palette-opt-${index}`;
      b.setAttribute('role', 'option');
      b.setAttribute('aria-selected', String(index === paletteIndex));
      b.append(Object.assign(document.createElement('strong'), { textContent: item.title || item.label || item.id }));
      b.append(Object.assign(document.createElement('small'), { textContent: `${item.kind || 'command'}${item.summary ? ' · ' + item.summary : ''}` }));
      b.addEventListener('click', () => runPaletteItem(item));
      li.append(b);
      box.append(li);
    });
    box.children[paletteIndex]?.querySelector('button')?.focus();
  }

  async function queryPalette(text) {
    if (!window.soul?.workspace) return;
    try {
      paletteItems = await window.soul.workspace('palette', { query: text, includeApps: true }) || [];
    } catch {
      paletteItems = [];
    }
    paintPalette(0);
  }

  async function openPalette() {
    if (document.body.classList.contains('age-gated')) return;
    closeOverlays();
    $('#commandPalette')?.classList.remove('hidden');
    const input = $('#paletteInput');
    if (input) {
      input.value = '';
      input.focus();
    }
    await queryPalette('');
  }

  function closePalette() {
    $('#commandPalette')?.classList.add('hidden');
  }

  async function runPaletteItem(item) {
    closePalette();
    if (item?.id && window.soul?.workspace) {
      try { await window.soul.workspace('recent', { id: item.id, title: item.title, kind: item.kind, action: item.action }); } catch {}
    }
    await executeAction(item?.action || item);
  }

  async function executeAction(action) {
    if (!action || !action.type) return;
    const type = action.type;
    if (type === 'open-view' && action.view && typeof window.eidovaraSetView === 'function') {
      window.eidovaraSetView(action.view);
      if (action.panel) $(`#${action.panel}`)?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' });
    }
    if (type === 'open-setup' && typeof window.eidovaraOpenSetup === 'function') window.eidovaraOpenSetup(true);
    if (type === 'open-diagnostics') $('#diagnosticsBtn')?.click();
    if (type === 'open-service') {
      if (typeof window.eidovaraSetView === 'function') window.eidovaraSetView('settings');
      $('#serviceForm')?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' });
    }
    if (type === 'open-legal' && typeof window.eidovaraShowLegal === 'function') window.eidovaraShowLegal(action.legal || 'about');
    if (type === 'open-updates') {
      if (typeof window.eidovaraSetView === 'function') window.eidovaraSetView('settings');
      $('#checkUpdateBtn')?.focus();
    }
    if (type === 'open-palette') openPalette();
    if (type === 'open-cheatsheet') openCheatsheet();
    if (type === 'start-focus') await startFocus(action.minutes || 25, action.label);
    if (type === 'stop-focus') await stopFocus();
    if (type === 'capture-scratch') await captureScratch();
    if (type === 'run-command' && action.command && typeof window.eidovaraSend === 'function') {
      if (typeof window.eidovaraSetView === 'function') window.eidovaraSetView(action.view || 'chat');
      window.eidovaraSend(action.command);
    }
    if (type === 'confirm-launch-app' && action.appId && window.soul?.launchApplication) {
      try { await window.soul.launchApplication(action.appId); } catch (err) { alert(String(err?.message || err)); }
    }
  }

  async function startFocus(minutes, label) {
    if (!window.soul?.workspace) return;
    const kernel = await window.soul.workspace('start-focus', { minutes: minutes || 25, label: label || t('focusQuiet', 'Focus session') });
    window.eidovaraKernel = kernel;
    if (window.eidovaraState) window.eidovaraState.kernel = { ...(window.eidovaraState.kernel || {}), workspace: kernel.workspace };
    if (typeof window.eidovaraSetView === 'function') window.eidovaraSetView('dashboard');
    renderFocusBar();
    window.eidovaraRenderDashboard?.();
  }

  async function stopFocus() {
    if (!window.soul?.workspace) return;
    const kernel = await window.soul.workspace('stop-focus');
    window.eidovaraKernel = kernel;
    if (window.eidovaraState) window.eidovaraState.kernel = { ...(window.eidovaraState.kernel || {}), workspace: kernel.workspace };
    renderFocusBar();
    window.eidovaraRenderDashboard?.();
  }

  async function saveScratch(text) {
    lastScratch = String(text || '');
    if (!window.soul?.workspace) return;
    const kernel = await window.soul.workspace('save-scratch', { text: lastScratch });
    window.eidovaraKernel = kernel;
  }

  async function captureScratch() {
    const extra = $('#scratchpadInput')?.value || lastScratch;
    if (!window.soul?.workspace) return;
    const result = await window.soul.workspace('capture-scratch', { text: extra });
    window.eidovaraKernel = result.kernel || result;
    lastScratch = '';
    if ($('#scratchpadInput')) $('#scratchpadInput').value = '';
    if (typeof window.eidovaraReloadState === 'function') await window.eidovaraReloadState();
    else if (window.soul?.snapshot) {
      window.eidovaraState = await window.soul.snapshot();
      window.eidovaraRenderAll?.();
    }
  }

  async function pin(id) {
    const kernel = await window.soul.workspace('pin', { id });
    applyKernel(kernel);
  }
  async function unpin(id) {
    const kernel = await window.soul.workspace('unpin', { id });
    applyKernel(kernel);
  }
  async function move(id, delta) {
    const order = [...(kernelWorkspace().widgets?.order || [])];
    const idx = order.indexOf(id);
    if (idx < 0) return;
    const next = Math.max(0, Math.min(order.length - 1, idx + delta));
    if (next === idx) return;
    order.splice(idx, 1);
    order.splice(next, 0, id);
    const kernel = await window.soul.workspace('reorder', { order });
    applyKernel(kernel);
  }
  function applyKernel(kernel) {
    if (!kernel) return;
    window.eidovaraKernel = kernel;
    if (window.eidovaraState) window.eidovaraState.kernel = { ...(window.eidovaraState.kernel || {}), workspace: kernel.workspace };
    window.eidovaraRenderDashboard?.();
    renderFocusBar();
  }

  function cheatsheetRows() {
    const voice = Boolean($('#voiceInputBtn') && !$('#voiceInputBtn').classList.contains('hidden'));
    const rows = [
      { keys: 'Ctrl+K', detail: t('shortcutPalette', 'Command palette — jump to views, intents, settings, legal, modules, and linked apps. Ctrl+P does the same.') },
      { keys: 'Ctrl+/', detail: t('shortcutCheatsheet', 'This cheatsheet. ? also opens it when you are not in a text field.') },
      { keys: 'Ctrl+A', detail: t('shortcutAdmin', 'Private administrator panel. Does not steal select-all from input, textarea, or select fields.') },
      { keys: 'Esc', detail: t('shortcutEsc', 'Close palette, cheatsheet, legal, admin, or cancelable setup overlays.') },
      { keys: 'Enter', detail: t('shortcutSend', 'Send the conversation. Shift+Enter inserts a new line.') }
    ];
    if (voice) rows.push({ keys: 'Hold 🎙', detail: t('shortcutDictate', 'Hold the dictation control to talk; release to stop. Uses OS speech recognition. Eidovara does not ship a neural TTS engine.') });
    return rows;
  }

  function openCheatsheet() {
    if (document.body.classList.contains('age-gated')) return;
    closePalette();
    const box = $('#cheatsheetList');
    if (box) {
      box.textContent = '';
      for (const row of cheatsheetRows()) {
        const line = document.createElement('div');
        line.className = 'cheatsheet-row';
        const kbd = document.createElement('kbd');
        kbd.textContent = row.keys;
        line.append(kbd, Object.assign(document.createElement('span'), { textContent: row.detail }));
        box.append(line);
      }
    }
    $('#cheatsheetOverlay')?.classList.remove('hidden');
    $('#cheatsheetCloseBtn')?.focus();
  }

  function bindHoldToTalk() {
    const btn = $('#voiceInputBtn');
    if (!btn || btn.dataset.holdBound) return;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;
    btn.dataset.holdBound = '1';
    let hold = null;
    const stop = () => { try { hold?.stop(); } catch {} hold = null; };
    btn.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      e.preventDefault();
      btn.dataset.holdUsed = '1';
      try {
        hold = new Recognition();
        hold.continuous = true;
        hold.interimResults = false;
        hold.onresult = ev => {
          const input = $('#messageInput');
          if (!input) return;
          const chunk = [...ev.results].map(r => r[0].transcript).join(' ');
          input.value = `${input.value} ${chunk}`.trim();
        };
        hold.start();
      } catch {}
    });
    btn.addEventListener('pointerup', stop);
    btn.addEventListener('pointerleave', stop);
    btn.addEventListener('pointercancel', stop);
    btn.addEventListener('click', e => {
      if (btn.dataset.holdUsed === '1') {
        e.preventDefault();
        e.stopImmediatePropagation();
        btn.dataset.holdUsed = '';
      }
    }, true);
  }

  document.addEventListener('keydown', e => {
    if (document.body.classList.contains('age-gated')) return;
    if (e.key === 'Escape') {
      if (overlayOpen('#commandPalette')) { closePalette(); e.preventDefault(); e.stopImmediatePropagation(); return; }
      if (overlayOpen('#cheatsheetOverlay')) { $('#cheatsheetOverlay').classList.add('hidden'); e.preventDefault(); e.stopImmediatePropagation(); }
      return;
    }
    const ctrl = e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey;
    if (ctrl && (e.key.toLowerCase() === 'k' || e.key.toLowerCase() === 'p')) {
      e.preventDefault();
      if (overlayOpen('#commandPalette')) closePalette();
      else openPalette();
      return;
    }
    if (ctrl && e.key === '/') {
      e.preventDefault();
      if (overlayOpen('#cheatsheetOverlay')) $('#cheatsheetOverlay').classList.add('hidden');
      else openCheatsheet();
      return;
    }
    if (e.key === '?' && !e.ctrlKey && !e.altKey && !inField(e.target)) {
      e.preventDefault();
      openCheatsheet();
      return;
    }
    if (!overlayOpen('#commandPalette')) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); paintPalette(paletteIndex + 1); }
    if (e.key === 'ArrowUp') { e.preventDefault(); paintPalette(paletteIndex - 1); }
    if (e.key === 'Enter' && paletteItems[paletteIndex]) {
      if (e.target === $('#paletteInput') || e.target?.closest?.('#paletteResults')) {
        e.preventDefault();
        runPaletteItem(paletteItems[paletteIndex]);
      }
    }
  }, true);

  $('#paletteInput')?.addEventListener('input', e => {
    clearTimeout(paletteTimer);
    const value = e.currentTarget.value;
    paletteTimer = setTimeout(() => queryPalette(value), reducedMotion() ? 0 : 80);
  });
  $('#paletteOpenBtn')?.addEventListener('click', () => openPalette());
  $('#paletteHintBtn')?.addEventListener('click', () => openPalette());
  $('#cheatsheetOpenBtn')?.addEventListener('click', () => openCheatsheet());
  $('#cheatsheetHintBtn')?.addEventListener('click', () => openCheatsheet());
  $('#cheatsheetCloseBtn')?.addEventListener('click', () => $('#cheatsheetOverlay')?.classList.add('hidden'));
  $('#focusQuietStop')?.addEventListener('click', () => stopFocus());
  $('#commandPalette')?.addEventListener('click', e => { if (e.target === $('#commandPalette')) closePalette(); });
  $('#cheatsheetOverlay')?.addEventListener('click', e => { if (e.target === $('#cheatsheetOverlay')) $('#cheatsheetOverlay').classList.add('hidden'); });

  window.eidovaraLayers = {
    renderDashboard,
    openPalette,
    openCheatsheet,
    executeAction,
    startFocus,
    stopFocus,
    saveScratch,
    captureScratch,
    pin,
    unpin,
    move,
    refreshKernel,
    renderFocusBar
  };

  bindHoldToTalk();
  refreshKernel();
})();
