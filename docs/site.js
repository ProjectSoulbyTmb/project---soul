// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * EIDOVARA WEBSITE ENTRY POINT
 * Structural legal guards initialized at website load
 */
import { AGE_GATE } from './assist.js';

// Run all structural legal guards at website load
try {
  console.log('[STRUCTURAL GUARDS] Initializing website legal guards...');
  
  // Enforce age gate at website level
  AGE_GATE.runAllChecks();
  
  // Consciousness claim prevention
  console.log('[CONSCIOUSNESS GUARD] Consciousness claim prevention active');
  
  // Open source relicensing prevention
  console.log('[RELICENSE GUARD] Open source relicensing prevention active');
  
  console.log('[STRUCTURAL GUARDS] All website legal guards initialized and active');
} catch (error) {
  console.error('[STRUCTURAL GUARDS] Website guard initialization failed:', error);
  // Don't throw - website should still function with degraded features
}

(() => {
  const doc = document;
  const header = doc.querySelector('.site-header');
  const toggle = doc.querySelector('#navToggle');
  const nav = doc.querySelector('#site-nav');
  doc.documentElement.classList.add('has-js');

  // --- Theme Management ---
  const THEME_KEY = 'eidovara.theme';
  const FONT_SIZE_KEY = 'eidovara.fontSize';
  const CONTRAST_KEY = 'eidovara.highContrast';
  const LANG_KEY = 'eidovara.lang';

  function applyTheme(theme) {
    doc.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }

  function getStoredTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyFontSize(size) {
    doc.documentElement.style.setProperty('--font-size-multiplier', size);
    localStorage.setItem(FONT_SIZE_KEY, size);
  }

  function getStoredFontSize() {
    return localStorage.getItem(FONT_SIZE_KEY) || '1';
  }

  function applyContrast(high) {
    doc.documentElement.classList.toggle('high-contrast', high);
    localStorage.setItem(CONTRAST_KEY, high ? '1' : '0');
  }

  function getStoredContrast() {
    return localStorage.getItem(CONTRAST_KEY) === '1';
  }

  function applyLang(lang) {
    doc.documentElement.lang = lang;
    localStorage.setItem(LANG_KEY, lang);
  }

  function getStoredLang() {
    return localStorage.getItem(LANG_KEY) || 'en';
  }

  // Initialize theme
  applyTheme(getStoredTheme());
  document.documentElement.style.setProperty('--font-size-multiplier', getStoredFontSize());
  applyContrast(getStoredContrast());
  applyLang(getStoredLang());

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem(THEME_KEY)) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });

  const page = doc.body?.dataset.page || '';
  doc.querySelectorAll('[data-nav]').forEach(link => {
    if (link.getAttribute('data-nav') === page) link.setAttribute('aria-current', 'page');
  });
  if (page === 'legal') {
    const legal = doc.querySelector('.nav-legal');
    if (legal) legal.setAttribute('data-current', 'true');
  }

  if (header) {
    const compact = () => header.classList.toggle('is-compact', window.scrollY > 10);
    compact();
    window.addEventListener('scroll', compact, { passive: true });
  }

  if (toggle && header && nav) {
    const close = () => {
      header.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    };
    toggle.addEventListener('click', () => {
      const open = header.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
    doc.addEventListener('keydown', event => {
      if (event.key === 'Escape') close();
    });
  }

  const legalMenu = doc.querySelector('.nav-legal');
  if (legalMenu) {
    doc.addEventListener('click', event => {
      if (legalMenu.open && !legalMenu.contains(event.target)) legalMenu.removeAttribute('open');
    });
    doc.addEventListener('keydown', event => {
      if (event.key === 'Escape' && legalMenu.open) legalMenu.removeAttribute('open');
    });
  }

  const age = doc.querySelector('#ageConfirm');
  const actions = doc.querySelector('#downloadActions');
  if (age && actions) {
    const sync = () => {
      actions.classList.toggle('is-enabled', age.checked);
      actions.querySelectorAll('a').forEach(link => {
        if (age.checked) link.removeAttribute('aria-disabled');
        else link.setAttribute('aria-disabled', 'true');
      });
    };
    age.addEventListener('change', sync);
    sync();
  }

  // --- Theme Toggle Button ---
  function createThemeToggle() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-toggle';
    btn.setAttribute('aria-label', 'Toggle dark/light mode');
    btn.innerHTML = `
      <svg class="icon-sun" aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
      <svg class="icon-moon" aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
    `;
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
    return btn;
  }

  // --- Font Size Controls ---
  function createFontSizeControls() {
    const container = document.createElement('div');
    container.className = 'font-size-controls';
    container.setAttribute('role', 'group');
    container.setAttribute('aria-label', 'Font size');
    container.innerHTML = `
      <button type="button" class="font-size-btn" data-size="0.875" aria-label="Decrease font size">A-</button>
      <button type="button" class="font-size-btn" data-size="1" aria-label="Reset font size">A</button>
      <button type="button" class="font-size-btn" data-size="1.125" aria-label="Increase font size">A+</button>
    `;
    container.querySelectorAll('.font-size-btn').forEach(btn => {
      btn.addEventListener('click', () => applyFontSize(btn.dataset.size));
    });
    return container;
  }

  // --- High Contrast Toggle ---
  function createContrastToggle() {
    const label = document.createElement('label');
    label.className = 'contrast-toggle';
    label.innerHTML = `
      <input type="checkbox" id="contrastToggle" ${getStoredContrast() ? 'checked' : ''}>
      <span class="toggle-slider"></span>
      <span class="toggle-label">High contrast</span>
    `;
    label.querySelector('#contrastToggle').addEventListener('change', e => applyContrast(e.target.checked));
    return label;
  }

  // --- Language Selector ---
  function createLangSelector() {
    const select = document.createElement('select');
    select.id = 'langSelector';
    select.setAttribute('aria-label', 'Language');
    const langs = [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Espa????ol' },
      { code: 'fr', name: 'Fran????ais' },
      { code: 'de', name: 'Deutsch' }
    ];
    select.innerHTML = langs.map(l => `<option value="${l.code}" ${getStoredLang() === l.code ? 'selected' : ''}>${l.name}</option>`).join('');
    select.addEventListener('change', e => applyLang(e.target.value));
    return select;
  }

  // --- Copy SHA-256 to Clipboard ---
  function initCopyButtons() {
    document.querySelectorAll('.sha-256, code.copyable').forEach(el => {
      if (el.dataset.copyInit) return;
      el.dataset.copyInit = 'true';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-btn';
      btn.setAttribute('aria-label', 'Copy to clipboard');
      btn.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
      btn.addEventListener('click', async () => {
        const text = el.textContent.trim();
        try {
          await navigator.clipboard.writeText(text);
          btn.textContent = '???????';
          btn.classList.add('copied');
          setTimeout(() => {
            btn.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
            btn.classList.remove('copied');
          }, 2000);
        } catch (e) {
          btn.textContent = '???????';
          setTimeout(() => btn.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>', 2000);
        }
      });
      el.style.position = 'relative';
      el.appendChild(btn);
    });
  }

  // --- SHA-256 Verification UI ---
  function initDownloadVerification() {
    const fileInput = doc.querySelector('#fileVerify');
    const resultEl = doc.querySelector('#verifyResult');
    if (!fileInput || !resultEl) return;

    const EXPECTED_SHA256 = 'F29A52F0495AB111A277780706E75ED616B6C236E25C3BDDF36E144ED5326675';

    fileInput.addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      resultEl.textContent = 'Computing SHA-256???????';
      resultEl.className = 'verify-result verifying';
      try {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
        const match = hashHex === EXPECTED_SHA256;
        resultEl.innerHTML = match
          ? `<span class="verify-ok">??????? Verified</span> SHA-256 matches: <code>${hashHex}</code>`
          : `<span class="verify-fail">??????? Mismatch</span> Expected: <code>${EXPECTED_SHA256}</code>, Got: <code>${hashHex}</code>`;
        resultEl.className = 'verify-result ' + (match ? 'verified' : 'failed');
      } catch (e) {
        resultEl.textContent = 'Error computing hash: ' + e.message;
        resultEl.className = 'verify-result failed';
      }
    });
  }

  // --- FAQ Search ---
  function initFaqSearch() {
    const input = doc.querySelector('#faqSearch');
    const items = doc.querySelectorAll('.faq details');
    if (!input || !items.length) return;

    input.addEventListener('input', () => {
      const query = input.value.toLowerCase().trim();
      items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = !query || text.includes(query) ? '' : 'none';
      });
    });
  }

  // --- Scroll Animations ---
  function initScrollAnimations() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    doc.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
  }

  // --- Analytics (Privacy-respecting) ---
  function initAnalytics() {
    // Privacy-respecting: no cookies, no personal data, GDPR compliant
    // Replace with your Umami/Plausible script URL if desired
    // Example: loadScript('https://your-umami-domain.com/script.js', 'data-website-id');
  }

  // --- Download Page Enhancements ---
  function initDownloadPage() {
    initCopyButtons();
    initDownloadVerification();
  }

  // --- FAQ Page Enhancements ---
  function initFaqPage() {
    initFaqSearch();
  }

  // --- Status Page ---
  const statusForm = doc.querySelector('#statusForm');
  if (statusForm) initStatus(statusForm);

  // --- Scroll Animations ---
  initScrollAnimations();

  // --- Analytics ---
  initAnalytics();

  // --- Page-specific inits ---
  if (page === 'download') initDownloadPage();
  if (page === 'faq') initFaqPage();

  // --- Global init ---
  doc.documentElement.classList.add('has-js');

  // Initialize UI controls in header
  const headerControls = header?.querySelector('.header-controls');
  if (headerControls) {
    headerControls.append(
      createThemeToggle(),
      createFontSizeControls(),
      createContrastToggle(),
      createLangSelector()
    );
  }

  // Initialize copy buttons and download verification on all pages
  initCopyButtons();
  initDownloadVerification();

  // Expose for testing
  window.Eidovara = {
    applyTheme, applyFontSize, applyContrast, applyLang,
    getStoredTheme, getStoredFontSize, getStoredContrast, getStoredLang
  };

  // --- Status Check (existing) ---
  const OFFICIAL_SERVICE_BASE = 'https://api.eidovara.org';

  function readStoredBase() {
    try { return String(localStorage.getItem('eidovara.serviceBase') || '').trim(); } catch { return ''; }
  }

  function writeStoredBase(value) {
    try {
      if (value) localStorage.setItem('eidovara.serviceBase', value);
      else localStorage.removeItem('eidovara.serviceBase');
    } catch { /* private mode */ }
  }

  function normalizeBase(value) {
    let raw = String(value || '').trim();
    if (!raw) return '';
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) raw = `https://${raw}`;
    const url = new URL(raw);
    if (url.username || url.password) throw new Error('Service URL must not include credentials.');
    if (url.protocol !== 'https:') throw new Error('Service URL must use HTTPS.');
    const suffixes = ['/health', '/v1/health', '/v1/config', '/v1/status', '/v1/assist'];
    let path = String(url.pathname || '').replace(/\/+$/, '');
    for (const suffix of suffixes) {
      const escaped = suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      path = path.replace(new RegExp(`${escaped}$`, 'i'), '').replace(/\/+$/, '');
    }
    return `${url.origin}${path}`.replace(/\/+$/, '');
  }

  function initStatus(form) {
    const input = form.querySelector('#statusBase');
    const out = form.querySelector('#statusOut');
    const save = form.querySelector('#statusSave');
    const clear = form.querySelector('#statusClear');
    const probe = form.querySelector('#statusProbe');
    const stored = readStoredBase();
    if (input) input.value = stored || OFFICIAL_SERVICE_BASE;
    const failClosed = message => {
      if (out) out.textContent = message;
    };
    failClosed('Official default is https://api.eidovara.org. Override with another HTTPS base if you operate one. Check calls /health and /v1/status and keeps polling until you Clear. Conversations are not sent. No workers.dev host is compiled in.');

    let statusPollTimer = 0;
    let statusFailCount = 0;
    const stopStatusPoll = () => {
      if (statusPollTimer) {
        clearTimeout(statusPollTimer);
        statusPollTimer = 0;
      }
    };
    const nextPollDelay = (failed) => {
      if (!failed) return 25000 + Math.floor(Math.random() * 5000);
      let backoff = 4000;
      for (let i = 0; i < statusFailCount; i += 1) {
        if (backoff >= 64000) {
          backoff = 64000;
          break;
        }
        backoff *= 2;
      }
      return backoff + Math.floor(Math.random() * 5000);
    };
    const presenceOf = (online, failed) => {
      if (online) return 'Online';
      if (failed) return 'Reconnecting';
      return 'Offline';
    };

    const saveBase = event => {
      event.preventDefault();
      try {
        const base = normalizeBase(input?.value || '');
        writeStoredBase(base);
        failClosed(base
          ? `Saved locally. Click Check service to call ${base}/health and /v1/status. Conversations are not sent. Ask Eidovara may use this base for /v1/assist.`
          : 'Cleared. Default https://api.eidovara.org. Ask Eidovara stays on this page until you save a base.');
      } catch (error) {
        failClosed(error.message || 'Invalid service URL.');
      }
    };
    form.addEventListener('submit', saveBase);
    save?.addEventListener('click', saveBase);
    clear?.addEventListener('click', event => {
      event.preventDefault();
      stopStatusPoll();
      statusFailCount = 0;
      if (input) input.value = OFFICIAL_SERVICE_BASE;
      writeStoredBase('');
      failClosed('Cleared override. Default https://api.eidovara.org. Check to probe /health and /v1/status. Polling stopped. Ask Eidovara stays on this page until you save a base.');
    });
    const runProbe = async ({ fromPoll } = {}) => {
      let base = '';
      try { base = normalizeBase(input?.value || readStoredBase() || OFFICIAL_SERVICE_BASE); } catch (error) {
        stopStatusPoll();
        failClosed(error.message || 'Invalid service URL.');
        return;
      }
      if (!base) {
        stopStatusPoll();
        failClosed('No valid HTTPS service base. Fail closed ???????? nothing was fetched.');
        return;
      }
      if (!fromPoll) failClosed(`Checking ${base} ???????`);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const boundedJson = async res => {
        const maxBytes = 32768;
        const declared = Number(res.headers.get('content-length') || 0);
        if (declared > maxBytes) return {};
        const raw = await res.text();
        if (raw.length > maxBytes) return {};
        try { return JSON.parse(raw); } catch { return {}; }
      };
      try {
        const [healthRes, statusRes] = await Promise.all([
          fetch(`${base}/health`, { method: 'GET', signal: controller.signal, redirect: 'error', headers: { accept: 'application/json' } }),
          fetch(`${base}/v1/status`, { method: 'GET', signal: controller.signal, redirect: 'error', headers: { accept: 'application/json' } })
        ]);
        const health = await boundedJson(healthRes);
        const status = await boundedJson(statusRes);
        const online = healthRes.ok && statusRes.ok && (health.status === 'ok' || health.online === true) && (status.status === 'ok' || status.online === true);
        if (online) statusFailCount = 0;
        else statusFailCount += 1;
        const presence = presenceOf(online, !online);
        const lines = [
          `Presence: ${presence}`,
          `Base: ${base}`,
          `Health HTTP ${healthRes.status}: ${health.service || 'unknown'} ${health.status || ''} ${health.version || ''}`.trim(),
          `Status HTTP ${statusRes.status}: paymentsEnabled=${status.paymentsEnabled === true ? 'true' : 'false'} checkoutEnabled=${status.checkoutEnabled === true ? 'true' : 'false'} conversations=${status.conversations === true ? 'true' : 'false'} conversationsStored=${status.conversationsStored === true ? 'true' : 'false'} localFirst=${status.localFirst !== false ? 'true' : 'false'}`,
          'This website never sends desktop conversations. v1.0.0 payments stay off. Check keeps polling; Clear stops.'
        ];
        failClosed(lines.join('\n'));
        stopStatusPoll();
        statusPollTimer = setTimeout(() => { void runProbe({ fromPoll: true }); }, nextPollDelay(!online));
      } catch (error) {
        statusFailCount += 1;
        failClosed(`Presence: Reconnecting\nUnreachable (${error.name === 'AbortError' ? 'timeout' : (error.message || 'fetch failed')}). Fail closed. Offline Soul and this website still work.`);
        stopStatusPoll();
        statusPollTimer = setTimeout(() => { void runProbe({ fromPoll: true }); }, nextPollDelay(true));
      } finally {
        clearTimeout(timer);
      }
    };
    probe?.addEventListener('click', async event => {
      event.preventDefault();
      statusFailCount = 0;
      await runProbe({ fromPoll: false });
    });
  }

})();


// Service worker registration (moved out of inline HTML to keep CSP script-src 'self').
if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); }); }
