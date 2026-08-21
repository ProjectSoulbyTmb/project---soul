// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/** Desktop product knowledge for the in-app Soul kernel (v0.18.2). Not the website helper. */

export const DESKTOP_KNOWLEDGE_VERSION = '0.18.2';
export const INSTALLER_NAME = 'Eidovara-0.18.2-Windows-x64-Setup.exe';
export const INSTALLER_SHA256 = 'EF228574DCDF34B8A9039654F2B762FAB6D289CCA9A94B2ECCF048AE971FE711';
export const INSTALLER_SIZE = 'about 101.3 MiB';

export const KNOWLEDGE_INTENTS = new Set([
  'age', 'unsigned', 'payments', 'premium', 'download', 'platforms', 'connect',
  'hosted', 'what', 'help', 'legal', 'status', 'forbidden', 'offline', 'privacy'
]);

const ENTRIES = {
  age: {
    title: 'Age 18+',
    reply: 'Eidovara is for adults 18 or older. You already passed the in-app age gate to use this window. That local checkbox is not independent identity or age verification. Adult Mode is a separate triple gate (legal-adult status, enablement, and current revocable consent) and stays off by default. If you are under 18, exit and do not use this software.',
    actions: [{ type: 'open-legal', legal: 'age', label: 'Age 18+ notice' }]
  },
  unsigned: {
    title: 'Unsigned Windows build',
    reply: 'This installation is Authenticode-unsigned on purpose for v0.18.2. It is not Microsoft-certified, not EV-signed, and not SmartScreen-preapproved. GitHub or Sigstore provenance is not Authenticode. No software is perfectly secure. Checksums and updates live under Settings → Software updates.',
    actions: [{ type: 'open-updates', label: 'Software updates' }, { type: 'open-legal', legal: 'about', label: 'About & legal' }]
  },
  payments: {
    title: 'Payments stay off',
    reply: 'v0.18.2 does not sell Premium and does not process payments. There is no live checkout, card collection, or PCI processing in this app. Free is $0. A local administrator override (Ctrl+A, away from text fields) can flip Premium feature gates for testing only. That override is not a purchase.',
    actions: [{ type: 'open-legal', legal: 'about', label: 'About & legal' }]
  },
  premium: {
    title: 'Free vs Premium',
    reply: 'Eidovara Free includes this workspace, media, gaming mode, backups, updates, offline and local-model assistance, public Wikipedia/Wikimedia research after an explicit internet/web/online request, and up to three linked apps. Premium test gates (local admin only) add compatible remote-model endpoints, a keyed Brave search, unlimited linked apps, and RGB lighting. No live checkout unlocks Premium in v0.18.2.',
    actions: [{ type: 'open-view', view: 'settings', label: 'Open Settings' }]
  },
  download: {
    title: 'You are already in the app',
    reply: `This window is the installed Eidovara v0.18.2 workspace, not the public Download page. The advertised unsigned Windows installer is ${INSTALLER_NAME} (${INSTALLER_SIZE}, SHA-256 ${INSTALLER_SHA256}) from GitHub Releases — an 18+ site concern. In this app, use Settings → Software updates for the official GitHub channel. Soul does not fetch Setup.exe.`,
    actions: [{ type: 'open-updates', label: 'Software updates' }]
  },
  platforms: {
    title: 'Official platform',
    reply: 'The official advertised product is Windows 10/11 x64. Linux and macOS packaging scripts are development targets, not official products. Eidovara is not an iOS, iPhone, iPad, or Apple product and does not require licensed SF Pro fonts. It is not affiliated with Apple, Microsoft, or Electron.',
    actions: [{ type: 'open-legal', legal: 'about', label: 'About & legal' }]
  },
  connect: {
    title: 'Optional service',
    reply: 'Settings → Eidovara service defaults to https://api.eidovara.org. Empty/default still resolves there; paste another HTTPS base to override. The desktop then GETs /v1/health (and /health), /v1/config, and /v1/status. An extra opt-in (off by default) can POST a single question to /v1/assist — never the conversation transcript. No workers.dev host is compiled into the app. Your Worker is not a cloud mind. Assist is not Soul. If the service is down, this workspace keeps working offline.',
    actions: [{ type: 'open-service', label: 'Service settings' }]
  },
  hosted: {
    title: 'Not a hosted chat',
    reply: 'Eidovara is local-first Windows software. Conversations stay on this PC. Soul is the on-device software self-model — not the public-site Assist widget and not a claim of consciousness. Optional service attach is health, config, and status. Optional /v1/assist is a separate opt-in, default off, and still refuses conversation history.',
    actions: [{ type: 'open-service', label: 'Service settings' }, { type: 'open-legal', legal: 'privacy', label: 'Privacy notice' }]
  },
  what: {
    title: 'What Eidovara is',
    reply: 'Eidovara v0.18.2 is a local-first Windows 10/11 x64 desktop workspace for apps, gaming tools, media, research, backups, and optional Soul. It is Stable Alpha, source-available (not open source), Authenticode-unsigned, and 18+. Soul is an optional software self-model on this device — not a person, not therapy, and not a claim of consciousness. The in-app kernel answers from local knowledge and your on-device profile. It is not the website helper.',
    actions: [{ type: 'open-setup', label: 'Configure Soul' }, { type: 'open-view', view: 'apps', label: 'Apps & Gaming' }]
  },
  help: {
    title: 'What this kernel can do',
    reply: 'I can open workspace surfaces, answer honest product facts (18+, unsigned, payments off, local-first), speak with OS-installed voices, show a decorative presence, and run local intents: focus, apps, study, entertainment, memory, and gaming checklists. Ctrl+K (or Ctrl+P) opens a local command palette; Ctrl+/ opens the keyboard cheatsheet. Local search covers linked apps, memories, settings labels, and product intents — no background crawler and no injection into other processes. I do not control other apps, OBS, or anti-cheat. Neural TTS, VRM, MakeHuman, and OBS websocket control are not in v0.18.2. Assist is not Soul.',
    actions: [
      { type: 'open-view', view: 'apps', label: 'Apps & Gaming' },
      { type: 'open-view', view: 'entertainment', label: 'Entertainment' },
      { type: 'open-cheatsheet', label: 'Keyboard cheatsheet' },
      { type: 'open-legal', legal: 'about', label: 'Legal' }
    ]
  },
  legal: {
    title: 'Legal pointers',
    reply: 'This is not legal advice. Eidovara is 18+, source-available not open source, and Authenticode-unsigned. Copyright in qualifying original first-party expression is claimed by Tyler Michael Bosworth. Soul Consciousness Studios is the intended publisher only. Do not use it for criminal activity or unauthorized access. Do not bypass subscriptions, DRM, anti-cheat, or authentication. Full TERMS, PRIVACY, AGE, and LICENSE ship with this installation and are also in the in-app legal overlay. GitHub pull requests do not transfer ownership.',
    actions: [{ type: 'open-legal', legal: 'terms', label: 'Terms' }, { type: 'open-legal', legal: 'privacy', label: 'Privacy' }]
  },
  privacy: {
    title: 'Privacy pointers',
    reply: 'This is not legal advice. Conversations, memories, settings, and the 18+ flag stay on this device. No owner-operated accounts or telemetry. What can leave: explicit Wikipedia/Wikimedia research, optional pasted model endpoints, official GitHub update checks, Spotify/YouTube HTTPS searches you click, optional /v1/health /v1/config /v1/status after you paste a service URL, and optional /v1/assist only after a separate opt-in. Conversations are not sent by default. No payment-card collection.',
    actions: [{ type: 'open-legal', legal: 'privacy', label: 'Privacy notice' }]
  },
  status: {
    title: 'Local status',
    reply: 'Diagnostics and the Eidovara service indicator are local to this installation. Service attach is optional and fail-closed. Payments stay off even if a remote config lied. This is not an uptime dashboard for a hosted Soul, and it is not a security certification.',
    actions: [{ type: 'open-diagnostics', label: 'Show diagnostics' }, { type: 'open-service', label: 'Service settings' }]
  },
  forbidden: {
    title: 'What v0.18.2 does not include',
    reply: 'v0.18.2 does not bundle neural TTS, VRM, MakeHuman, or OBS websocket control. It does not claim scientific consciousness or sentience. It does not offer an official Linux or macOS product, Authenticode signing, or live payments. Adult Mode stays gated. Playback uses voices already installed on this OS when you enable that option.',
    actions: [{ type: 'open-legal', legal: 'about', label: 'About & legal' }]
  },
  offline: {
    title: 'Offline workspace',
    reply: 'Free / Offline Soul and this workspace work with no cloud URL. Profiles, conversations, memories, and backups stay in the Windows application-data directory. Explicit internet/web/online research is the exception, and only after you ask. If a connected model endpoint fails, replies fall back to offline mode. The kernel stays the source of truth even when a Worker is attached.',
    actions: [{ type: 'open-view', view: 'settings', label: 'Open Settings' }]
  }
};

