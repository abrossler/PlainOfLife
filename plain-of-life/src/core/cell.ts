export abstract class Cell {
    abstract executeTurn( input: Uint8Array, output: Uint8Array ): void
    abstract makeChild() : Cell
}