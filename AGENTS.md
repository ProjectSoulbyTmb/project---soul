# Eidovara — Agent & Developer Contract

Read this file BEFORE any operation in this repository. These rules exist because on 2026-08-21 two concurrent AI sessions corrupted git state, duplicated work, and shipped a broken boot path while CI stayed green.

## 1. Single-writer rule

- Only ONE session (human or AI) may modify this repo at a time.
- Before ANY write operation run:

```powershell
git reflog -1 --date=iso   # if the last entry is < 30 minutes old and not yours, STOP
git status --porcelain      # if dirty and not your changes, STOP
```

- If another session is active: wait, or coordinate through the user. Never "work around" it.

## 2. Clean-handoff protocol

A session may only end when ALL of the following hold:

- Working tree committed or stashed (never leave >20 dirty files)
- No rebase/merge/cherry-pick in progress (check `.git/rebase-merge`, `.git/rebase-apply`)
- No orphaned locks (`git status` reports nothing unusual)
- Final commit message includes trailer: `Session: <your-session-id>`

## 3. Forbidden operations for automated agents

- `git push --force` / `--force-with-lease`
- Interactive rebase (`-i`)
- `git reset --hard` (use `rebase --abort` / report instead)
- Deleting branches you did not create
- Editing files under a path another session recently touched (check `git log -1 --name-only`)

If blocked by any rule: abort safely, then REPORT to the user. Do not improvise.

## 4. Startup-path freeze

These files require a green boot-smoke test before merge (see Phase 5.3 of ERROR_PREVENTION_ROADMAP):

- `src/electron/main.js` (especially lines before the first import)
- `src/renderer/index.html`
- `src/renderer/renderer.js`
- `src/electron/preload.cjs`
- `src/core/guards/index.js`

## 5. Environment variable contract

| Variable | Who sets it | Dev behavior | Packaged behavior |
|---|---|---|---|
| `EIDOVARA_AGE_GATE_ACCEPTED` | Test harness only | Enables CLI/test age gate | **Never set** — startup code MUST NOT require it |

Any new env var must be added to this table in the same commit.

## 6. Quality gates (non-negotiable per commit)

```powershell
npm run lint          # zero errors; no-undef = build breaker
npm test              # zero failures; known-failures.json entries need owner+expiry
npm run check         # syntax gate
```

Pre-push hook runs lint + full tests. If CI is red, fixing it outranks all feature work.
