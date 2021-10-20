import { defaultSerialization } from '../core/default_serialization'
import { CellContainers, ExtCellContainer } from './cell_container'
import { ExtPlain } from './plain'
import { RuleExtensionFactory } from './rule_extension_factory'

/**
 * The abstract super class for all Plain of Life rules.
 *
 * Implement your own Plain of Life rule set by deriving your rules class.
 */
export abstract class Rules<E extends RuleExtensionFactory> implements RuleExtensionFactory {
  /**
   * Finalize the initialization of new rules after the plain and cell containers are initialized.
   *
   * Override if needed by your rules. An example could be a rule specific 'owner' property on plain field level that needs to
   * be initialized with the container of the cell sitting on the plain field.
   * @param plain The plain with all plain fields
   * @param cellContainers The container list of all alive cells
   */
  /* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function */
  initNew(plain: ExtPlain<E>, cellContainers: CellContainers<E>): void {}
  /* eslint-enable @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function */

  /**
   * Init new rules from serializable rules as returned by {@link toSerializable}. Used during plain of life
   * de-serialization.
   *
   * Override if {@link defaultFromSerializable} is not sufficient e.g. because of circular object references in your rules.
   */
  initFromSerializable(serializable: Record<string, unknown>): void {
    Object.assign(this, defaultSerialization.fromSerializable(serializable))
  }

  /**
   * Convert the rules to a serializable format e.g. by flattening circular references (if there are any). Used during plain
   * of life serialization.
   *
   * Override if {@link defaultToSerializable} is not sufficient e.g. because of circular object references in your rules
   * @returns a serializable format of the rules as supported by {@link JSON.stringify}
   */
  toSerializable(): Record<string, unknown> {
    return defaultSerialization.toSerializable(this as Record<string, unknown>)
  }

  /**
   * The main method to implement your own Plain of Life rule set.
   * @param plain The plain to access all plain fields by x and y coordinates
   * @param cellContainers The container of all alive cells to iterate over the cells, prepare the input, call executeTurn of
   * the cell and process the output
   */
  abstract executeTurn(currentTurn: bigint, plain: ExtPlain<E>, cellContainers: CellContainers<E>): void

  /**
   * Provide an object with all rule specific properties you want to add as cell record to all cell containers.
   *
   * Typical examples might be cellEnergy: number, cellAge: number or any other attribute required by your rules for each cell
   * to execute a turn.
   */
  abstract createNewCellRecord(): ReturnType<E['createNewCellRecord']>

  /**
   * If a seed call is added to a plain of life, this cell had no chance yet to 'learn' what's a good output according to your
   * rules. So provide an output that ensures at least survival if constantly returned every turn at the beginning.
   */
  abstract getRecommendedSeedCellOutput(): Uint8Array

  /**
   * Init a cell record from a serializable cell record as returned by {@link cellRecordToSerializable}. Used during plain
   * of life de-serialization.
   *
   * Override if {@link defaultFromSerializable} is not sufficient.
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
    Object.assign(toInit, defaultSerialization.fromSerializable(serializable, allCellContainers))
  }

  /**
   * Convert a cell record to a serializable format e.g. by flattening circular references (if there are any). Used during plain
   * of life serialization.
   *
   * Override if {@link defaultToSerializable} is not sufficient.
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
    return defaultSerialization.toSerializable(cellRecord, allCellContainers)
  }

  /**
   * Provide an object with all rule specific properties you want to add as field record to all plain fields.
   *
   * Typical examples might be fieldTemperature: number, fieldFood: Food or any other attribute required by your rules for each
   * plain field to execute a turn.
   */
  abstract createNewFieldRecord(): ReturnType<E['createNewFieldRecord']>

  /**
   * Init a field record from a serializable field record as returned by {@link fieldRecordToSerializable}. Used during plain
   * of life de-serialization.
   *
   * Override if {@link defaultFromSerializable} is not sufficient.
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
    Object.assign(toInit, defaultSerialization.fromSerializable(serializable, allCellContainers))
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
    return defaultSerialization.toSerializable(fieldRecord, allCellContainers)
  }
}
