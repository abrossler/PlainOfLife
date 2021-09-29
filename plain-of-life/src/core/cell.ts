import { defaultToSerializable } from "./serializable_plain_of_life"

export abstract class Cell {
  abstract executeTurn(input: Uint8Array, output: Uint8Array): void
  abstract makeChild(): Cell

  initNew():this {
    return this
  }

  initFromSerializable( serializable: unknown ):this {
    return this
  }

  toSerializable( ): Record<string, unknown>{
    return defaultToSerializable(this)
  }

}
