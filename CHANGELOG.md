# Eidovara

## Unreleased

## v0.22.2

- Honest two-track cut: **source v0.22.2** (this tree, Worker health, website helper, desktop chrome) while the live advertised Windows installer remains **v0.19.1** `Eidovara-0.19.1-Windows-x64-Setup.exe` SHA-256 `72F4D09ADA17593F0391438A5375ABC9351041DA8ABB252E68271B8FDACCA7D8`. No `Eidovara-0.22.2-Windows-x64-Setup.exe` exists yet; do not invent a hash. Tags `v0.18.0`–`v0.19.1` were not moved. After merge, deploy the Worker and Pages; a newer Setup.exe needs a real Windows build plus a measured SHA.
- Incorporates website marks/wallpapers (#40), security/licensing completeness (#41), and honest online-status heartbeat plus log redaction / single-instance lock (#42).

- Security and licensing completeness pass (not a government filing, not a relicense): Dependabot covers npm and GitHub Actions with grouped PRs; CodeQL v4 on `ubuntu-latest` uploads SARIF; OpenSSF Scorecards pins refreshed; dependency-review stays `fail-on-severity: moderate` with an honest Dependency graph owner click; prohibited-secret scan excludes `security.yml` without weakening patterns; SECURITY.md and `security.txt` document private vulnerability reporting as an owner toggle; NOTICE.md tracks `electron-updater` 6.8.9; TERMS/EULA export-control notice without inventing license numbers; `ip-certification.json` inventories security workflows; legal hub links infringement/DMCA without a fake Copyright Office agent; future Windows builds flip Electron fuses and call `app.enableSandbox()` (live v0.19.1 Setup.exe unchanged). Authenticode, USPTO, Copyright Office registration, executed CLA, and formed company stay owner-action-required.
- Desktop online status stays current after 18+ when `https://api.eidovara.org` (or a pasted HTTPS/loopback base) is reachable: the main process heartbeats GET `/health` and GET `/v1/status` with jitter, reconnects with exponential backoff, and surfaces honest **Online / Reconnecting / Offline** in Settings, diagnostics, companion, and the tray tooltip. Conversations are not sent. Workspace renderer `connect-src 'none'` is unchanged. Worker `/v1/status` is `private, no-store`, CORS/HEAD cover health and status, and `wrangler.toml` binds `api.eidovara.org`.
- Foundation hygiene: local `project-soul.log` redacts Bearer tokens and obvious secret-shaped fields before write; Electron `requestSingleInstanceLock` focuses an existing window instead of spawning a second copy.
- Public site ships high-resolution first-party website display marks, light/dark/product wallpapers, and an Open Graph image (`docs/eidovara-mark.png`, `docs/soul-consciousness-studios-mark.png`, `docs/eidovara-wallpaper-*.jpg`, `docs/eidovara-og.png`). Favicon stays the registered 512 rendition. Registered application masters in `assets/branding/` are unchanged.
- Historical `v0.19.0` Windows Setup.exe SHA-256 recorded from a downloaded GitHub Release asset (`F2B0D9BB0A887294CF58A43C75DF67FA422C2120540DE03D5227A9B239D08310`, matches `SHA256SUMS.txt`). Advertised live installer remains **v0.19.1** `72F4D09ADA17593F0391438A5375ABC9351041DA8ABB252E68271B8FDACCA7D8`. Tags were not moved. CodeQL research sanitizer (`js/bad-html-filtering-regexp`) is already on `main` as a markup scanner; commit `cbb8558` was not cherry-picked because it sits behind the land-all kernel and would conflict.
- Runtime engine catalog (Soul kernel, WebGL lathe, Web Audio Feel, procedural heartbeat/breath/drone, Chromium HTML5/Media Session, OS speechSynthesis, optional SpeechRecognition, Electron stay-awake, optional Chromium gamepad for the Feel pad, WebGPU probe). Diagnostics lists shipped vs blocked engines. Neural TTS, VRM, Three.js/Babylon/React, ffmpeg, OBS websocket, and Lovense stay off. No new installer version.
- Adult Soul studio plus Adult Media desk after the 18+ app gate and Adult Mode triple gate (legal-adult status, enablement, current consent). Until a later release, **Adult Mode is only reachable from the private administrator panel** (Ctrl+A, away from text fields). Identity keeps Revoke consent and Standard mode. Studio is a separate 21+ first-party figure, OS/`eidovara-media` audio, generated ambient beds, guided sessions, and a Feel Sync pad. Adult Media is local rails (For you / Continue / Watch later / folders) plus official HTTPS tube/creator searches in the system browser. Guest overlays stay closed in Adult Mode. Not Pornhub-in-app, not Lovense hardware, not VRM, not bundled neural TTS.
- Desktop chrome sharpened: tighter cards, inset nav, Adult Soul theater stage, and an Adult Mode section inside the admin dialog. Enablement buttons and Adult Soul nav stay hidden until an admin session is unlocked.
- Feel Sync copies popular Vibease-style settings (11 pulse patterns, XY speed/strength, loop/float, sensitivity, media/fantasy/voice sync) and VibeMate-style settings (PIN stealth, auto-blank, hide recents, bookmark folders, AI-style local search, wellness cards) without pairing toys, recording the screen, auto-tipping, or fingerprint. Hardware toys stay in their vendor apps. PIN is 4–8 local digits stored as a salted hash.
- Repository IP self-attestation: dated inventory of every legal instrument (present / unsigned-template / not-filed / owner-action-required), first-party SPDX on HTML/CSS/scripts/server, copyright-deposit helper (`npm run ip:deposit`, gitignored output), infringement/DMCA pointers, and tests that forbid fake USPTO/Copyright Office/patent/PCI claims. Not a government registration. Focus-session tests use wall-clock-relative timestamps so they do not expire on the record date.
- Gaming/productivity workspace overlays: floating Eidovara windows for Soul chat, HTTPS browsing, and Discord’s own site in a sandboxed guest session (`persist:eidovara-guest` / `persist:eidovara-guest-discord`). Not an official Discord overlay, not game-process injection, no OS-wide hotkeys. Play desk lists confirm-launched apps plus this process’s CPU/memory. Companion chips include `open-chat-overlay`, `open-browse-overlay`, `open-discord-overlay`, and `set-always-on-top`. Ctrl+Shift+O / Ctrl+K open them. Adult Mode closes guest overlays. Assist stays opt-in and does not receive Discord tokens or guest DOM. Workspace CSP is unchanged (`media-src https: eidovara-media:`, never `'self'`). Guest navigations with `javascript:`, `data:`, `blob:`, or `vbscript:` are refused.
- Fluid now-playing bar with expand stage, frameless glass Pop out / Dock (hidden in Adult Mode and before 18+), native HD playback (no default downscale, hardware decode when Chromium GPU is on, HTTP Range seek), quality menu only for real extra renditions, rate/loop/shuffle, sidecar vtt/srt, sleep timer, fullscreen, media keys via Media Session, and Chromium output picker when `setSinkId` exists. Media URLs are applied from parsed `https:` / `eidovara-media:` hrefs in memory, not by copying a quality-menu DOM value onto `player.src`. No Spotify/YouTube embeds, DRM rip, Hi-Res logos, or ffmpeg.
- Desktop automatic updater: after 18+, Eidovara can check GitHub Releases for a newer Windows NSIS installer, verify `latest.yml` SHA-512 via electron-updater, download in the background, and apply only after Restart and install. Authenticode-unsigned. Auto-check can be turned off. Advertised live installer remains v0.19.1 until a newer tagged Setup.exe exists.
- Music, watch, and mood requests surface the local entertainment library (play in Eidovara through `eidovara-media:`, never `media-src 'self'`) plus official YouTube, Spotify, and Internet Archive HTTPS search chips. Eidovara does not scrape those sites’ HTML, rip streams, or inject into Spotify, iTunes, VLC, or Windows Media Player.

## v0.19.1

- Next-layer similar-app desktop chrome on the advertised v0.19.0 kernel (not a cloned launcher or streaming brand): Windows tray stay-running, always-on-top, pin companion dock, Recents (confirm-launched apps, local media titles, opened memories), in-app notice drawer (focus / sleep / backup — not OS toast spam or telemetry), local-media sleep timer for `eidovara-media`, palette calculator and length/mass/temperature conversions (no live FX), and Windows-only open-at-login via Electron `setLoginItemSettings`. No Recall screenshots, DRM rip, VLC/Spotify/iTunes process control, global hotkeys into other apps, lyrics dumps, romantic companion, or live checkout.
- Companion coverage from `main` stays: dock and conversation share one kernel; nav/intents reach dashboard, conversation, apps (confirm-launch + discover), entertainment (mood/favorites/watch/OST/surprise + local media), memory (review/add/forget), identity/Adult Mode, settings (provider/theme/service/updates/backups/customization), help/legal, diagnostics, research (explicit internet only), focus/study/create/gaming checklists, and accessibility. Every named next step ships a working chip. Suggested “what can you do here?” follows the current view. Optional Soul is not faked when setup is off. `/v1/assist` still requires opt-in.
- Research snippet filters drop script/style bodies with a markup scanner instead of HTML-tag regexes (CodeQL `js/bad-html-filtering-regexp`). Display still uses `textContent`. Wholesale merges of in-flight companion-complete / internet-research branches were skipped because they delete the land-all kernel; unique sanitizer tests were ported instead.
- Palette jump list, Dashboard start path, grouped Settings, internet research after an explicit request, and companion coverage stay. Search is not a whole-internet index. Linked apps stay confirm-launch. Assist is not Soul.
- New unsigned Windows installer: `package.json` / Worker health / website-helper version is `0.19.1`. App id stays `com.soulconsciousnessstudios.eidovara`. Tags `v0.18.0`–`v0.19.0` already exist and were not moved.
- Primary public download is `https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/Eidovara-0.19.1-Windows-x64-Setup.exe` (the NSIS `.exe`, about 101.3 MiB, not the source repository). Pinned tag asset: `https://github.com/ProjectSoulbyTmb/project---soul/releases/download/v0.19.1/Eidovara-0.19.1-Windows-x64-Setup.exe`. SHA-256 `72F4D09ADA17593F0391438A5375ABC9351041DA8ABB252E68271B8FDACCA7D8`. Authenticode-unsigned; not Microsoft-certified. GitHub/Sigstore provenance is not Authenticode.
- Official service default stays `https://api.eidovara.org`. No `workers.dev` host is compiled in. CSP still forbids `media-src 'self'`. Music web remains official HTTPS search plus local files.

## v0.19.0

- Beautiful consumer release on the land-all 0.18.3 kernel plus internet research: pin-able Dashboard tiles, local scratchpad, a timed quiet focus bar, kernel-backed palette/search (Ctrl+K / Ctrl+P), companion dock, first-run after 18+, grouped Settings, and official `https://api.eidovara.org`.
- Companion and conversation turns run public web lookup during `engine.respond` after an explicit internet/web/online request — not only the Research panel. Wikipedia/Wikimedia, optional Internet Archive catalog search, optional Premium Brave key (local testing gate, not a live payment unlock), and a bounded HTTPS fetch of a user-provided or result URL (https only, no credentials, redirects refused, size/timeout caps). The assistant reply cites sanitized titles, snippets, and hostnames. Source chips in the companion log confirm, then use `openExternal`. Readable text extracts stay sanitized (`textContent`, never raw `innerHTML`). Honest copy: public lookup after you ask, not a full-internet index. Fail closed on offline/timeout/blocked host; the workspace keeps working. This path does not call `/v1/assist` unless the existing Assist opt-in is already on and the user asked Assist. Assist is not Soul.
- New unsigned Windows installer: `package.json` / Worker health / website-helper version is `0.19.0`. App id stays `com.soulconsciousnessstudios.eidovara`. Tags `v0.18.0`–`v0.18.3` already exist and were not moved.
- Primary public download is `https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/Eidovara-0.19.0-Windows-x64-Setup.exe` (the NSIS `.exe`, about 101.3 MiB, not the source repository). Pinned tag asset: `https://github.com/ProjectSoulbyTmb/project---soul/releases/download/v0.19.0/Eidovara-0.19.0-Windows-x64-Setup.exe`. SHA-256 `F2B0D9BB0A887294CF58A43C75DF67FA422C2120540DE03D5227A9B239D08310`. Authenticode-unsigned; not Microsoft-certified. GitHub/Sigstore provenance is not Authenticode.
- Shared `docs/tokens.css` / renderer tokens honor `prefers-reduced-motion`. Home, Download, and Help advertise v0.19.0. Honest 18+ / unsigned / no-payments / Assist≠Soul remain visible. No neural TTS/VRM/OBS, no payments, no `workers.dev` default, no `media-src 'self'`.

## v0.18.3

- Professional consumer polish on the running desktop app and public site: after 18+, one Dashboard start path (Soul vs Assist), grouped Settings with short help, Ctrl+K jump list, Ctrl+/ cheatsheet, and Ctrl+A still away from text fields. Empty states, errors, and success copy stay plain language. Confirm-to-launch is unchanged. Age 18+, unsigned Windows, and no live payments stay visible without all-caps spam.
- New unsigned Windows installer: `package.json` / Worker health / website-helper version is `0.18.3`. App id stays `com.soulconsciousnessstudios.eidovara`. Tags `v0.18.0`, `v0.18.1`, and `v0.18.2` already exist and were not moved.
- Primary public download is `https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/Eidovara-0.18.3-Windows-x64-Setup.exe` (the NSIS `.exe`, about 101.3 MiB, not the source repository). Pinned tag asset: `https://github.com/ProjectSoulbyTmb/project---soul/releases/download/v0.18.3/Eidovara-0.18.3-Windows-x64-Setup.exe`. SHA-256 `4C6D9FA2B0CB4667C1B6580551632618DEB12B5CF5947457474BAEC0DFA7740E`. Authenticode-unsigned; not Microsoft-certified. GitHub/Sigstore provenance is not Authenticode.
- Restore `publicServiceUrl` in the Electron main process (it was dropped when the Soul kernel was wired, which broke Connect / launch / Test service) and keep `SoulEngine` imported from `../core/engine.js`.
- Desktop Settings → Eidovara service defaults to the official custom hostname `https://api.eidovara.org` (HTTPS base only, no path). Empty/default still resolves there; paste another HTTPS base to override. No `workers.dev` host is compiled in. Conversations are not sent. Fetch failure stays local-first.
- First-party IP notices: LICENSE/EULA close relicensing-as-OSS and contributor-mark loopholes; SPDX `LicenseRef-Eidovara-Source-Available-1.0` on LICENSE and first-party `src/**/*.js` / `docs/*.js`; Soul Consciousness Studios stays the intended publisher only; assignment files remain unsigned templates. No ®, patent, or Copyright Office registration is claimed.
- Consumer workspace layers on the in-app Soul kernel (not a cloned launcher brand): Ctrl+K / Ctrl+P command palette, unified local search (linked apps, memories, settings labels, product intents), pin/reorder dashboard tiles, a real timed focus session with remaining time and a quiet UI, an on-device scratchpad that can capture into Memory, and a Ctrl+/ keyboard cheatsheet. Search is not a background crawler and does not inject into other processes. Focus does not kill or overlay other apps. Linked apps stay confirm-launch. `/v1/assist` stays opt-in and is not used by these layers. OS `speechSynthesis` and CSS/canvas presence are unchanged. 18+ gates unchanged.
- In-app Soul kernel (session kernel; first-party software; not a third-party branded product; not consciousness): after 18+ and profile load, an always-on session routes workspace intents (apps, media, research, help, settings, accessibility), keeps a local self-model JSON, and exposes a feature-module registry (`register({ id, title, enabled, commands, ui? })`). Built-in modules include workspace surfaces plus focus, study, creative desk, gaming prep, memory keeper, talk-through, companion presence, identity/consent, and custom quick actions. Adding a module is appending a descriptor in `src/core/modules.js`. Third-party film and assistant brands are not product or feature names; see TRADEMARKS.md.
- Customization registry persists module toggles, custom quick actions, OS `speechSynthesis` voice URI/rate/pitch/mute, companion presence look, and local phrasing knobs. Voices are whatever Windows/OS has installed; Eidovara does not ship a neural TTS engine. Speech recognition is optional Chromium `SpeechRecognition` with a permission/error line. Companion presence is CSS/canvas/ambient or a local image via `eidovara-media:` (CSP `img-src` includes that scheme; `media-src` is unchanged). Looks are not alive and are not VRM/MakeHuman.
- Soul online stays opt-in and fail-closed: the official default is `https://api.eidovara.org` (overridable in the same Settings field) **and** enable **Allow one-shot Worker helper** (default off). Connect still uses `GET /v1/health` (fallback `/health`), `/v1/config`, `/v1/status`. Optional `POST /v1/assist` sends only the typed query (~32 KiB), never conversations by default. Assist is not Soul; the Worker is the operator’s, not a cloud mind. Offline kernel remains source of truth.
- Persistent companion dock after 18+: heartbeat, presence, module chips, custom actions, a local Ask Soul composer, and hold-to-talk on Windows `SpeechRecognition`. Ctrl+/ opens the keyboard cheatsheet; Ctrl+K jumps (including Ask Soul). Phrasing knobs change local wording only at high values and never claim sentience. Avatar click opens the companion instead of hiding it. Dashboard composer can ask the Worker helper for one send when opt-in is on. Looks include ribbon/hidden plus CSS/canvas/local image; not VRM/MakeHuman.
- Desktop no longer constructs a Soul profile before the in-app 18+ gate; `soul:openExternal` is age-gated; Wikipedia/Wikimedia result URLs must match wiki/wikimedia hostnames.
- Official consumer hostname is `https://eidovara.org` (Cloudflare Pages project `eidovara` from `docs/`). GitHub Pages github.io remains the same `docs/` from `main`. Home and Status funnel installer clicks through the Download 18+ checkbox. Nested 404s use `<base href="https://eidovara.org/">`. Retired `/download/windows` redirects to the Download 18+ page.
- Marketing site lists installer size (~101.3 MiB), pinned `v0.18.3` asset URL, and the published SHA-256 on public pages. FAQ no longer skips the 18+ gate with a raw `.exe` href.

## v0.18.2

- New unsigned Windows installer: `package.json` / Worker health / website-helper version is `0.18.2`. App id stays `com.soulconsciousnessstudios.eidovara`. Tags `v0.18.0` and `v0.18.1` already exist and were not moved.
- Primary public download is `https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/Eidovara-0.18.2-Windows-x64-Setup.exe` (the NSIS `.exe`, about 101.3 MiB, not the source repository). Pinned tag asset: `https://github.com/ProjectSoulbyTmb/project---soul/releases/download/v0.18.2/Eidovara-0.18.2-Windows-x64-Setup.exe`. SHA-256 `EF228574DCDF34B8A9039654F2B762FAB6D289CCA9A94B2ECCF048AE971FE711`. Secondary repo link remains. Authenticode-unsigned; not Microsoft-certified. GitHub/Sigstore provenance is not Authenticode.
- Includes the v0.18.1 proof/fix and download-CTA work already on `main`: CLI 18+ gate before profile create, service/provider query-string strip, helper HTTPS-only links, official Setup.exe CTAs.

## v0.18.1

- Public download CTAs (Download page after 18+, Home, README, FAQ/Help, Ask Eidovara) point at the official unsigned Windows installer `Eidovara-0.18.1-Windows-x64-Setup.exe`, not the GitHub source tree. Authenticode-unsigned; not Microsoft-certified.
- Windows installer rebuild after PR #10 (`cursor/engine-product-surface-c180`) merged to `main`. Tag `v0.18.0` already pointed at older `main` and was not moved. `package.json` / Worker / website-helper version is `0.18.1`. App id stays `com.soulconsciousnessstudios.eidovara`.
- GitHub Pages `docs/` from `main` is the live site. Operator snapshot: `LIVE.md`. Payments stay fail-closed. No Authenticode claim. No `workers.dev` host in app or public JS.

## v0.18.0

- Untrusted Wikipedia/Brave result URLs and stored website/store URLs are parsed with `URL` (`https:` and no credentials) instead of an `https://` prefix check. Website helper `/v1/assist` fetch uses `redirect: 'error'` and a 32 KiB JSON bound, matching desktop service GET. Worker `/health` `/v1/config` `/v1/status` now also advertise `checkoutEnabled: false` and `conversationsStored: false`. Payments stay off.
- Live + compatibility: desktop Connect / launch / Ctrl+A Test service uses GET `/health` `/v1/config` `/v1/status` (HTTPS except loopback; path strip includes `/v1/assist`); Ask Eidovara stays on `docs/knowledge.js` with optional pasted POST `/v1/assist`; Status fail-closed without a URL. Worker `/v1/config` matches the same fail-closed JSON (`paymentsEnabled` false, 18+, unsigned Windows, `localFirst`, no conversations). GitHub Pages still publishes `docs/` from `main` only — live github.io stays the older homepage until PR #10 merges. Paste-base still required; no `workers.dev` host is compiled into the app or public JS.
- Network, security, and licensing inventory now matches current egress: Wikipedia/Wikimedia after an explicit research request, pasted HTTPS providers, Premium Brave, GitHub update checks, optional Worker `/health` `/v1/config` `/v1/status` `/v1/assist`, and Spotify/YouTube HTTPS search links. Payments stay fail-closed. Neural TTS, VRM, OBS control, and live checkout remain document-only. No `workers.dev` default; app CSP still forbids `media-src 'self'`.

- First-party IP ownership: OWNERSHIP.md honest limits; unsigned contributor and entity assignment templates; LICENSE/EULA/NOTICE/TERMS reserve qualifying original Eidovara expression to Tyler Michael Bosworth without claiming Electron, Chromium, Node.js, Windows, Wikimedia, or user content; marks stay unregistered ™; no fake copyright-office, USPTO, or patent claims. Source-available evaluation license unchanged (not MIT/Apache/GPL). GitHub PRs remain unaccepted until a privately executed written agreement.
- Public site: Home, Product, Download (18+ gate), Assist, Help/FAQ, Status, Legal hub, 404, sticky/mobile nav, and Ask Eidovara (client-side knowledge pack; optional Worker `GET`/`POST /v1/assist`). CSP is `script-src 'self'` with no `unsafe-inline`/`unsafe-eval`. No `workers.dev` default. Payments stay off. GitHub Pages still serves `main` until this PR is merged; Dependency review needs an owner click to enable Dependency graph; Worker drift is fixed with `npx wrangler deploy`.
- Honest cannot-ship remains documented, not faked: live payments, Authenticode, official Linux/macOS, neural TTS/VRM/OBS, consciousness.
- Public online path: the GitHub Pages homepage now explains visit → unsigned Windows download (or build from source) → local desktop app; optional Worker is `/health`, `/v1/config`, `/v1/status`, and website-helper `/v1/assist`. Owner runbook covers Pages, Releases, wrangler, and an optional custom domain. `Release Windows` accepts `workflow_dispatch` for unsigned artifacts and still publishes only on `v*` tags. No Authenticode, no live checkout, no `workers.dev` default in the app.
- Quality pass: Wikipedia citations keep search rank and canonical HTTPS URLs; forget no longer wipes every memory on an empty or one-character phrase; safety replies stay in front of overlapping consent commands; CLI `--message` reports empty-input errors; pasted provider URLs are validated at save; Free can clear a leftover Brave key; Ctrl+A no longer steals select-all from text fields; the 18+ overlay inert-blocks the workspace and refreshes backups after accept.
- Desktop app can attach to the official online Eidovara service (`GET /health`, `/v1/config`, `/v1/status`) from Settings after the 18+ gate. The URL is a persisted user setting (HTTPS except loopback), not a baked-in `workers.dev` host. Fetch failure stays offline-OK; Offline Soul and the workspace keep working. `paymentsEnabled` stays off even if a future config lied. Conversations are not sent to the Worker.
- Tightens legal app-usage copy and gates for the Windows-first Stable Alpha: TERMS.md, AGE.md, PRIVACY.md, website terms/privacy/age pages, installer EULA, Worker `/v1/config`, and an in-app Legal overlay. Source-available (not OSI open source); 18+ confirmation is required before desktop IPC and CLI product commands; Adult Mode remains a triple gate with revocable consent. No live payments, no Authenticode claim, no Apple/iOS product identity, no bundled neural TTS/VRM/MakeHuman/OBS websocket.
- Applies a system-inspired visual pass to the website and desktop renderer: shared design tokens, large titles, grouped inset cards, system light/dark materials, and restrained system-blue controls. Not an Apple product and not an iOS/iPhone app; uses the system font stack rather than licensed SF Pro files.
- Added gated, local-only body-shape controls and optional non-photorealistic presentation for Soul's explicitly fictional adult avatar; settings remain unavailable unless legal-adult status, Adult Soul, and current consent are active.

- Adds consolidated release legal notices and displays the source-available license during Windows installation.
- Presents the age-of-majority warning only when Adult Soul is accessed, while keeping enablement and consent separate.
- Clarifies minor restrictions, professional-advice limits, mandatory consumer rights, payment status, media rights, and third-party boundaries.
- Adds persisted English, Spanish, French, and German interface foundations and assistant-language preferences with English fallback.
- Makes the desktop workspace usable offline: Soul answers setup roles, dashboard starters, entertainment mixes, study/stream checklists, and Windows launcher help instead of a generic listener.
- Plays user-selected local audio/video through a gated `eidovara-media://` protocol (`media-src https: eidovara-media:`), without opening `'self'` media or persisting local paths in taste records.
- Requires an explicit internet/web/online request before Wikipedia/Wikimedia research; mood mix, apps, gaming, study, and stream intents stay local.
- Awaits CLI replies, skips empty lines, and adds `--message`, `--help`, and `npm run cli`.
- Preserves assistant language/tone/accessibility when the behavior form omits them; Free edition no longer re-applies a stored Brave search key.
- Confirms application launch in the Windows dialog before `shell.openPath`; media playback honors the advertised `confirm` capability except after a local file picker.
- Normalizes local Ollama `/api/chat` and Premium OpenAI-compatible `/chat/completions` URLs so pasted chat paths are not doubled; HTTPS is required except loopback (including `[::1]`).
- Disables RGB, Brave key, and remote-endpoint controls in the Free UI; documents Node 22.12+ for Electron 43 and the advertised `NETWORK-USAGE.md` path.
- Documents Ctrl+A paste of the Cloudflare Worker base URL; Test service hits `/health`. The app does not hard-code `workers.dev`.

## v0.17.12

- Encrypts desktop settings, profiles, conversations, memories, rollback copies, and new backups with operating-system credential protection when available.
- Migrates existing plaintext desktop storage in place without discarding user data.
- Restricts update packages to the official Project Soul GitHub release channel in addition to HTTPS and SHA-256 verification.
- Adds Windows internet-zone marking and a silent Microsoft Defender scan attempt for downloaded updates without requiring Defender to be installed.
- Adds persistence, migration, backup-encryption, and untrusted-update regression tests.

## v0.17.11

- Added distinct black, white, and red application and studio emblems with transparent masters and a multi-resolution Windows icon.
- Integrated the Eidovara icon into the executable, window, installer, uninstaller, website, and favicon.
- Added CODEOWNERS, Dependabot, CodeQL, brand-use controls, and cryptographic asset provenance records.

## v0.17.10

- Disabled electron-builder's implicit tag publisher so the dedicated GitHub Release step can publish the completed installer.

## v0.17.9

- Corrected the installer-only GitHub Actions build invocation after the v0.17.8 packaging job failed.

## v0.17.8

- Changed official GitHub releases from an extractable ready-folder ZIP to a standard Windows setup installer.
- Made the updater manifest target the versioned installer `.exe` directly.
- Kept checksum, SBOM, privacy, signing-status, and provenance evidence alongside the installer.

## v0.17.7

- Tightened copyright claim boundaries around qualifying original expression, ideas, systems, methods, facts, and third-party material.
- Added a documented trademark-clearance log and commercial-launch legal gate.
- Expanded child/privacy, subscription, platform-integration, and third-party runtime notices.
- Updated the public terms, privacy, and licensing pages with accurate unregistered-mark and pre-sale disclosures.

## v0.17.6

- Removed the public hard-coded administrator credential.
- Added first-run, per-installation administrator password enrollment with a random salt and scrypt hash.
- Clarified that the local Premium edition selector is an owner testing override, not payment authorization.

## v0.17.5

- Fixed the Entertainment navigation title and enforced the user's disabled media-playback preference at every player entry point.
- Rebuilt the public homepage around Eidovara's modular workspace instead of presenting the assistant as the sole product focus.

## v0.17.4

- Made low-overhead gaming mode actually disable Eidovara animations, transitions, transparency effects, decorative shadows, and active speech.
- Added runtime diagnostics for modern video/audio codecs, HDR and wide-color display queries, fullscreen, picture-in-picture, Web Audio, Media Session, and gamepads.
- Added explicit single-file local audio/video selection without granting general filesystem access or persisting local paths in entertainment taste records.
- Documented gaming/media capability ownership and avoided unsupported FPS, latency, HDR, codec, anti-cheat, or universal compatibility claims.

## v0.17.3

- Bounded adaptive-memory and provider-context surfaces and rejected empty or oversized memory records.
- Added a one-megabyte update-manifest limit before JSON parsing.
- Added continuous smoke and dependency-license inventory checks to security automation.
- Added reviewed maintenance, chain-of-title, and Windows compatibility policies.
- Clarified contribution ownership, public-hosting rights, third-party application terms, and the limits of universal compatibility claims.
- Added local, bounded Windows Start Menu application discovery with explicit user selection and no process injection.
- Repositioned Eidovara as a modular Windows workspace with Soul as an optional assistant layer rather than the sole product focus.

## v0.17.2

- Added a persistent entertainment taste engine for plays, skips, completions, favorites, and better similar-media prompts.
- Added a dedicated Entertainment workspace for mood mixes, favorites, recent media, and lawful platform handoffs.
- Deepened Soul's original emotional-attunement and wisdom framework while explicitly preventing dependency, false emotion claims, or third-party character imitation.

## v0.17.1

- Refined the consumer presentation around working capabilities and removed speculative product claims.
- Added the official responsive website and in-app privacy, security, and licensing links.
- Added hardened repository/server operations and release verification.

## v0.17.0

- Renamed the application to the preliminarily screened coined mark Eidovara™ and identified Soul Consciousness Studios™ as Tyler Michael Bosworth's intended business name.
- Preserved Soul as the assistant personality while separating its identity from the product and publisher names.
- Hardened provider context against persistent-memory prompt injection and stopped local OBS endpoints from entering remote model context.
- Added a hideable 2D/3D-styled Soul companion, reduced-motion controls, installed Windows voice selection, optional reply narration, speech preview, and gracefully detected dictation.
- Clarified that OBS is an optional stream helper, not a core application dependency.
- Added a license-screened companion/voice adapter roadmap, Dependabot coverage, recurring Windows security checks, private-key scanning, and stricter public-repository exclusions.
- Rebuilt the official website as a responsive product and trust center, with dedicated security and licensing pages linked directly from application Settings.
- Added Electron permission-check and webview-attachment denial alongside existing sandbox, isolation, navigation, and permission-request controls.
- Added restrictive website content-security policies, responsible disclosure metadata, company-formation guidance, and clearer pre-formation IP ownership language.
- Updated package identifiers, artifacts, release evidence, website, updater, documentation, and platform names for Eidovara.

## v0.16.1

- Added a dependency-free Cloudflare Worker template for HTTPS health and hosted-checkout configuration.
- Added private service URL management and bounded service health checks to the administrator panel.
- Added Stripe, PayPal, and Gumroad hosted-checkout guidance without collecting card data in Soul.
- Added payment/site operations, responsible security reporting, and static-host security-header templates.
- Expanded Windows GPU feature and Web Audio diagnostics without unsafe driver injection.
- Added fail-closed server tests and retained ASAR integrity packaging.

## v0.16.0

- Renamed the product to Eidovara and added creator, licensing, trademark, contribution, and provenance controls.
- Hardened renderer permissions, provider/network response limits, redirect handling, atomic recovery, and application identifiers.
- Added a responsive tailored dashboard with role, focus, style, memory, app, and privacy summaries plus quick workflows.
- Added persistent response length, tone, focus, accessibility, web research, media playback, memory learning, reflection, and autonomy controls.
- Kept application launching confirmation-only and enforced disabled research and learning policies in the core engine.

## v0.15.8

- Rebuilt the complete current Project Soul source as a conventional Windows setup application and portable executable.
- Retained the reproducible ready-folder release as the online fallback for systems where an unsigned installer is blocked.

## v0.15.7

- Added configurable user-led, balanced, and proactive assistant autonomy with persistent reflection and initiative controls.
- Clarified Soul's continuity as a persistent software self-model rather than a claim of sentience.
- Added explicit lawfulness, safety, consent, privacy, honesty, fairness, and user-autonomy reasoning guidance.
- Replaced fragile hosted Wine/installer packaging with a reproducible Windows ready-folder ZIP release and added SHA-256-verified ZIP updater support.

## v0.15.6

- Added a customizable Apps & Gaming Hub for safely selecting, organizing, launching, and removing trusted Windows executables and shortcuts.
- Added persistent background, panel, accent, surface-opacity, and animated RGB appearance controls.
- Added a low-overhead gaming mode that disables decorative animation and backdrop effects while playing.
- Added GPU, Chromium, hardware-acceleration, and media-engine details to local diagnostics.

## v0.15.1

- Added the GitHub Releases online updater and corrected automated release-channel injection.

## v0.15.2

- Added GitHub/Sigstore build-provenance certificates, SHA-256 checksum publication, SPDX SBOM generation, and explicit Authenticode status disclosure.

## v0.15.3

- Added build-attested privacy and network-usage declarations and removed the clean-runner ASAR signing-helper dependency.
- Added a first-launch and reusable assistant setup wizard with gaming/editing, streaming/OBS, studying, personal, creative, productivity, and custom-needs profiles.

## v0.15.4

- Disabled unavailable Authenticode identity discovery on clean CI runners while retaining signed GitHub/Sigstore release provenance.

## v0.15.5

- Moved automated Windows packaging to a reproducible Wine build container to avoid unavailable hosted-runner signing helpers.

- Released the online Windows Alpha build from the verified v0.14.0 baseline.
- Added installer, portable, and ready-to-run folder distributions for Windows x64.
- Added explicit-request internet research with cited information, image previews, and video playback from allowlisted public sources.
- Added optional credential-protected broad web and image search while retaining no-key fallback sources.
- Added pre-provider lawful-use enforcement and local safety incident auditing while preserving gated lawful consensual adult content.
- Added a persistent audio/video media dock with queues, transport controls, seeking, volume, fullscreen video, and automatic advancement.
- Added DJ favorites, similar-track discovery, continuous queues, and Spotify/YouTube handoff controls.

## v0.14.0

- Rebuilt the application around a conversation-first desktop GUI.
- Added persistent multi-conversation history and migration from the v0.13 profile shape.
- Added offline fallback plus generic local and compatible HTTPS provider adapters without product-specific dependencies.
- Provider failures now fall back locally without crashing or losing the conversation turn.
- Added provider settings UI and OS-protected API-key storage through Electron safeStorage when available.
- Hardened renderer isolation, sandboxing, CSP, navigation blocking, input size validation, crash logging, atomic profile writes, and corrupt-profile recovery.
- Preserved persistent memory, protected identity, adaptive personality, relationship initiative, criticism processing, growth reflection, boundaries, Adult Soul gating, scoped consent, and immediate consent revocation.
- Added end-user Windows, macOS, and Linux bootstrap packages that do not require Node.js or npm.
- Added validated, timestamped profile backup creation, listing, and restore controls.
- Reconciled all product surfaces and build metadata to v0.14.0.
