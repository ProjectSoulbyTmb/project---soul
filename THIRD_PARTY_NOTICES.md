# Third-party notices

Copyright in qualifying original first-party Eidovara expression is claimed by Soul Consciousness Studios. That claim does **not** extend to third-party software.

Eidovara 1.0.0 is packaged with Electron 43.4.1 (MIT) and its Chromium/Node.js runtime components under their respective licenses. The Windows distribution includes `LICENSE.electron.txt` and `LICENSES.chromium.html`; these files must remain with redistributed copies. Electron's build-time packaging tools are not represented as first-party code. The in-app updater uses `electron-updater` 6.8.9 (MIT) against official GitHub Releases metadata. Node.js, Electron, Chromium, electron-builder, electron-updater, and platform services retain their owners' copyrights, licenses, and trademarks. Soul Consciousness Studios and Soul Consciousness Studios do not own Electron, Chromium, Node.js, Microsoft Windows, or Wikipedia/Wikimedia content.

The MIT-licensed `rcedit` build tool is used only during Windows packaging to apply the approved icon to the executable. It is a development dependency and is not exposed as an application capability.

References or links to Windows, DirectX, NVIDIA, OBS, Spotify, YouTube, GitHub, Cloudflare, Stripe, PayPal, Gumroad, Brave Search, Wikimedia, Apple, or other services describe compatibility or optional user-directed integrations. They do not imply sponsorship, endorsement, partnership, certification, or transfer of trademark rights. Eidovara is not an iOS, iPhone, or Apple product. Eidovara, Soul, and the Soul kernel are not Jarvis, Iron Man, Marvel, Disney, Siri, Alexa, Copilot, ChatGPT, Claude, Raycast, Alfred, Spotlight, Clippy, Replika, Character.AI, Xbox, or Game Bar. See TRADEMARKS.md.

Optional runtime destinations (not redistributed in the installer) include Wikipedia/Wikimedia APIs, user-pasted HTTPS `/chat/completions` or loopback Ollama `/api/chat` providers, Premium Brave Search when a user supplies a key, GitHub Releases for update checks, an optional Cloudflare Worker for `/health`, `/v1/health`, `/v1/config`, `/v1/status`, website-helper `/v1/assist`, and desktop `/v1/assist` only after helper opt-in (fail-closed, no conversation history), and official Spotify/YouTube HTTPS search pages. Those services stay under their owners' terms. See NETWORK-USAGE.md.

Speech output uses voices already installed on Windows. Neural TTS packs, VRM, MakeHuman, and OBS websocket clients are not redistributed or enabled in v1.0.0; they remain documented future adapters only. Live payments stay fail-closed. YouTube and Spotify controls open official HTTPS searches and do not download protected streams.

Eidovara does not redistribute commercial media catalogs or bypass platform access controls. Users and distributors must comply with third-party licenses, API terms, media rights, and service policies.

