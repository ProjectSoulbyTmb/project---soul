# Copyright Office deposit preparation (owner-only)

This file tells Soul Consciousness Studios how to assemble a **local** source-code deposit for a possible U.S. Copyright Office registration. It is **not legal advice**, not a filing, and not a claim that Eidovara is registered.

A Cloud Agent cannot log into [copyright.gov](https://www.copyright.gov), pay the fee, or upload a deposit as the owner.

## What belongs in a deposit (typical computer-program claim)

Follow Circular 61 and the current Copyright Office instructions at filing time. In general:

- Include **first-party** Eidovara source, tests, documentation, and first-party UI assets that you actually claim.
- **Exclude** Electron, Chromium, Node.js, `node_modules/`, secrets, `.env`, private keys, unpublished patent drafts, executed assignments, customer data, and user content.
- Do not claim Wikipedia/Wikimedia text, third-party marks, or Windows/OS components as yours.
- Identifying material rules (how many pages of source, trade-secret redaction) change; read the Office’s current circular before uploading.

## Local helper

From the repository root, with no secrets in the working tree:

```
npm run ip:deposit
```

That script writes a file listing and SHA-256 digest of first-party paths into `copyright-deposit/` (gitignored). Review the listing, delete anything that should stay secret, then use the Copyright Office portal yourself.

Never commit `copyright-deposit/`, registration certificates, applicant addresses, or payment receipts to this public repository.

## After a certificate issues

You may then state that **that specific work** is registered and cite the real registration number. Until then, say “copyright claimed,” not “registered.” Update [IP_CERTIFICATION.md](IP_CERTIFICATION.md) only with true numbers.
