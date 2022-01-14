import { RawAssembler } from '../pol/cells/raw_assembler'
import { ExtPlainOfLife, PlainOfLife } from '../pol/core/plain_of_life'
import { RuleExtensionFactory } from '../pol/core/rule_extension_factory'
import { WinCoherentAreas } from '../pol/rules/win_coherent_areas'
import { TurnListener } from './turn.listener.interface'

export class PlainOfLifeDriver {
  private _plainOfLife: ExtPlainOfLife<RuleExtensionFactory> | null = null
  private turnListeners: TurnListener[] = []
  private interval: number | undefined

  public init(plainWidth: number, plainHeight: number, familyTreeWidth: number, familyTreeHeight: number) {
    this._plainOfLife = PlainOfLife.createNew(plainWidth, plainHeight, WinCoherentAreas, RawAssembler, familyTreeWidth, familyTreeHeight)
  }

  public isRunning(): boolean {
    return this.interval !== undefined
  }

  public start(): void {
    if (this.isRunning()) {
      return
    }
    this.interval = window.setInterval(() => {
      this.run()
    }, 1)
  }

  public stop(): void {
    if (!this.isRunning()) {
      return
    }
    window.clearInterval(this.interval)
    this.interval = undefined
  }

  public step(): void {
    if (this.isRunning()) {
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
