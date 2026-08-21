# Eidovara privacy notice

Last updated: August 21, 2026

This notice describes Eidovara v0.19.1 Stable Alpha (Windows 10/11 x64). It is a self-declared product notice, **not** an independent audit, ISO certification, or guarantee of compliance for every deployment. Eidovara is restricted to users age 18 or older and does not intentionally collect minors' personal information. Local age confirmation is not independent age or identity verification. See [AGE.md](AGE.md) and [NETWORK-USAGE.md](NETWORK-USAGE.md).

## Local-first: what stays on the machine

By default, Eidovara stores the following in the Windows application-data directory (CLI: the chosen `--data-dir` or `~/.project-soul`):

- profiles, conversations, memories, preferences, and assistant-behavior settings;
- local safety-audit records;
- linked-application shortcuts, entertainment taste (without local file paths);
- Adult Mode / consent state and the 18+ confirmation flag;
- encrypted settings, credentials, and backups when Windows credential protection is available;
- the per-installation administrator password **hash** (not the password).

Official Windows builds protect this data at rest with the current Windows user's operating-system credential encryption when available. That protects data at rest; it does not protect against malware or another process already running as that user. Credentials are encrypted separately and are not exposed to the renderer. Protected backups may be bound to the same Windows account.

There are **no** owner-operated user accounts, telemetry SDKs, advertising identifiers, analytics, cloud memory, or automatic conversation reporting.

## What can leave the machine

Network access is user-directed except for the official update-manifest check:

| Leaves the device | When | What is sent |
| --- | --- | --- |
| Wikipedia / Wikimedia | Explicit internet, web, or online research request from the companion, conversation, or Research panel | Search terms, IP address, application user agent |
| Internet Archive | Explicit internet/web/online research request | Search terms, IP address, application user agent |
| User-provided or result HTTPS page | Explicit research that includes an HTTPS URL, or a bounded in-app text extract | URL request, IP address, application user agent. No credentials. Redirects refused. |
| Brave Search (Premium test gate) | Explicit research **and** a user-supplied key while Premium testing is on. Not a live payment unlock. | Search terms, API credential, IP address |
| User-pasted local model endpoint (loopback) | You send a chat while Local is selected | Conversation context and model name on loopback |
| User-pasted HTTPS `/chat/completions` endpoint | You send a chat while Compatible/Premium is selected | Conversation context, model name, credential if you stored one |
| GitHub official release channel | After 18+: automatic or manual update check (Settings can disable auto-check); user-approved installer download | App version via user agent, IP address; installer bytes after checksum verification. Builds are Authenticode-unsigned. |
| Spotify, YouTube, or Internet Archive HTTPS search | You click a media-dock button or an official search chip (constructed search URLs; Eidovara does not fetch those sites’ HTML) | Search terms; the destination site may set its own cookies |
| Optional Eidovara service `/v1/health` (fallback `/health`), `/v1/config`, `/v1/status` | After 18+ confirmation: launch check, Settings **Connect**, or local admin **Test service**. Default base is `https://api.eidovara.org`; paste another HTTPS base to override | No conversations or payment data; health/config/status JSON only |
| Optional website helper `/v1/assist` | You paste an HTTPS Worker base on the public site | The typed question and mode. Desktop conversation history is refused. Transcripts are not stored. |
| Optional desktop helper `/v1/assist` | You paste a Worker HTTPS base **and** enable **Allow one-shot Worker helper** (default off), then tick **Ask the Worker helper** on one send | The typed question and mode only (about 32 KiB). Conversations, memories, and chat history stay local. Transcripts are not stored. Assist is not Soul. |
| Optional desktop `/v1/assist` | You paste an HTTPS base in Settings, enable Soul online (default off), and check send for that message | A single typed question and mode. Conversation history is never sent. Assist is not Soul. Transcripts are not stored. |

A configured provider receives only what is needed for that request and is governed by **that provider's** terms. Eidovara does not collect payment-card numbers, security codes, or payment certificates. Payments stay fail-closed (`paymentsEnabled` remains false). Payment environment variables for the optional Worker are intended to stay empty in v0.19.1. No `workers.dev` host is compiled into the app. The official default is `https://api.eidovara.org`.

## Your controls

You can inspect, back up, reset, or delete local data from Settings (Open local data folder, backups, Reset Soul). Clearing stored API keys is a Settings control. Uninstalling the Windows app does not automatically wipe every profile if you used a custom CLI data directory.

Adult Mode additionally requires the age of majority where located; revoking consent is local and immediate.

## Future features

Accounts, telemetry, cloud storage, live payments, or user uploads would require a new privacy and child-safety review before launch. This notice does not authorize those features.
