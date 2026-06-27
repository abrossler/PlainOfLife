# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run start       # Dev server at http://localhost:4200/ with hot reload
npm run build       # Production build → dist/game-of-cells-ui/
npm run test        # Unit tests via Karma + Jasmine (Chrome)
npm run lint        # ESLint with Angular ESLint + Prettier
npm run format      # Prettier formatting
ng e2e              # End-to-end tests via Protractor
```

To run a single test file, use the `--include` flag or focus the spec with `fdescribe`/`fit` in the test file itself.

## Code Style

Configured via `.prettierrc` and `.eslintrc.json`:
- Single quotes, no semicolons, no trailing commas, 2-space indent, 120-char line width
- Component selectors prefixed `app-` (kebab-case); directive selectors prefixed `app` (camelCase)
- `skipTests: true` in `angular.json` — the CLI does **not** generate spec files automatically; create them manually

## Architecture

**Plain of Life** is a cellular automaton simulation (Game-of-Life variant) with an Angular UI. The codebase is split into two largely independent layers:

### Domain layer: `src/app/pol/`
Pure TypeScript with no Angular dependencies — the simulation engine.

- `core/` — the simulation heart: `PlainOfLife` orchestrates a `Plain` (2D grid of `PlainField`s), `CellContainer`s, `FamilyTree`, and pluggable `Rules`. `ExtPlainOfLife` is the public Pick-type that restricts access outside core.
- `cells/` — concrete `Cell` implementations (extend `Cell` to create custom cell behavior)
- `rules/` — concrete `Rules` implementations (extend `Rules` to create custom rule sets)
- `ownership_managers/` — tracks cell ownership of coherent areas
- `util/` — stateless helpers: serialization, flood-fill, RNG, type guards, direction math

`PlainOfLife` uses **BigInt** for turn counting. State can be serialized to/from JSON for file save/load.

### Angular layer
- `model/` — `PolDriver` is an `@Injectable` service that owns the `ExtPlainOfLife` instance, schedules turn execution via `setInterval` **outside the Angular zone** (for performance), and hands off to a **Web Worker** (`pol.worker.ts`) when the browser tab is hidden (with a 5-second grace period before worker start).
- `pol_lab/` — the single interactive UI component. Renders two canvases: the main plain (pixel-painted via `ImageData`) and the family tree (scrolling genealogy view). Bootstraps modals for restart and family tree scale.
- `app.module.ts` / `app.component.ts` — thin root wrappers; real logic is in `PolLabModule`.

### Key patterns
- **Turn listeners**: UI components register `PolTurnListener` on `PolDriver` to react to each foreground turn without Angular change detection overhead.
- **Rule extension factory**: `RuleExtensionFactory` enables typed per-field rule-specific data attached to `PlainField`.
- **Serialization**: The `SerializablePlainOfLife` wrapper and `src/app/pol/util/serialization.ts` handle full round-trip save/restore; `file-saver` drives the browser download.
- **Dual-canvas rendering**: Plain canvas is 250×150 fields × 5px/field = 1250×750px. Family tree canvas is 1250×400px with configurable scale.

### Test stubs
`src/test_stubs/` contains shared mocks/stubs for unit tests. Unit tests (`*.spec.ts`) live alongside the files they test inside `src/app/pol/`.
