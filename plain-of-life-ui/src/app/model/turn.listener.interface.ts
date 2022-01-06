import { Board } from './board'

export interface TurnListener {
  onTurnExecuted(board: Board): void
}
