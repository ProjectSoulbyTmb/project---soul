# Eidovara Runbook

## Repository location

- **Canonical clone:** `C:\Dev\project---soul` — NEVER keep a working copy inside OneDrive
  (sync-conflict merging corrupted this repo repeatedly on 2026-08-22).
- **Origin:** https://github.com/ProjectSoulbyTmb/project---soul (branch `main`)

## Recovery procedure

```powershell
# fresh machine / damaged clone:
git clone https://github.com/ProjectSoulbyTmb/project---soul C:\Dev\project---soul
cd C:\Dev\project---soul
corepack enable
pnpm install --frozen-lockfile
pnpm test && pnpm run smoke
```

## Automation map (all in .github/workflows/)

| Workflow                              | Trigger           | Purpose                                                    |
| ------------------------------------- | ----------------- | ---------------------------------------------------------- |
| ci.yml                                | push/PR           | lint·format·syntax·tests·audit                             |
| windows-ci.yml                        | push/PR/nightly   | same gates on real Windows runner                          |
| auto-debug.yml                        | every 6h          | full gate sweep + live-site probe → files issue on failure |
| auto-fix.yml                          | daily             | eslint/prettier/dep-patch fixes → validated PR             |
| link-check.yml                        | weekly + docs PRs | internal link/anchor integrity                             |
| stale.yml                             | Mondays           | queue hygiene                                              |
| codeql/security/scorecards/dependabot | weekly/monthly    | vuln & supply-chain scanning                               |
| release-windows.yml                   | `v*` tags         | NSIS installer build + provenance                          |
| release-drafter.yml                   | push to main      | draft release notes                                        |
| pages.yml / cloudflare-\*.yml         | on change         | site + API deployment                                      |

## Known owner actions (not automatable)

1. Branch protection on `main` + auto-merge (Settings → Branches/Pull requests)
2. Dependency graph + private vulnerability reporting (Settings → Code security)
3. Secret scanning + push protection (Settings → Code security)
4. Cloudflare credentials (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) for deploys
5. Code-signing certificate (installers remain Authenticode-unsigned)

## Rules that prevent repeat incidents

1. One AI/dev session at a time per clone.
2. Commit immediately after meaningful changes; push before ending a session.
3. Never re-add the repo to OneDrive/Dropbox or any sync folder.
4. If files look "half-old/half-new": `git status`, `git restore .`, never hand-edit merges.
