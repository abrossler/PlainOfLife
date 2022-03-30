import { Direction } from '../util/direction'
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
export type ExtPlainField<E extends RuleExtensionFactory> = Pick<
  PlainField<E>,
  'fieldRecord' | 'getCellContainers' | 'isFree' | 'posX' | 'posY' | 'getNeighbor'
>

/**
 * The plain field class - not for direct usage outside of POL core: Outside the module {@link ExtPlainField} shall be used
 */
export class PlainField<E extends RuleExtensionFactory> {
  /** All cell containers placed on the plain field */
  private cellContainers: ExtCellContainer<E>[] = []
  /**
   * The four neighbor fields in this order: North, East, South, West.
   */
  /* Mainly for performance optimization - the access to the neighbor is faster than the access to the two-dimensional plain array with modulo divisions to consider
   * the torus topography.
   */
  neighbors: PlainField<E>[] = [] // Initialized when creating the plain
  /** The X position of the field on the plain */
  /* Mainly for performance optimization - holding the (never changing) position on the plain per field is faster than holding the (changing) position per cell container
  with the need for modulo divisions to stay in the boundaries of the plain when the cell is moving.
   */
  _posX!: number
  /** The Y position of the field on the plain */
  _posY!: number
  /** The field record with rule specific extensions as returned by createNewFieldRecord */
  fieldRecord: ReturnType<E['createNewFieldRecord']>

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
  // For usage outside of the POL core, thus returning ExtCellContainer
  getCellContainers(): Readonly<ExtCellContainer<E>[]> {
    return this.cellContainers
  }

  /**
   * Is the plain field free or is it occupied by one or several cell containers?
   */
  isFree(): boolean {
    return this.cellContainers.length === 0
  }

  /**
   * Get the neighbor plain field in the given direction considering the torus topography of the plain.
   *
   * For example the neighbor in the north of a plain field at the top of the plain is the corresponding field from the very bottom...
   */
  getNeighbor(direction: Direction): ExtPlainField<E> {
    return this.neighbors[direction]
  }

  /** Get the X position of the field on the plain */
  get posX() {
    return this._posX
  }

  /** Get the Y position of the field on the plain */
  get posY() {
    return this._posY
  }
}
