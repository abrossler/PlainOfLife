import { Cell } from '../core/cell'

export class DemoCell extends Cell {
  executeTurn(input: Uint8Array, output: Uint8Array): void {}

  makeChild(): DemoCell {
    return new DemoCell()
  }

  testPublic = 'Public'
  private testPrivate = 'Private'
}

export class DemoCell2 extends Cell {
  executeTurn(input: Uint8Array, output: Uint8Array): void {}

  makeChild(): DemoCell {
    return new DemoCell()
  }
}
