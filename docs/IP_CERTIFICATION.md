# Eidovara repository self-attestation

Record date: 21 August 2026  
Claimant: Tyler Michael Bosworth  
Intended publisher name: Soul Consciousness Studios (does not own this IP unless a formed entity receives a signed assignment)

This file **certifies the contents of this public repository** as of the record date: which legal instruments exist, what they do, and what they do not do. It is a dated project record and automated-test target.

**It is not legal advice.** It is not a U.S. Copyright Office registration, USPTO filing, patent, Authenticode publisher certificate, PCI-DSS audit, court judgment, executed assignment, or counsel opinion. Publishing this file does not file anything with any government office.

Machine-readable companion: [ip-certification.json](ip-certification.json).

## What this attestation covers

| Layer | Attested here | Not attested here |
| --- | --- | --- |
| First-party copyright **claim** in qualifying original Eidovara expression | Yes — claimant Tyler Michael Bosworth; notice in LICENSE, COPYRIGHT.txt, NOTICE.md, SPDX headers | U.S. Copyright Office **registration** |
| Source-available evaluation license | Yes — `LicenseRef-Eidovara-Source-Available-1.0` in LICENSE; not MIT/Apache/GPL/OSI | A right to relicense forks as open source |
| Unregistered marks Eidovara™, Soul (feature name), Soul Consciousness Studios™ | Yes — ™ usage and TRADEMARKS.md | registered-mark symbol, USPTO serial, or federal registration |
| Chain of title vs third-party layers | Yes — Electron, Chromium, Node.js, Windows, Wikimedia, user content excluded | Ownership of those third-party layers |
| Contributor / entity assignments | Templates exist and are **unsigned** | Any executed CLA or company assignment |
| Advertised Windows installer v0.22.2 | Filename, measured SHA-256, Authenticode-**unsigned**, GitHub/Sigstore provenance | Microsoft certification, EV signing, SmartScreen pre-approval |
| Source version 0.22.2 | `package.json` / Worker health / website helper | A claim that provenance is Authenticode signing |
| Inbound GitHub patches | Policy: not accepted until private written assignment | Transfer of copyright by opening a PR |

## Certified product record (source v0.22.2; live installer v0.22.2)

These facts match the published unsigned Windows installer plus this source cut. They are integrity facts, not a government certificate.

| Field | Value |
| --- | --- |
| Product | Eidovara |
| Source version | 0.22.2 |
| Live advertised installer version | 0.22.2 |
| App id | `com.soulconsciousnessstudios.eidovara` |
| Official platform | Windows 10/11 x64 |
| Installer | `Eidovara-0.22.2-Windows-x64-Setup.exe` |
| Size | 106,691,429 bytes (about 101.75 MiB) |
| SHA-256 | `A26B8232E6B81A77566610AFF110197022850AB4348F86D390663831584B5DEE` |
| Release tag | `v0.22.2` |
| Authenticode | unsigned |
| Build provenance | GitHub/Sigstore provenance available; not Authenticode |
| Age | 18 or older |
| License | Eidovara Source-Available Evaluation License 1.0 |
| Payments | fail-closed; no live checkout |
| Service default | `https://api.eidovara.org` (optional; conversations not sent) |
| Public site | `https://eidovara.org/` |

Do not retag `v0.22.2` or invent a different installer hash in this file.

## Instrument inventory

Status values used below:

- **in-repo** — the instrument is published here and is what it claims to be
- **unsigned-template** — a form the owner may execute privately; git does not contain signatures
- **not-filed** — a checklist only; no application has been sent
- **owner-action-required** — cannot be completed by a commit

