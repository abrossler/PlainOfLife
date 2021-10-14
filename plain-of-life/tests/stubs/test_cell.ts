import { Cell } from '../../src/core/cell'

export class TestCell extends Cell {
  cellId = TestCell.idCounter++
  memory = [0, 1, 2, 3, 255]
  deepObject = { a: { b: 'B' } }

  private static idCounter = 1
  executeTurn(input: Uint8Array, output: Uint8Array): void {
    throw new Error('Method not implemented.')
  }
  makeChild(): Cell {
    return new TestCell()
  }
  initSeedCell(recommendedOutput: Uint8Array): void {
    throw new Error('Method not implemented.')
  }
}
