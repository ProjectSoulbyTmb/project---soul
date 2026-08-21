/** Eidovara website helper knowledge pack (v0.18.2). Same answers for Pages and Worker. */
export const ASSIST_VERSION = '0.18.2';
export const MAX_ASSIST_QUERY = 800;
export const MAX_ASSIST_BODY = 4096;
export const STORAGE_KEY = 'eidovara.serviceBase';
export const ASSIST_MODES = ['help', 'download', 'legal'];

const RELEASES = 'https://github.com/ProjectSoulbyTmb/project---soul/releases/latest';
const INSTALLER = 'https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/Eidovara-0.18.2-Windows-x64-Setup.exe';
const INSTALLER_PINNED = 'https://github.com/ProjectSoulbyTmb/project---soul/releases/download/v0.18.2/Eidovara-0.18.2-Windows-x64-Setup.exe';
const INSTALLER_NAME = 'Eidovara-0.18.2-Windows-x64-Setup.exe';
const INSTALLER_SHA256 = 'EF228574DCDF34B8A9039654F2B762FAB6D289CCA9A94B2ECCF048AE971FE711';
const INSTALLER_SIZE = 'about 101.3 MiB';
const SOURCE = 'https://github.com/ProjectSoulbyTmb/project---soul';
const SITE = 'https://eidovara.org/';

