import { Cell } from '../core/cell'

export class DemoCell implements Cell {
  executeTurn(input: Uint8Array, output: Uint8Array): void {}

  makeChild(): DemoCell {
    return new DemoCell()
  }
}
