/**
 * Abstract super class for any cell living on a plain of life.
 *
 * Implement your own Plain of Life cells by deriving a sub class.
 */
export abstract class Cell {
  /**
   * Execute a turn: Calculate an output based on an input and the internal state of the cell. The meaning of the input and the
   * output depends an the used {@link Rules}. The cell implementation shall not be aware of this meaning and work for any
   * rules.
   *
   * The method is called VERY frequently - thus take care for performance with your implementation.
   */
  abstract executeTurn(input: Uint8Array, output: Uint8Array): void

  /**
   * Make a child: The child shall be a copy of the parent cell (making the child) with slight random variations so that
   * the child calculates the output in {@link executeTurn} slightly different than the parent.
   *
   * This random change might be an advantage according to the {@link Rules} so that the child (and it's children) have
   * a better chance to survive and reproduce. Or it might be a disadvantage and the child's branch in the family tree will
   * die out
   * @returns a child cell. The child is expected to be a new instance of the same class as the parent cell
   */
  abstract makeChild(): Cell

  /**
   * Init a seed cell after creation. A seed cell is a cell that is added initially to a new plain of life and that is not
   * created by {@link makeChild}
   *
   * @param recommendedOutput as the initial {@link executeTurn} output recommended by the rules for a seed cell to survive
   */
  abstract initSeedCell(recommendedOutput: Uint8Array): void

  /**
   * Init a new cell from a serializable cell as returned by {@link toSerializable}. Used during plain of life
   * de-serialization.
   *
   * Override if {@link defaultFromSerializable} is not sufficient e.g. because of circular object references in your cell
   */
  initFromSerializable(serializable: Record<string, unknown>): void {
    Object.assign(this, JSON.parse(JSON.stringify(serializable)))
  }

  /**
   * Convert a cell to a serializable format e.g. by flattening circular references (if there are any). Used during plain
   * of life serialization
   *
   * Override if {@link defaultToSerializable} is not sufficient e.g. because of circular object references in your cell
   * @returns a serializable format of the cell as supported by {@link JSON.stringify}
   */
  toSerializable(): Record<string, unknown> {
    // How to support typed arrays (Uint8Array...) https://gist.github.com/jonathanlurie/04fa6343e64f750d03072ac92584b5df
    return JSON.parse(JSON.stringify(this))
  }
}
