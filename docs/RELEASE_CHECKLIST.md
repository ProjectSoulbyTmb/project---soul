# Eidovara Release Checklist (v2.0.0 and later)

Execute top to bottom. Every unchecked box blocks the release.

## 0. Preconditions

- [ ] Feature freeze announced; only release-blocking fixes land
- [ ] `node scripts/dev-check.js` green locally
- [ ] No open high-severity items in `docs/INCIDENTS.md`

## 1. Version and schema

- [ ] Version bumped in `package.json` (semver: breaking -> major)
- [ ] `CHANGELOG.md` entry complete (user-facing language)
- [ ] Schema version bumped if profiles changed; `migrateProfile` tested against a real v1 profile export
- [ ] Knowledge pack regenerated if content changed (private tooling)

## 2. Quality gates

- [ ] Full suite green (`npm test`) with **zero** known-failure baselines used
- [ ] `eslint . --max-warnings 0` clean
- [ ] `node scripts/module-load-probe.mjs` - all test files load
- [ ] `node scripts/ci-secret-scan.mjs` clean
- [ ] Performance check run; budgets within limits (routing p95, audit sweep, renderer MB)
- [ ] Boot smoke e2e green on Windows runner

## 3. Security review

- [ ] All GitHub Actions pinned by commit digest (`digest-pin-check`)
- [ ] Worker rate limiting + origin allowlist active on deployed api.eidovara.org
- [ ] Update chain: digests verified end-to-end; signature verification ON if signing live
- [ ] SECURITY.md / NETWORK-USAGE.md statements match shipped reality
- [ ] Signing status file accurate (`docs/signing.md`)

## 4. Build and publish

- [ ] Tag `vX.Y.Z` pushed; Release Windows workflow completes
- [ ] Authenticode signing applied or CODE-SIGNING-STATUS honestly says unsigned
- [ ] SHA256SUMS.txt + latest.yml + SBOM + provenance attestation attached to the Release
- [ ] Measured facts copied into Worker vars (`LIVE_INSTALLER_SHA256`, `LIVE_INSTALLER_SIZE`)
- [ ] Website download page + home page advertise exactly this installer (tests enforce)

## 5. Post-release

- [ ] Downloaded artifact hash matches published digest on two machines
- [ ] In-app update check sees the new release from a v(X-1) install
- [ ] Crash/feedback watch for 72 hours before broad announcement
- [ ] INCIDENTS.md reviewed; retro notes appended
