import { RawAssembler } from '../pol/cells/raw_assembler'
import { ExtPlainOfLife, PlainOfLife } from '../pol/core/plain_of_life'
import { RuleExtensionFactory } from '../pol/core/rule_extension_factory'
import { WinCoherentAreas } from '../pol/rules/win_coherent_areas'
import { ModelModule } from './model.module'
import { TurnListener } from './turn.listener.interface'

export class PlainOfLifeDriver {

  private _plainOfLife: ExtPlainOfLife<RuleExtensionFactory> | null = null
  private turnListeners: TurnListener[] = []
  private interval: number | undefined

  public init(plainWidth: number, plainHeight: number ) {
    this._plainOfLife = PlainOfLife.createNew(plainWidth, plainHeight, WinCoherentAreas, RawAssembler)
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
    this._plainOfLife?.executeTurn()

    for (let listener of this.turnListeners) {
      listener.onTurnExecuted(this)
    }
  }

  get plainOfLife() {
    return this._plainOfLife
  }
}
