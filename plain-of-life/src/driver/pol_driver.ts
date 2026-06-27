import type { ExtPlainOfLife } from '../pol/core/plain_of_life'
import { PlainOfLife } from '../pol/core/plain_of_life'
import type { RuleExtensionFactory } from '../pol/core/rule_extension_factory'
import type { Cell } from '../pol/core/cell'
import type { Rules } from '../pol/core/rules'
import type { SerializablePlainOfLife } from '../pol/core/serializable_plain_of_life'
import { LogService } from '../pol/util/log.service'

/** Log every n'th turn */
const logTurn = 100n

/**
 * An interface called by the driver whenever a Plain of Life turn was executed in the foreground.
 *
 * Not called during execution in background by a web worker or Node server.
 */
export interface PolTurnListener {
  onTurnExecuted(): void
}

/**
 * A driver to run a Plain of Life.
 *
 * - provides convenient access to one Plain of Life
 * - schedules the turn execution and emits an event whenever a turn was executed in the foreground
 * - on tab hide: hands off to a local Node server (localhost:3001) if available, otherwise falls
 *   back to a web worker
 * - on tab show: fetches latest state from whichever backend was running
 *
 * Framework-agnostic: no Angular dependencies.
 */
export class PolDriver {
  private _plainOfLife: ExtPlainOfLife<RuleExtensionFactory> | null = null
  private _isRunning = false
  private worker: Worker | null = null
  private turnListeners: PolTurnListener[] = []
  private interval: number | undefined
  private logger = new LogService()

  /** Unique ID for this tab's simulation session on the Node server */
  private readonly sessionId: string = crypto.randomUUID()
  /** Which backend is currently running the simulation, or null when in foreground */
  private backendMode: 'node' | 'worker' | null = null
  /** True while switchToBackground is mid-flight (between clearInterval and backend confirmed) */
  private switchingToBackground = false
  private readonly NODE_SERVER = 'http://localhost:3001'
  /** How long to wait for the Node server to respond before falling back to web worker */
  private readonly NODE_TIMEOUT_MS = 5000

