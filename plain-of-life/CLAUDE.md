# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Maintenance:** Claude should update this file automatically during conversations whenever architectural decisions, constraints, or non-obvious design rationale are discussed and agreed upon. Don't wait to be asked.

## Commands

```bash
npm run dev         # Dev server at http://localhost:5173/ with hot reload
npm run build       # Production build → dist/ (Vite + Rolldown)
npm test            # Vitest in watch mode
npx vitest run      # Run all tests once and exit
npm run check       # svelte-check type check across .svelte and .ts files
npm run preview     # Serve the production build locally for spot-checks
npm run run-pol     # Headless CLI runner (see Headless runner section below)
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
- `src/driver/pol_driver.ts` — framework-agnostic `PolDriver` class. Owns the `ExtPlainOfLife` instance, schedules turn execution via `setInterval(0)`. When the tab is hidden, hands off to a Web Worker (`pol.worker.ts`). No Angular zone tricks needed — Svelte does not run change detection across the app.
- `src/driver/pol.worker.ts` — the web worker; imported in `pol_driver.ts` via Vite's `?worker` suffix, which compiles it as a dedicated worker bundle. Uses a `MessageChannel` self-posting loop (not `setInterval`) to avoid browser timer throttling in background tabs.
- `src/App.svelte` — the single-page UI. Two canvases (plain + family tree), control buttons, and two modal dialogs (restart confirm, family tree scale). Uses Svelte 5 runes (`$state`) for reactivity.
- `src/main.ts` — Svelte 5 mount entry point.

### Headless runner: `src/server/pol_runner.ts`
A standalone CLI for overnight or long-running simulations without a browser. Saves periodic JSON snapshots that can be loaded back in the UI.

```bash
npm run run-pol                                              # use all defaults
npm run run-pol -- --rules "Climate And Chemistry" --turns 500000 --save-every 50000
npm run run-pol -- --load saved-plains/Turn100000_WinCoherentAreas_RawAssembler.json --turns 200000
```

Options and defaults:

| Option | Default |
|---|---|
| `--rules` | `Win Coherent Areas` |
| `--cell` | `Raw Assembler` (seed cell) |
| `--turns` | `1000000` |
| `--save-every` | `100000` |
| `--load <file>` | — |
| `--output-dir` | `saved-plains` |

Plain size is fixed at 250×150 to match the UI. Files are named `Turn<N>_<RulesName>.json`.

### Key patterns
- **Turn listeners**: `App.svelte` registers a `PolTurnListener` on `PolDriver` to repaint canvases after each foreground turn.
- **Rule extension factory**: `RuleExtensionFactory` enables typed per-field rule-specific data attached to `PlainField`.
- **Serialization**: The `SerializablePlainOfLife` wrapper and `src/pol/util/serialization.ts` handle full round-trip save/restore. File save uses the File System Access API (`showSaveFilePicker`) with a fallback to `<a download>` for Firefox.
- **Dual-canvas rendering**: Plain canvas is 250×150 fields × 5px/field = 1250×750px. Family tree canvas is 1250×400px with configurable scale.
- **Background execution**: When the tab is hidden the driver hands off to a web worker (`pol.worker.ts`). The worker uses a `MessageChannel` self-posting loop — no browser timer throttling. When the tab returns, the driver sends a `flush` message to the worker and receives the latest state back.

### Test stubs
`src/test_stubs/` contains shared mocks/stubs for unit tests. Unit tests (`*.spec.ts`) live alongside the files they test inside `src/pol/`. Tests use Vitest's API — `vi.spyOn` rather than Jasmine's `spyOn`, `.mockReturnValue()` rather than `.and.returnValue()`.

## Architectural decisions

These are deliberate constraints — don't suggest alternatives without a strong reason.

### Browser-only execution (production)
The simulation runs entirely in the browser for the production build. Three reasons:
1. **Security**: The long-term vision is a programming game where users supply their own `Cell` and `Rules` subclasses. User code running on a server the owner is responsible for is not safely sandboxable. The browser's V8 sandbox provides this for free.
2. **Cost**: The simulation is CPU/memory intensive and runs indefinitely. One server process per active user would be expensive with no revenue model. The browser offloads computation to the user's own hardware.
3. **UI simplicity**: The two-canvas repaint runs every turn. Running locally avoids streaming state from a server on every turn.

**`src/server/pol_runner.ts` is a dev/research-only local tool** and does not compromise this model:
- Runs entirely on the developer's own machine, produces JSON files, never serves network traffic
- Not part of the production build (`npm run build` produces a browser-only bundle)
- Output files are standard serialized PlainOfLife state — can be loaded in the UI via "Open file"

### Domain layer must stay environment-agnostic
`src/pol/` has no DOM or framework dependencies. This is intentional — it's what makes the web worker and headless runner approaches possible (the same `PlainOfLife` class runs in the main thread, the worker, and Node.js). Never add browser or Svelte dependencies to `src/pol/`.

## History

Migrated from Angular 13 (`../plain-of-life-ui/`) to Svelte 5 + Vite 8 in mid-2026. The domain layer (`pol/`) is unchanged; only the UI shell and driver layer were rewritten. The old Angular project is kept as a reference but no longer maintained.
