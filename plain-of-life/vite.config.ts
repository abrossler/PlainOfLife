import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  // Vitest configuration — runs tests under Vite's pipeline, so the same TS/Svelte
  // setup that builds the app also runs the specs. `globals: true` lets the spec
  // files use `describe`/`it`/`expect`/etc. without explicit imports (matching how
  // the Jasmine-era specs were written, so we don't have to add imports everywhere).
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts']
  }
})
