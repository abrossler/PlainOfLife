import http from 'http'
import { PlainOfLife } from '../pol/core/plain_of_life.js'
import type { ExtPlainOfLife } from '../pol/core/plain_of_life.js'
import type { RuleExtensionFactory } from '../pol/core/rule_extension_factory.js'
import type { SerializablePlainOfLife } from '../pol/core/serializable_plain_of_life.js'

const PORT = 3001
const logTurn = 100n

/**
 * Session lifecycle note — orphaned sessions:
 *
 * The server has no way to detect that the browser tab or window was closed. HTTP is
 * stateless: when the browser disappears the server simply stops receiving requests.
 * As a result, a session keeps running until the driver sends DELETE /sessions/:id,
 * which only happens when the tab becomes visible again (restoreFromNodeServer calls
 * deleteNodeSession). Cases where the session is never cleaned up:
 *
 *   - Browser tab/window closed while simulation was handed off to the server
 *   - Browser crash
 *   - Computer goes to sleep with the tab hidden
 *   - Vite dev server killed while tab is hidden
 *
 * The standard fix (heartbeat + server-side timeout) was deliberately NOT implemented
 * because any timeout would kill legitimate overnight runs. Accepting orphaned sessions
 * is the right trade-off for a local dev tool: just stop the server (Ctrl+C or kill the
 * terminal) when you are done. The server is idle when no sessions are active, and even
 * an active but orphaned session only burns CPU on your own machine.
 */

/**
 * CORS headers — allow only the Vite dev server.
 * The production build is a static bundle with no server dependency,
 * so these headers are only relevant during development.
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

interface SessionRecord {
  plainOfLife: ExtPlainOfLife<RuleExtensionFactory>
  immediateHandle: ReturnType<typeof setImmediate> | null
}

/**
 * One session per browser tab. Keyed by a UUID generated in PolDriver.
 * Each session runs its own setImmediate loop — no throttling, full CPU speed.
 */
const sessions = new Map<string, SessionRecord>()

function scheduleNext(id: string): void {
  const session = sessions.get(id)
  if (!session) return
  session.immediateHandle = setImmediate(() => runTurn(id))
}

function runTurn(id: string): void {
  const session = sessions.get(id)
  if (!session) return
  const t0 = performance.now()
  session.plainOfLife.executeTurn()
  if (session.plainOfLife.currentTurn % logTurn === 0n) {
    const dt = performance.now() - t0
    const cellCount = session.plainOfLife.cellCount
    const timePerCell = cellCount > 0 ? (dt / cellCount).toFixed(5) : 'n/a'
    console.log(
      `[pol-server] session ${id.slice(0, 8)} turn ${session.plainOfLife.currentTurn} | ${cellCount} cells | ${dt.toFixed(1)} ms/turn | ${timePerCell} ms/cell`
    )
  }
  scheduleNext(id)
}

function startSession(id: string, data: SerializablePlainOfLife): void {
  stopSession(id) // clean up any existing session with same id
  const plainOfLife = PlainOfLife.createFromSerializable(data)
  sessions.set(id, { plainOfLife, immediateHandle: null })
  scheduleNext(id)
  console.log(`[pol-server] session ${id.slice(0, 8)} started at turn ${plainOfLife.currentTurn}`)
}

function stopSession(id: string): void {
  const session = sessions.get(id)
  if (!session) return
  if (session.immediateHandle !== null) clearImmediate(session.immediateHandle)
  sessions.delete(id)
  console.log(`[pol-server] session ${id.slice(0, 8)} stopped`)
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString()))
    req.on('error', reject)
  })
}

/**
 * HTTP API:
 *   POST   /sessions/:id/state  — receive serialized POL, start running it
 *   GET    /sessions/:id/state  — pause loop, snapshot state, resume loop, respond
 *   DELETE /sessions/:id        — stop and remove session
 */
const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders)
    res.end()
    return
  }

  const match = req.url?.match(/^\/sessions\/([^/]+)(\/state)?$/)
  if (!match) {
    res.writeHead(404, corsHeaders)
    res.end()
    return
  }

  const id = match[1]
  const isState = !!match[2]

  try {
    if (req.method === 'POST' && isState) {
      const body = await readBody(req)
      startSession(id, JSON.parse(body) as unknown as SerializablePlainOfLife)
      res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders })
      res.end('{}')

    } else if (req.method === 'GET' && isState) {
      const session = sessions.get(id)
      if (!session) {
        res.writeHead(404, corsHeaders)
        res.end()
        return
      }
      // Pause loop before snapshotting — Node is single-threaded so no actual
      // race is possible, but cancelling the handle keeps the loop clean.
      if (session.immediateHandle !== null) {
        clearImmediate(session.immediateHandle)
        session.immediateHandle = null
      }
      const serializable = session.plainOfLife.toSerializable()
      scheduleNext(id) // restart loop after snapshot
      res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders })
      res.end(JSON.stringify(serializable))

    } else if (req.method === 'DELETE' && !isState) {
      stopSession(id)
      res.writeHead(200, corsHeaders)
      res.end()

    } else {
      res.writeHead(405, corsHeaders)
      res.end()
    }
  } catch (e) {
    console.error('[pol-server] error:', e)
    res.writeHead(500, corsHeaders)
    res.end()
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[pol-server] listening on http://127.0.0.1:${PORT}`)
})
