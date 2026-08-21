/** Eidovara website helper knowledge pack (v0.18.3). Same answers for Pages and Worker. */
export const ASSIST_VERSION = '0.18.3';
export const MAX_ASSIST_QUERY = 800;
export const MAX_ASSIST_BODY = 4096;
export const STORAGE_KEY = 'eidovara.serviceBase';
export const DEFAULT_SERVICE_BASE = 'https://api.eidovara.org';
export const ASSIST_MODES = ['help', 'download', 'legal'];

const RELEASES = 'https://github.com/ProjectSoulbyTmb/project---soul/releases/latest';
const INSTALLER = 'https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/Eidovara-0.18.3-Windows-x64-Setup.exe';
const INSTALLER_PINNED = 'https://github.com/ProjectSoulbyTmb/project---soul/releases/download/v0.18.3/Eidovara-0.18.3-Windows-x64-Setup.exe';
const INSTALLER_NAME = 'Eidovara-0.18.3-Windows-x64-Setup.exe';
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
    reply: 'Eidovara v0.18.3 is a local-first Windows 10/11 x64 desktop workspace for apps, gaming tools, media, research, backups, and optional Soul. It is not a hosted chat account. Visiting this website does not create an account or store conversations. Soul is an optional assistant layer that runs on your PC. Free / Offline Soul works with no cloud URL.',
    links: [{ href: 'product.html', label: 'Product' }, { href: 'download.html', label: 'Download' }]
  },
  {
    id: 'hosted',
    modes: ['help', 'legal'],
    tags: ['hosted', 'cloud', 'account', 'saas', 'webapp', 'browser', 'chatbot', 'multi-tenant', 'login', 'sign'],
    title: 'Not a hosted Soul',
    reply: 'This site is not a hosted chat account. Conversations, memories, and workspace settings stay on the Windows PC by default. Soul, when you use it, runs on that PC. The desktop app can optionally Connect to a Worker for /health, /v1/config, and /v1/status only. Conversations are not sent to that service. If the service is down, the local workspace still works.',
    links: [{ href: 'privacy.html', label: 'Privacy' }, { href: 'status.html', label: 'Status' }]
  },
  {
    id: 'age',
    modes: ['help', 'download', 'legal'],
    tags: ['18', 'age', 'adult', 'minor', 'child', 'older', 'gate', 'eligibility', 'coppa'],
    title: 'Age 18+',
    reply: 'Eidovara is for adults 18 or older. You must be at least 18 years old to download, install, or use the Windows app, CLI, or official releases. Windows Setup shows an 18+ notice. The desktop app blocks use until you confirm age and accept the Terms. The CLI needs --i-am-18-or-older or a stored confirmation. Local confirmation is not independent identity or age verification. If you are under 18, leave this site and do not install.',
    links: [{ href: 'age.html', label: 'Age 18+' }, { href: 'terms.html', label: 'Terms' }]
  },
  {
    id: 'download',
    modes: ['download', 'help'],
    tags: ['download', 'install', 'installer', 'setup', 'release', 'get', 'windows', 'alpha', 'exe', 'nsis', 'certified'],
    title: 'Download Windows Alpha',
    reply: `The official download is the unsigned Windows 10/11 x64 NSIS installer ${INSTALLER_NAME} (${INSTALLER_SIZE}) from GitHub Releases — the .exe binary, not the GitHub source repository. Confirm you are 18 or older on the Download page, then use the primary button to get that file. SHA-256 ${INSTALLER_SHA256}. Latest alias: ${INSTALLER}. Pinned tag asset: ${INSTALLER_PINNED}. It is Authenticode-unsigned, not Microsoft-certified, not EV-signed, and not SmartScreen-preapproved. GitHub/Sigstore provenance is not Authenticode. We cannot Authenticode-sign until the owner provides a code-signing certificate. Source-available fallback: npm run dist:win:installer on Windows.`,
    links: [{ href: 'download.html', label: 'Download page (18+)' }, { href: INSTALLER, label: INSTALLER_NAME }]
  },
  {
    id: 'source',
    modes: ['download', 'help'],
    tags: ['source', 'build', 'npm', 'dist', 'clone', 'compile', 'from'],
    title: 'Build from source',
    reply: 'The advertised download is the official unsigned Setup.exe, not a git clone. If you still want source on Windows 10/11 x64, run npm install, then npm run dist:win:installer. Linux and macOS packaging scripts are development targets, not official products. The license is source-available, not open source.',
    links: [{ href: SOURCE, label: 'Source repository' }, { href: 'download.html', label: 'Official installer (18+)' }]
  },
  {
    id: 'unsigned',
    modes: ['download', 'help', 'legal'],
    tags: ['unsigned', 'authenticode', 'smartscreen', 'sign', 'certificate', 'checksum', 'sha', 'certified', 'microsoft'],
    title: 'Unsigned Windows build',
    reply: `Official advertised installers are Authenticode-unsigned. That is intentional for v0.18.3, not a claim that a signed or Microsoft-certified build exists. We cannot Authenticode-sign until the owner provides a code-signing certificate. Windows SmartScreen may warn. Confirm 18+ on the Download page, then get ${INSTALLER_NAME} (${INSTALLER_SIZE}) from the official GitHub Releases asset and verify SHA-256 ${INSTALLER_SHA256}. GitHub/Sigstore provenance is not Authenticode. No software is perfectly secure.`,
    links: [{ href: 'download.html', label: 'Download page (18+)' }, { href: 'security.html', label: 'Security' }]
  },
  {
    id: 'payments',
    modes: ['help', 'legal', 'download'],
    tags: ['pay', 'payment', 'premium', 'checkout', 'stripe', 'paypal', 'gumroad', 'buy', 'price', 'subscription', 'card', 'pci'],
    title: 'Payments stay off',
    reply: 'v0.18.3 does not sell Premium and does not process payments. There is no live checkout on this website or in the app. Free is $0. Premium feature gates exist for local administrator testing only (Ctrl+A). That override is not payment or PCI processing. Payment-card data is not accepted. Store URLs on the optional Worker stay empty.',
    links: [{ href: './#plans', label: 'Free vs Premium' }, { href: 'terms.html', label: 'Terms' }]
  },
  {
    id: 'premium',
    modes: ['help'],
    tags: ['premium', 'free', 'edition', 'rgb', 'brave', 'apps', 'unlimited', 'remote', 'model'],
    title: 'Free vs Premium',
    reply: 'Eidovara Free includes the workspace, media, gaming mode, backups, updates, offline and local-model assistance, public Wikipedia/Wikimedia research, and up to three linked applications. Premium (local-admin test only) adds compatible remote-model endpoints, broad keyed web search, unlimited linked apps, and RGB lighting. No live checkout unlocks Premium in v0.18.3.',
    links: [{ href: './#plans', label: 'Plans' }]
  },
  {
    id: 'connect',
    modes: ['help'],
    tags: ['connect', 'worker', 'service', 'health', 'config', 'status', 'settings', 'url', 'https', 'offline'],
    title: 'Connect service in Settings',
    reply: 'After the 18+ gate, Settings → Eidovara service (or Ctrl+A Test service) uses https://api.eidovara.org by default. Paste another HTTPS base to override; empty/default resolves to that official host. The desktop app calls /health, /v1/config, and /v1/status only. Conversations are not sent. No workers.dev host is compiled in. If the service is down, Free / Offline Soul and the workspace keep working.',
    links: [{ href: 'faq.html', label: 'FAQ' }, { href: 'status.html', label: 'Status' }]
  },
  {
    id: 'offline',
    modes: ['help'],
    tags: ['offline', 'local', 'no', 'internet', 'airplane', 'disconnected'],
    title: 'Offline Soul',
    reply: 'Free / Offline Soul works with no cloud URL and no Worker. Profiles, conversations, memories, and backups stay in the Windows application-data directory. You can use apps, media, gaming mode, and local assistance without attaching a service. Explicit internet/web/online research is the exception, and only after you ask.',
    links: [{ href: 'product.html', label: 'Product' }, { href: 'privacy.html', label: 'Privacy' }]
  },
  {
    id: 'apps',
    modes: ['help'],
    tags: ['apps', 'launch', 'start', 'menu', 'exe', 'shortcut', 'gaming', 'injection', 'anticheat'],
    title: 'Apps and gaming',
    reply: 'Eidovara can discover local Start Menu shortcuts, organize trusted .exe/.lnk files, confirm, then ask Windows to launch them. Free keeps up to three linked apps. Low-overhead gaming mode reduces Eidovara visuals only. It does not inject into processes or interact with anti-cheat. You must already have the right to use those applications.',
    links: [{ href: 'product.html', label: 'Product' }]
  },
  {
    id: 'media',
    modes: ['help'],
    tags: ['media', 'music', 'video', 'entertainment', 'spotify', 'youtube', 'queue', 'playback'],
    title: 'Media and entertainment',
    reply: 'Play user-selected local files and properly sourced public audio or video, keep queues and favorites, and open official Spotify/YouTube HTTPS searches. Playback can require confirmation. YouTube and Spotify buttons do not rip streams. Neural TTS, VRM, MakeHuman, and OBS websocket control are not bundled in v0.18.3.',
    links: [{ href: 'product.html', label: 'Product' }]
  },
  {
    id: 'research',
    modes: ['help'],
    tags: ['research', 'wikipedia', 'wikimedia', 'internet', 'web', 'online', 'brave', 'search'],
    title: 'Research',
    reply: 'Built-in research uses public Wikipedia/Wikimedia only after an explicit internet, web, or online request. It can retrieve cited results, including pictures, audio, and video when asked, or open secure pages in the system browser. Broad keyed Brave Search is a Premium test gate and uses a key you supply. Eidovara is not a general-purpose crawler.',
    links: [{ href: 'product.html', label: 'Product' }, { href: 'terms.html', label: 'Terms' }]
  },
  {
    id: 'soul',
    modes: ['help'],
    tags: ['soul', 'assistant', 'conscious', 'sentient', 'voice', 'avatar', 'memory', 'tone'],
    title: 'Optional Soul',
    reply: 'Soul is optional software assistance with configurable tone, focus, memory, voice, avatar, and initiative. It is not a human, not therapy, and not a claim of consciousness or sentience. This website helper is also not Soul: it only answers from a fixed product knowledge pack. Output is general assistance, not legal, medical, or financial advice.',
    links: [{ href: 'assist.html', label: 'Website helper' }, { href: 'terms.html', label: 'Terms' }]
  },
  {
    id: 'backups',
    modes: ['help'],
    tags: ['backup', 'restore', 'memory', 'settings', 'local', 'data', 'privacy'],
    title: 'Backups and local data',
    reply: 'Preferences, conversations, backups, appearance, and workspace configuration stay local by default. Encrypted settings and backups use Windows credential protection when available. That protects data at rest; it does not protect against malware running as your user. Review or remove local data from Settings.',
    links: [{ href: 'privacy.html', label: 'Privacy' }, { href: 'product.html', label: 'Product' }]
  },
  {
    id: 'platforms',
    modes: ['help', 'download'],
    tags: ['linux', 'mac', 'macos', 'iphone', 'ios', 'android', 'platform', 'official'],
    title: 'Official platform',
    reply: 'The official advertised product is Windows 10/11 x64. Linux and macOS packaging scripts are development targets, not official signed products. Eidovara is not an iOS, iPhone, iPad, or Apple product and does not require licensed SF Pro fonts. It is not affiliated with Apple, Microsoft, or Electron.',
    links: [{ href: 'licensing.html', label: 'Licensing' }]
  },
  {
    id: 'license',
    modes: ['legal', 'help'],
    tags: ['license', 'open', 'source-available', 'oss', 'copyright', 'evaluation'],
    title: 'Source-available, not open source',
    reply: 'The repository uses the Eidovara Source-Available Evaluation License. That is not an OSI open-source license and is not MIT, Apache, or GPL. Viewing the source does not transfer ownership or grant patent or trademark rights. Read LICENSE, TERMS, NOTICE, OWNERSHIP, and AGE included with each release.',
    links: [{ href: 'licensing.html', label: 'Licensing' }, { href: SOURCE, label: 'GitHub' }]
  },
  {
    id: 'ownership',
    modes: ['legal', 'help'],
    tags: ['owner', 'owns', 'ownership', 'copyright', 'tyler', 'bosworth', 'studios', 'trademark', 'assignment', 'who'],
    title: 'First-party owner',
    reply: '© 2026 Tyler Michael Bosworth. All rights reserved. Source-available; use governed by LICENSE + TERMS. Third-party stays third-party. Qualifying original Eidovara expression is claimed by Tyler Michael Bosworth. Soul Consciousness Studios is an intended publisher name, not a formed entity that owns this IP unless assigned. Eidovara does not own Electron, Chromium, Node.js, Windows, or Wikipedia/Wikimedia content. Users own their own files. Marks are claimed unregistered. GitHub still allows viewing and forking through GitHub. Pull requests do not transfer copyright until a privately executed assignment. The contributor CLA and entity assignment files are unsigned templates only; this repository does not contain executed copies. This is not legal advice, a court judgment, or a government registration.',
    links: [{ href: 'licensing.html', label: 'Licensing' }, { href: 'legal.html', label: 'Legal hub' }]
  },
  {
    id: 'cla',
    modes: ['legal', 'help'],
    tags: ['cla', 'contributor', 'assignment', 'signed', 'execute', 'executed', 'template', 'inbound', 'pr', 'pull'],
    title: 'Unsigned contributor assignment',
    reply: 'The contributor copyright assignment in this repository is an unsigned template only. It is not executed. GitHub pull requests, issues, and “I agree” checkboxes do not transfer copyright. Eidovara does not accept inbound copyrightable work until Tyler Michael Bosworth gives prior written approval and both parties execute a separate written agreement. Do not commit completed copies to the public repository. This is not legal advice.',
    links: [{ href: 'CONTRIBUTOR_ASSIGNMENT.md', label: 'CLA template' }, { href: 'legal.html', label: 'Legal hub' }]
  },
  {
    id: 'pages-publish',
    modes: ['help'],
    tags: ['pages', 'website', 'live', 'github', 'publish', 'main', 'merge', 'old', 'outdated', 'missing', 'eidovara', 'cloudflare', 'domain', 'www'],
    title: 'Live GitHub Pages publishes from main',
    reply: 'The official consumer site is https://eidovara.org (Cloudflare Pages project eidovara deploying the same docs/ folder). GitHub Pages also publishes docs/ from the main branch at the github.io URL after PR #10 merged to main. pages.yml deploys docs/ on push to main; do not retarget Pages at a feature branch. www.eidovara.org has no DNS record until the owner adds a CNAME. This helper cannot change GitHub or Cloudflare DNS settings.',
    links: [{ href: './', label: 'Home' }, { href: 'status.html', label: 'Status' }]
  },
  {
    id: 'terms',
    modes: ['legal'],
    tags: ['terms', 'acceptable', 'criminal', 'unauthorized', 'use', 'legal'],
    title: 'Terms pointers',
    reply: 'These pointers are not legal advice. Eidovara is 18+, source-available not open source, and Authenticode-unsigned on Windows. Do not use it for criminal activity or unauthorized access to computers, accounts, networks, or data. Do not bypass subscriptions, DRM, anti-cheat, or authentication. Research is Wikipedia/Wikimedia after an explicit internet/web/online request. Application launching is user-confirmed local Windows apps.',
    links: [{ href: 'terms.html', label: 'Terms of use' }, { href: 'legal.html', label: 'Legal hub' }]
  },
  {
    id: 'privacy',
    modes: ['legal', 'help'],
    tags: ['privacy', 'telemetry', 'analytics', 'leave', 'network', 'conversation'],
    title: 'Privacy pointers',
    reply: 'This is not legal advice. There are no owner-operated accounts, telemetry, advertising identifiers, or cloud memory. What can leave the machine: explicit Wikipedia/Wikimedia research, optional pasted model endpoints, official GitHub update checks, Spotify/YouTube HTTPS searches you click, and optional /health /v1/config /v1/status after you paste a service base. Conversations are not sent to the Worker. No payment-card collection.',
    links: [{ href: 'privacy.html', label: 'Privacy notice' }]
  },
  {
    id: 'security',
    modes: ['legal', 'help'],
    tags: ['security', 'sandbox', 'csp', 'vulnerability', 'sbom', 'checksum'],
    title: 'Security pointers',
    reply: 'The desktop renderer is sandboxed and isolated from Node.js. Official releases publish SHA-256 checksums, an SPDX SBOM, and GitHub build provenance. Installers are not Authenticode-signed. Report vulnerabilities through the repository private advisory channel when available; do not post exploits or credentials in public issues. No software is guaranteed perfectly secure.',
    links: [{ href: 'security.html', label: 'Security center' }]
  },
  {
    id: 'helper',
    modes: ['help', 'legal'],
    tags: ['helper', 'chatbot', 'widget', 'ask', 'website', 'assist', 'faq'],
    title: 'Website helper',
    reply: 'Ask Eidovara on this site is a website helper over a fixed knowledge pack from the README, Terms, Age, Privacy, and download/runbook facts. It is not Soul, not conscious, and not legal advice. It needs no API key on eidovara.org or GitHub Pages. If you paste an optional Worker base in Status or this sheet, the same allowlisted answers can be served from POST /v1/assist. Transcripts are not stored. Desktop conversation history is never sent.',
    links: [{ href: 'assist.html', label: 'Assist' }, { href: 'faq.html', label: 'FAQ' }]
  },
  {
    id: 'status',
    modes: ['help'],
    tags: ['status', 'pages', 'outage', 'uptime', 'releases'],
    title: 'Public status',
    reply: `Default public surfaces are https://eidovara.org (Cloudflare Pages) plus the GitHub Pages github.io mirror, and the official unsigned Windows installer on GitHub Releases (${INSTALLER_NAME}, ${INSTALLER_SIZE}, SHA-256 ${INSTALLER_SHA256}). The Status page prefills https://api.eidovara.org for /health and /v1/status. Paste another HTTPS base to override (saved in localStorage). No workers.dev host is compiled into the site. Invalid URLs fail closed.`,
    links: [{ href: 'status.html', label: 'Status' }, { href: 'download.html', label: 'Download (18+)' }]
  },
  {
    id: 'forbidden-features',
    modes: ['help', 'legal'],
    tags: ['tts', 'neural', 'vrm', 'obs', 'makehuman', 'consciousness', 'vr'],
    title: 'What v0.18.3 does not include',
    reply: 'v0.18.3 does not bundle neural TTS, VRM, MakeHuman, or OBS websocket control. It does not claim scientific consciousness. It does not offer an official Linux or macOS product, Authenticode signing, or live payments. Adult Mode is a separate triple gate and stays off by default.',
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
  empty: 'Ask a short product question about Eidovara v0.18.3 (download, 18+, local desktop use, payments, or legal pointers).',
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
