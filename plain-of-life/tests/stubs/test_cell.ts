import { Cell } from '../../src/core/cell'

export class TestCell extends Cell {
  memory: Uint8Array = new Uint8Array([0, 1, 2, 3, 255])

  executeTurn(input: Uint8Array, output: Uint8Array): void {
    throw new Error('Method not implemented.')
  }
  makeChild(): Cell {
    throw new Error('Method not implemented.')
  }
  initSeedCell(recommendedOutput: Uint8Array): void {
    throw new Error('Method not implemented.')
  }
}
