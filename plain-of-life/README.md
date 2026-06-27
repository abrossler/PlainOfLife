# Plain of Life

A cellular automaton simulation (Game-of-Life variant) with a Svelte 5 UI.

## Getting Started

```bash
npm install        # Install dependencies
npm run dev        # Dev server at http://localhost:5173/ with hot reload
```

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