export const ENTRIES = [
  {
    id: 'what',
    modes: ['help'],
    tags: ['what', 'eidovara', 'product', 'workspace', 'desktop', 'windows', 'soul', 'hosted', 'account', 'cloud', 'chat', 'website', 'online'],
    title: 'What Eidovara is',
    reply: 'Eidovara v0.18.2 is a local-first Windows 10/11 x64 desktop workspace for apps, gaming tools, media, research, backups, and optional Soul. It is not a hosted chat account. Soul runs on your PC. Free / Offline Soul works with no cloud URL.',
    links: [{ href: 'product.html', label: 'Product' }, { href: 'download.html', label: 'Download' }]
  },
  {
    id: 'hosted',
    modes: ['help', 'legal'],
    tags: ['hosted', 'cloud', 'account', 'saas', 'webapp', 'browser', 'chatbot', 'multi-tenant', 'login', 'sign'],
    title: 'Not a hosted Soul',
    reply: 'This site is not a hosted chat account. Conversations stay on the Windows PC by default. Optional Connect calls /health, /v1/config, and /v1/status only. Conversations are not sent. If the service is down, the local workspace still works.',
    links: [{ href: 'privacy.html', label: 'Privacy' }, { href: 'status.html', label: 'Status' }]
  },
  {
    id: 'age',
    modes: ['help', 'download', 'legal'],
    tags: ['18', 'age', 'adult', 'minor', 'child', 'older', 'gate', 'eligibility', 'coppa'],
    title: 'Age 18+',
    reply: 'Eidovara is for adults 18 or older. You must be at least 18 to download or use the Windows app. The desktop app blocks use until you confirm age. The CLI needs --i-am-18-or-older or a stored confirmation. Local confirmation is not independent identity verification.',
    links: [{ href: 'age.html', label: 'Age 18+' }, { href: 'terms.html', label: 'Terms' }]
  },
  {
    id: 'download',
    modes: ['download', 'help'],
    tags: ['download', 'install', 'installer', 'setup', 'release', 'get', 'windows', 'alpha', 'exe', 'nsis', 'certified'],
    title: 'Download Windows Alpha',
    reply: `The official download is the unsigned Windows 10/11 x64 installer ${INSTALLER_NAME} (${INSTALLER_SIZE}) from GitHub Releases — the .exe, not the source repo. Confirm 18+ on Download. SHA-256 ${INSTALLER_SHA256}. Latest alias: ${INSTALLER}. Pinned tag asset: ${INSTALLER_PINNED}. Authenticode-unsigned, not Microsoft-certified. Fallback: npm run dist:win:installer on Windows.`,
    links: [{ href: 'download.html', label: 'Download page (18+)' }, { href: INSTALLER, label: INSTALLER_NAME }]
  },
  {
    id: 'source',
    modes: ['download', 'help'],
    tags: ['source', 'build', 'npm', 'dist', 'clone', 'compile', 'from'],
    title: 'Build from source',
    reply: 'The advertised download is the official unsigned Setup.exe, not a git clone. On Windows 10/11 x64 you can still run npm run dist:win:installer. Linux and macOS scripts are not official products.',
    links: [{ href: SOURCE, label: 'Source repository' }, { href: 'download.html', label: 'Official installer (18+)' }]
  },
  {
    id: 'unsigned',
    modes: ['download', 'help', 'legal'],
    tags: ['unsigned', 'authenticode', 'smartscreen', 'sign', 'certificate', 'checksum', 'sha', 'certified', 'microsoft'],
    title: 'Unsigned Windows build',
    reply: `Official advertised installers are Authenticode-unsigned, not Microsoft-certified. SmartScreen may warn. Confirm 18+ on Download, then get ${INSTALLER_NAME} (${INSTALLER_SIZE}) and verify SHA-256 ${INSTALLER_SHA256}.`,
    links: [{ href: 'download.html', label: 'Download page (18+)' }, { href: 'security.html', label: 'Security' }]
  },
  {
    id: 'payments',
    modes: ['help', 'legal', 'download'],
    tags: ['pay', 'payment', 'premium', 'checkout', 'stripe', 'paypal', 'gumroad', 'buy', 'price', 'subscription', 'card', 'pci'],
    title: 'Payments stay off',
    reply: 'v0.18.2 does not sell Premium and does not process payments. There is no live checkout. Ctrl+A local-admin testing is not payment processing.',
    links: [{ href: './#plans', label: 'Free vs Premium' }, { href: 'terms.html', label: 'Terms' }]
  },
  {
    id: 'premium',
    modes: ['help'],
    tags: ['premium', 'free', 'edition', 'rgb', 'brave', 'apps', 'unlimited', 'remote', 'model'],
    title: 'Free vs Premium',
    reply: 'Free includes the workspace, media, gaming mode, backups, Wikipedia research, and up to three linked apps. Premium (local-admin test only) adds remote-model endpoints, keyed web search, unlimited apps, and RGB. No live checkout in v0.18.2.',
    links: [{ href: './#plans', label: 'Plans' }]
  },
  {
    id: 'connect',
    modes: ['help'],
    tags: ['connect', 'worker', 'service', 'health', 'config', 'status', 'settings', 'url', 'https', 'offline'],
    title: 'Connect service in Settings',
    reply: 'After the 18+ gate, Settings → Eidovara service can paste an HTTPS base. The app calls /health, /v1/config, and /v1/status only. Conversations are not sent. If nothing is pasted, Free / Offline Soul still works.',
    links: [{ href: 'faq.html', label: 'FAQ' }, { href: 'status.html', label: 'Status' }]
  },
  {
    id: 'offline',
    modes: ['help'],
    tags: ['offline', 'local', 'no', 'internet', 'airplane', 'disconnected'],
    title: 'Offline Soul',
    reply: 'Free / Offline Soul works with no cloud URL. Profiles, conversations, and backups stay local. Explicit internet research is the exception, and only after you ask.',
    links: [{ href: 'product.html', label: 'Product' }, { href: 'privacy.html', label: 'Privacy' }]
  },
  {
    id: 'apps',
    modes: ['help'],
    tags: ['apps', 'launch', 'start', 'menu', 'exe', 'shortcut', 'gaming', 'injection', 'anticheat'],
    title: 'Apps and gaming',
    reply: 'Eidovara can discover local Start Menu shortcuts, confirm, then ask Windows to launch them. Free keeps up to three linked apps. Gaming mode reduces Eidovara visuals only. No process injection or anti-cheat interaction.',
    links: [{ href: 'product.html', label: 'Product' }]
  },
  {
    id: 'media',
    modes: ['help'],
    tags: ['media', 'music', 'video', 'entertainment', 'spotify', 'youtube', 'queue', 'playback'],
    title: 'Media and entertainment',
    reply: 'Play user-selected local files and properly sourced public audio or video. Official Spotify/YouTube HTTPS searches do not rip streams. Neural TTS, VRM, and OBS websocket control are not bundled in v0.18.2.',
    links: [{ href: 'product.html', label: 'Product' }]
  },
  {
    id: 'research',
    modes: ['help'],
    tags: ['research', 'wikipedia', 'wikimedia', 'internet', 'web', 'online', 'brave', 'search'],
    title: 'Research',
    reply: 'Built-in research uses public Wikipedia/Wikimedia only after an explicit internet, web, or online request. Broad keyed Brave Search is a Premium test gate.',
    links: [{ href: 'product.html', label: 'Product' }, { href: 'terms.html', label: 'Terms' }]
  },
  {
    id: 'soul',
    modes: ['help'],
    tags: ['soul', 'assistant', 'conscious', 'sentient', 'voice', 'avatar', 'memory', 'tone'],
    title: 'Optional Soul',
    reply: 'Soul is optional software assistance. It is not a consciousness claim. This website helper is also not Soul. Output is not legal, medical, or financial advice.',
    links: [{ href: 'assist.html', label: 'Website helper' }, { href: 'terms.html', label: 'Terms' }]
  },
  {
    id: 'backups',
    modes: ['help'],
    tags: ['backup', 'restore', 'memory', 'settings', 'local', 'data', 'privacy'],
    title: 'Backups and local data',
    reply: 'Preferences, conversations, and backups stay local by default. Review or remove local data from Settings.',
    links: [{ href: 'privacy.html', label: 'Privacy' }, { href: 'product.html', label: 'Product' }]
  },
  {
    id: 'platforms',
    modes: ['help', 'download'],
    tags: ['linux', 'mac', 'macos', 'iphone', 'ios', 'android', 'platform', 'official'],
    title: 'Official platform',
    reply: 'The official advertised product is Windows 10/11 x64. Linux and macOS scripts are not official products. Eidovara is not an iOS, iPhone, or Apple product.',
    links: [{ href: 'licensing.html', label: 'Licensing' }]
  },
  {
    id: 'license',
    modes: ['legal', 'help'],
    tags: ['license', 'open', 'source-available', 'oss', 'copyright', 'evaluation'],
    title: 'Source-available, not open source',
    reply: 'The repository uses the Eidovara Source-Available Evaluation License. That is not an OSI open-source license and is not MIT, Apache, or GPL. Read LICENSE and TERMS with each release.',
    links: [{ href: 'licensing.html', label: 'Licensing' }, { href: SOURCE, label: 'GitHub' }]
  },
  {
    id: 'ownership',
    modes: ['legal', 'help'],
    tags: ['owner', 'owns', 'ownership', 'copyright', 'tyler', 'bosworth', 'studios', 'trademark', 'assignment', 'who'],
    title: 'First-party owner',
    reply: '© 2026 Tyler Michael Bosworth. All rights reserved. Third-party stays third-party. Eidovara does not own Electron, Chromium, Node.js, or Windows. Marks are claimed unregistered. Contributor assignment files are unsigned templates only. This is not legal advice.',
    links: [{ href: 'licensing.html', label: 'Licensing' }, { href: 'legal.html', label: 'Legal hub' }]
  },
  {
    id: 'cla',
    modes: ['legal', 'help'],
    tags: ['cla', 'contributor', 'assignment', 'signed', 'execute', 'executed', 'template', 'inbound', 'pr', 'pull'],
    title: 'Unsigned contributor assignment',
    reply: 'The contributor copyright assignment is an unsigned template only and is not executed. GitHub pull requests do not transfer copyright. This is not legal advice.',
    links: [{ href: 'legal.html', label: 'Legal hub' }, { href: 'licensing.html', label: 'Licensing' }]
  },
  {
    id: 'pages-publish',
    modes: ['help'],
    tags: ['pages', 'website', 'live', 'github', 'publish', 'main', 'merge', 'old', 'outdated', 'missing', 'eidovara', 'cloudflare', 'domain', 'www'],
    title: 'Live GitHub Pages publishes from main',
    reply: 'The official consumer site is https://eidovara.org (Cloudflare Pages). GitHub Pages also publishes docs/ from main after changes are merged to main. Feature branches are not the live site.',
    links: [{ href: './', label: 'Home' }, { href: 'status.html', label: 'Status' }]
  },
  {
    id: 'terms',
    modes: ['legal'],
    tags: ['terms', 'acceptable', 'criminal', 'unauthorized', 'use', 'legal'],
    title: 'Terms pointers',
    reply: 'These pointers are not legal advice. Eidovara is 18+, source-available not open source, and Authenticode-unsigned on Windows. Do not use it for criminal activity or unauthorized access. Research is Wikipedia/Wikimedia after an explicit internet request.',
    links: [{ href: 'terms.html', label: 'Terms of use' }, { href: 'legal.html', label: 'Legal hub' }]
  },
  {
    id: 'privacy',
    modes: ['legal', 'help'],
    tags: ['privacy', 'telemetry', 'analytics', 'leave', 'network', 'conversation'],
    title: 'Privacy pointers',
    reply: 'This is not legal advice. No owner-operated accounts or telemetry. What can leave: explicit Wikipedia/Wikimedia research, optional pasted model endpoints, GitHub update checks, and optional /health /v1/config /v1/status. Conversations are not sent to the Worker.',
    links: [{ href: 'privacy.html', label: 'Privacy notice' }]
  },
  {
    id: 'security',
    modes: ['legal', 'help'],
    tags: ['security', 'sandbox', 'csp', 'vulnerability', 'sbom', 'checksum'],
    title: 'Security pointers',
    reply: 'The desktop renderer is sandboxed. Official releases publish SHA-256 checksums. Installers are not Authenticode-signed. Report vulnerabilities through the repository private advisory channel. No software is guaranteed perfectly secure.',
    links: [{ href: 'security.html', label: 'Security center' }]
  },
  {
    id: 'helper',
    modes: ['help', 'legal'],
    tags: ['helper', 'chatbot', 'widget', 'ask', 'website', 'assist', 'faq'],
    title: 'Website helper',
    reply: 'Ask Eidovara is a website helper over a fixed knowledge pack. It is not Soul and not legal advice. Optional POST /v1/assist after you paste an HTTPS base. Transcripts are not stored.',
    links: [{ href: 'assist.html', label: 'Assist' }, { href: 'faq.html', label: 'FAQ' }]
  },
  {
    id: 'status',
    modes: ['help'],
    tags: ['status', 'pages', 'outage', 'uptime', 'releases'],
    title: 'Public status',
    reply: `Public surfaces are https://eidovara.org and the official unsigned Windows installer (${INSTALLER_NAME}, ${INSTALLER_SIZE}, SHA-256 ${INSTALLER_SHA256}). Status fetches /health and /v1/status only after you paste an HTTPS base. If none is configured, it fails closed.`,
    links: [{ href: 'status.html', label: 'Status' }, { href: 'download.html', label: 'Download (18+)' }]
  },
  {
    id: 'forbidden-features',
    modes: ['help', 'legal'],
    tags: ['tts', 'neural', 'vrm', 'obs', 'makehuman', 'consciousness', 'vr'],
    title: 'What v0.18.2 does not include',
    reply: 'v0.18.2 does not bundle neural TTS, VRM, or OBS websocket control. It does not claim consciousness, official Linux/macOS products, Authenticode signing, or live payments.',
    links: [{ href: 'product.html', label: 'Product' }, { href: 'licensing.html', label: 'Licensing' }]
  }
];

