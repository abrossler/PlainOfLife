import { PlainOfLifeDriver } from './plain_of_life_driver'

export interface TurnListener {
  onTurnExecuted(board: PlainOfLifeDriver): void
}
