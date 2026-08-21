# Eidovara HTTPS service

This dependency-free Cloudflare Worker supplies public health, status, store configuration, and website-helper endpoints. It never receives card data, passwords, model credentials, conversations, or local memories. The Electron desktop app defaults to `https://api.eidovara.org` and does not hard-code a `workers.dev` URL. Paste another HTTPS base into **Settings → Eidovara service** (or Ctrl+A **Soul HTTPS service**) to override. Ask Eidovara `/v1/assist` still needs a saved HTTPS base (localStorage).

<!-- Compatibility matrix: desktop uses GET /health /v1/config /v1/status (Connect after 18+, launch retry, Ctrl+A Test service) against https://api.eidovara.org by default, then a main-process liveness loop of GET /health and GET /v1/status with jitter and backoff; site Ask Eidovara is offline knowledge.js plus optional pasted POST /v1/assist; Status prefills the official host and polls only after Check; Fail-closed with no URL for assist; neither client sends conversations; HTTPS except loopback (desktop only). -->

## Compatibility matrix

| Client | Endpoints | Rules |
| --- | --- | --- |
| Desktop Settings **Connect**, launch after 18+, Ctrl+A **Test service** | GET `/health`, GET `/v1/config`, GET `/v1/status` (also GET `/v1/health`) | HTTPS except loopback. Default base `https://api.eidovara.org`. Pasted bases strip `/health` `/v1/config` `/v1/status` `/v1/assist` `/v1/health`. Conversations are not sent on Connect. Fetch failure stays Offline Soul. `paymentsEnabled` is always false. |
| Desktop live status (after 18+ with a service base) | GET `/health` and GET `/v1/status` on an interval with jitter; exponential backoff while Reconnecting | Main process only (workspace renderer `connect-src 'none'`). Status is **Online**, **Reconnecting**, or **Offline** — never faked. Stops when the window quits or there is no valid URL. Does not send conversations, memories, or Adult Mode payloads. Does not require `/v1/assist` or a new `/v1/heartbeat` route. Free / Offline Soul still works if the host is down. |
| Desktop composer **Ask the Worker helper** | Optional POST `/v1/assist` after a pasted HTTPS base **and** Settings **Allow one-shot Worker helper** (default off) | Typed query only (~32 KiB). Chat history, memories, and conversations stay local. Assist is not Soul. |
| GitHub Pages Ask Eidovara | Optional POST `/v1/assist` after a pasted HTTPS base | Works offline from `docs/knowledge.js` with no URL. Same allowlisted pack as this Worker. GET `/v1/assist` is metadata or `?q=`. |
| GitHub Pages Status | GET `/health` and GET `/v1/status` against the official default or a pasted override | Prefills `https://api.eidovara.org`. Invalid URLs fail closed. Check starts an honest poll; Clear stops it. No fetch until Check. |

Neither client compiles a `workers.dev` host. Desktop calls `/v1/assist` only after explicit helper opt-in (default off).

## Free deployment

1. Create a Cloudflare account and enable Workers Free.
2. Install Wrangler locally with `npm install --save-dev wrangler` or use Cloudflare's dashboard editor. Do not add Wrangler to Eidovara's committed `package.json` unless you intend it as a product dependency.
3. Authenticate with `npx wrangler login` or export `CLOUDFLARE_API_TOKEN` in your own shell — never commit it — then `npx wrangler deploy`. Redeploy after merging Worker changes so the live Worker does not drift behind `server/worker.js`. Skip deploy if you have no token; the Pages helper still works.
4. Create hosted checkout links in Stripe Payment Links, PayPal Payment Links, or Gumroad only when selling. Keep those URLs empty to leave payments off.
5. Put only the public HTTPS checkout URLs in `wrangler.toml` variables or the Cloudflare dashboard. Never add API secrets to this repository.
6. The desktop already defaults to `https://api.eidovara.org`. After the 18+ gate, the app calls `GET /health`, `GET /v1/config`, and `GET /v1/status` on Connect, then keeps liveness current with `GET /health` and `GET /v1/status`. Paste another HTTPS **base** into Settings → **Eidovara service** only to override. If those requests fail, Offline Soul continues locally.

Official baked default: `https://api.eidovara.org`. Operator `workers.dev` example (not baked into the app or public site): see [docs/PAYMENTS_AND_SITE.md](docs/PAYMENTS_AND_SITE.md). The public website custom domain is `https://eidovara.org/` (Cloudflare Pages project `eidovara`, same `docs/` as GitHub Pages `https://projectsoulbytmb.github.io/project---soul/`). `server/wrangler.toml` binds the Worker to custom hostname `api.eidovara.org`.

For production, enable Cloudflare account two-factor authentication, keep Wrangler tokens out of source control, deploy from a protected GitHub environment, monitor `/health`, and configure more than one owner-controlled recovery method. The public service is deliberately stateless, so an outage cannot corrupt user conversations or payment records.

Endpoints: `GET`/`HEAD /health`, `GET`/`HEAD /v1/health`, `GET`/`HEAD /v1/config`, `GET`/`HEAD /v1/status`, and `GET`/`POST /v1/assist`. OPTIONS is CORS-preflight (`GET, HEAD, POST`). `/health`, `/v1/config`, and `/v1/status` report `paymentsEnabled: false`, `checkoutEnabled: false`, `localFirst: true`, `conversationsStored: false`, 18+, and unsigned Windows. `/v1/status` uses `Cache-Control: private, no-store`. There is no `/v1/heartbeat` route; desktop liveness reuses `/health` and `/v1/status`. `/v1/assist` answers from the same allowlisted knowledge pack as `docs/knowledge.js`, refuses empty/oversized/abuse-shaped input, does not store transcripts, and does not accept desktop conversation history. Store URLs stay empty unless you later add provider-hosted checkout links. Live payments stay off in source v0.22.2 (live installer remains v0.19.1). The desktop app ignores checkout even if a future config lied. All other methods and paths fail closed.