| Instrument | Path | Status |
| --- | --- | --- |
| Source-available evaluation license | [LICENSE](../LICENSE) | in-repo |
| Installer EULA (embeds LICENSE) | [installer/EULA.txt](../installer/EULA.txt) | in-repo |
| Product terms | [TERMS.md](../TERMS.md) | in-repo |
| Privacy notice | [PRIVACY.md](../PRIVACY.md) | in-repo |
| Age 18+ | [AGE.md](../AGE.md) | in-repo |
| Legal notices | [LEGAL_NOTICES.md](../LEGAL_NOTICES.md) | in-repo |
| Security policy | [SECURITY.md](../SECURITY.md) | in-repo |
| One-page copyright claim | [COPYRIGHT.txt](../COPYRIGHT.txt) | in-repo |
| NOTICE / third-party runtime table | [NOTICE.md](../NOTICE.md) | in-repo |
| Ownership limits | [OWNERSHIP.md](../OWNERSHIP.md) | in-repo |
| Authors | [AUTHORS.md](../AUTHORS.md) | in-repo |
| Unregistered trademark usage | [TRADEMARKS.md](../TRADEMARKS.md) | in-repo |
| Third-party notices | [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) | in-repo |
| Contribution policy | [CONTRIBUTING.md](../CONTRIBUTING.md) | in-repo |
| Citation (does not grant a license) | [CITATION.cff](../CITATION.cff) | in-repo |
| Copyright notice + copyright.gov checklist | [COPYRIGHT.md](COPYRIGHT.md) | in-repo / not-filed |
| Brand asset hashes | [COPYRIGHT_ASSET_REGISTER.md](COPYRIGHT_ASSET_REGISTER.md) | in-repo (provenance, not registration) |
| Copyright Office deposit instructions | [COPYRIGHT_DEPOSIT.md](COPYRIGHT_DEPOSIT.md) | in-repo / owner-action-required |
| USPTO filing checklist | [TRADEMARK_FILING.md](TRADEMARK_FILING.md) | not-filed |
| Knockout clearance log | [TRADEMARK_CLEARANCE_LOG.md](TRADEMARK_CLEARANCE_LOG.md) | in-repo (not comprehensive clearance) |
| Name screening record | [NAME_CLEARANCE.md](NAME_CLEARANCE.md) | in-repo (knockout only) |
| Chain of title | [CHAIN_OF_TITLE.md](CHAIN_OF_TITLE.md) | in-repo |
| IP protection plan | [IP_PROTECTION.md](IP_PROTECTION.md) | in-repo |
| Public vs private repository policy | [PUBLIC_REPOSITORY_POLICY.md](PUBLIC_REPOSITORY_POLICY.md) | in-repo |
| Infringement / DMCA pointers | [INFRINGEMENT.md](INFRINGEMENT.md) | in-repo |
| Contributor assignment (CLA) | [CONTRIBUTOR_ASSIGNMENT.md](CONTRIBUTOR_ASSIGNMENT.md) | unsigned-template |
| Entity IP assignment | [ENTITY_IP_ASSIGNMENT.md](ENTITY_IP_ASSIGNMENT.md) | unsigned-template |
| Company formation checklist | [COMPANY_FORMATION.md](COMPANY_FORMATION.md) | not-filed |
| SPDX first-party headers | `src/**/*.js`, `src/**/*.cjs`, `docs/*.js`, first-party HTML/CSS, `scripts/*`, `server/*` | in-repo |
| CODEOWNERS | [.github/CODEOWNERS](../.github/CODEOWNERS) | in-repo (`@ProjectSoulbyTmb` only) |
| security.txt | [docs/.well-known/security.txt](.well-known/security.txt) | in-repo (no PGP key published) |
| Dependabot | [.github/dependabot.yml](../.github/dependabot.yml) | in-repo (npm + GitHub Actions) |
| Security checks workflow | [.github/workflows/security.yml](../.github/workflows/security.yml) | in-repo |
| CodeQL workflow | [.github/workflows/codeql.yml](../.github/workflows/codeql.yml) | in-repo |
| OpenSSF Scorecards workflow | [.github/workflows/scorecards.yml](../.github/workflows/scorecards.yml) | in-repo |
| Dependency review workflow | [.github/workflows/dependency-review.yml](../.github/workflows/dependency-review.yml) | in-repo (needs Dependency graph owner click) |
| U.S. Copyright Office registration | — | owner-action-required |
| USPTO trademark application | — | owner-action-required |
| Patent application | — | owner-action-required (do not claim a filing until one exists) |
| Authenticode code-signing identity | — | owner-action-required |
| Executed CLA or entity assignment | — | owner-action-required (keep executed copies **out** of this public repo) |

