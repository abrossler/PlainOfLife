import { Serialization } from './default_serialization'
import { CellContainer, CellContainers, ExtCellContainer } from './cell_container'
import { ExtPlain } from './plain'
import { RuleExtensionFactory } from './rule_extension_factory'

/**
 * The abstract super class for all Plain of Life rules.
 *
 * Implement your own Plain of Life rule set by deriving your rules class. Typically use your class as RuleExtensionFactory:
 *
 * class MyRules extends Rules\<MyRules\>
 */
export abstract class Rules<E extends RuleExtensionFactory> implements RuleExtensionFactory {
  /**
   * Initialize the new rules after the plain was initialized.
   *
   * Override if needed by your rules. For example you might register for the plain listeners to cell events here...
   * @param plain The plain with all plain fields
   */
  /* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function */
  initNew(plain: ExtPlain<E>): void {}
  /* eslint-enable @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function */

  /**
   * Init new rules from serializable rules as returned by {@link toSerializable}. Used during plain of life
   * de-serialization.
   *
   * Override if default serialization is not sufficient e.g. because of circular object references in your rules.
   */
  initFromSerializable(serializable: Record<string, unknown>, plain: ExtPlain<E>): void {
    Object.assign(this, Rules.createDefaultSerialization().fromSerializable(serializable))
  }

  /**
   * Convert the rules to a serializable format e.g. by performing a Base4 encoding to typed arrays. Used during plain
   * of life serialization.
   *
   * Override if default serialization is not sufficient e.g. because of circular object references in your rules.
   * @returns a serializable format of the rules as supported by {@link JSON.stringify}
   */
  toSerializable(): Record<string, unknown> {
    return Rules.createDefaultSerialization().toSerializable(this as Record<string, unknown>)
  }

  /**
   * The main method to implement your own Plain of Life rule set.
   * @param plain The plain to access all plain fields by x and y coordinates
   * @param cellContainers The container of all alive cells to iterate over the cells, prepare the input, call executeTurn of
   * the cell and process the output
   */
  abstract executeTurn(plain: ExtPlain<E>, cellContainers: CellContainers<E>, currentTurn: bigint): void

  /**
   * Provide an object with all rule specific properties you want to add as cell record to all cell containers.
   *
   * Typical examples might be cellEnergy: number, cellAge: number or any other attribute required by your rules for each cell
   * to execute a turn.
   */
  abstract createNewCellRecord(): ReturnType<E['createNewCellRecord']>

  /**
   * If a seed cell is added to a plain of life, this cell had no chance yet to 'learn' what's a good output according to your
   * rules. So provide an output that ensures at least survival if constantly returned every turn at the beginning.
   *
   * Additionally it's very useful for the cell to know the length of the input upfront. The cell can expect the length
   * to be constant - so it must not change between turns...
   */
  abstract getSeedCellHints(): { inputLength: number; recommendedSeedCellOutput: Uint8Array }

  /**
   * Init a cell record from a serializable cell record. Used during plain of life de-serialization.
   *
   * Override if default serialization is not sufficient.
   *
   * @param toInit Cell record to init
   * @param serializable Serializable cell record to init from
   * @param allCellContainers In case the cell record contains cell container references: All containers to get the referenced cell
   * container from the serialized index.
   */
  initCellRecordFromSerializable(
    toInit: ReturnType<E['createNewCellRecord']>,
    serializable: Record<string, unknown>,
    allCellContainers: ExtCellContainer<E>[]
  ): void {
    Object.assign(toInit, Rules.createDefaultSerialization(allCellContainers).fromSerializable(serializable))
  }

  /**
   * Convert a cell record to a serializable format e.g. by Base4 encoding typed arrays. Used during plain of life serialization.
   *
   * Override if default serialization is not sufficient.
   *
   * @param cellRecord The cell record to be converted
   * @param allCellContainers If the cell record contains cell container references: All containers to find the index of the
   * cell container for serialization.
   * @returns a serializable format of the cell record as supported by {@link JSON.stringify}
   */
  cellRecordToSerializable(
    cellRecord: ReturnType<E['createNewCellRecord']>,
    allCellContainers: ExtCellContainer<E>[]
  ): Record<string, unknown> {
    return Rules.createDefaultSerialization(allCellContainers).toSerializable(cellRecord)
  }

  /**
   * Provide an object with all rule specific properties you want to add as field record to all plain fields.
   *
   * Typical examples might be fieldTemperature: number, fieldFood: Food or any other attribute required by your rules for each
   * plain field to execute a turn.
   */
  abstract createNewFieldRecord(): ReturnType<E['createNewFieldRecord']>

  /**
   * Init a field record from a serializable field record. Used during plain of life de-serialization.
   *
   * Override if default serialization is not sufficient.
   *
   * @param toInit Field record to init
   * @param serializable Serializable field record to init from
   * @param allCellContainers In case the field record contains cell container references: All containers to get the cell
   * container from the serialized index.
   */
  initFieldRecordFromSerializable(
    toInit: ReturnType<E['createNewFieldRecord']>,
    serializable: Record<string, unknown>,
    allCellContainers: ExtCellContainer<E>[]
  ): void {
    Object.assign(toInit, Rules.createDefaultSerialization(allCellContainers).fromSerializable(serializable))
  }

  /**
   * Convert a field record to a serializable format e.g. by flattening circular references (if there are any). Used during plain
   * of life serialization.
   *
   * Override if {@link defaultToSerializable} is not sufficient.
   *
   * @param fieldRecord The field record to be converted
   * @param allCellContainers In case the field record contains cell container references: All containers to find the index of
   * the cell container for serialization.
   * @returns a serializable format of the field record as supported by {@link JSON.stringify}
   */
  fieldRecordToSerializable(
    fieldRecord: ReturnType<E['createNewFieldRecord']>,
    allCellContainers: ExtCellContainer<E>[]
  ): Record<string, unknown> {
    return Rules.createDefaultSerialization(allCellContainers).toSerializable(fieldRecord)
  }

  /**
   * Create a new Serialization object that replaces cell container instances with the index of the cell container in an array if such an array is provided.
   * @param allCellContainers Array of all cell containers
   * @returns The new Serialization object
   */
  private static createDefaultSerialization(
    allCellContainers?: ExtCellContainer<RuleExtensionFactory>[]
  ): Serialization {
    const serialization = new Serialization()
    if (allCellContainers) {
      serialization.addIndexer(
        CellContainer as new () => CellContainer<RuleExtensionFactory>,
        '__CellRecord__',
        allCellContainers
      )
    }

    return serialization
  }
}