const PRODUCT_RULES = [
  { id: 'age', re: /18\+|eighteen(?:\s+or\s+older)?|\bage\s*gate\b|\bunder\s*18\b|\badults?\s+only\b|\bcoppa\b|\bhow\s+old\b/i },
  { id: 'unsigned', re: /\b(authenticode|unsigned|smartscreen|microsoft[- ]certified|code[ -]?sign(?:ed|ing)?|ev[ -]?sign)\b/i },
  { id: 'payments', re: /\b(pci|stripe|paypal|gumroad|checkout|live\s+payments?|buy\s+(?:premium|eidovara)|credit\s*cards?|card\s+numbers?)\b/i },
  { id: 'platforms', re: /\b(linux|macos|mac\s*os|iphone|ios|ipad|android|official\s+platform|sf\s*pro)\b/i },
  { id: 'forbidden', re: /\b(neural\s+tts|vrm|makehuman|obs\s+websocket|consciousness|sentien(?:t|ce)|are\s+you\s+(?:alive|conscious|a\s+person))\b/i },
  { id: 'download', re: /\b(download|setup\.exe|installer|github\s+releases|get\s+eidovara)\b/i },
  { id: 'connect', re: /\b(connect\s+(?:the\s+)?service|worker\s+url|paste\s+(?:an?\s+)?https|\/v1\/status|\/v1\/health|\/health)\b/i },
  { id: 'hosted', re: /\b(hosted\s+chat|cloud\s+account|saas|conversations?\s+sent|\/v1\/assist|website\s+helper|site\s+assist)\b/i },
  { id: 'premium', re: /\b(free\s+vs\s+premium|premium\s+(?:test|gate|edition|override)|eidovara\s+premium)\b/i },
  { id: 'privacy', re: /\b(telemetry|analytics|what\s+leaves|privacy\s+notice)\b/i },
  { id: 'status', re: /\b(diagnostics|service\s+status|is\s+(?:the\s+)?service\s+(?:up|down|online|offline))\b/i },
  { id: 'legal', re: /\b(terms(?:\s+of\s+use)?|legal\s+notice|source-available|open\s+source|not\s+legal\s+advice)\b/i },
  { id: 'offline', re: /\b(offline\s+soul|airplane|no\s+internet|local[ -]first|works?\s+offline)\b/i },
  { id: 'what', re: /\b(what\s+is\s+eidovara|what\s+does\s+eidovara|tell\s+me\s+about\s+eidovara|eidovara\s+workspace)\b/i },
  { id: 'help', re: /\b(what\s+can\s+(?:you|this\s+(?:companion|workspace|assistant|kernel))\s+do|how\s+do\s+i\s+use\s+(?:this|eidovara)|workspace\s+(?:helper|companion))\b/i }
];

export function matchProductIntent(input) {
  const text = String(input || '');
  if (!text.trim()) return null;
  for (const rule of PRODUCT_RULES) {
    if (rule.re.test(text)) return rule.id;
  }
  return null;
}

export function knowledgeEntry(id) {
  return ENTRIES[id] || null;
}

export function shouldUseKnowledgeReply(intent) {
  return KNOWLEDGE_INTENTS.has(intent);
}

export { ENTRIES as DESKTOP_KNOWLEDGE_ENTRIES };
