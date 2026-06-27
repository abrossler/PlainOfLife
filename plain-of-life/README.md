# Plain of Life

A cellular automaton simulation (Game-of-Life variant) with a Svelte 5 UI.

## Getting Started

```bash
npm install        # Install dependencies
npm run start      # Start Node simulation server + Vite dev server (recommended)
npm run dev        # Vite only — no Node server, falls back to web worker in background
```

Open http://localhost:5173/ in your browser.

### Why two start commands?

When the browser tab is hidden, browsers throttle background execution ~4×. `npm run start` also launches a local Node.js server on `localhost:3001` that runs the simulation at full speed when the tab is hidden — useful for overnight runs. If you don't need that, `npm run dev` is enough.

The Node server is strictly local (`127.0.0.1` only) and not required — the app falls back to a web worker automatically if the server is not running.

## Commands

```bash
npm run build      # Production build → dist/
npm run preview    # Serve the production build locally for spot-checks
npm run check      # Type-check all .svelte and .ts files
npm test           # Run tests in watch mode
npx vitest run     # Run all tests once and exit
```

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
