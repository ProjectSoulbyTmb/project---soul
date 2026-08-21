import { answerAssist, STORAGE_KEY } from './knowledge.js';

const suffixes = ['/health', '/v1/config', '/v1/status', '/v1/assist'];

function readBase() {
  try { return String(localStorage.getItem(STORAGE_KEY) || '').trim(); } catch { return ''; }
}

function writeBase(value) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, value);
    else localStorage.removeItem(STORAGE_KEY);
  } catch { /* private mode */ }
}

function trimSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function normalizeBase(value) {
  let raw = String(value || '').trim();
  if (!raw) return '';
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) raw = `https://${raw}`;
  const url = new URL(raw);
  if (url.username || url.password) throw new Error('Service URL must not include credentials.');
  if (url.protocol !== 'https:') throw new Error('Service URL must use HTTPS.');
  let path = trimSlash(url.pathname || '');
  for (const suffix of suffixes) {
    const escaped = suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    path = trimSlash(path.replace(new RegExp(`${escaped}$`, 'i'), ''));
  }
  return trimSlash(`${url.origin}${path}`);
}

async function onlineAnswer(base, query, mode) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const maxBytes = 32768;
  try {
    const res = await fetch(`${base}/v1/assist`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ query, mode }),
      signal: controller.signal,
      redirect: 'error'
    });
    const declared = Number(res.headers.get('content-length') || 0);
    if (declared > maxBytes) return null;
    const raw = await res.text();
    if (raw.length > maxBytes) return null;
    let body;
    try { body = JSON.parse(raw); } catch { return null; }
    if (!body || typeof body.reply !== 'string') return null;
    return body;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value === true) node.setAttribute(key, '');
    else if (value !== false && value != null) node.setAttribute(key, String(value));
  }
  for (const child of children) node.append(child);
  return node;
}

function renderLinks(target, links) {
  if (!Array.isArray(links) || !links.length) return;
  const list = el('p', { className: 'assist-links' });
  for (const link of links) {
    if (!link || !link.href || !link.label) continue;
    const a = el('a', { href: link.href, text: link.label });
    list.append(a, document.createTextNode(' '));
  }
  target.append(list);
}

function addMessage(log, role, text, links) {
  const item = el('div', { className: `assist-msg assist-msg-${role}` });
  const body = el('p');
  body.textContent = text;
  item.append(body);
  if (role === 'assistant') renderLinks(item, links);
  log.append(item);
  log.scrollTop = log.scrollHeight;
}

function mount() {
  if (document.querySelector('.assist-root')) return;
  const root = el('div', { className: 'assist-root' });
  const launch = el('button', {
    className: 'assist-launch',
    type: 'button',
    'aria-haspopup': 'dialog',
    'aria-controls': 'assistSheet',
    text: 'Ask Eidovara'
  });
  const sheet = el('div', {
    className: 'assist-sheet',
    id: 'assistSheet',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'assistTitle',
    hidden: true
  });
  const title = el('h2', { id: 'assistTitle', className: 'assist-title', text: 'Website helper' });
  const sub = el('p', { className: 'assist-sub', text: 'Ask Eidovara answers from a fixed v0.18.0 knowledge pack. Not Soul, not conscious, not legal advice. Adults 18+.' });
  const close = el('button', { className: 'assist-close', type: 'button', text: 'Close', 'aria-label': 'Close assistant' });
  const modes = el('div', { className: 'assist-modes', role: 'radiogroup', 'aria-label': 'Helper mode' }, [
    modeRadio('help', 'Help', true),
    modeRadio('download', 'Download help'),
    modeRadio('legal', 'Legal pointers')
  ]);
  const log = el('div', { className: 'assist-log', 'aria-live': 'polite' });
  const form = el('form', { className: 'assist-form' });
  const input = el('textarea', {
    id: 'assistQuery',
    name: 'query',
    rows: '2',
    maxlength: '800',
    required: true,
    placeholder: 'Ask about download, 18+, or what Eidovara is…'
  });
  const send = el('button', { className: 'assist-send', type: 'submit', text: 'Send' });
  const tools = el('details', { className: 'assist-service' });
  tools.append(
    el('summary', { text: 'Optional online service (paste HTTPS base)' }),
    el('p', { className: 'assist-hint', text: 'Leave empty to stay on this page. Do not paste secrets. Same pattern as desktop Settings → Eidovara service. No workers.dev host is built in.' }),
    el('label', { className: 'assist-label', text: 'Service base' }),
  );
  const serviceInput = el('input', {
    id: 'assistService',
    type: 'url',
    maxlength: '200',
    autocomplete: 'off',
    placeholder: 'https://eidovara-api.example.workers.dev',
    spellcheck: 'false'
  });
  const serviceSave = el('button', { className: 'btn-gray assist-service-save', type: 'button', text: 'Save locally' });
  const sourceNote = el('p', { className: 'assist-source', id: 'assistSource', text: 'Answering on this page (no cloud).' });
  tools.append(serviceInput, serviceSave);
  form.append(input, send);
  const header = el('div', { className: 'assist-sheet-head' }, [title, close]);
  sheet.append(header, sub, modes, log, sourceNote, form, tools);
  root.append(launch, sheet);
  document.body.append(root);

  const stored = readBase();
  if (stored) serviceInput.value = stored;
  addMessage(log, 'assistant', 'I am a website helper for Eidovara v0.18.0, not Soul. Ask about the Windows desktop app, download, age 18+, payments, or legal pointers. Conversations are not stored.');

  function selectedMode() {
    const picked = modes.querySelector('input[name="assistMode"]:checked');
    return picked ? picked.value : 'help';
  }

  function setOpen(open) {
    sheet.hidden = !open;
    root.classList.toggle('is-open', open);
    launch.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) input.focus();
    else launch.focus();
  }

  launch.addEventListener('click', () => setOpen(true));
  close.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !sheet.hidden) setOpen(false);
  });

  serviceSave.addEventListener('click', () => {
    try {
      const base = normalizeBase(serviceInput.value);
      writeBase(base);
      sourceNote.textContent = base
        ? `Online assist will try ${base}/v1/assist, then fall back to this page. Transcripts are not stored.`
        : 'Answering on this page (no cloud).';
    } catch (error) {
      sourceNote.textContent = error.message || 'Invalid HTTPS base.';
    }
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const query = input.value.trim();
    if (!query) return;
    addMessage(log, 'user', query);
    input.value = '';
    const mode = selectedMode();
    let result = answerAssist(query, { mode });
    let via = 'this page';
    let base = '';
    try { base = normalizeBase(serviceInput.value || readBase()); } catch { base = ''; }
    if (base) {
      sourceNote.textContent = 'Trying optional online assist…';
      const remote = await onlineAnswer(base, query, mode);
      if (remote && remote.reply) {
        result = remote;
        via = 'optional Worker (same knowledge pack)';
      } else {
        via = 'this page (online assist failed closed)';
      }
    }
    sourceNote.textContent = `Answered from ${via}. Not Soul. Not legal advice. Transcripts are not stored.`;
    addMessage(log, 'assistant', result.reply, result.links);
  });
}

function modeRadio(value, label, checked = false) {
  const wrap = el('label', { className: 'assist-mode' });
  const input = el('input', { type: 'radio', name: 'assistMode', value });
  if (checked) input.checked = true;
  wrap.append(input, document.createTextNode(label));
  return wrap;
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
else mount();
