import { Cell } from '../../src/core/cell'

/**
 * A simple test cell for test automates
 */
export class TestCell extends Cell {
  private static idCounter = 1
  cellId = TestCell.idCounter++ // Just to easily distinguish test cell instances when debugging

  recommendedOutput: number[] = []
  deepObject = { a: { b: 'B' } }

  // Simplistic execute turn implementation just returning the recommendedOutput
  executeTurn(input: Uint8Array, output: Uint8Array): void {
    const length = Math.min(output.length, this.recommendedOutput.length)
    for (let i = 0; i < length; i++) {
      output[i] = this.recommendedOutput[i]
    }
  }

  // Most simple makeChild implementation possible...
  makeChild(): Cell {
    return new TestCell()
  }

  // Simple initSeedCell just keeping the recommendedOutput
  initSeedCell(inputLength: number, recommendedOutput: Uint8Array): void {
    this.recommendedOutput = [...recommendedOutput]
  }
}
