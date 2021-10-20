import { Cell } from '../../src/core/cell'

export class TestCell extends Cell {
  private static idCounter = 1

  cellId = TestCell.idCounter++
  recommendedOutput: number[] = []
  deepObject = { a: { b: 'B' } }
  initSeedCellPassed = false

  executeTurn(input: Uint8Array, output: Uint8Array): void {
    let length = Math.min(output.length, this.recommendedOutput.length)
    for (let i = 0; i < length; i++) {
      output[i] = this.recommendedOutput[i]
    }
  }
  makeChild(): Cell {
    return new TestCell()
  }
  initSeedCell(recommendedOutput: Uint8Array): void {
    this.recommendedOutput = [...recommendedOutput]
    this.initSeedCellPassed = true
  }
}
