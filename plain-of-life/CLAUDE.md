# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev         # Dev server at http://localhost:5173/ with hot reload
npm run build       # Production build → dist/ (Vite + Rolldown)
npm test            # Vitest in watch mode
npx vitest run      # Run all tests once and exit
npm run check       # svelte-check type check across .svelte and .ts files
npm run preview     # Serve the production build locally for spot-checks
```

To run a single test file: `npx vitest run path/to/file.spec.ts`. To focus an individual test, use `describe.only` / `it.only` inside the file.

## Code Style

- Single quotes, no semicolons, 2-space indent (no Prettier config yet — match the existing style by hand)
- Vitest globals (`describe`, `it`, `expect`, `beforeEach`, `vi`, etc.) are enabled via `vitest/globals` in `tsconfig.app.json`, so spec files do not need to import them
- Type-only imports must use `import { type Foo }` syntax — Vite/Rolldown enforces `isolatedModules` strictly, so importing a pure type as a value will break the build

## Architecture

**Plain of Life** is a cellular automaton simulation (Game-of-Life variant) with a Svelte UI. The codebase is split into two largely independent layers:

### Domain layer: `src/pol/`
Pure TypeScript with no framework dependencies — the simulation engine. Lifted unchanged from the previous Angular project.

- `core/` — the simulation heart: `PlainOfLife` orchestrates a `Plain` (2D grid of `PlainField`s), `CellContainer`s, `FamilyTree`, and pluggable `Rules`. `ExtPlainOfLife` is the public Pick-type that restricts access outside core.
- `cells/` — concrete `Cell` implementations (extend `Cell` to create custom cell behavior)
- `rules/` — concrete `Rules` implementations (extend `Rules` to create custom rule sets)
- `ownership_managers/` — tracks cell ownership of coherent areas
- `util/` — stateless helpers: serialization, flood-fill, RNG, type guards, direction math

`PlainOfLife` uses **BigInt** for turn counting. State can be serialized to/from JSON for file save/load.

### UI layer
- `src/driver/pol_driver.ts` — framework-agnostic `PolDriver` class. Owns the `ExtPlainOfLife` instance, schedules turn execution via `setInterval(0)`, and hands off to a **Web Worker** (`pol.worker.ts`) when the browser tab is hidden (5-second grace period before worker start). No Angular zone tricks needed — Svelte does not run change detection across the app.
- `src/driver/pol.worker.ts` — the web worker; imported in `pol_driver.ts` via Vite's `?worker` suffix, which compiles it as a dedicated worker bundle.
- `src/App.svelte` — the single-page UI. Two canvases (plain + family tree), control buttons, and two modal dialogs (restart confirm, family tree scale). Uses Svelte 5 runes (`$state`) for reactivity.
- `src/main.ts` — Svelte 5 mount entry point.

### Key patterns
- **Turn listeners**: `App.svelte` registers a `PolTurnListener` on `PolDriver` to repaint canvases after each foreground turn.
- **Rule extension factory**: `RuleExtensionFactory` enables typed per-field rule-specific data attached to `PlainField`.
- **Serialization**: The `SerializablePlainOfLife` wrapper and `src/pol/util/serialization.ts` handle full round-trip save/restore. File download uses `URL.createObjectURL` + `<a download>` (no `file-saver` dep needed).
- **Dual-canvas rendering**: Plain canvas is 250×150 fields × 5px/field = 1250×750px. Family tree canvas is 1250×400px with configurable scale.
- **Background execution**: The simulation continues running for hours/days. When the browser tab is hidden, work transparently moves to a worker so cells keep evolving.

### Test stubs
`src/test_stubs/` contains shared mocks/stubs for unit tests. Unit tests (`*.spec.ts`) live alongside the files they test inside `src/pol/`. Tests use Vitest's API — `vi.spyOn` rather than Jasmine's `spyOn`, `.mockReturnValue()` rather than `.and.returnValue()`.

## History

Migrated from Angular 13 (`../plain-of-life-ui/`) to Svelte 5 + Vite 8 in mid-2026. The domain layer (`pol/`) is unchanged; only the UI shell and driver layer were rewritten. The old Angular project is kept as a reference but no longer maintained.
