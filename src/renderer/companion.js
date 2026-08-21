// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const t = (key, fallback) => window.eidovaraI18n?.t(key, fallback) || fallback || key;
  let kernel = null;
  let pulseTimer = 0;
  let pollTimer = 0;

  function reducedMotion() {
    return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
  }

  function drawPulse(canvas, time) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const frozen = reducedMotion();
    const phase = frozen ? 0.5 : 0.5 + 0.35 * Math.sin(time / 1000);
    const cx = w / 2, cy = h / 2;
    const radius = Math.min(w, h) * (0.18 + phase * 0.12);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(10, 132, 255, 0.85)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.8, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(10, 132, 255, ${0.2 + phase * 0.35})`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  function startPulse() {
    const canvas = $('#soulPresenceCanvas');
    if (!canvas) return;
    cancelAnimationFrame(pulseTimer);
    if (reducedMotion()) { drawPulse(canvas, 0); return; }
    const tick = time => {
      if ($('#soulPresence')?.dataset.look !== 'pulse') return;
      drawPulse(canvas, time);
      pulseTimer = requestAnimationFrame(tick);
    };
    pulseTimer = requestAnimationFrame(tick);
  }

  function applyPresence(lookId, imageUrl) {
    const root = $('#soulPresence');
    if (!root) return;
    const look = lookId || 'orb';
    root.dataset.look = look;
    const canvas = $('#soulPresenceCanvas');
    const img = $('#soulPresenceImage');
    const empty = $('#soulPresenceEmpty');
    const figure = $('#soulPresenceFigure');
    if (canvas) canvas.hidden = look !== 'pulse';
    if (figure) figure.hidden = look === 'pulse' || look === 'local-image' || look === 'ambient' || look === 'ribbon' || look === 'hidden';
    root.hidden = look === 'hidden';
    if (img) {
      const show = look === 'local-image' && imageUrl;
      img.hidden = !show;
      img.alt = show ? t('presenceImageAlt', 'Local companion image you chose. Decorative, not a live model.') : '';
      if (show) img.src = imageUrl;
      else img.removeAttribute('src');
    }
    if (empty) {
      empty.hidden = !(look === 'local-image' && !imageUrl);
    }
    if (look === 'pulse') startPulse();
    else cancelAnimationFrame(pulseTimer);
  }

  function relTime(iso) {
    if (!iso) return t('soulNeverBeat', 'No heartbeat yet');
    const ms = Date.now() - new Date(iso).getTime();
    if (!Number.isFinite(ms) || ms < 8000) return t('soulBeatNow', 'Heartbeat just now');
    if (ms < 60000) return t('soulBeatSeconds', `Heartbeat ${Math.round(ms / 1000)}s ago`);
    return t('soulBeatMinutes', `Heartbeat ${Math.round(ms / 60000)}m ago`);
  }

  function renderDock() {
    const beat = $('#soulHeartbeat');
    const online = $('#soulOnlineCopy');
    const modules = $('#soulModuleChips');
    const actions = $('#soulQuickActions');
    if (!beat || !kernel) return;
    const live = kernel.live === true;
    beat.innerHTML = '';
    const strong = document.createElement('strong');
    strong.textContent = live ? t('soulLive', 'Soul is live on this PC') : t('soulIdle', 'Soul kernel idle');
    const pulses = Number(kernel.pulseCount) > 0 ? ` Pulse ${kernel.pulseCount}.` : '';
    beat.append(strong, document.createTextNode(` · ${relTime(kernel.heartbeatAt)}.${pulses} ${kernel.selfModel?.architecture ? 'Software self-model, not a mind.' : 'Confirm 18+ to start the local kernel.'}`));
    if (online) {
      const opted = kernel.assistOptIn === true;
      const configured = Boolean(window.eidovaraSettings?.serviceUrl);
      const connected = window.eidovaraSettings?.serviceStatus?.online === true;
      let copy = t('soulOnlineOff', 'Online helper off. Local kernel stays the source of truth.');
      if (opted && !configured) copy = t('soulOnlineNeedUrl', 'Opt-in is on, but no Worker URL is saved. Paste one in Settings.');
      else if (opted && !connected) copy = t('soulOnlineDisconnected', 'Worker unreachable. Offline Soul continues locally. Assist is not Soul.');
      else if (opted && connected) copy = t('soulOnlineOn', 'Worker attached. Assist stays off unless you tick the composer box. Conversations are not sent.');
      online.textContent = copy;
    }
    applyPresence(kernel.presence?.lookId || kernel.presence?.look?.id, window.eidovaraSettings?.companion?.presenceUrl);
    if (modules) {
      modules.textContent = '';
      for (const mod of kernel.modules || []) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = mod.title;
        b.title = mod.summary || mod.title;
        b.setAttribute('aria-pressed', String(mod.enabled !== false));
        b.addEventListener('click', () => {
          if (mod.ui?.view && typeof window.eidovaraSetView === 'function') window.eidovaraSetView(mod.ui.view);
        });
        modules.append(b);
      }
      if (!modules.children.length) modules.append(Object.assign(document.createElement('p'), { className: 'soul-dock-empty', textContent: t('soulNoModules', 'No modules registered.') }));
    }
    if (actions) {
      actions.textContent = '';
      for (const item of kernel.customActions || []) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = item.label;
        b.addEventListener('click', () => {
          if (typeof window.eidovaraSetView === 'function') window.eidovaraSetView('chat');
          if (typeof window.eidovaraSend === 'function') window.eidovaraSend(item.command);
        });
        actions.append(b);
      }
      if (!actions.children.length) actions.append(Object.assign(document.createElement('p'), { className: 'soul-dock-empty', textContent: t('soulNoActions', 'Add a custom quick action in Settings.') }));
    }
    renderKernelSettings();
  }

  function renderKernelSettings() {
    const box = $('#kernelModuleList');
    if (!box || !kernel) return;
    box.textContent = '';
    for (const mod of kernel.modules || []) {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = mod.enabled !== false;
      input.dataset.moduleId = mod.id;
      const span = document.createElement('span');
      span.textContent = `${mod.title} — ${mod.summary}`;
      label.append(input, span);
      box.append(label);
    }
    const look = $('#presenceLook');
    if (look && kernel.looks) {
      const current = kernel.presence?.lookId || 'orb';
      look.textContent = '';
      for (const item of kernel.looks) {
        const o = document.createElement('option');
        o.value = item.id;
        o.textContent = `${item.title} — ${item.description}`;
        look.append(o);
      }
      look.value = current;
    }
    const phrasing = kernel.phrasing || {};
    if ($('#phrasingWit')) $('#phrasingWit').value = phrasing.wit ?? 40;
    if ($('#phrasingFormality')) $('#phrasingFormality').value = phrasing.formality ?? 40;
    if ($('#phrasingBrevity')) $('#phrasingBrevity').value = phrasing.brevity ?? 50;
    if ($('#assistOptIn')) $('#assistOptIn').checked = kernel.assistOptIn === true;
    const list = $('#customActionList');
    if (list) {
      list.textContent = '';
      for (const item of kernel.customActions || []) {
        const row = document.createElement('div');
        row.className = 'kv';
        row.append(Object.assign(document.createElement('span'), { textContent: item.label }), Object.assign(document.createElement('span'), { textContent: item.command }));
        list.append(row);
      }
      if (!list.children.length) list.append(Object.assign(document.createElement('p'), { className: 'soul-dock-empty', textContent: t('soulNoActions', 'Add a custom quick action in Settings.') }));
    }
    const wrap = $('#assistThisWrap');
    const dockWrap = $('#companionAssistWrap');
    const show = kernel.assistOptIn === true && Boolean(window.eidovaraSettings?.serviceUrl);
    if (wrap) {
      wrap.classList.toggle('hidden', !show);
      if (!show && $('#assistThisMessage')) $('#assistThisMessage').checked = false;
    }
    if (dockWrap) {
      dockWrap.classList.toggle('hidden', !show);
      if (!show && $('#companionAssistThis')) $('#companionAssistThis').checked = false;
    }
  }

  async function refresh() {
    if (!window.soul?.kernelStatus || !window.eidovaraSettings?.ageGateAccepted) {
      kernel = { live: false, modules: [], customActions: [], looks: [], presence: { lookId: 'orb' }, soulOnline: { assistOptIn: false } };
      renderDock();
      return kernel;
    }
    try {
      kernel = await window.soul.kernelStatus();
      renderDock();
      return kernel;
    } catch {
      kernel = { live: false, modules: [], customActions: [], looks: [], presence: { lookId: 'orb' } };
      renderDock();
      return kernel;
    }
  }

  async function saveCustomization(extra = {}) {
    const moduleEnabled = {};
    for (const input of $$('#kernelModuleList input[data-module-id]')) moduleEnabled[input.dataset.moduleId] = input.checked;
    const payload = {
      moduleEnabled,
      phrasing: {
        wit: Number($('#phrasingWit')?.value || 40),
        formality: Number($('#phrasingFormality')?.value || 40),
        brevity: Number($('#phrasingBrevity')?.value || 50)
      },
      presence: { lookId: $('#presenceLook')?.value || 'orb' },
      voice: {
        voiceURI: $('#voiceSelect')?.value || '',
        rate: Number($('#voiceRate')?.value || 1),
        pitch: Number($('#voicePitch')?.value || 1),
        mute: $('#voiceMute') ? $('#voiceMute').checked : !$('#voiceEnabled')?.checked
      },
      assistOptIn: $('#assistOptIn') ? $('#assistOptIn').checked : false,
      ...extra
    };
    const result = await window.soul.configureKernel(payload);
    kernel = result.kernel || kernel;
    if (result.settings) window.eidovaraSettings = result.settings;
    renderDock();
    return result;
  }

  function startPolling() {
    clearInterval(pollTimer);
    pollTimer = setInterval(() => { if (document.body.classList.contains('age-gated')) return; refresh().catch(() => {}); }, 5000);
  }

  window.eidovaraCompanion = {
    refresh,
    saveCustomization,
    startPolling,
    applyKernelActions(actions) {
      for (const item of actions || []) {
        if (!item.auto) continue;
        if (item.type === 'open-view' && item.view && typeof window.eidovaraSetView === 'function') window.eidovaraSetView(item.view);
        if (item.type === 'open-setup' && typeof window.eidovaraOpenSetup === 'function') window.eidovaraOpenSetup(true);
        if (item.type === 'open-diagnostics') $('#diagnosticsBtn')?.click();
        if (item.type === 'open-service') {
          if (typeof window.eidovaraSetView === 'function') window.eidovaraSetView('settings');
          $('#serviceForm')?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' });
        }
        if (item.type === 'open-legal' && typeof window.eidovaraShowLegal === 'function') window.eidovaraShowLegal(item.legal || 'about');
        if (item.type === 'open-palette' && typeof window.eidovaraLayers?.openPalette === 'function') window.eidovaraLayers.openPalette();
        if (item.type === 'open-cheatsheet' && typeof window.eidovaraLayers?.openCheatsheet === 'function') window.eidovaraLayers.openCheatsheet();
        if (item.type === 'start-focus' && typeof window.eidovaraLayers?.startFocus === 'function') window.eidovaraLayers.startFocus(item.minutes || 25, item.label);
        if (item.type === 'stop-focus' && typeof window.eidovaraLayers?.stopFocus === 'function') window.eidovaraLayers.stopFocus();
        if (item.type === 'capture-scratch' && typeof window.eidovaraLayers?.captureScratch === 'function') window.eidovaraLayers.captureScratch();
        if (item.type === 'confirm-launch-app' && item.appId && window.soul?.launchApplication) window.soul.launchApplication(item.appId);
        if (item.type === 'run-command' && item.command && typeof window.eidovaraSend === 'function') window.eidovaraSend(item.command);
        if (item.type === 'open-updates') {
          if (typeof window.eidovaraSetView === 'function') window.eidovaraSetView('settings');
          $('#checkUpdateBtn')?.focus();
        }
      }
    },
    noteExchange(userText, reply, extra) {
      const log = $('#companionLog');
      if (!log) return;
      log.textContent = '';
      if (!userText && !reply) {
        log.append(Object.assign(document.createElement('p'), { className: 'soul-dock-empty', textContent: t('companionEmpty', 'Ask from this dock. Local kernel answers on this PC. Assist is not Soul.') }));
        return;
      }
      if (userText) log.append(Object.assign(document.createElement('p'), { className: 'companion-turn', textContent: userText }));
      if (reply) log.append(Object.assign(document.createElement('p'), { className: 'companion-turn assistant', textContent: reply }));
      if (extra) log.append(Object.assign(document.createElement('p'), { className: 'companion-turn', textContent: extra }));
    }
  };

  $('#companionForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const text = $('#companionInput')?.value;
    if (typeof window.eidovaraSend === 'function') window.eidovaraSend(text, { surface: 'companion' });
  });
  $('#companionInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const text = e.currentTarget.value;
      if (typeof window.eidovaraSend === 'function') window.eidovaraSend(text, { surface: 'companion' });
    }
  });

  $('#kernelCustomizeForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const status = $('#kernelCustomizeStatus');
    if (status) status.textContent = t('savingKernel', 'Saving customization…');
    try {
      await saveCustomization();
      if (status) status.textContent = t('savedKernel', 'Customization saved on this PC. Modules, voice, presence, and phrasing stay local.');
    } catch (err) {
      if (status) status.textContent = String(err?.message || err);
    }
  });
  $('#addCustomActionBtn')?.addEventListener('click', async () => {
    const label = $('#customActionLabel')?.value.trim();
    const command = $('#customActionCommand')?.value.trim();
    const status = $('#kernelCustomizeStatus');
    if (!label || !command) {
      if (status) status.textContent = t('needActionFields', 'Add a label and a command or intent.');
      return;
    }
    const existing = (kernel?.customActions || []).slice();
    existing.push({ label, command, intent: 'general', view: 'chat' });
    try {
      await saveCustomization({ customActions: existing });
      if ($('#customActionLabel')) $('#customActionLabel').value = '';
      if ($('#customActionCommand')) $('#customActionCommand').value = '';
      if (status) status.textContent = t('actionAdded', 'Quick action saved locally.');
    } catch (err) {
      if (status) status.textContent = String(err?.message || err);
    }
  });
  $('#companionImageBtn')?.addEventListener('click', async () => {
    const status = $('#kernelCustomizeStatus');
    try {
      window.eidovaraSettings = await window.soul.selectCompanionImage();
      await saveCustomization({ presence: { lookId: 'local-image', hasLocalImage: Boolean(window.eidovaraSettings?.companion?.presenceUrl) } });
      if (status) status.textContent = window.eidovaraSettings?.companion?.presenceUrl
        ? t('imageChosen', 'Local image attached through eidovara-media. Decorative only.')
        : t('imageCancelled', 'No image chosen.');
    } catch (err) {
      if (status) status.textContent = String(err?.message || err);
    }
  });
})();
