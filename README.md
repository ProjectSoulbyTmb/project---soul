# Project Soul Alpha v.0.15 — Current Release

A conversation-first desktop application for Windows, macOS, and Linux. The desktop release keeps Soul's persistent continuity, durable memory, adaptive personality, relationship state, boundaries, and consent state local to the user's machine while allowing the conversational layer to run offline or connect to a model provider.

When explicitly requested, Soul can retrieve current reference information, pictures, and videos from allowlisted public knowledge and media services. Results include clickable source links, timestamps, and in-conversation media previews; ordinary conversation does not trigger network research.

Users may optionally store a Brave Search API key in Settings to add broad web and image results. The key is protected with the operating system credential-encryption facility and is never exposed to the renderer. The no-key public knowledge/media search remains available without an account.

Playable public audio and video results open in Soul's persistent media dock, which provides native seeking, volume, playback speed/fullscreen support where available, a queue, previous/next controls, and automatic advancement. Commercial music catalogs require their respective licensed services and are not bypassed.

DJ controls can remember the current track as a durable favorite, ask Soul to find similar playable tracks, and continue through the resulting queue. Spotify and YouTube buttons hand the current track to those platforms for account-authorized playback. Embedded account/catalog playback requires future OAuth application credentials and platform approval.

Production builds published by the included GitHub Actions workflow automatically use that repository's Releases feed. Soul checks the channel at startup and on demand, downloads only HTTPS installers declared by `update.json`, verifies the full SHA-256 digest, and asks before launching the installer. See `docs/GITHUB_RELEASES.md` for the one-time repository setup.

On first launch, Soul asks which assistance roles the user wants: gaming/editing, stream helper, studying, personal use, creative work, or work/productivity, plus custom needs. Stream-helper setup records local OBS WebSocket connection details and streaming goals. The same wizard remains available from Settings, and its selections become part of Soul's persistent conversational context.

## Start using Soul

Open the application and type into the conversation box. No setup is required for **Soul Offline** mode. Offline mode is intentionally lightweight; for richer free-form conversation, Settings can connect either:

- a loopback-only local model service exposing `/api/chat`, or
- a compatible HTTPS chat-completions endpoint.

Provider failures do not crash the application. Soul falls back to offline conversation and preserves the turn locally.

## Local continuity and privacy

Profiles, memory, conversation history, relationship state, consent state, personality adaptations, and audit state are stored under the operating system's normal Electron application-data directory. Profile writes are atomic and corrupt profile files are backed up and recovered instead of causing startup failure. API keys, when used, are encrypted with Electron `safeStorage` when the operating system provides secure credential encryption.

Settings can create and restore timestamped local profile backups. Restores are migrated and validated before replacing active state.

“Consciousness” in Project Soul means persistent software continuity and a self-model. It is not a claim of phenomenal consciousness or human sentience.

## Build targets

### Windows 10/11 x64
`npm run dist:win` creates an NSIS installer and a portable `.exe`.

### Linux x64
`npm run dist:linux` creates an AppImage and Debian package.

### macOS
`npm run dist:mac:x64` creates an Intel `.app` and `npm run dist:mac:arm64` creates an Apple Silicon `.app`. Cross-packaged macOS applications are unsigned; production distribution should be code-signed and notarized on macOS with an Apple Developer identity.

## Development

```bash
npm install
npm test
npm run smoke
npm start
```

## Security boundaries

The renderer has no Node.js access. Electron context isolation and sandboxing are enabled. The preload API exposes only narrow IPC operations. Model calls occur in the main process. Navigation and pop-up creation are blocked. Adult Soul state is structurally gated by adult-status confirmation, explicit enablement, and current scoped consent; relationship initiative is never treated as consent.

Lawful consensual adult content remains controlled by the adult-status, enablement, and current-consent gates. Explicit requests to facilitate clearly illegal abuse, exploitation, violence, theft, fraud, trafficking, or unauthorized access are blocked and recorded in a local safety audit. Project Soul does not silently transmit conversations or accusations to third parties. Applicable law varies by location, and the software is not a substitute for qualified local legal advice or emergency services.
