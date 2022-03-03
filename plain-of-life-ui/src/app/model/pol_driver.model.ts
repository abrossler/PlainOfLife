import { Injectable, NgZone } from '@angular/core'
import { LogService } from '../log.service'
import { ExtPlainOfLife, PlainOfLife } from '../pol/core/plain_of_life'
import { RuleExtensionFactory } from '../pol/core/rule_extension_factory'
import { Cell } from '../pol/core/cell'
import { Rules } from '../pol/core/rules'
import { saveAs } from 'file-saver'

/** Log every n'th turn */
const logTurn = 100n

/** Milliseconds to wait before a web worker is started to continue with the turn execution in background after the tab became invisible */
const msToWaitBeforeWorkerStart = 5000

/**
 * An interface called by the driver whenever a Plain of Life turn was executed in the foreground.
 *
 * Not called during execution in background by a web worker
 */
export interface PolTurnListener {
  onTurnExecuted(): void
}

/**
 * A driver to run a Plain of Life with an Angular UI.
 *
 * Mainly the diver
 * - provides convenient access for UI components to one Plain of Life
 * - schedules the turn execution and emits an event whenever a turn was executed in the foreground
 * - triggers turn execution by a web worker in the background if the tab is not visible
 */
@Injectable()
export class PolDriver {
  private _plainOfLife: ExtPlainOfLife<RuleExtensionFactory> | null = null
  private _isRunning = false
  private worker: Worker | null = null
  private turnListeners: PolTurnListener[] = []
  private interval: number | undefined

  constructor(private logger: LogService, private ngZone: NgZone) {
    // Depending on visibility, toggle between running the POL turn execution in fore- and background
    // To do so, register for visibility changes...
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.logger.info('Tab became visible')
        this.switchToForeground()
      } else {
        this.logger.info('Tab became invisible')
        setTimeout(() => {
          // Still not visible after timeout
          if (document.visibilityState !== 'visible') {
            this.logger.info('Tab still invisible')
            this.switchToBackground()
          }
        }, msToWaitBeforeWorkerStart)
      }
    })
  }

  /**
   * Init the driver to run a new Plain of Life.
   * @param plainWidth  Width of the plain
   * @param plainHeight Height of the plain
   * @param Rules Constructor to create the rules that apply to the plain
   * @param Cell Constructor to create a first seed cell on the plain that starts reproducing
   * @param familyTreeWidth Height of the family tree
   * @param familyTreeHeight Width of teh family tree
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
   * Save the Plain of Life run by the driver to a local file
   */
  saveToFile(fileName?: string | undefined): void {
    if (!fileName) {
      const date = new Date()
      fileName =
        'Turn' +
        this.plainOfLife.currentTurn +
        '_' +
        this.plainOfLife.getRulesName().replace(/\s/g, '') +
/*        '_' +
        date.getFullYear() +
        '_' +
        ('0' + (date.getMonth() + 1)).slice(-2) +
        '_' +
        ('0' + date.getDate()).slice(-2) +
        '_' +
        ('0' + date.getHours()).slice(-2) +
        ':' +
        ('0' + date.getMinutes()).slice(-2) +*/
        '.json'
    }
    const blob = new Blob([JSON.stringify(this.plainOfLife.toSerializable())])
    saveAs(blob, fileName)
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
   * If running, terminate the worker and schedule the turn execution in the foreground.
   */
  private switchToForeground(): void {
    if (!this._plainOfLife || !this.isRunning || !this.worker) {
      return
    }

    this.logger.info('Switching to foreground')
    this.worker.terminate()
    this.worker = null
    // Run outside Angular to avoid unnecessary change detections each turn
    this.ngZone.runOutsideAngular(() => this.setInterval())
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
    this.worker = new Worker(new URL('./pol.worker', import.meta.url))
    this.worker.onmessage = ({ data }) => {
      this.logger.info(`Got POL from worker - turn ` + data.currentTurn)
      this._plainOfLife = PlainOfLife.createFromSerializable(data)
    }
    this.worker.postMessage(this.plainOfLife?.toSerializable())
    window.clearInterval(this.interval)
    this.interval = undefined
  }

  /** Is the Plain of Life turn execution running or stopped? */
  public get isRunning(): boolean {
    return this._isRunning
  }

  /**
   * Make the Plain og Life run: Start (schedule) the regular turn execution
   */
  public start(): void {
    if (!this._plainOfLife || this.worker !== null || this.interval !== undefined) {
      return
    }
    this._isRunning = true
    // Run outside Angular to avoid unnecessary change detections each turn
    this.ngZone.runOutsideAngular(() => this.setInterval())
  }

  /**
   * Schedule the regular turn execution
   */
  private setInterval() {
    this.interval = window.setInterval(() => {
      this.run()
    }, 0)
  }

  /**
   * Stop the running Plain of Life turn execution
   */
  public stop(): void {
    if (!this._plainOfLife || this.worker !== null || !this._isRunning) {
      return
    }
    this._isRunning = false
    window.clearInterval(this.interval)
    this.interval = undefined
  }

  /**
   * Execute one single Plain of Live turn directly (without scheduling)
   */
  public step(): void {
    if (!this._plainOfLife || this.worker !== null || this._isRunning) {
      return
    }
    this.run()
  }

  /**
   * Register a turn listener that gets a message whenever a Plain of Life turn is executed in foreground
   * @param listener the listener to register
   */
  public addTurnListener(listener: PolTurnListener): void {
    this.turnListeners.push(listener)
  }

  /**
   * Actually execute one Plain of Life turn in foreground
   */
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

  /**
   * Get the Plain of Life run by the driver
   */
  public get plainOfLife(): ExtPlainOfLife<RuleExtensionFactory> {
    if (!this._plainOfLife) {
      throw new Error('plainOfLife must not be accessed before initialization of driver')
    }
    return this._plainOfLife
  }
}
