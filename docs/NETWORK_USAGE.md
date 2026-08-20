# Network usage statement

This self-declared network inventory is included in signed release provenance.

| Destination | Trigger | Data sent |
| --- | --- | --- |
| `en.wikipedia.org` | Explicit information/media request | Search terms, IP address, application user agent |
| `commons.wikimedia.org` and `upload.wikimedia.org` | Explicit image/audio/video request or playback | Search terms or media URL request, IP address, application user agent |
| `api.search.brave.com` | Explicit web/image request when the user configured a search key | Search terms, API credential, IP address |
| User-configured model endpoint | User sends a conversation while that provider is selected | Conversation context, selected model, credential when required |
| `github.com/ProjectSoulbyTmb/project---soul` | Startup/manual update check; user-approved update download | App version through user agent, IP address; installer request |
| Spotify or YouTube web service | User clicks the respective media button | Current track search text, IP address, platform cookies/account state |

No general background crawler, telemetry service, advertising endpoint, or automatic external safety-reporting endpoint is present.
