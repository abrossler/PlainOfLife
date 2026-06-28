# Plain of Life

A cellular automaton simulation (Game-of-Life variant) with a Svelte 5 UI.

## Getting Started

```bash
npm install      # Install dependencies
npm run dev      # Dev server at http://localhost:5173/ with hot reload
```

Open http://localhost:5173/ in your browser.

## Commands

```bash
npm run build      # Production build → dist/
npm run preview    # Serve the production build locally for spot-checks
npm run check      # Type-check all .svelte and .ts files
npm test           # Run tests in watch mode
npx vitest run     # Run all tests once and exit
```

## Headless runner

For overnight or long simulation runs without the browser:

```bash
npm run run-pol                       # all defaults: Win Coherent Areas, Raw Assembler, 1M turns
npm run run-pol -- --turns 500000 --save-every 50000
npm run run-pol -- --rules "Climate And Chemistry" --cell "Raw Assembler" --turns 200000
npm run run-pol -- --load saved-plains/Turn100000_WinCoherentAreas_RawAssembler.json --turns 500000
```

| Option | Default | Description |
|---|---|---|
| `--rules <name>` | `Win Coherent Areas` | Rules class (case-insensitive) |
| `--cell <name>` | `Raw Assembler` | Seed cell class (case-insensitive) |
| `--turns <n>` | `1000000` | Total turns to run |
| `--save-every <n>` | `100000` | Save a snapshot every N turns |
| `--load <file>` | — | Load saved JSON instead of starting new |
| `--output-dir <dir>` | `saved-plains` | Where to write snapshot files |

Plain size is fixed at 250×150 to match the UI. The seed cell sets the starting population — rules determine what cell types may appear during evolution.

Snapshots are named `Turn<N>_<RulesName>.json` and can be loaded back in the browser UI via the "Open file" button.

## Running a single test file

```bash
npx vitest run path/to/file.spec.ts
```

To focus an individual test, use `describe.only` / `it.only` inside the file.

## Tech Stack

- [Svelte 5](https://svelte.dev/) + [Vite](https://vitejs.dev/) + TypeScript
- [Vitest](https://vitest.dev/) for unit tests

## Recommended IDE

[VS Code](https://code.visualstudio.com/) + [Svelte extension](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode)
