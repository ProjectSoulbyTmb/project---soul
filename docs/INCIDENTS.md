# Incident Log

One row per production-caught bug. "Gate" = which ERROR_PREVENTION_ROADMAP control would have caught it. Review monthly; findings feed roadmap revisions.

| Date | Symptom | Root cause | Detected by | Gate that would have caught it |
|---|---|---|---|---|
| 2026-08-21 | Renderer UI completely dead (SyntaxError on load) | ESM `import` statements in `renderer.js`, loaded as classic script by `index.html` | Audit (manual) | 2.2 boot smoke test |
| 2026-08-21 | Plain `npm start` and packaged builds exit(1) at launch | Startup guard requires `EIDOVARA_AGE_GATE_ACCEPTED`; packaged builds set nothing | Audit (manual) | 2.2 boot smoke - 5.5 env contract |
| 2026-08-21 | ~40 legal/compliance assertions silently absent from suite | `import fs from 'node:tester'` typo; file-load failure baselined as known failure | Audit (manual) | 2.3 load validation - 2.1 kill ratchet |
| 2026-08-21 | CI green while `pnpm test` failed 17 tests | Quality-gate ratchet passes within 50-item known-failures baseline | Audit (manual) | 2.1 kill ratchet |
| 2026-08-21 | Offline provider fallback never engaged | Out-of-scope `providerName` reference in engine catch block (`no-undef`) | ESLint | 3.1 zero-error lint gate |
| 2026-08-21 | Two AI sessions corrupted git state (hijacked rebase, duplicated fixes x3) | No single-writer rule or handoff protocol | User observation | 1.1-1.3 coordination rules |
| 2026-08-21 | Repo left mid-rebase with diverged history by an ended session | Session ended without clean-handoff protocol | Session guard (post-hoc) | 1.2 clean-handoff - 1.4 forbidden ops |
| 2026-08-22 | ~46 surface tests failed after prettier sweep reformatted sources | Tests pinned minified-era syntax (`a===b`); formatter added spaces | Full-suite run | 3.4 format-aware assertions / matchTolerant helper |
| 2026-08-22 | OneDrive sync truncated ~40 repo files to garbage names | Repo lived inside OneDrive folder during active git operations | Garbage-file purge commits | Move out of sync folders (done 2026-08-22) |
