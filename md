# Security, licensing, and sustainability maintenance

Eidovara uses reviewed releases, not silent self-modification. The application may check the official HTTPS update manifest automatically, but it downloads and opens a verified package only after user approval.

## Continuous controls

- GitHub Dependabot checks package and workflow updates weekly.
- Security automation runs on every main-branch push, every pull request, and weekly. It executes the full tests, syntax checks, production dependency audit, and private-key scan.
- Each release generates SHA-256 checksums, an SPDX software bill of materials, a privacy declaration, signing-status disclosure, and GitHub build provenance.
- Network destinations, data categories, and user triggers are documented in `NETWORK_USAGE.md` / `NETWORK-USAGE.md` and must be updated when connectivity changes. Documented future adapters (neural TTS, VRM, OBS control, live payments) must not be enabled by a maintenance update.

## Required review before adoption

Dependency, runtime, media, voice, avatar, provider, payment, and AI-model upgrades require all of the following before release:

1. Review the exact version, source, license, notices, maintainer status, and known vulnerabilities.
2. Confirm compatibility with the proprietary Eidovara license and document redistributed material.
3. Pin the dependency or asset version and integrity hash where practical.
4. Test migrations, restart persistence, offline behavior, permissions, failure handling, and removal.
5. Update the SBOM, third-party notices, privacy notice, network inventory, and release notes when affected.
6. Release through a reviewable pull request and retain rollback instructions.

No update may weaken consent, user control, credential handling, data deletion, or the distinction between persistent software adaptation and human consciousness. Consumer demand is evidence for prioritization, not permission to collect telemetry, copy protected products, bypass platform terms, or install unreviewed code.

Eidovara is modular by product policy: applications, gaming, media, entertainment, appearance, accessibility, research, and maintenance must not depend on a remote AI provider. Soul may coordinate or explain those capabilities but is an optional layer. New modules must degrade independently so one provider or adapter outage does not disable the workspace.

## Release gates

A consumer release must pass tests, syntax and smoke checks, dependency audit, forbidden-string and secret scans, persistence/restart checks, and release-evidence generation. Public Windows distribution must disclose Authenticode status. A trusted signing claim is permitted only after the built executable verifies against a current public-trust certificate.

Payment-controlled Premium activation remains incomplete until a server validates signed provider webhooks and issues expiring, revocable entitlements. The local administrator edition switch is for owner testing and is not payment authorization.
