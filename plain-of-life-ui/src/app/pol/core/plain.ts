import { modulo } from '../util/modulo'
import { ExtPlainField, PlainField } from './plain_field'
import { RuleExtensionFactory } from './rule_extension_factory'
import { ExtCellContainer } from './cell_container'
import { removeFromArray } from '../util/array_helper'

const maxPlainSize = 10000000

/**
 * A plain of plain fields that can be accessed by their x and y coordinates.
 */
/*
 * The external plain exposes all properties and methods that make sense (and safely can be used) outside the
 * POL core
 */
export type ExtPlain<E extends RuleExtensionFactory> = Pick<
  Plain<E>,
  | 'getAt'
  | 'width'
  | 'height'
  | 'addSeedCellAddListener'
  | 'removeSeedCellAddListener'
  | 'addCellMoveListener'
  | 'removeCellMoveListener'
  | 'addCellMakeChildListener'
  | 'removeCellMakeChildListener'
  | 'addCellDivideListener'
  | 'removeCellDivideListener'
  | 'addCellDeathListener'
  | 'removeCellDeathListener'
>

/**
 * Listener on added seed cells
 */
export interface SeedCellAddListener<E extends RuleExtensionFactory> {
  /**
   * Method called for registered listeners after a seed cell was added to the plain.
   * @param cellContainer of the added seed cell
   */
  onSeedCellAdd(cellContainer: ExtCellContainer<E>): void
}

/**
 * Listener on cells moved to an arbitrary position
 */
export interface CellMoveListener<E extends RuleExtensionFactory> {
  /**
   * Method called for registered listeners after a cell was moved.
   *
   * @param cellContainer The container of the moved cell
   * @param from The field the container was placed on before the move
   */
  onCellMove(cellContainer: ExtCellContainer<E>, from: ExtPlainField<E>): void
}

/**
 * Listener on cells making a child
 */
export interface CellMakeChildListener<E extends RuleExtensionFactory> {
  /**
   * Method called for registered listeners after a cell made a child
   * @param child container of the child cell
   * @param parent container of the parent cell
   */
  onCellMakeChild(child: ExtCellContainer<E>, parent: ExtCellContainer<E>): void
}

/**
 * Listener on cells dividing in two children
 */
export interface CellDivideListener<E extends RuleExtensionFactory> {
  /**
   * Method called for registered listeners after a parent cell divided in two children. Note that the parent dies when dividing.
   *
   * @param parent container of the (dead) parent cell
   * @param child1 container of the first child
   * @param child2 container of the second child
   */
  onCellDivide(parent: ExtCellContainer<E>, child1: ExtCellContainer<E>, child2: ExtCellContainer<E>): void
}

/**
 * Listener on the death of cells
 */
export interface CellDeathListener<E extends RuleExtensionFactory> {
  /**
   * Method called for registered listeners after a cell died
   * @param cellContainer of the cell that died
   */
  onCellDeath(cellContainer: ExtCellContainer<E>): void
}

/**
 * A plain of plain fields with a torus topography for POL core internal use only ({@link ExtPlain} is for for external use).
 */
export class Plain<E extends RuleExtensionFactory> {
  private readonly array: PlainField<E>[][]
  private _cellCount = 0

  // All registered listeners for cell events
  private seedCellAddListeners: SeedCellAddListener<E>[] = []
  private cellMoveListeners: CellMoveListener<E>[] = []
  private cellMakeChildListeners: CellMakeChildListener<E>[] = []
  private cellDivideListeners: CellDivideListener<E>[] = []
  private cellDeathListeners: CellDeathListener<E>[] = []

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

    this.array = Array.from({ length: _height }, () => {
      return Array.from({ length: _width }, () => {
        return new PlainField<E>(fieldRecordFactory)
      })
    })

    for (let x = 0; x < _width; x++) {
      for (let y = 0; y < _height; y++) {
        const field = this.array[y][x]
        field._posX = x
        field._posY = y
        field.neighbors.push(this.getAtInt(x, y - 1)) // North
        field.neighbors.push(this.getAtInt(x + 1, y)) // East
        field.neighbors.push(this.getAtInt(x, y + 1)) // South
        field.neighbors.push(this.getAtInt(x - 1, y)) // West
      }
    }
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
    return this.array[modulo(posY, this._height)][modulo(posX, this._width)]
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
   * Get the number of cells living on the plain
   */
  get cellCount(): number {
    return this._cellCount
  }

  /**
   * Add a cell container to the plain
   */
  addCellContainer(cellContainer: ExtCellContainer<E>): void {
    this._cellCount++
    const to = cellContainer.plainField
    this.array[to.posY][to.posX].addCellContainer(cellContainer)
  }

