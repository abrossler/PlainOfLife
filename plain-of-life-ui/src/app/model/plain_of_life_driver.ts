import { RawAssembler } from '../pol/cells/raw_assembler'
import { ExtPlainOfLife, PlainOfLife } from '../pol/core/plain_of_life'
import { RuleExtensionFactory } from '../pol/core/rule_extension_factory'
import { WinCoherentAreas } from '../pol/rules/win_coherent_areas'
import { TurnListener } from './turn.listener.interface'

export class PlainOfLifeDriver {
  private _plainOfLife: ExtPlainOfLife<RuleExtensionFactory> | null = null
  private _isRunning: boolean = false
  private worker: Worker | null = null
  private turnListeners: TurnListener[] = []
  private interval: number | undefined

  public init(plainWidth: number, plainHeight: number, familyTreeWidth: number, familyTreeHeight: number) {
    this._plainOfLife = PlainOfLife.createNew(
      plainWidth,
      plainHeight,
      WinCoherentAreas,
      RawAssembler,
      familyTreeWidth,
      familyTreeHeight
    )
  }

  public switchToForeground(): boolean {
    if (!this._isRunning  || !this.worker ) {
      return false
    }
    
    console.log('Terminating worker')
    this.worker?.terminate()
    this.worker = null
    this.setInterval()

    return true
  }

  public switchToBackground(): boolean {
    if (!this._isRunning  || this.worker ) {
      return false
    }

    console.log('Starting worker')
    this.worker = new Worker(new URL('./model.worker', import.meta.url))
    this.worker.onmessage = ({ data }) => {
      console.log(`gotPOL`)
      this._plainOfLife = PlainOfLife.createFromSerializable(data)
    }
    this.worker.postMessage({ command: 'setPOL', plainOfLife: this.plainOfLife?.toSerializable() })
    window.clearInterval(this.interval)
    this.interval = undefined
    return true
  }

  public get isRunning(): boolean {
    return this._isRunning
  }

  public start(): void {
    if (this.interval !== undefined) {
      return
    }
    this._isRunning = true
    // Not running if window isn't visible - refer to https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
    this.setInterval()
  }

  private setInterval() {
    this.interval = window.setInterval(() => {
      this.run()
    }, 1)
  }

  public stop(): void {
    if (!this._isRunning) {
      return
    }
    this._isRunning = false
    window.clearInterval(this.interval)
    this.interval = undefined
  }

  public step(): void {
    if (this._isRunning) {
      return
    }
    this.run()
  }

  public addOnTurnListener(listener: TurnListener): void {
    this.turnListeners.push(listener)
  }

  private run(): void {
    if (this.plainOfLife !== null) {
      const timeStampBefore = window.performance.now()
      this.plainOfLife.executeTurn()
      if (this.plainOfLife.currentTurn % 100n === 0n) {
        const dt = window.performance.now() - timeStampBefore
        const cellCount = this.plainOfLife.cellCount
        console.log(
          'Turn: ' +
            this.plainOfLife.currentTurn +
            ' Turn time: ' +
            dt +
            ' For cells:' +
            cellCount +
            ' => Time per cell:' +
            dt / cellCount
        )
      }
    }

    for (const listener of this.turnListeners) {
      listener.onTurnExecuted(this)
    }
  }

  get plainOfLife() {
    return this._plainOfLife
  }
}
