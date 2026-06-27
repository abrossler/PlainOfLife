import type { ExtPlainOfLife } from '../pol/core/plain_of_life'
import { PlainOfLife } from '../pol/core/plain_of_life'
import type { RuleExtensionFactory } from '../pol/core/rule_extension_factory'
import type { Cell } from '../pol/core/cell'
import type { Rules } from '../pol/core/rules'
import { LogService } from '../pol/util/log.service'

/** Log every n'th turn */
const logTurn = 100n

/**
 * An interface called by the driver whenever a Plain of Life turn was executed in the foreground.
 *
 * Not called during execution in background by a web worker
 */
export interface PolTurnListener {
  onTurnExecuted(): void
}

/**
 * A driver to run a Plain of Life.
 *
 * - provides convenient access to one Plain of Life
 * - schedules the turn execution and emits an event whenever a turn was executed in the foreground
 * - triggers turn execution by a web worker in the background if the tab is not visible
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
   * Reset the driver (without touching the run Plain of Life)
   */
  private reset() {
    this._isRunning = false
    this.worker?.terminate()
    this.worker = null
    if (this.interval) {
      window.clearInterval(this.interval)
    }
    this.interval = undefined
  }

  /**
   * If running, request the latest state from the worker, then terminate it and
   * resume foreground execution from that state.
   */
  private switchToForeground(): void {
    if (!this._plainOfLife || !this.isRunning || !this.worker) {
      return
    }

    this.logger.info('Switching to foreground')
    const workerToTerminate = this.worker
    this.worker = null

    // Ask the worker for its latest state before terminating it.
    // The onmessage handler updates _plainOfLife, then we terminate and start the interval.
    workerToTerminate.onmessage = ({ data }) => {
      this.logger.info('Got final POL from worker - turn ' + data.currentTurn)
      this._plainOfLife = PlainOfLife.createFromSerializable(data)
      workerToTerminate.terminate()
      this.setInterval()
    }
    workerToTerminate.postMessage('flush')
  }

  /**
   * If running, create a new worker, hand it over the POL and stop the turn execution in the foreground.
   *
   * Additionally register a message handler at the worker to regularly get updates of the POL from the worker.
   */
  private switchToBackground(): void {
    if (!this._plainOfLife || !this.isRunning || this.worker) {
      return
    }

    this.logger.debug('Starting worker')
    // Vite worker import syntax: ?worker gives us a constructor that builds the worker module
    this.worker = new PolWorkerCtor()
    this.worker.postMessage(this.plainOfLife?.toSerializable())
    window.clearInterval(this.interval)
    this.interval = undefined
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
      this.logger.info('Turn ' + this.plainOfLife.currentTurn + ' with ' + cellCount + ' cells')
      this.logger.debug('Time per cell: ' + dt / cellCount, false)
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
