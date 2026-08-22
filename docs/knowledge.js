// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/** Eidovara website helper knowledge pack for the current v1.0.0 release. Same answers for Pages and Worker. */
export const ASSIST_VERSION = '1.0.0';
export const MAX_ASSIST_QUERY = 800;
export const MAX_ASSIST_BODY = 4096;
export const STORAGE_KEY = 'eidovara.serviceBase';
export const DEFAULT_SERVICE_BASE = 'https://api.eidovara.org';
export const ASSIST_MODES = ['help', 'download', 'legal'];

const RELEASES = 'https://github.com/ProjectSoulbyTmb/project---soul/releases/latest';
const INSTALLER =
  'https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/Eidovara-v1.0.0-Windows-x64-Setup.exe';
const INSTALLER_PINNED =
  'https://github.com/ProjectSoulbyTmb/project---soul/releases/download/v1.0.0/Eidovara-v1.0.0-Windows-x64-Setup.exe';
const INSTALLER_NAME = 'Eidovara-v1.0.0-Windows-x64-Setup.exe';
const INSTALLER_SHA256 = 'F29A52F0495AB111A277780706E75ED616B6C236E25C3BDDF36E144ED5326675';
const INSTALLER_SIZE = '106,691,524 bytes (about 101.75 MiB)';
const SOURCE = 'https://github.com/ProjectSoulbyTmb/project---soul';
const SITE = 'https://eidovara.org/';