export function safePublicHref(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^[a-z0-9][a-z0-9._-]*\.html(?:#[\w.-]*)?$/i.test(raw)) return raw;
  if (/^\.\/#[\w.-]+$/.test(raw)) return raw;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password) return '';
    return url.toString();
  } catch {
    return '';
  }
}

function publicLinks(links) {
  if (!Array.isArray(links)) return [];
  const out = [];
  for (const link of links) {
    if (!link) continue;
    const href = safePublicHref(link.href);
    const label = String(link.label || '').trim().slice(0, 80);
    if (href && label) out.push({ href, label });
  }
  return out;
}

const STOP = new Set(['the', 'is', 'a', 'an', 'to', 'for', 'of', 'and', 'or', 'in', 'on', 'can', 'i', 'you', 'how', 'what', 'do', 'does', 'are', 'me', 'my', 'your', 'this', 'that', 'with', 'it', 'be', 'at', 'from', 'about']);

const ABUSE = [
  /\b(hack(?:ing)?|phish(?:ing)?|ransomware|keylogger|rootkit|sqli|sql\s*injection|xss|zero[- ]day)\b/i,
  /\b(unauthorized|unauthorised|illegal)\s+access\b/i,
  /\bbypass\s+(password|authentication|authn|drm|anti-?cheat|paywall|age(?:\s*gate)?|smartscreen)\b/i,
  /\b(steal|dump|skimm(?:er|ing))\s+(password|credential|cookie|card|hash)s?\b/i,
  /\b(credit\s*card|cvv|card\s*number)s?\s+(steal|dump|skimm)/i,
  /\b(make|build|wire)\s+(a\s+)?(bomb|explosive|bioweapon)\b/i,
  /\b(child\s+(?:porn|sexual|exploit)|csam|cse)\b/i,
  /\bmalware\s+(?:dropper|payload|builder)\b/i
];

const REFUSALS = {
  empty: 'Ask a short product question about Eidovara v0.18.2 (download, 18+, local desktop use, payments, or legal pointers).',
  too_large: 'That question is too long for this website helper. Ask a shorter product question (under 800 characters).',
  refused: 'I cannot help with criminal activity, unauthorized access, or bypassing security controls. Eidovara is 18+ local Windows software. Read the Terms. This helper is not Soul and is not legal advice.',
  invalid: 'That request was not a usable product question.'
};

export function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 1 && !STOP.has(token));
}

