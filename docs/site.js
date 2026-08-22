// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Eidovara Website — Modern Entry Point
 * Privacy-respecting, accessible, performant
 */

(() => {
  'use strict';

  // ==========================================================================
  // CONFIGURATION & CONSTANTS
  // ==========================================================================
  const CONFIG = {
    storageKeys: {
      theme: 'eidovara.theme',
      fontSize: 'eidovara.fontSize',
      contrast: 'eidovara.highContrast',
      lang: 'eidovara.lang',
      analytics: 'eidovara.analyticsConsent',
      cookieBanner: 'eidovara.cookieBannerDismissed',
      serviceBase: 'eidovara.serviceBase',
    },
    defaults: {
      theme: 'auto',
      fontSize: '1',
      contrast: false,
      lang: 'en',
      analytics: false,
    },
    languages: [
      { code: 'en', name: 'English', native: 'English' },
      { code: 'es', name: 'Español', native: 'Español' },
      { code: 'fr', name: 'Français', native: 'Français' },
      { code: 'de', name: 'Deutsch', native: 'Deutsch' },
    ],
    serviceBase: 'https://api.eidovara.org',
    analyticsEndpoint: null, // Set to your Umami/Plausible endpoint if desired
  };

  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================
  const state = {
    theme: null,
    fontSize: null,
    contrast: null,
    lang: null,
    analyticsConsent: null,
    cookieBannerDismissed: false,
    serviceBase: null,
  };

  // ==========================================================================
  // UTILITY FUNCTIONS
  // ==========================================================================
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

  function getStorage(key, fallback = null) {
    try {
      return localStorage.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function setStorage(key, value) {
    try {
      if (value === null || value === undefined) localStorage.removeItem(key);
      else localStorage.setItem(key, String(value));
    } catch {
      /* private mode / quota exceeded */
    }
  }

  function debounce(fn, ms = 150) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  }

  function throttle(fn, ms = 100) {
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last >= ms) {
        last = now;
        fn(...args);
      }
    };
  }

  // ==========================================================================
  // THEME MANAGEMENT
  // ==========================================================================
  function applyTheme(theme) {
    const resolved =
      theme === 'auto'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme;
    document.documentElement.setAttribute('data-theme', resolved);
    state.theme = theme;
    setStorage(CONFIG.storageKeys.theme, theme);
  }

  function initTheme() {
    const stored = getStorage(CONFIG.storageKeys.theme, CONFIG.defaults.theme);
    applyTheme(stored);

    // Listen for system theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (
          !getStorage(CONFIG.storageKeys.theme) ||
          getStorage(CONFIG.storageKeys.theme) === 'auto'
        ) {
          applyTheme('auto');
        }
      });
    }
  }

  // ==========================================================================
  // FONT SIZE MANAGEMENT
  // ==========================================================================
  function applyFontSize(size) {
    document.documentElement.style.setProperty('--font-size-multiplier', size);
    state.fontSize = size;
    setStorage(CONFIG.storageKeys.fontSize, size);
  }

  function initFontSize() {
    const stored = getStorage(CONFIG.storageKeys.fontSize, CONFIG.defaults.fontSize);
    applyFontSize(stored);
  }

  // ==========================================================================
  // HIGH CONTRAST MANAGEMENT
  // ==========================================================================
  function applyContrast(enabled) {
    document.documentElement.classList.toggle('high-contrast', enabled);
    state.contrast = enabled;
    setStorage(CONFIG.storageKeys.contrast, enabled ? '1' : '0');
  }

  function initContrast() {
    const stored =
      getStorage(CONFIG.storageKeys.contrast, CONFIG.defaults.contrast ? '1' : '0') === '1';
    applyContrast(stored);
  }

  // ==========================================================================
  // LANGUAGE MANAGEMENT
  // ==========================================================================
  function applyLang(lang) {
    document.documentElement.lang = lang;
    state.lang = lang;
    setStorage(CONFIG.storageKeys.lang, lang);
    updateLangSelector(lang);
  }

  function initLang() {
    const stored = getStorage(CONFIG.storageKeys.lang, CONFIG.defaults.lang);
    applyLang(stored);
  }

  function updateLangSelector(lang) {
    const select = $('#langSelector');
    if (select) select.value = lang;
  }

  // ==========================================================================
  // COOKIE CONSENT MANAGEMENT
  // ==========================================================================
  function initCookieConsent() {
    const banner = $('#cookie-consent');
    if (!banner) return;

    const dismissed = getStorage(CONFIG.storageKeys.cookieBanner);
    const analyticsConsent = getStorage(CONFIG.storageKeys.analytics);

    if (dismissed) {
      banner.hidden = true;
      state.cookieBannerDismissed = true;
      state.analyticsConsent = analyticsConsent === '1';
      loadAnalyticsIfConsented();
      return;
    }

    banner.hidden = false;

    // Accept all
    $('#cookie-consent [data-cookie-action="accept-all"]').addEventListener('click', () => {
      setStorage(CONFIG.storageKeys.cookieBanner, '1');
      setStorage(CONFIG.storageKeys.analytics, '1');
      state.cookieBannerDismissed = true;
      state.analyticsConsent = true;
      banner.hidden = true;
      loadAnalyticsIfConsented();
    });

    // Essential only
    $('#cookie-consent [data-cookie-action="essential-only"]').addEventListener('click', () => {
      setStorage(CONFIG.storageKeys.cookieBanner, '1');
      setStorage(CONFIG.storageKeys.analytics, '0');
      state.cookieBannerDismissed = true;
      state.analyticsConsent = false;
      banner.hidden = true;
    });

    // Open preferences modal
    $('#cookie-consent [data-cookie-action="preferences"]').addEventListener('click', () => {
      openCookieModal();
    });
  }

  function openCookieModal() {
    const modal = $('#cookie-modal');
    if (!modal) return;
    $('#analytics-consent').checked = state.analyticsConsent;
    modal.showModal();
  }

  function initCookieModal() {
    const modal = $('#cookie-modal');
    if (!modal) return;

    modal.addEventListener('close', () => {
      if (modal.returnValue === 'save') {
        const consent = $('#analytics-consent').checked;
        setStorage(CONFIG.storageKeys.analytics, consent ? '1' : '0');
        state.analyticsConsent = consent;
        loadAnalyticsIfConsented();
      }
    });

    // Close on Escape
    modal.addEventListener('keydown', e => {
      if (e.key === 'Escape') modal.close();
    });
  }

  function loadAnalyticsIfConsented() {
    if (state.analyticsConsent && CONFIG.analyticsEndpoint && !window._eidovaraAnalyticsLoaded) {
      // Load privacy-respecting analytics (Umami, Plausible, etc.)
      const script = document.createElement('script');
      script.defer = true;
      script.src = CONFIG.analyticsEndpoint;
      script.dataset.websiteId = CONFIG.analyticsEndpoint.split('/').pop(); // Adjust as needed
      document.head.appendChild(script);
      window._eidovaraAnalyticsLoaded = true;
    }
  }

  // ==========================================================================
  // SERVICE BASE MANAGEMENT (for status page)
  // ==========================================================================
  function getServiceBase() {
    if (state.serviceBase) return state.serviceBase;
    const stored = getStorage(CONFIG.storageKeys.serviceBase);
    state.serviceBase = stored || CONFIG.serviceBase;
    return state.serviceBase;
  }

  function setServiceBase(value) {
    const normalized = normalizeBase(value);
    state.serviceBase = normalized;
    if (normalized) setStorage(CONFIG.storageKeys.serviceBase, normalized);
    else setStorage(CONFIG.storageKeys.serviceBase, null);
    return normalized;
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

  // ==========================================================================
  // UI COMPONENT CREATION
  // ==========================================================================
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

  function createContrastToggle() {
    const label = document.createElement('label');
    label.className = 'contrast-toggle';
    label.innerHTML = `
      <input type="checkbox" id="contrastToggle" ${state.contrast ? 'checked' : ''}>
      <span class="toggle-slider"></span>
      <span class="toggle-label">High contrast</span>
    `;
    label
      .querySelector('#contrastToggle')
      .addEventListener('change', e => applyContrast(e.target.checked));
    return label;
  }

  function createLangSelector() {
    const select = document.createElement('select');
    select.id = 'langSelector';
    select.setAttribute('aria-label', 'Language');
    select.innerHTML = CONFIG.languages
      .map(
        l =>
          `<option value="${l.code}" ${state.lang === l.code ? 'selected' : ''}>${l.native}</option>`
      )
      .join('');
    select.addEventListener('change', e => applyLang(e.target.value));
    return select;
  }

  // ==========================================================================
  // HEADER CONTROLS INJECTION
  // ==========================================================================
  function injectHeaderControls() {
    const headerControls = $('.header-controls');
    if (!headerControls) return;
    headerControls.append(
      createThemeToggle(),
      createFontSizeControls(),
      createContrastToggle(),
      createLangSelector()
    );
  }

  // ==========================================================================
  // NAVIGATION
  // ==========================================================================
  function initNavigation() {
    const header = $('.site-header');
    const toggle = $('#navToggle');
    const nav = $('#site-nav');
    document.documentElement.classList.add('has-js');

    // Active nav link
    const page = document.body?.dataset.page || '';
    $$('[data-nav]').forEach(link => {
      if (link.getAttribute('data-nav') === page) link.setAttribute('aria-current', 'page');
    });
    if (page === 'legal') {
      const legal = $('.nav-legal');
      if (legal) legal.setAttribute('data-current', 'true');
    }

    // Compact header on scroll
    if (header) {
      const compact = () => header.classList.toggle('is-compact', window.scrollY > 10);
      compact();
      window.addEventListener('scroll', throttle(compact, 50), { passive: true });
    }

    // Mobile nav toggle
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
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') close();
      });
    }

    // Legal dropdown outside click
    const legalMenu = $('.nav-legal');
    if (legalMenu) {
      document.addEventListener('click', e => {
        if (legalMenu.open && !legalMenu.contains(e.target)) legalMenu.removeAttribute('open');
      });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && legalMenu.open) legalMenu.removeAttribute('open');
      });
    }
  }

  // ==========================================================================
  // DOWNLOAD PAGE: AGE GATE & VERIFICATION
  // ==========================================================================
  function initDownloadPage() {
    initCopyButtons();
    initDownloadVerification();

    const age = $('#ageConfirm');
    const actions = $('#downloadActions');
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
  }

  // ==========================================================================
  // COPY BUTTONS
  // ==========================================================================
  function initCopyButtons() {
    $$('.sha-256, code.copyable').forEach(el => {
      if (el.dataset.copyInit) return;
      el.dataset.copyInit = 'true';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-btn';
      btn.setAttribute('aria-label', 'Copy to clipboard');
      btn.innerHTML =
        '<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
      btn.addEventListener('click', async () => {
        const text = el.textContent.trim();
        try {
          await navigator.clipboard.writeText(text);
          btn.textContent = '✓ Copied';
          btn.classList.add('copied');
          setTimeout(() => {
            btn.innerHTML =
              '<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
            btn.classList.remove('copied');
          }, 2000);
        } catch {
          btn.textContent = '✗ Failed';
          setTimeout(() => {
            btn.innerHTML =
              '<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
          }, 2000);
        }
      });
      el.style.position = 'relative';
      el.appendChild(btn);
    });
  }

  // ==========================================================================
  // DOWNLOAD VERIFICATION (SHA-256)
  // ==========================================================================
  function initDownloadVerification() {
    const fileInput = $('#fileVerify');
    const resultEl = $('#verifyResult');
    if (!fileInput || !resultEl) return;

    const EXPECTED_SHA256 = 'F29A52F0495AB111A277780706E75ED616B6C236E25C3BDDF36E144ED5326675';

    fileInput.addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      resultEl.textContent = 'Computing SHA-256…';
      resultEl.className = 'verify-result verifying';
      try {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase();
        const match = hashHex === EXPECTED_SHA256;
        resultEl.innerHTML = match
          ? `<span class="verify-ok">✓ Verified</span> SHA-256 matches: <code>${hashHex}</code>`
          : `<span class="verify-fail">✗ Mismatch</span> Expected: <code>${EXPECTED_SHA256}</code>, Got: <code>${hashHex}</code>`;
        resultEl.className = 'verify-result ' + (match ? 'verified' : 'failed');
      } catch (err) {
        resultEl.textContent = 'Error computing hash: ' + err.message;
        resultEl.className = 'verify-result failed';
      }
    });
  }

  // ==========================================================================
  // FAQ SEARCH
  // ==========================================================================
  function initFaqPage() {
    const input = $('#faqSearch');
    const items = $$('.faq details');
    if (!input || !items.length) return;

    input.addEventListener(
      'input',
      debounce(() => {
        const query = input.value.toLowerCase().trim();
        items.forEach(item => {
          item.style.display =
            !query || item.textContent.toLowerCase().includes(query) ? '' : 'none';
        });
      }, 150)
    );
  }

  // ==========================================================================
  // STATUS PAGE: SERVICE STATUS CHECKER
  // ==========================================================================
  function initStatusPage() {
    const form = $('#statusForm');
    if (!form) return;

    const input = form.querySelector('#statusBase');
    const out = form.querySelector('#statusOut');
    const save = form.querySelector('#statusSave');
    const clear = form.querySelector('#statusClear');
    const probe = form.querySelector('#statusProbe');

    const failClosed = message => {
      if (out) out.textContent = message;
    };

    const base = getServiceBase();
    if (input) input.value = base || CONFIG.serviceBase;
    failClosed(
      'Official default is https://api.eidovara.org. Override with another HTTPS base if you operate one. Check calls /health and /v1/status and keeps polling until you Clear. Conversations are not sent. No workers.dev host is compiled in.'
    );

    let statusPollTimer = 0;
    let statusFailCount = 0;

    const stopStatusPoll = () => {
      if (statusPollTimer) {
        clearTimeout(statusPollTimer);
        statusPollTimer = 0;
      }
    };

    const nextPollDelay = failed =>
      failed
        ? Math.min(4000 * Math.pow(2, statusFailCount), 64000) + Math.floor(Math.random() * 5000)
        : 25000 + Math.floor(Math.random() * 5000);

    const presenceOf = (online, failed) =>
      online ? 'Online' : failed ? 'Reconnecting' : 'Offline';

    const runProbe = async ({ fromPoll } = {}) => {
      let base = '';
      try {
        base = normalizeBase(input?.value || getServiceBase() || CONFIG.serviceBase);
      } catch (error) {
        stopStatusPoll();
        failClosed(error.message || 'Invalid service URL.');
        return;
      }
      if (!base) {
        stopStatusPoll();
        failClosed('No valid HTTPS service base. Fail closed — nothing was fetched.');
        return;
      }
      if (!fromPoll) failClosed(`Checking ${base} …`);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);

      const boundedJson = async res => {
        const maxBytes = 32768;
        const declared = Number(res.headers.get('content-length') || 0);
        if (declared > maxBytes) return {};
        const raw = await res.text();
        if (raw.length > maxBytes) return {};
        try {
          return JSON.parse(raw);
        } catch {
          return {};
        }
      };

      try {
        const [healthRes, statusRes] = await Promise.all([
          fetch(`${base}/health`, {
            method: 'GET',
            signal: controller.signal,
            redirect: 'error',
            headers: { accept: 'application/json' },
          }),
          fetch(`${base}/v1/status`, {
            method: 'GET',
            signal: controller.signal,
            redirect: 'error',
            headers: { accept: 'application/json' },
          }),
        ]);
        const health = await boundedJson(healthRes);
        const status = await boundedJson(statusRes);
        const online =
          healthRes.ok &&
          statusRes.ok &&
          (health.status === 'ok' || health.online === true) &&
          (status.status === 'ok' || status.online === true);
        if (online) statusFailCount = 0;
        else statusFailCount += 1;
        const presence = presenceOf(online, !online);
        const lines = [
          `Presence: ${presence}`,
          `Base: ${base}`,
          `Health HTTP ${healthRes.status}: ${health.service || 'unknown'} ${health.status || ''} ${health.version || ''}`.trim(),
          `Status HTTP ${statusRes.status}: paymentsEnabled=${status.paymentsEnabled === true ? 'true' : 'false'} checkoutEnabled=${status.checkoutEnabled === true ? 'true' : 'false'} conversations=${status.conversations === true ? 'true' : 'false'} conversationsStored=${status.conversationsStored === true ? 'true' : 'false'} localFirst=${status.localFirst !== false ? 'true' : 'false'}`,
          'This website never sends desktop conversations. v1.0.0 payments stay off. Check keeps polling; Clear stops.',
        ];
        failClosed(lines.join('\n'));
        stopStatusPoll();
        statusPollTimer = setTimeout(() => {
          void runProbe({ fromPoll: true });
        }, nextPollDelay(!online));
      } catch (error) {
        statusFailCount += 1;
        failClosed(
          `Presence: Reconnecting\nUnreachable (${error.name === 'AbortError' ? 'timeout' : error.message || 'fetch failed'}). Fail closed. Offline Soul and this website still work.`
        );
        stopStatusPoll();
        statusPollTimer = setTimeout(() => {
          void runProbe({ fromPoll: true });
        }, nextPollDelay(true));
      } finally {
        clearTimeout(timer);
      }
    };

    const saveBase = event => {
      event.preventDefault();
      try {
        const base = normalizeBase(input?.value || '');
        setServiceBase(base);
        failClosed(
          base
            ? `Saved locally. Click Check service to call ${base}/health and /v1/status. Conversations are not sent. Ask Eidovara may use this base for /v1/assist.`
            : 'Cleared override. Default https://api.eidovara.org. Ask Eidovara stays on this page until you save a base.'
        );
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
      if (input) input.value = CONFIG.serviceBase;
      setServiceBase(null);
      failClosed(
        'Cleared override. Default https://api.eidovara.org. Check to probe /health and /v1/status. Polling stopped. Ask Eidovara stays on this page until you save a base.'
      );
    });
    probe?.addEventListener('click', async event => {
      event.preventDefault();
      statusFailCount = 0;
      await runProbe({ fromPoll: false });
    });
  }

  // ==========================================================================
  // INTERSECTION OBSERVER ANIMATIONS
  // ==========================================================================
  function initScrollAnimations() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    $$('.animate-on-scroll').forEach(el => observer.observe(el));
  }

  // ==========================================================================
  // PRIVACY-RESPECTING ANALYTICS (optional)
  // ==========================================================================
  function initAnalytics() {
    // Load only if user consented
    if (state.analyticsConsent && CONFIG.analyticsEndpoint && !window._eidovaraAnalyticsLoaded) {
      const script = document.createElement('script');
      script.defer = true;
      script.src = CONFIG.analyticsEndpoint;
      // For Umami: script.dataset.websiteId = 'your-id';
      // For Plausible: script.dataset.domain = 'eidovara.org';
      document.head.appendChild(script);
      window._eidovaraAnalyticsLoaded = true;
    }
  }

  // ==========================================================================
  // SERVICE WORKER REGISTRATION
  // ==========================================================================
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
      });
    }
  }

  // ==========================================================================
  // EXPOSE GLOBAL API FOR TESTING
  // ==========================================================================
  window.Eidovara = {
    applyTheme,
    applyFontSize,
    applyContrast,
    applyLang,
    getStorage,
    setStorage,
    getServiceBase,
    setServiceBase,
    normalizeBase,
    openCookieModal,
    CONFIG,
  };

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  function init() {
    // Load all state
    initTheme();
    initFontSize();
    initContrast();
    initLang();

    // Initialize cookie consent
    initCookieConsent();
    initCookieModal();

    // Initialize UI
    initNavigation();
    injectHeaderControls();

    // Page-specific
    if (document.body?.dataset.page === 'download') initDownloadPage();
    if (document.body?.dataset.page === 'faq') initFaqPage();
    if (document.body?.dataset.page === 'status') initStatusPage();

    // Copy buttons & download verification (all pages)
    initCopyButtons();
    initDownloadVerification();

    // Scroll animations
    initScrollAnimations();

    // Analytics (respects consent)
    initAnalytics();

    // Service worker
    registerServiceWorker();

    // Mark JS as loaded
    document.documentElement.classList.add('has-js');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
