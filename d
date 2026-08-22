# Premium commerce and entitlement plan

## Consumer plans

- **Eidovara Free — $0:** unlimited conversations, offline/local models, core memory, companion, built-in research, media, backups, updates, and three linked apps.
- **Eidovara Premium Monthly — target $7.99/month:** all Premium capabilities with monthly cancellation.
- **Eidovara Premium Annual — target $59.99/year:** the same entitlement, billed annually. This is the preferred value plan.

Prices are launch targets, not an active offer, until checkout, taxes, refund/cancellation terms, support contact, and entitlement delivery are configured. Do not advertise a fake discount or “lifetime” access while the product has ongoing service costs.

## Required automatic-unlock flow

1. The app opens an HTTPS provider-hosted checkout page. Eidovara never accepts card details.
2. The provider sends a signed webhook to the owner-controlled Cloudflare Worker.
3. The Worker verifies the signature and stores only the minimum subscription/entitlement mapping.
4. The app exchanges an activation code over HTTPS for a short-lived, signed entitlement token.
5. The app verifies the token with a pinned public key, stores it with OS secure storage, and enables Premium only while valid.
6. Cancellation, refund, chargeback, expiration, and replay events update the record; a documented offline grace period handles outages.

## Security requirements before sales

- Webhook secrets and signing private keys stay in Cloudflare Secrets, never Git, the app, or public variables.
- Use idempotency, timestamp/replay validation, constant-time verification, rate limits, generic activation errors, audit events, and key rotation.
- Do not use email alone as proof of purchase or editable local settings as production edition authority.
- Publish pricing, renewals, cancellation, refunds, support, privacy purpose, retention, and tax handling before checkout.
- Test payment success/failure, cancellation, refund, chargeback, duplicate webhook, expiration, offline grace, clock skew, and outage.

The current local edition control is for private testing only, not production payment enforcement.
