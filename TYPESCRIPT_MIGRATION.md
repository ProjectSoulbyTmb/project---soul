# TypeScript Migration Guide

## Overview
This project uses JavaScript with JSDoc annotations for type safety. Full TypeScript migration is planned.

## Current State
- `tsconfig.json` configured for type-checking only (`noEmit: true`)
- JSDoc types in core modules
- CI runs `tsc --noEmit` for type validation
- Source files remain `.js` / `.cjs` / `.mjs`

## Migration Strategy (Incremental)

### Phase 1: JSDoc Enhancement (Current)
- Add `@typedef`, `@param`, `@returns` to all public APIs
- Enable `checkJs: true` in tsconfig
- Use `@ts-check` pragma in files

### Phase 2: Config Files First
- Rename `*.config.js` → `*.config.ts`
- `playwright.config.ts` ✓ (already done)
- `eslint.config.js` → `eslint.config.ts`
- `tsconfig.json` → keep as JSON

### Phase 3: Core Modules
Priority order:
1. `src/core/schema.js` - data structures
2. `src/core/kernel.js` - kernel types
3. `src/core/engine.js` - SoulEngine class
4. `src/core/store.js` - JsonStore
5. `src/providers/*.js` - provider interfaces

### Phase 4: Electron/Renderer
- `src/electron/main.js` → `main.ts`
- `src/electron/preload.cjs` → keep as `.cjs` (CommonJS)
- `src/renderer/*.js` → `.ts`

### Phase 5: Tests
- `tests/**/*.test.js` → `.test.ts`
- Update Playwright config for TS

## JSDoc Patterns Used

```javascript
/**
 * @typedef {Object} KernelState
 * @property {Session} session
 * @property {Registry} registry
 * @property {VoiceSettings} voice
 * @property {Presence} presence
 * @property {SoulOnline} soulOnline
 * @property {WorkspaceLayers} workspace
 */

/**
 * @param {string} intent
 * @param {Overlay} overlay
 * @param {string} view
 * @returns {Action[]}
 */
export function actionsForIntent(intent, overlay, view) { ... }
```

## Running Type Checks
```bash
npx tsc --noEmit           # Full type check
npx tsc --noEmit --watch   # Watch mode
```

## IDE Setup
- VS Code: TypeScript language service auto-detects `tsconfig.json`
- Enable "Check JS" in settings for `.js` files
- Use `@ts-check` at top of files for strict checking

## Blockers
- Electron preload scripts must stay CommonJS (`.cjs`)
- Some dynamic imports need `import()` type annotations
- `node:test` globals need declaration file