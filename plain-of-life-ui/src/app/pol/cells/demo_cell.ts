import { Cell } from '../core/cell'

export class DemoCell extends Cell {
  standardOutput: Uint8Array | undefined
  initSeedCell(inputLength: number, recommendedOutput: Uint8Array): void {
    this.standardOutput = recommendedOutput
  }

  executeTurn(input: Uint8Array, output: Uint8Array): void {
    if (this.standardOutput) {
      output[0] = 1
    }
  }

  makeChild(): DemoCell {
    return new DemoCell()
  }

  testPublic = 'Public'
  private testPrivate = 'Private'
}

export class DemoCell2 extends Cell {
  standardOutput: Uint8Array | undefined
  initSeedCell(inputLength: number, recommendedOutput: Uint8Array): void {
    this.standardOutput = recommendedOutput
  }

  executeTurn(input: Uint8Array, output: Uint8Array): void {
    if (this.standardOutput) {
      output[0] = 1
    }
  }

  makeChild(): DemoCell {
    return new DemoCell()
  }
}
