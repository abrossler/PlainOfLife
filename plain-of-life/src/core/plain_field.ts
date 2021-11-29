import { ExtCellContainer } from './cell_container'
import { RuleExtensionFactory } from './rule_extension_factory'

/**
 * A field on the plain of life that provides access to the cells located on the field and all rule specific field properties
 * returned by {@link RuleExtensionFactory.createNewFieldRecord}.
 */
/*
 * External plain fields expose all properties and methods that make sense (and safely can be used) outside the
 * POL core
 */
export type ExtPlainField<E extends RuleExtensionFactory> = Pick<PlainField<E>, 'fieldRecord' | 'getCellContainers'>

/**
 * The plain field class - not for direct usage outside of POL core: Outside the module {@link ExtPlainField} shall be used
 */
export class PlainField<E extends RuleExtensionFactory> {
  private cellContainers: ExtCellContainer<E>[] = []
  public fieldRecord: ReturnType<E['createNewFieldRecord']>

  /**
   * Constructor that creates a plain field instance
   */
  constructor(fieldRecordFactory: RuleExtensionFactory) {
    this.fieldRecord = fieldRecordFactory.createNewFieldRecord() as ReturnType<E['createNewFieldRecord']>
  }

  /**
   * Add a cell container to the plain field. One plain field can hold 0 to n cell containers.
   *
   * For POL core internal use only, doesn't ensure consistency with the cell container
   */
  addCellContainer(toAdd: ExtCellContainer<E>): void {
    this.cellContainers.push(toAdd)
  }

  /**
   * Remove a cell container from the plain field.
   *
   * For POL core internal use only, doesn't ensure consistency with the cell container
   */
  removeCellContainer(toRemove: ExtCellContainer<E>): void {
    const index = this.cellContainers.findIndex((cr) => cr === toRemove)
    if (index === -1) {
      throw new Error('Trying to remove not existing cell container. This shall never happen.')
    }
    this.cellContainers.splice(index, 1)
  }

  /**
   * Get all cell containers located on the plain field
   */
  // For usage outside of teh POL core, thus returning ExtCellContainer
  getCellContainers(): Readonly<ExtCellContainer<E>[]> {
    return this.cellContainers
  }
}