  constructor() {
    // Depending on visibility, toggle between running the POL turn execution in fore- and background
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.logger.info('Tab became visible')
        this.switchToForeground()
      } else {
        this.logger.info('Tab became invisible')
        this.switchToBackground()
      }
    })
  }

  /**
   * Init the driver to run a new Plain of Life.
   */
  public init(
    plainWidth: number,
    plainHeight: number,
    Rules: new () => Rules<RuleExtensionFactory>,
    Cell: new () => Cell,
    familyTreeWidth: number,
    familyTreeHeight: number
  ) {
    this._plainOfLife = PlainOfLife.createNew(plainWidth, plainHeight, Rules, Cell, familyTreeWidth, familyTreeHeight)
    this.reset()
  }

  /**
   * Save the Plain of Life run by the driver to a local file.
   *
   * Uses the File System Access API (showSaveFilePicker) when available — gives a native Save dialog.
   * Falls back to a programmatic <a download> click for browsers that don't support it (e.g. Firefox).
   */
  async saveToFile(fileName?: string | undefined): Promise<void> {
    if (!fileName) {
      fileName = 'Turn' + this.plainOfLife.currentTurn + '_' + this.plainOfLife.getRulesName().replace(/\s/g, '') + '.json'
    }
    const json = JSON.stringify(this.plainOfLife.toSerializable())

    if ('showSaveFilePicker' in window) {
      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [{ description: 'Plain of Life JSON', accept: { 'application/json': ['.json'] } }],
      })
      const writable = await fileHandle.createWritable()
      await writable.write(json)
      await writable.close()
    } else {
      const blob = new Blob([json])
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  /**
   * Open a saved Plain of Live from a file and run it by the driver
   */
  openFromFile(file: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onloadend = () => {
        try {
          const fileContent = reader.result as string
          this._plainOfLife = PlainOfLife.createFromSerializable(JSON.parse(fileContent))
        } catch (e) {
          reject(e)
        }
        this.reset()
        resolve()
      }
      reader.onerror = () => reject(new Error('Failed to read file'))

      reader.readAsText(file)
    })
  }

  /**
   * Reset the driver (without touching the running Plain of Life).
   * Cleans up any active Node server session or web worker.
   */
  private reset() {
    this._isRunning = false
    if (this.backendMode === 'node') this.deleteNodeSession()
    this.backendMode = null
    this.switchingToBackground = false
    this.worker?.terminate()
    this.worker = null
    if (this.interval) {
      window.clearInterval(this.interval)
    }
    this.interval = undefined
  }

  /**
   * On tab becoming visible: fetch latest state from the Node server (if that's what's running)
   * or flush from the web worker, then resume foreground execution.
   */
  private async switchToForeground(): Promise<void> {
    // If switchingToBackground is in flight, the visibilityState check there will handle the abort
    if (!this._plainOfLife || !this.isRunning || this.backendMode === null) return

    this.logger.info('Switching to foreground from mode: ' + this.backendMode)
    const mode = this.backendMode
    this.backendMode = null // clear immediately to prevent re-entrant calls

    if (mode === 'node') {
      await this.restoreFromNodeServer()
    } else {
      // Web worker path — existing flush protocol
      const w = this.worker!
      this.worker = null
      w.onmessage = ({ data }) => {
        this.logger.info('Got final POL from worker - turn ' + data.currentTurn)
        this._plainOfLife = PlainOfLife.createFromSerializable(data)
        w.terminate()
        this.setInterval()
      }
      w.postMessage('flush')
    }
  }

  /**
   * On tab becoming invisible: try to hand off to the local Node server first.
   * If the server is not reachable within NODE_TIMEOUT_MS, fall back to a web worker.
   *
   * clearInterval is called synchronously before any async work so the foreground
   * loop stops immediately regardless of which backend is chosen.
   */
  private async switchToBackground(): Promise<void> {
    if (!this._plainOfLife || !this.isRunning || this.backendMode !== null || this.switchingToBackground) return

    // Stop foreground loop synchronously before any async work
    window.clearInterval(this.interval)
    this.interval = undefined
    this.switchingToBackground = true

    const t0 = performance.now()
    const serializable = this.plainOfLife.toSerializable()
    const json = JSON.stringify(serializable)
    this.logger.info(`Serialized state: ${(json.length / 1024).toFixed(1)} KB in ${(performance.now() - t0).toFixed(0)} ms`)

    if (await this.tryNodeServer(json)) {
      this.switchingToBackground = false
      // If the tab became visible again during the probe, don't go to background
      if (document.visibilityState === 'visible') {
        this.logger.info('Tab became visible during Node probe — resuming foreground')
        this.setInterval()
        return
      }
      this.backendMode = 'node'
      this.logger.info('Background: Node server session ' + this.sessionId)
    } else {
      this.switchingToBackground = false
      if (document.visibilityState === 'visible') {
        this.logger.info('Tab became visible during worker fallback — resuming foreground')
        this.setInterval()
        return
      }
      this.backendMode = 'worker'
      this.logger.info('Background: web worker fallback')
      this.worker = new PolWorkerCtor()
      this.worker.postMessage(serializable)  // worker accepts SerializablePlainOfLife object
    }
  }

  /**
   * POST the pre-serialized JSON to the Node server.
   * Returns true if the server accepted it, false if unreachable or too slow.
   */
  private async tryNodeServer(json: string): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), this.NODE_TIMEOUT_MS)
      const t0 = performance.now()
      const res = await fetch(`${this.NODE_SERVER}/sessions/${this.sessionId}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: json,
        signal: controller.signal,
      })
      clearTimeout(timeout)
      this.logger.info(`Node server POST: ${res.status} in ${(performance.now() - t0).toFixed(0)} ms`)
      return res.ok
    } catch (e) {
      this.logger.info('Node server not reachable: ' + e)
      return false
    }
  }

  /**
   * GET the latest state from the Node server, deserialize it, then clean up the session.
   * Falls back to the last known local state if the server is unreachable.
   * Always resumes the foreground interval in the finally block.
   */
  private async restoreFromNodeServer(): Promise<void> {
    try {
      const res = await fetch(`${this.NODE_SERVER}/sessions/${this.sessionId}/state`)
      if (res.ok) {
        const data = await res.json() as SerializablePlainOfLife
        this.logger.info('Got final POL from Node server - turn ' + data.currentTurn)
        this._plainOfLife = PlainOfLife.createFromSerializable(data)
      } else {
        this.logger.info('Node server GET failed ' + res.status + ', keeping last known state')
      }
    } catch (e) {
      this.logger.info('Node server unreachable on return: ' + e)
    } finally {
      this.deleteNodeSession()
      this.setInterval()
    }
  }

  /** Fire-and-forget DELETE to clean up the session on the Node server. */
  private deleteNodeSession(): void {
    fetch(`${this.NODE_SERVER}/sessions/${this.sessionId}`, { method: 'DELETE' }).catch(() => {})
  }

  public get isRunning(): boolean {
    return this._isRunning
  }

  public start(): void {
    if (!this._plainOfLife || this.worker !== null || this.interval !== undefined) {
      return
    }
    this._isRunning = true
    this.setInterval()
  }

  private setInterval() {
    this.interval = window.setInterval(() => {
      this.run()
    }, 0)
  }

  public stop(): void {
    if (!this._plainOfLife || this.worker !== null || !this._isRunning) {
      return
    }
    this._isRunning = false
    window.clearInterval(this.interval)
    this.interval = undefined
  }

  public step(): void {
    if (!this._plainOfLife || this.worker !== null || this._isRunning) {
      return
    }
    this.run()
  }

  public addTurnListener(listener: PolTurnListener): void {
    this.turnListeners.push(listener)
  }

  private run(): void {
    const timeStampBefore = performance.now()
    this.plainOfLife.executeTurn()
    if (this.plainOfLife.currentTurn % logTurn === 0n) {
      const dt = performance.now() - timeStampBefore
      const cellCount = this.plainOfLife.cellCount
      const timePerCell = cellCount > 0 ? (dt / cellCount).toFixed(5) : 'n/a'
      this.logger.info(`Turn ${this.plainOfLife.currentTurn} | ${cellCount} cells | ${dt.toFixed(1)} ms/turn | ${timePerCell} ms/cell`)
    }

    for (const listener of this.turnListeners) {
      listener.onTurnExecuted()
    }
  }

  public get plainOfLife(): ExtPlainOfLife<RuleExtensionFactory> {
    if (!this._plainOfLife) {
      throw new Error('plainOfLife must not be accessed before initialization of driver')
    }
    return this._plainOfLife
  }
}

// Vite-specific worker import. The ?worker suffix tells Vite to compile the file as a
// dedicated web worker and give us a default-exported constructor for it.
import PolWorkerCtor from './pol.worker.ts?worker'
