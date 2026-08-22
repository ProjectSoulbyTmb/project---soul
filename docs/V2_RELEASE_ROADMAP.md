# Eidovara v2.0.0 - Official Release Roadmap

Created 2026-08-22. Target: the first **stable, signed, officially supported** release, graduating from v1.0.0 Stable Alpha. Windows 10/11 x64 remains the only official platform.

## Release definition

v2.0.0 is official when **all six gates (G1-G6) pass**. "Official" means: Authenticode-signed installer, verified update chain, green CI without ratchets, documented support scope, and a completed security review.

## Current baseline (2026-08-22)

| Area                | State                                                                           |
| ------------------- | ------------------------------------------------------------------------------- |
| Tests               | 326/326 passing on public main; smoke OK                                        |
| Lint                | 0 errors / 7 warnings                                                           |
| Installer           | v1.0.0 shipped, SHA-pinned, provenance + SBOM, **Authenticode-unsigned**        |
| Update chain        | Checksum-mandatory, HTTPS-only, signature verification disabled (blocked by W1) |
| Payments            | Disabled; Free edition is full surface                                          |
| Experimental kernel | Withdrawn from public lineage; preserved privately                              |

## Workstreams

### W1 - Trust and Signing (BLOCKING)

1. Acquire Authenticode certificate (OV acceptable; EV removes SmartScreen friction)
2. Sign installers in `release-windows.yml`; set `signExecutable` accordingly
3. Re-enable electron-updater signature verification (`verifyUpdateCodeSignature`)
4. Publish signing-policy page; document revocation procedure
5. Reproducible-build spot-check job (two builds -> identical manifest diff modulo timestamps)

### W2 - Quality Gates

1. Delete the known-failures ratchet permanently; CI fails on ANY failure (suite is already green)
2. Wire boot-smoke Electron spec into Windows CI (plain launch, UI mounts, no exit(1))
3. Test-file load validation step in CI
4. Coverage floors: >=70% for engine, store, updater, service paths
5. Zero-warning lint policy (`--max-warnings 0`) with the current 7 warnings fixed
6. Replace perf-check stubs with the real budget checks and run them per release

### W3 - Security Hardening

1. Cloudflare Worker `/v1/assist`: rate limiting (token bucket per IP) + abuse metrics
2. Storage fallback policy: decide behavior when safeStorage is unavailable (block writes of secrets vs plaintext-with-warning) and implement
3. Persistent admin lockout counters (survive restart)
4. `soul:openExternal`: confirmation dialog parity with overlay path
5. CI enforcement: secret-pattern scan + action digest-pin check fail the build
6. Security review against SECURITY.md claims; update NETWORK-USAGE.md to final state

### W4 - Product Surface for V2

1. Editions posture decision: keep single free edition through V2 (recommended), or define paid tiers
2. Assistant framework strategy: private-source module compiled into signed artifacts; source never published; capability list documented publicly without implementation detail
3. Localization QA pass for es/fr/de; English fallback verified
4. Performance budgets wired into release checklist (routing <1ms p95, audits <500ms sweep, renderer <8MB warn)
5. Accessibility pass: keyboard-only walkthrough + screen-reader labels on primary flows

### W5 - Docs and Site

1. version-history.html gains the v2.0.0 entry; sitemap refresh automated in release workflow
2. README rewritten for stable status (remove alpha caveats that no longer apply)
3. INCIDENTS.md review gate: no open high-severity incidents at GA
4. SUPPORT.md scope reviewed against final feature set

### W6 - Release Mechanics

1. Version migration: schema bump if any profile changes ship; migrateProfile tested against v1 profiles
2. Release checklist execution: checksums, SHA256SUMS.txt, provenance attestation, SBOM, drafted notes
3. Staged rollout: tag `v2.0.0-beta.N` pre-releases first; updater channel test with signed artifacts
4. Post-GA: monitor crash reports/feedback for 72h before announcing broadly

## Gates

| Gate | Requirement                                                                 |
| ---- | --------------------------------------------------------------------------- |
| G1   | W1 complete: signed builds verify end-to-end                                |
| G2   | 14 consecutive days: suite green, boot-smoke green, zero-warning lint in CI |
| G3   | Security checklist (W3) signed off                                          |
| G4   | Beta soak: >=2 tagged pre-releases, no regression-class incidents filed     |
| G5   | Docs/site final pass (W5)                                                   |
| G6   | Release checklist executed without waivers                                  |

## Indicative timeline

```
Weeks 1-2   W1 signing pipeline + W2 gate hardening
Week 3      W3 security items
Week 4      W4 product decisions land; feature freeze
Week 5      W5 docs/site; beta.1 tag
Weeks 5-6   Beta soak (G4); beta.2 if needed
Week 7      v2.0.0 GA
```

## Non-goals for V2

- Linux/macOS official products
- Live payments (revisit post-GA)
- Neural TTS / VRM / OBS control
- Any consciousness or sentience claims (permanently non-negotiable)
