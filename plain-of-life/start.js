/**
 * start.js — launch both the local Node simulation server and the Vite dev server.
 *
 * Usage: node start.js
 * Or:    npm run start
 *
 * The two processes are independent: if the Node server fails to start, Vite still runs
 * and the UI falls back to its web worker for background execution.
 *
 * Ctrl+C kills both processes cleanly.
 */
import { spawn } from 'child_process'

function run(cmd, args, label) {
  // shell: true is required on Windows because npx/npm are .cmd files
  const proc = spawn(cmd, args, { stdio: 'inherit', shell: true })
  proc.on('error', err => console.error(`[${label}] failed to start: ${err.message}`))
  proc.on('exit', code => { if (code) console.log(`[${label}] exited with code ${code}`) })
  return proc
}

const server = run('npx', ['tsx', '--watch', 'src/server/pol_server.ts'], 'pol-server')
const vite   = run('npx', ['vite'], 'vite')

process.on('SIGINT', () => {
  server.kill()
  vite.kill()
  process.exit(0)
})