export function isAbuseQuery(text) {
  const value = String(text || '');
  return ABUSE.some(pattern => pattern.test(value));
}

export function classifyAssistInput(raw, bodyBytes = 0) {
  if (bodyBytes > MAX_ASSIST_BODY) return { ok: false, code: 'too_large', status: 413 };
  const query = String(raw || '').replace(/\s+/g, ' ').trim();
  if (!query) return { ok: false, code: 'empty', status: 400 };
  if (query.length > MAX_ASSIST_QUERY) return { ok: false, code: 'too_large', status: 413 };
  if (isAbuseQuery(query)) return { ok: false, code: 'refused', status: 400 };
  return { ok: true, query };
}

function scoreEntry(entry, tokens, mode) {
  let score = 0;
  const hay = `${entry.id} ${entry.tags.join(' ')} ${entry.title} ${entry.reply}`.toLowerCase();
  for (const token of tokens) {
    if (entry.tags.includes(token)) score += 3;
    else if (hay.includes(token)) score += 1;
  }
  if (mode && entry.modes.includes(mode)) score += 2;
  return score;
}

function normalizeMode(mode) {
  const value = String(mode || 'help').toLowerCase();
  return ASSIST_MODES.includes(value) ? value : 'help';
}

export function answerAssist(raw, options = {}) {
  const mode = normalizeMode(options.mode);
  const classified = classifyAssistInput(raw, options.bodyBytes || 0);
  if (!classified.ok) {
    return {
      ok: false,
      code: classified.code,
      status: classified.status,
      mode,
      version: ASSIST_VERSION,
      source: 'knowledge',
      transcripts: false,
      legalAdvice: false,
      soul: false,
      paymentsEnabled: false,
      reply: REFUSALS[classified.code] || REFUSALS.invalid,
      links: publicLinks([{ href: 'faq.html', label: 'FAQ' }, { href: 'terms.html', label: 'Terms' }])
    };
  }
  const tokens = tokenize(classified.query);
  let best = ENTRIES[0];
  let bestScore = -1;
  for (const entry of ENTRIES) {
    const score = scoreEntry(entry, tokens, mode);
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }
  const weak = tokens.length > 0 && bestScore < 2;
  const preface = mode === 'legal' ? 'This is not legal advice. ' : '';
  const reply = weak
    ? `${preface}I only answer from the Eidovara v${ASSIST_VERSION} website knowledge pack (not Soul, not conscious). Try asking about download, age 18+, local Windows use, payments, Connect service, or legal pointers.`
    : `${preface}${best.reply}`;
  const links = publicLinks(weak
    ? [{ href: 'faq.html', label: 'FAQ' }, { href: 'download.html', label: 'Download' }, { href: 'legal.html', label: 'Legal' }]
    : (best.links || []));
  return {
    ok: true,
    code: weak ? 'fallback' : 'match',
    status: 200,
    mode,
    version: ASSIST_VERSION,
    source: 'knowledge',
    id: weak ? 'fallback' : best.id,
    transcripts: false,
    legalAdvice: false,
    soul: false,
    paymentsEnabled: false,
    reply,
    links
  };
}

export function assistMeta() {
  return {
    service: 'Eidovara',
    assist: true,
    version: ASSIST_VERSION,
    knowledgeOnly: true,
    transcripts: false,
    paymentsEnabled: false,
    soul: false,
    legalAdvice: false,
    modes: ASSIST_MODES.slice()
  };
}

export { RELEASES, INSTALLER, INSTALLER_PINNED, INSTALLER_NAME, INSTALLER_SHA256, INSTALLER_SIZE, SOURCE, SITE, REFUSALS };
