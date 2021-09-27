export abstract class Cell {
  abstract executeTurn(input: Uint8Array, output: Uint8Array): void
  abstract makeChild(): Cell

  initNew():this {
    return this
  }

  initFromSerializable( serializable: unknown ):this {
    return this
  }

  toSerializable( ): unknown{
    return this
  }

}
