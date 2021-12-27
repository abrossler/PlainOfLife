import { modulo } from '../util/modulo'
import { ExtPlainField, PlainField } from './plain_field'
import { RuleExtensionFactory } from './rule_extension_factory'
import { ExtCellContainer } from './cell_container'

const maxPlainSize = 10000000

/**
 * A plain of plain fields that can be accessed by their x and y coordinates.
 */
/*
 * The external plain exposes all properties and methods that make sense (and safely can be used) outside the
 * POL core
 */
export type ExtPlain<E extends RuleExtensionFactory> = Pick<Plain<E>, 'getAt' | 'width' | 'height'>

/**
 * A plain of plain fields with a torus topography for POL core internal use only ({@link ExtPlain} is for for external use).
 */
export class Plain<E extends RuleExtensionFactory> {
  private readonly array: PlainField<E>[][]

  /**
   * Create a new plain of new plain fields with the size width x height
   */
  constructor(fieldRecordFactory: RuleExtensionFactory, private _width: number, private _height: number) {
    if (_width < 2) {
      throw new Error('The minimum width for a plain of life is 2 but got ' + _width)
    }

    if (_height < 2) {
      throw new Error('The minimum height for a plain of life is 2 but got ' + _height)
    }

    if (!Number.isInteger(_width) || !Number.isInteger(_height)) {
      throw new Error('Width and height for a plain of life must be integer numbers')
    }

    if (_width * _height > maxPlainSize) {
      throw new Error('Plain is too big - width * height must be <= ' + maxPlainSize)
    }

    this.array = Array.from({ length: _width }, () => {
      return Array.from({ length: _height }, () => {
        return new PlainField<E>(fieldRecordFactory)
      })
    })
  }

  /**
   * Get a plain field by it's x and y coordinates. The "plain" has a torus topography meaning that
   * if you leave the plain to the right (with a x coordinate value exceeding the plain size), you automatically enter it from
   * the left. The topography behaves accordingly when leaving to the left, top or bottom...
   */
  getAt(posX: number, posY: number): ExtPlainField<E> {
    return this.getAtInt(posX, posY)
  }

  /**
   * Get a plain field for POL core internal usage by it's x and y coordinates
   */
  getAtInt(posX: number, posY: number): PlainField<E> {
    return this.array[modulo(posX, this._width)][modulo(posY, this._height)]
  }

  /**
   * Get the width of the plain
   */
  get width(): number {
    return this._width
  }

  /**
   * Get the height of the plain
   */
  get height(): number {
    return this._height
  }

  /**
   * Adjust the position of a cell on the plain when moved and do callbacks before.
   * @returns the position (x and y) of the cell after the move
   */
  onCellMove(cellContainer: ExtCellContainer<E>, dX: number, dY: number): [number, number] {
    this.array[cellContainer.posX][cellContainer.posY].removeCellContainer(cellContainer)

    const newX = modulo(cellContainer.posX + dX, this.width)
    const newY = modulo(cellContainer.posY + dY, this.height)

    this.array[newX][newY].addCellContainer(cellContainer)
    return [newX, newY]
  }

  /**
   * If a cell died, remove the container of the cell from the plain and do callbacks before
   */
  onCellDeath(cellContainer: ExtCellContainer<E>): void {
    this.array[cellContainer.posX][cellContainer.posY].removeCellContainer(cellContainer)
  }

  /**
   * If a cell made a child, add the container of the child to the plain and do callbacks before
   * @returns the position (x and y) of the child
   */
  onCellMakeChild(parent: ExtCellContainer<E>, child: ExtCellContainer<E>, dX: number, dY: number): [number, number] {
    return this.addCellContainer(child, parent.posX + dX, parent.posY + dY)
  }

  /**
   * If a cell divided, remove the container of the parent and add the containers of the two children and do callbacks before.
   * @returns the positions (x1, y1, x2, y2) of the two children
   */
  onCellDivide(
    parent: ExtCellContainer<E>,
    child1: ExtCellContainer<E>,
    dX1: number,
    dY1: number,
    child2: ExtCellContainer<E>,
    dX2: number,
    dY2: number
  ): [number, number, number, number] {
    const parentX = parent.posX
    const parentY = parent.posY

    this.array[parentX][parent.posY].removeCellContainer(parent)
    return [
      ...this.addCellContainer(child1, parentX + dX1, parentY + dY1),
      ...this.addCellContainer(child2, parentX + dX2, parentY + dY2)
    ]
  }

  /**
   * If a seed cell is added, add the container of the seed cell to the plain and do callbacks before
   * @returns the position (x and y) of the seed cell modulo the size of the plain
   */
  onSeedCellAdd(cellContainer: ExtCellContainer<E>, posX: number, posY: number): [number, number] {
    return this.addCellContainer(cellContainer, posX, posY)
  }

  /**
   * Add a cell container to the plain at a given position
   * @returns the position (x and y) of the added container modulo the size of the plain
   */
  addCellContainer(cellContainer: ExtCellContainer<E>, posX: number, posY: number): [number, number] {
    posX = modulo(posX, this.width)
    posY = modulo(posY, this.height)

    this.array[posX][posY].addCellContainer(cellContainer)
    return [posX, posY]
  }
}