## What automated tests certify

`tests/legal-surface.test.js` and `tests/ip-certification.test.js` fail the build if this repository:

- claims a Copyright Office file identifier, a USPTO registration identifier, a U.S. patent identifier, pending-patent wording, a PCI DSS certificate, or a registered-mark symbol
- treats LICENSE as MIT/Apache/GPL/OSI open source
- drops the 18+ / Authenticode-unsigned / source-available facts
- treats the CLA or entity assignment as executed
- stamps first-party JS with a third-party SPDX identifier
- lists an inventory path that does not exist
- invents a different v0.22.2 installer SHA-256 than the published desktop knowledge pack

Passing tests certify **repository honesty and presence**, not a government grant of rights.

## Owner-only leftovers (cannot be done by a git commit)

Complete these privately with qualified counsel. Do not paste certificates, serials, or signed PDFs back into this public repository until you are ready to state a **true** registration number.

1. **Copyright Office.** Register qualifying source-code and first-party visual works at [copyright.gov](https://www.copyright.gov) using [COPYRIGHT.md](COPYRIGHT.md) and [COPYRIGHT_DEPOSIT.md](COPYRIGHT_DEPOSIT.md). Run `npm run ip:deposit` locally; the output directory is gitignored.
2. **Trademark.** Retain a U.S. trademark attorney; complete a comprehensive search; file only in the name of the actual owner (today: Tyler Michael Bosworth personally). See [TRADEMARK_FILING.md](TRADEMARK_FILING.md). Use ™ until a registration **issues**.
3. **Entity.** Form a company only if desired, then execute [ENTITY_IP_ASSIGNMENT.md](ENTITY_IP_ASSIGNMENT.md) privately. Formation alone does not transfer IP.
4. **Contributors.** Do not merge inbound copyrightable work until a privately signed assignment exists.
5. **Authenticode.** Obtain an identity-validated code-signing certificate. Never commit the private key.
6. **Patents.** Consult a registered patent attorney before additional public disclosure of patent-sensitive mechanisms and before any statement that a patent has been filed.
7. **Hosting clicks** still on the owner: GitHub Dependency graph, GitHub private vulnerability reporting, Cloudflare `npx wrangler deploy` after Worker edits, `www` DNS CNAME. See [LIVE.md](../LIVE.md). Scorecards/CodeQL SARIF upload does not turn those toggles on.

## How this repository already protects the claim

- Source-available license that **forbids** relicensing first-party material as open source
- SPDX `LicenseRef-Eidovara-Source-Available-1.0` on first-party source, site scripts, HTML, CSS, and packaging helpers
- Honest ™-only marks; no registered-mark symbol
- Unsigned CLA/entity templates so git cannot be mistaken for executed title
- Brand-asset SHA-256 register
- Public/private split and gitignore for keys, deposits, and executed paperwork
- CODEOWNERS requiring `@ProjectSoulbyTmb` on legal paths
- CodeQL, OpenSSF Scorecards (SARIF), Dependabot (npm and GitHub Actions), license inventory, and a prohibited-secret scan whose regex cannot self-match `security.yml`
- Installer SHA-256 and GitHub/Sigstore provenance (provenance is **not** Authenticode)
- Issue template for IP notices; GitHub DMCA process for official takedowns

## Honesty rules

- Do not add a fake certificate image, Txu/VAu identifier, USPTO serial, or a PCI DSS certificate claim.
- Do not describe Soul as consciousness or Eidovara as an Apple/Microsoft/Electron product.
- Do not claim this self-attestation **is** a Copyright Office or USPTO registration.
- Update the record date and inventory when a **real** filing or assignment happens; until then keep status `not-filed` / `unsigned-template` / `owner-action-required`.
