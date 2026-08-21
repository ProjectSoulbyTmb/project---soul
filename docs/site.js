(() => {
  const doc = document;
  const header = doc.querySelector('.site-header');
  const toggle = doc.querySelector('#navToggle');
  const nav = doc.querySelector('#site-nav');
  doc.documentElement.classList.add('has-js');

  const page = doc.body?.dataset.page || '';
  doc.querySelectorAll('[data-nav]').forEach(link => {
    if (link.getAttribute('data-nav') === page) link.setAttribute('aria-current', 'page');
  });
  if (page === 'legal') {
    const legal = doc.querySelector('.nav-legal');
    if (legal) legal.setAttribute('data-current', 'true');
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

  const statusForm = doc.querySelector('#statusForm');
  if (statusForm) initStatus(statusForm);

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
    const suffixes = ['/health', '/v1/config', '/v1/status', '/v1/assist'];
    let path = url.pathname.replace(/\/+$/, '');
    for (const suffix of suffixes) {
      if (path.toLowerCase().endsWith(suffix)) path = path.slice(0, -suffix.length);
    }
    return `${url.origin}${path.replace(/\/+$/, '')}`;
  }

  function initStatus(form) {
    const input = form.querySelector('#statusBase');
    const out = form.querySelector('#statusOut');
    const save = form.querySelector('#statusSave');
    const clear = form.querySelector('#statusClear');
    const probe = form.querySelector('#statusProbe');
    const stored = readStoredBase();
    if (input && stored) input.value = stored;
    const failClosed = message => {
      if (out) out.textContent = message;
    };
    failClosed('Not configured. This site is GitHub Pages; Windows downloads come from GitHub Releases. No Worker URL is compiled in. Paste an HTTPS base only if you operate one — otherwise no request is sent.');

    save?.addEventListener('click', event => {
      event.preventDefault();
      try {
        const base = normalizeBase(input?.value || '');
        writeStoredBase(base);
        failClosed(base
          ? `Saved locally. Click Check service to call ${base}/health and /v1/status. Conversations are not sent.`
          : 'Cleared. Fail closed — no service request will be sent.');
      } catch (error) {
        failClosed(error.message || 'Invalid service URL.');
      }
    });
    clear?.addEventListener('click', event => {
      event.preventDefault();
      if (input) input.value = '';
      writeStoredBase('');
      failClosed('Cleared. GitHub Pages + GitHub Releases only. Fail closed — no service request will be sent.');
    });
    probe?.addEventListener('click', async event => {
      event.preventDefault();
      let base = '';
      try { base = normalizeBase(input?.value || readStoredBase()); } catch (error) {
        failClosed(error.message || 'Invalid service URL.');
        return;
      }
      if (!base) {
        failClosed('No service base configured. Fail closed — nothing was fetched. Pages and Releases do not require a Worker.');
        return;
      }
      writeStoredBase(base);
      failClosed(`Checking ${base} …`);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const [healthRes, statusRes] = await Promise.all([
          fetch(`${base}/health`, { method: 'GET', signal: controller.signal, headers: { accept: 'application/json' } }),
          fetch(`${base}/v1/status`, { method: 'GET', signal: controller.signal, headers: { accept: 'application/json' } })
        ]);
        const health = await healthRes.json().catch(() => ({}));
        const status = await statusRes.json().catch(() => ({}));
        const lines = [
          `Base: ${base}`,
          `Health HTTP ${healthRes.status}: ${health.service || 'unknown'} ${health.status || ''} ${health.version || ''}`.trim(),
          `Status HTTP ${statusRes.status}: paymentsEnabled=${status.paymentsEnabled === true ? 'true' : 'false'} conversations=${status.conversations === true ? 'true' : 'false'} localFirst=${status.localFirst !== false ? 'true' : 'false'}`,
          'This website never sends desktop conversations. v0.18.0 payments stay off.'
        ];
        failClosed(lines.join('\n'));
      } catch (error) {
        failClosed(`Unreachable (${error.name === 'AbortError' ? 'timeout' : (error.message || 'fetch failed')}). Fail closed. Offline Soul and this Pages site still work.`);
      } finally {
        clearTimeout(timer);
      }
    });
  }
})();
