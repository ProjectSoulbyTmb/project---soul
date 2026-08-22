# Eidovara - Error-Prevention Roadmap

Created 2026-08-22 from the incident evidence in [INCIDENTS.md](INCIDENTS.md). Ordered by observed failure frequency. Owner: the operator; every AI session reads this before working.

## Phase 1 - Agent Coordination (highest frequency)

| # | Action | How |
|---|---|---|
| 1.1 | Single-writer rule | One AI/editor session modifies the repo at a time; pre-session check via `node scripts/session-guard.js` |
| 1.2 | Clean-handoff protocol | Sessions end only with clean tree, no rebase in progress, `Session:` trailer on last commit |
| 1.3 | Ownership markers | `Session: <id>` trailer on agent commits for attribution in `git log` |
| 1.4 | No destructive ops by agents | Ban force-push, interactive rebase, `reset --hard` for automated sessions |

## Phase 2 - Make CI Tell the Truth

| # | Action | How |
|---|---|---|
| 2.1 | Kill failure ratchet | Empty `tests/known-failures.json`; gate exits non-zero on ANY failure; baselines require owner + expiry |
| 2.2 | Boot smoke test in CI | Launch Electron with no special env; assert window renders and no exit(1) - see `tests/e2e/boot-smoke.spec.js` |
| 2.3 | Test-file load validation | CI step imports every test file; module-load failures fail separately from assertion failures |
| 2.4 | Coverage floor | >=70% for `src/core/guards/*`, `telemetry.js`, updater paths |
| 2.5 | Vacuous-job detector | Every CI job prints assertion counts; delete jobs that run zero tests |

## Phase 3 - Pre-Merge Quality Gates

| # | Action | How |
|---|---|---|
| 3.1 | Zero-error lint policy | `eslint . --max-warnings 0` in CI; pre-push hook runs lint + full tests |
| 3.2 | Ban silent error swallowing | `no-empty` rule for catch blocks; each silence needs justification comment |
| 3.3 | Startup-path review rule | Any boot-reachable `process.exit(1)` requires documented env override + launch test |
| 3.4 | Dead-scaffolding budget | Stub functions need `// TODO(owner, date)`; CI fails TODOs older than 60 days |

## Phase 4 - Git and Encoding Hygiene

| # | Action | How |
|---|---|---|
| 4.1 | Line-ending/BOM policy, once | `.gitattributes` (`* text=auto eol=lf`) - DONE 2026-08-22; lint detects recurrence |
| 4.2 | Branch TTL | Weekly Action auto-deletes merged branches; issue for unmerged >45 days - DONE via stale-branches.yml |
| 4.3 | Small-batch commits | Never accumulate >20 dirty files; commit at logical checkpoints |
| 4.4 | Protect main | GitHub ruleset requiring CI pass before push/merge |

## Phase 5 - Release and Runtime Safety

| # | Action | How |
|---|---|---|
| 5.1 | Update-chain trust | Authenticode cert; remove nulled `verifyUpdateCodeSignature` or document residual risk |
| 5.2 | Single-source release metadata | Generate installer constants from one source; CI fails on drift |
| 5.3 | Boot-path freeze | Files in AGENTS.md startup list require green boot smoke before merge |
| 5.4 | Merge-day verification | After merges touching electron/renderer entry files: e2e launch + manual start |
| 5.5 | Env contract | All env vars documented in AGENTS.md with dev vs packaged behavior |

## Phase 6 - Dependency and Supply Chain

| # | Action | How |
|---|---|---|
| 6.1 | Weekly audit triage | Fail CI on new high advisories in runtime deps; named owner, weekly cadence |
| 6.2 | Electron upgrade cadence | Quarterly major-upgrade task so pinned Electron never ages into known CVEs |
| 6.3 | Lockfile discipline | Exactly one lockfile (`pnpm-lock.yaml`); CI checks no `package-lock.json` |
| 6.4 | Plugin intake rules | Manifest schema validation test, lint inclusion, sandbox review before third-party plugins ship |

## Phase 7 - Knowledge and Runbooks

| # | Action | How |
|---|---|---|
| 7.1 | Incident log | INCIDENTS.md reviewed monthly; feeds roadmap revisions |
| 7.2 | AGENTS.md contract | Standing instruction file read by every session - highest-leverage artifact (DONE) |
| 7.3 | Onboarding smoke script | `scripts/dev-check.js`: guard -> syntax -> lint -> tests -> smoke in one command (DONE) |

## Rollout Status

```
DONE:     AGENTS.md (7.2) - session-guard (1.1/1.2) - .gitattributes LF (4.1)
          branch TTL (4.2) - dev-check script (7.3) - boot-smoke spec staged (2.2 spec)
NEXT:     wire boot smoke into windows CI (2.2) - kill ratchet fully (2.1)
          load validation step (2.3) - zero-warning lint gate (3.1)
LATER:    coverage floors (2.4) - Authenticode path (5.1) - main ruleset (4.4)
Ongoing:  monthly incident review feeding roadmap revisions
```

## Success Metrics (90-day targets)

| Metric | Baseline (2026-08-21) | Target |
|---|---|---|
| Test failures on main | 53 (hidden by ratchet earlier) | 0, ratchet gone |
| Plain `npm start` boots | exit(1) risk | verified in CI boot smoke |
| Lint errors on main | 43 (incl. 2 real bugs) | 0, gated |
| Agent collisions | 4+ incidents | 0 via single-writer rule |
| Stale remote branches | ~73 | <10 with TTL automation |
| Dirty files at session end | up to 82 | <=20, enforced by handoff protocol |
| Time-to-detect broken boot | days | <15 min (CI boot smoke) |

Leading indicator: first three INCIDENTS.md rows caused by *pre-merge* catches instead of runtime breakage.