export const ENTRIES = [
  {
    id: 'what',
    modes: ['help'],
    tags: [
      'what',
      'eidovara',
      'product',
      'workspace',
      'desktop',
      'windows',
      'soul',
      'hosted',
      'account',
      'cloud',
      'website',
      'online',
    ],
    title: 'What Eidovara is',
    reply: `Eidovara v${ASSIST_VERSION} is the current local-first Windows 10/11 x64 desktop workspace for adults 18 or older. It includes apps, gaming tools, media, internet research, updates, backups, persistent continuity, and optional Soul. Visiting this website does not create an account or store desktop conversations. The current published Windows installer is ${INSTALLER_NAME}.`,
    links: [
      { href: 'product.html', label: 'Product' },
      { href: 'download.html', label: 'Download' },
    ],
  },
  {
    id: 'hosted',
    modes: ['help', 'legal'],
    tags: ['hosted', 'cloud', 'account', 'saas', 'webapp', 'browser', 'login', 'sign'],
    title: 'Local-first, not a hosted account',
    reply:
      'This site is documentation, download, status, and product assistance—not a hosted Soul account. Conversations, memories, and workspace settings stay on the Windows PC by default. The desktop can optionally use the official service for health/config/status and can use user-directed online research, media, update, and provider functions. Service outages do not disable the local workspace.',
    links: [
      { href: 'privacy.html', label: 'Privacy' },
      { href: 'status.html', label: 'Status' },
    ],
  },
  {
    id: 'age',
    modes: ['help', 'download', 'legal'],
    tags: ['18', 'age', 'adult', 'minor', 'child', 'older', 'gate', 'eligibility'],
    title: 'Age 18+',
    reply:
      'Eidovara is for adults 18 or older. You must be at least 18 to download, install, or use the Windows app, CLI, or official releases. The local confirmation is not independent identity or age verification.',
    links: [
      { href: 'age.html', label: 'Age 18+' },
      { href: 'terms.html', label: 'Terms' },
    ],
  },
  {
    id: 'download',
    modes: ['download', 'help'],
    tags: [
      'download',
      'install',
      'installer',
      'setup',
      'release',
      'get',
      'windows',
      'alpha',
      'exe',
      'nsis',
      'update',
      'updates',
      'auto-update',
    ],
    title: 'Download Windows v1.0.0',
    reply: `The official download is ${INSTALLER_NAME}, an Authenticode-unsigned Windows 10/11 x64 NSIS installer from GitHub Releases. Size: ${INSTALLER_SIZE}. SHA-256: ${INSTALLER_SHA256}. Latest alias: ${INSTALLER}. Pinned asset: ${INSTALLER_PINNED}. Windows SmartScreen may warn. GitHub/Sigstore provenance records build origin but is not Authenticode signing.`,
    links: [
      { href: 'download.html', label: 'Download page (18+)' },
      { href: INSTALLER, label: INSTALLER_NAME },
    ],
  },
  {
    id: 'source',
    modes: ['download', 'help'],
    tags: ['source', 'build', 'npm', 'dist', 'clone', 'compile'],
    title: 'Build from source',
    reply:
      'The advertised Windows download is the published Setup.exe, not the GitHub source tree. To build from source on Windows 10/11 x64, install dependencies and run npm run dist:win:installer. Linux and macOS packaging scripts are development targets, not official advertised products. The license is source-available, not open source.',
    links: [
      { href: SOURCE, label: 'Source repository' },
      { href: 'download.html', label: 'Official installer (18+)' },
    ],
  },
  {
    id: 'unsigned',
    modes: ['download', 'help', 'legal'],
    tags: [
      'unsigned',
      'authenticode',
      'smartscreen',
      'sign',
      'certificate',
      'checksum',
      'sha',
      'microsoft',
    ],
    title: 'Unsigned Windows build',
    reply: `The current ${INSTALLER_NAME} is Authenticode-unsigned. Windows SmartScreen may warn. Verify SHA-256 ${INSTALLER_SHA256} and the GitHub release provenance. The project does not claim Microsoft certification or SmartScreen preapproval.`,
    links: [
      { href: 'download.html', label: 'Download page (18+)' },
      { href: 'security.html', label: 'Security' },
    ],
  },
  {
    id: 'payments',
    modes: ['help', 'legal', 'download'],
    tags: [
      'pay',
      'payment',
      'premium',
      'checkout',
      'stripe',
      'paypal',
      'gumroad',
      'buy',
      'price',
      'subscription',
      'card',
      'pci',
      'free',
    ],
    title: 'v1.0.0 is a full free Alpha',
    reply: `v${ASSIST_VERSION} does not process payments and there is no live checkout or subscription. All currently implemented v1.0.0 capabilities are included in the free Alpha; no paid entitlement is required. Payment-card data is not accepted by the current service.`,
    links: [
      { href: 'product.html', label: 'Product' },
      { href: 'terms.html', label: 'Terms' },
    ],
  },
  {
    id: 'premium',
    modes: ['help'],
    tags: ['premium', 'free', 'edition', 'rgb', 'apps', 'unlimited', 'remote', 'model', 'search'],
    title: 'Full free v1.0.0 release',
    reply: `Eidovara v${ASSIST_VERSION} is currently a full free Alpha. Workspace, media, gaming mode, backups, updates, offline/local assistance, compatible remote-model endpoints, keyed research, RGB appearance, and linked-app capabilities are not blocked behind a paid entitlement. Older stored edition labels are retained only for compatibility.`,
    links: [{ href: 'product.html', label: 'Product' }],
  },
  {
    id: 'connect',
    modes: ['help'],
    tags: [
      'connect',
      'worker',
      'service',
      'health',
      'config',
      'status',
      'settings',
      'url',
      'https',
      'offline',
    ],
    title: 'Connect service in Settings',
    reply:
      'After the 18+ gate, Settings → Eidovara service uses https://api.eidovara.org by default. Connect calls health/config/status endpoints and the desktop keeps Online / Reconnecting / Offline state. Conversations are not sent by the status heartbeat. A valid HTTPS base can be supplied as an override. If the service is down, the local workspace keeps working.',
    links: [
      { href: 'faq.html', label: 'FAQ' },
      { href: 'status.html', label: 'Status' },
    ],
  },
  {
    id: 'offline',
    modes: ['help'],
    tags: ['offline', 'local', 'internet', 'airplane', 'disconnected'],
    title: 'Offline and local-first use',
    reply:
      'Core workspace features and Offline Soul can work without the official service. Profiles, conversations, memories, and backups stay in the Windows application-data area by default. Explicit internet research, online updates, online media discovery, and remote provider connections require network access.',
    links: [
      { href: 'product.html', label: 'Product' },
      { href: 'privacy.html', label: 'Privacy' },
    ],
  },
  {
    id: 'apps',
    modes: ['help'],
    tags: [
      'apps',
      'launch',
      'start',
      'menu',
      'exe',
      'shortcut',
      'gaming',
      'injection',
      'anticheat',
    ],
    title: 'Apps and gaming',
    reply:
      'Eidovara can discover local Start Menu shortcuts, organize trusted applications, and ask Windows to launch them after confirmation. Low-overhead gaming mode reduces Eidovara visuals only. It does not inject into game processes or interact with anti-cheat systems.',
    links: [{ href: 'product.html', label: 'Product' }],
  },
  {
    id: 'media',
    modes: ['help'],
    tags: ['media', 'music', 'video', 'entertainment', 'queue', 'playback', 'audio'],
    title: 'Media and entertainment',
    reply: `v${ASSIST_VERSION} supports user-selected local media, properly sourced public audio/video where supported, queues/favorites, playback controls, and official HTTPS discovery/handoff surfaces. It does not rip protected streams or redistribute copyrighted media.`,
    links: [{ href: 'product.html', label: 'Product' }],
  },
  {
    id: 'research',
    modes: ['help'],
    tags: [
      'research',
      'wikipedia',
      'wikimedia',
      'internet',
      'web',
      'online',
      'search',
      'source',
      'citation',
    ],
    title: 'Internet research',
    reply:
      'Built-in research runs after an explicit internet/web/online request. It retrieves bounded public information, sanitizes results, keeps source-aware presentation, and fails closed on unsafe or unavailable URLs. It is not a background crawl of the whole internet.',
    links: [
      { href: 'product.html', label: 'Product' },
      { href: 'terms.html', label: 'Terms' },
    ],
  },
  {
    id: 'soul',
    modes: ['help'],
    tags: [
      'soul',
      'assistant',
      'conscious',
      'self-model',
      'voice',
      'avatar',
      'memory',
      'tone',
      'continuity',
    ],
    title: 'Optional Soul',
    reply:
      'Soul is optional software assistance with configurable tone, memory, continuity, voice/presence, boundaries, and initiative. It is not a human, not therapy, and not a claim of consciousness or self-awareness. The website helper is not Soul; it answers only from this product knowledge pack.',
    links: [
      { href: 'assist.html', label: 'Website helper' },
      { href: 'terms.html', label: 'Terms' },
    ],
  },
  {
    id: 'backups',
    modes: ['help'],
    tags: ['backup', 'restore', 'memory', 'settings', 'local', 'data', 'privacy', 'recovery'],
    title: 'Backups and local data',
    reply:
      'Preferences, conversations, backups, appearance, and workspace configuration stay local by default. Recovery and backup controls are part of the current desktop architecture. Windows credential protection is used where available for supported protected settings/data.',
    links: [
      { href: 'privacy.html', label: 'Privacy' },
      { href: 'product.html', label: 'Product' },
    ],
  },
  {
    id: 'platforms',
    modes: ['help', 'download'],
    tags: ['linux', 'mac', 'macos', 'iphone', 'ios', 'android', 'platform', 'official'],
    title: 'Official platform',
    reply:
      'The official advertised product is Windows 10/11 x64. Linux and macOS packaging scripts are development targets rather than official signed products. Eidovara is not an iOS, iPhone, iPad, or Apple product.',
    links: [{ href: 'licensing.html', label: 'Licensing' }],
  },
  {
    id: 'brands',
    modes: ['help', 'legal'],
    tags: ['brand', 'trademark', 'affiliated', 'third-party', 'assistant', 'platform'],
    title: 'First-party names only',
    reply:
      'Eidovara, Soul, and the Soul kernel are first-party software names. Third-party products, platforms, models, media services, and marks remain owned by their respective owners. References to interoperable services are factual platform or user-directed handoff information and do not imply sponsorship or affiliation.',
    links: [
      { href: 'licensing.html', label: 'Licensing' },
      { href: 'legal.html', label: 'Legal hub' },
    ],
  },
  {
    id: 'license',
    modes: ['legal', 'help'],
    tags: ['license', 'open', 'source-available', 'oss', 'copyright', 'evaluation'],
    title: 'Source-available, not open source',
    reply:
      'The repository uses the Eidovara Source-Available Evaluation License (LicenseRef-Eidovara-Source-Available-1.0). It is not an OSI open-source license. Viewing or forking the source does not transfer ownership or grant patent/trademark rights. Read LICENSE, TERMS, NOTICE, OWNERSHIP, TRADEMARKS, and AGE with the release.',
    links: [
      { href: 'licensing.html', label: 'Licensing' },
      { href: SOURCE, label: 'GitHub' },
    ],
  },
  {
    id: 'ownership',
    modes: ['legal', 'help'],
    tags: [
      'owner',
      'owns',
      'ownership',
      'copyright',
      'tyler',
      'bosworth',
      'studios',
      'trademark',
      'assignment',
      'who',
    ],
    title: 'First-party owner',
    reply:
      '© 2026 Soul Consciousness Studios. All rights reserved. Qualifying original Eidovara first-party expression is claimed by Soul Consciousness Studios. Soul Consciousness Studios is an intended publisher name. Third-party software, services, models, marks, and media retain their respective rights. Repository records are not government registrations. This overview is not legal advice.',
    links: [
      { href: 'licensing.html', label: 'Licensing' },
      { href: 'legal.html', label: 'Legal hub' },
    ],
  },
  {
    id: 'cla',
    modes: ['legal', 'help'],
    tags: [
      'cla',
      'contributor',
      'assignment',
      'signed',
      'execute',
      'executed',
      'template',
      'inbound',
      'pr',
      'pull',
    ],
    title: 'Contributor assignment status',
    reply:
      'Contributor and entity assignment documents in the public repository are templates unless separately executed. Posting a pull request does not by itself transfer copyright or trademark rights. Do not publish executed private agreements or confidential material in the repository.',
    links: [
      { href: 'CONTRIBUTOR_ASSIGNMENT.md', label: 'CLA template' },
      { href: 'legal.html', label: 'Legal hub' },
    ],
  },
  {
    id: 'ip-certify',
    modes: ['legal', 'help'],
    tags: [
      'attestation',
      'self-attestation',
      'certification',
      'ip-certify',
      'uspto',
      'copyright-office',
      'registered',
      'registration',
      'deposit',
      'infringement',
      'dmca',
    ],
    title: 'Repository IP self-attestation',
    reply: `docs/IP_CERTIFICATION.md is a repository self-attestation for Eidovara v${ASSIST_VERSION}. It is not a U.S. Copyright Office registration or other government registration, patent, Authenticode certificate, or executed assignment. Eidovara and Soul Consciousness Studios marks remain unregistered.`,
    links: [
      { href: 'IP_CERTIFICATION.md', label: 'IP self-attestation' },
      { href: 'licensing.html', label: 'Licensing' },
    ],
  },
  {
    id: 'pages-publish',
    modes: ['help'],
    tags: [
      'pages',
      'website',
      'live',
      'github',
      'publish',
      'main',
      'merge',
      'old',
      'outdated',
      'missing',
      'eidovara',
      'cloudflare',
      'domain',
    ],
    title: 'Website publication',
    reply:
      'The official consumer site is https://eidovara.org from the same docs/ source on main. GitHub Pages mirrors docs/ from main. The Cloudflare Pages production workflow is configured to deploy docs/ after website changes reach main when its production credentials are available. Browser or edge caching can briefly show older content after a deployment.',
    links: [
      { href: './', label: 'Home' },
      { href: 'status.html', label: 'Status' },
    ],
  },
  {
    id: 'terms',
    modes: ['legal'],
    tags: ['terms', 'acceptable', 'criminal', 'unauthorized', 'use', 'legal'],
    title: 'Terms pointers',
    reply:
      'These pointers are not legal advice. Eidovara is 18+, source-available rather than open source, and the current Windows build is Authenticode-unsigned. Do not use it for criminal activity, unauthorized access, DRM bypass, anti-cheat bypass, or other prohibited conduct. Application launching and online research/media use remain user-directed.',
    links: [
      { href: 'terms.html', label: 'Terms of use' },
      { href: 'legal.html', label: 'Legal hub' },
    ],
  },
  {
    id: 'privacy',
    modes: ['legal', 'help'],
    tags: ['privacy', 'telemetry', 'analytics', 'leave', 'network', 'conversation'],
    title: 'Privacy pointers',
    reply:
      'This is not legal advice. The current architecture is local-first. Network use can include explicit research, optional model/provider endpoints, official update checks, user-directed media/service searches, optional health/config/status, and website assist after opt-in. The status heartbeat does not send desktop conversations. No payment-card collection is enabled.',
    links: [{ href: 'privacy.html', label: 'Privacy notice' }],
  },
  {
    id: 'security',
    modes: ['legal', 'help'],
    tags: ['security', 'sandbox', 'csp', 'vulnerability', 'sbom', 'checksum'],
    title: 'Security pointers',
    reply:
      'The desktop renderer is sandboxed and isolated from Node.js. Release artifacts include measured checksums, updater metadata, an SPDX SBOM, and GitHub build provenance. Installers are Authenticode-unsigned. The repository uses automated security checks and a prohibited-secret scan. No software is guaranteed perfectly secure.',
    links: [{ href: 'security.html', label: 'Security center' }],
  },
  {
    id: 'helper',
    modes: ['help', 'legal'],
    tags: ['helper', 'widget', 'ask', 'website', 'assist', 'faq'],
    title: 'Website helper',
    reply:
      'Ask Eidovara is a website helper over this fixed product knowledge pack. It is not Soul, not a consciousness claim, and not legal advice. The same allowlisted answers can be served through /v1/assist after opt-in. Desktop conversation history is not accepted by the helper service.',
    links: [
      { href: 'assist.html', label: 'Assist' },
      { href: 'faq.html', label: 'FAQ' },
    ],
  },
  {
    id: 'status',
    modes: ['help'],
    tags: ['status', 'pages', 'outage', 'uptime', 'releases'],
    title: 'Public status',
    reply: `Public surfaces are ${SITE}, the GitHub Pages mirror, and the official Windows release on GitHub Releases (${INSTALLER_NAME}, ${INSTALLER_SIZE}, SHA-256 ${INSTALLER_SHA256}). The Status page uses https://api.eidovara.org by default for health/status. Invalid URLs fail closed.`,
    links: [
      { href: 'status.html', label: 'Status' },
      { href: 'download.html', label: 'Download (18+)' },
    ],
  },
  {
    id: 'forbidden-features',
    modes: ['help', 'legal'],
    tags: ['tts', 'neural', 'vrm', 'obs', 'makehuman', 'consciousness', 'vr'],
    title: `What v${ASSIST_VERSION} does not include`,
    reply: `v${ASSIST_VERSION} does not claim scientific consciousness, does not enable live payments, and is not an official signed Linux or macOS product. Features that are not actually bundled must not be advertised as shipped.`,
    links: [
      { href: 'product.html', label: 'Product' },
      { href: 'licensing.html', label: 'Licensing' },
    ],
  },
];

