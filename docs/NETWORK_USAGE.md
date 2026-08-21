# Network usage statement

This self-declared network inventory is included in signed release provenance. The same inventory is advertised at [NETWORK-USAGE.md](../NETWORK-USAGE.md).

| Destination | Trigger | Data sent |
| --- | --- | --- |
| `en.wikipedia.org` | Explicit internet/web/online research request | Search terms, IP address, application user agent |
| `commons.wikimedia.org` and `upload.wikimedia.org` | Explicit image/audio/video request or playback | Search terms or media URL request, IP address, application user agent |
| `api.search.brave.com` | Explicit web/image request when a Premium Brave Search key is configured | Search terms, API credential, IP address |
| User-configured local model (`127.0.0.1` / `localhost` / `::1`, typically Ollama `/api/chat`) | User sends a conversation while Local is selected | Conversation context and selected model on loopback |
| User-configured Premium HTTPS `/chat/completions` endpoint | User sends a conversation while Compatible is selected | Conversation context, selected model, credential when required |
| Configured HTTPS service `/health` | Owner uses Ctrl+A **Test service** | No conversations or payment data; health JSON only |
| `github.com/ProjectSoulbyTmb/project---soul` | Startup/manual update check; user-approved update download | App version through user agent, IP address; installer request |
| Spotify or YouTube web service | User clicks the respective media button | Current track search text, IP address, platform cookies/account state |

No general background crawler, telemetry service, advertising endpoint, or automatic external safety-reporting endpoint is present. The Electron app does not hard-code a `workers.dev` URL; paste a service base into the local administrator panel.
