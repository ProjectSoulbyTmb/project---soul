# Network usage

This is the advertised path linked from README, PRIVACY.md, and LEGAL_NOTICES.md. The same inventory is maintained at [docs/NETWORK_USAGE.md](docs/NETWORK_USAGE.md).

This self-declared network inventory is included in signed release provenance.

## Current egress (v0.19.1)

Network access is user-directed except the official GitHub update-manifest check. No `workers.dev` host is compiled into the Electron app or the public site. The official Eidovara service default is `https://api.eidovara.org` (overridable). Payments stay **fail-closed**: `paymentsEnabled` and `checkoutEnabled` remain false even if a remote `/v1/config` payload claims otherwise.

| Destination | Trigger | Data sent |
| --- | --- | --- |
| `en.wikipedia.org` | Explicit internet/web/online research request from the companion, conversation, or Research panel | Search terms, IP address, application user agent |
| `commons.wikimedia.org` and `upload.wikimedia.org` | Explicit image/audio/video request or playback | Search terms or media URL request, IP address, application user agent |
| `archive.org` | Explicit internet/web/online research request (public catalog search, not a crawl of the whole internet) | Search terms, IP address, application user agent |
| User-provided or result HTTPS page | Explicit research request that includes an HTTPS URL, or a bounded readable extract of a result URL | URL request, IP address, application user agent. No credentials. Redirects refused. |
| `api.search.brave.com` | Explicit web/image request when a Premium Brave Search key is configured (local testing gate, not a live payment unlock) | Search terms, API credential, IP address |
| User-configured local model (`127.0.0.1` / `localhost` / `::1`, typically Ollama `/api/chat`) | User sends a conversation while Local is selected | Conversation context and selected model on loopback |
| User-configured Premium HTTPS `/chat/completions` endpoint | User sends a conversation while Compatible is selected | Conversation context, selected model, credential when required |
| Configured Eidovara service `GET /v1/health` (fallback `GET /health`), `GET /v1/config`, `GET /v1/status` | After 18+ confirmation: launch retry, Settings **Connect**, or Ctrl+A **Test service**. Default base `https://api.eidovara.org`; paste another HTTPS base to override | No conversations or payment data; health/config/status JSON only |
| Optional website helper `GET`/`POST /v1/assist` | Visitor pastes an HTTPS Worker base on the public site (Status / Assist); knowledge-pack questions only | The typed question and mode. Desktop conversation history is refused. Transcripts are not stored. |
| Optional desktop `POST /v1/assist` | After 18+: pasted HTTPS base in Settings **and** Soul-online opt-in **and** the per-message send checkbox (all default off) | A single typed question and mode. Conversation history is never sent. Assist is not Soul. Transcripts are not stored. |
| Optional desktop helper `POST /v1/assist` | User pastes a Worker HTTPS base **and** enables **Allow one-shot Worker helper** (default off), then checks **Ask the Worker helper** on one send | The typed query only (about 32 KiB bound). Conversations, memories, and chat history stay local. Transcripts are not stored. |
| `github.com/ProjectSoulbyTmb/project---soul` | Startup/manual update check; user-approved update download | App version through user agent, IP address; installer request |
| Spotify, YouTube, or Netflix web service | User clicks the respective media button or an explicit catalog URL | Current track search text or the official page URL, IP address, platform cookies/account state |
| User-initiated public HTTPS audio/video file | Entertainment Online field, explicit “play this https …” after **Online media** is enabled, or Play on a Wikimedia/Archive **file** URL | URL request, IP address, application user agent. No cookies. Redirects capped. Streamed through `eidovara-online:`. |

No general background crawler, telemetry service, advertising endpoint, or automatic external safety-reporting endpoint is present. Empty/default Settings → Eidovara service resolves to `https://api.eidovara.org`. If the service is unreachable, Offline Soul continues locally. Store URLs on `/v1/config` stay empty in v0.19.1; the app never enables live checkout from a remote flag.

## Enhancement-allowed vs blocked

Documentation may describe the implemented surfaces above. It must not enable new live capabilities.

**Allowed to document and keep using (already implemented):**

- Explicit Wikipedia/Wikimedia research
- Internet Archive catalog search after an explicit internet/web/online request
- Bounded HTTPS page fetch (user-provided or result URL) after that same explicit request
- User-pasted HTTPS (or loopback) model providers
- Premium Brave Search with a user-supplied key
- Official GitHub update checks and user-approved downloads
- Optional Worker `GET /v1/health` (and `GET /health`), `/v1/config`, `/v1/status` against `https://api.eidovara.org` by default (overridable)
- Optional website `GET`/`POST /v1/assist` after a pasted HTTPS base
- Optional desktop `POST /v1/assist` after a pasted HTTPS base, Soul-online opt-in, and a per-message send checkbox (default off; Assist is not Soul)
- Optional desktop `POST /v1/assist` only after pasted HTTPS base **and** explicit helper opt-in (default off); conversations are not sent
- Spotify/YouTube/Netflix official HTTPS search or catalog links (no stream ripping)
- User-initiated public HTTPS media files after Online media is enabled, gated in the main process and streamed on `eidovara-online:`
- Fail-closed payments (`paymentsEnabled: false`)
- Sandboxed renderer, 18+ gates, source-available evaluation license, Authenticode-unsigned disclosure

**Blocked in v0.19.1 (screening records only — do not enable):**

- Bundled neural TTS (Kokoro, Piper, sherpa-onnx) or cloud voice credentials
- VRM / MakeHuman character engines or imported anatomical models
- Direct OBS websocket control
- Live payments, card collection, webhook entitlement, or PCI processing
- Weakening the renderer sandbox, 18+ gates, or `.github/workflows/dependency-review.yml`
- App CSP `media-src 'self'` (local media stays on `eidovara-media:`; remote play uses `eidovara-online:` after a main-process gate — do not put `https:` in renderer `media-src`)
- youtube-dl, yt-dlp, Invidious, Piped, googlevideo progressive URLs, Spotify Web Playback SDK, Widevine CDM hacks, iframe embeds, or CDN hls.js/Shaka
- Fake registered-mark, patent, or PCI-DSS claims
- A hardcoded `workers.dev` Worker URL in the desktop app or public site