  /**
   * Remove a cell container from the plain
   */
  removeCellContainer(cellContainer: ExtCellContainer<E>): void {
    this._cellCount--
    const from = cellContainer.plainField
    this.array[from.posY][from.posX].removeCellContainer(cellContainer)
  }

  /**
   * If a seed cell is added, add the container of the seed cell to the plain and notify registered listeners
   */
  onSeedCellAdd(cellContainer: ExtCellContainer<E>): void {
    this.addCellContainer(cellContainer)

    this.seedCellAddListeners.forEach((listener) => {
      listener.onSeedCellAdd(cellContainer)
    })
  }

  /**
   * Add a listener that is notified when a seed cell is added to the plain
   */
  addSeedCellAddListener(toAdd: SeedCellAddListener<E>): void {
    this.seedCellAddListeners.push(toAdd)
  }

  /**
   * Remove a previously added SeedCellAddListener
   * @returns the number of removed listeners
   */
  removeSeedCellAddListener(toRemove: SeedCellAddListener<E>): number {
    return removeFromArray(toRemove, this.seedCellAddListeners)
  }

  /**
   * If a cell is moved, adjust the position of the cell container on the plain and notify registered listeners.
   */
  onCellMove(cellContainer: ExtCellContainer<E>, from: ExtPlainField<E>): void {
    this.array[from.posY][from.posX].removeCellContainer(cellContainer)
    const to = cellContainer.plainField
    this.array[to.posY][to.posX].addCellContainer(cellContainer)

    this.cellMoveListeners.forEach((listener) => {
      listener.onCellMove(cellContainer, from)
    })
  }

  /**
   * Add a listener that is notified when a cell is moved on the plain
   */
  addCellMoveListener(toAdd: CellMoveListener<E>): void {
    this.cellMoveListeners.push(toAdd)
  }

  /**
   * Remove a previously added CellMoveListener
   * @returns the number of removed listeners
   */
  removeCellMoveListener(toRemove: CellMoveListener<E>): number {
    return removeFromArray(toRemove, this.cellMoveListeners)
  }

  /**
   * If a cell made a child, add the container of the child to the plain and notify registered listeners.
   */
  onCellMakeChild(parent: ExtCellContainer<E>, child: ExtCellContainer<E>): void {
    this.addCellContainer(child)

    this.cellMakeChildListeners.forEach((listener) => {
      listener.onCellMakeChild(child, parent)
    })
  }

  /**
   * Add a listener that is notified when a cell makes a child
   */
  addCellMakeChildListener(toAdd: CellMakeChildListener<E>): void {
    this.cellMakeChildListeners.push(toAdd)
  }

  /**
   * Remove a previously added CellMakeChildListener
   * @returns the number of removed listeners
   */
  removeCellMakeChildListener(toRemove: CellMakeChildListener<E>): number {
    return removeFromArray(toRemove, this.cellMakeChildListeners)
  }

  /**
   * If a cell divided, remove the container of the parent and add the containers of the two children to the plain.
   * Then notify registered listeners.
   */
  onCellDivide(parent: ExtCellContainer<E>, child1: ExtCellContainer<E>, child2: ExtCellContainer<E>): void {
    this.removeCellContainer(parent)
    this.addCellContainer(child1)
    this.addCellContainer(child2)

    this.cellDivideListeners.forEach((listener) => {
      listener.onCellDivide(parent, child1, child2)
    })
  }

  /**
   * Add a listener that is notified when a cell is divided in two children
   */
  addCellDivideListener(toAdd: CellDivideListener<E>): void {
    this.cellDivideListeners.push(toAdd)
  }

  /**
   * Remove a previously added CellDivideListener
   * @returns the number of removed listeners
   */
  removeCellDivideListener(toRemove: CellDivideListener<E>): number {
    return removeFromArray(toRemove, this.cellDivideListeners)
  }

  /**
   * If a cell died, remove the container of the cell from the plain and notify registered listeners.
   */
  onCellDeath(cellContainer: ExtCellContainer<E>): void {
    this.removeCellContainer(cellContainer)

    this.cellDeathListeners.forEach((listener) => {
      listener.onCellDeath(cellContainer)
    })
  }

  /**
   * Add a listener that is notified when a cell died
   */
  addCellDeathListener(toAdd: CellDeathListener<E>): void {
    this.cellDeathListeners.push(toAdd)
  }

  /**
   * Remove a previously added CellDeathListener
   * @returns the number of removed listeners
   */
  removeCellDeathListener(toRemove: CellDeathListener<E>): number {
    return removeFromArray(toRemove, this.cellDeathListeners)
  }
}