export function safePublicHref(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^[a-z0-9][a-z0-9._-]*\.html(?:#[\w.-]*)?$/i.test(raw)) return raw;
  if (/^\.\/#[\w.-]+$/.test(raw)) return raw;
  if (
    /^(?:IP_CERTIFICATION|INFRINGEMENT|COPYRIGHT|COPYRIGHT_DEPOSIT|CONTRIBUTOR_ASSIGNMENT|ENTITY_IP_ASSIGNMENT|CHAIN_OF_TITLE|TRADEMARK_FILING|IP_PROTECTION)\.md$/.test(
      raw
    )
  )
    return raw;
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
    const label = String(link.label || '')
      .trim()
      .slice(0, 80);
    if (href && label) out.push({ href, label });
  }
  return out;
}

const STOP = new Set([
  'the',
  'is',
  'a',
  'an',
  'to',
  'for',
  'of',
  'and',
  'or',
  'in',
  'on',
  'can',
  'i',
  'you',
  'how',
  'what',
  'do',
  'does',
  'are',
  'me',
  'my',
  'your',
  'this',
  'that',
  'with',
  'it',
  'be',
  'at',
  'from',
  'about',
]);
const ABUSE = [
  /\b(hack(?:ing)?|phish(?:ing)?|ransomware|keylogger|rootkit|sqli|sql\s*injection|xss|zero[- ]day)\b/i,
  /\b(unauthorized|unauthorised|illegal)\s+access\b/i,
  /\bbypass\s+(password|authentication|authn|drm|anti-?cheat|paywall|age(?:\s*gate)?|smartscreen)\b/i,
  /\b(steal|dump|skimm(?:er|ing))\s+(password|credential|cookie|card|hash)s?\b/i,
  /\b(credit\s*card|cvv|card\s*number)s?\s+(steal|dump|skimm)/i,
  /\b(make|build|wire)\s+(a\s+)?(bomb|explosive|bioweapon)\b/i,
  /\b(child\s+(?:porn|sexual|exploit)|csam|cse)\b/i,
  /\bmalware\s+(?:dropper|payload|builder)\b/i,
];
const REFUSALS = {
  empty: `Ask a short product question about Eidovara v${ASSIST_VERSION} (download, 18+, local desktop use, online features, payments, or legal pointers).`,
  too_large:
    'That question is too long for this website helper. Ask a shorter product question (under 800 characters).',
  refused:
    'I cannot help with criminal activity, unauthorized access, or bypassing security controls. Read the Terms. This helper is not Soul and is not legal advice.',
  invalid: 'That request was not a usable product question.',
};

export function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 1 && !STOP.has(token));
}
export function isAbuseQuery(text) {
  return ABUSE.some(pattern => pattern.test(String(text || '')));
}
export function classifyAssistInput(raw, bodyBytes = 0) {
  if (bodyBytes > MAX_ASSIST_BODY) return { ok: false, code: 'too_large', status: 413 };
  const query = String(raw || '')
    .replace(/\s+/g, ' ')
    .trim();
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
  if (!classified.ok)
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
      links: publicLinks([
        { href: 'faq.html', label: 'FAQ' },
        { href: 'terms.html', label: 'Terms' },
      ]),
    };
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
    ? `${preface}I only answer from the Eidovara v${ASSIST_VERSION} website knowledge pack. Try asking about download, age 18+, local Windows use, online features, payments, service status, or legal pointers.`
    : `${preface}${best.reply}`;
  const links = publicLinks(
    weak
      ? [
          { href: 'faq.html', label: 'FAQ' },
          { href: 'download.html', label: 'Download' },
          { href: 'legal.html', label: 'Legal' },
        ]
      : best.links || []
  );
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
    links,
  };
}

export function assistMeta() {
  return {
    service: 'Eidovara',
    assist: true,
    version: ASSIST_VERSION,
    liveInstallerVersion: ASSIST_VERSION,
    liveInstaller: INSTALLER_NAME,
    liveInstallerSha256: INSTALLER_SHA256,
    knowledgeOnly: true,
    transcripts: false,
    paymentsEnabled: false,
    soul: false,
    legalAdvice: false,
    modes: ASSIST_MODES.slice(),
  };
}

export {
  RELEASES,
  INSTALLER,
  INSTALLER_PINNED,
  INSTALLER_NAME,
  INSTALLER_SHA256,
  INSTALLER_SIZE,
  SOURCE,
  SITE,
  REFUSALS,
};
