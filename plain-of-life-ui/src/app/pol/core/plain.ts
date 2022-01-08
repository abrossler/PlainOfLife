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
 * Listener on cells moved
 */
export interface CellMoveListener<E extends RuleExtensionFactory> {
  /**
   * Method called for registered listeners after a cell was moved.
   *
   * Note that the delta arguments are useful as it's not easy to calculate these values due to the torus topography of the plain.
   * @param cellContainer of the moved cell
   * @param oldX position of the cell before the move
   * @param oldY position of the cell before the move
   * @param dX delta, distance moved in x- direction
   * @param dY delta, distance moved in y- direction
   */
  onCellMove(cellContainer: ExtCellContainer<E>, oldX: number, oldY: number, dX: number, dY: number): void
}

/**
 * Listener on cells making a child
 */
export interface CellMakeChildListener<E extends RuleExtensionFactory> {
  /**
   * Method called for registered listeners after a cell made a child
   *
   * Note that the delta arguments are useful as it's not easy to calculate these values due to the torus topography of the plain.
   * @param child container of the child cell
   * @param parent container of the parent cell
   * @param dX delta, distance from parent to child in x- direction
   * @param dY delta, distance from parent to child in y- direction
   */
  onCellMakeChild(child: ExtCellContainer<E>, parent: ExtCellContainer<E>, dX: number, dY: number): void
}

/**
 * Listener on cells dividing in two children
 */
export interface CellDivideListener<E extends RuleExtensionFactory> {
  /**
   * Method called for registered listeners after a parent cell divided in two children. Note that the parent dies when dividing.
   *
   * Note that the delta arguments are useful as it's not easy to calculate these values due to the torus topography of the plain.
   * @param parent container of the (dead) parent cell
   * @param child1 container of the first child
   * @param dX1 delta, distance from parent to child1 in x- direction
   * @param dY1 delta, distance from parent to child1 in y- direction
   * @param child2 container of the second child
   * @param dX2 delta, distance from parent to child2 in x- direction
   * @param dY2 delta, distance from parent to child2 in y- direction
   */
  onCellDivide(
    parent: ExtCellContainer<E>,
    child1: ExtCellContainer<E>,
    dX1: number,
    dY1: number,
    child2: ExtCellContainer<E>,
    dX2: number,
    dY2: number
  ): void
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
  private _cellCount: number = 0

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
   * Add a cell container to the plain at a given position
   */
  addCellContainer(cellContainer: ExtCellContainer<E>, posX: number, posY: number): void {
    this._cellCount++
    this.array[posY][posX].addCellContainer(cellContainer)
  }

  /**
   * If a seed cell is added, add the container of the seed cell to the plain and notify registered listeners
   */
  onSeedCellAdd(cellContainer: ExtCellContainer<E>): void {
    this.array[cellContainer.posY][cellContainer.posX].addCellContainer(cellContainer)

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
  onCellMove(cellContainer: ExtCellContainer<E>, oldX: number, oldY: number, dX: number, dY: number): void {
    this.array[oldY][oldX].removeCellContainer(cellContainer)
    this.array[cellContainer.posY][cellContainer.posX].addCellContainer(cellContainer)

    this.cellMoveListeners.forEach((listener) => {
      listener.onCellMove(cellContainer, oldX, oldY, dX, dY)
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
  onCellMakeChild(parent: ExtCellContainer<E>, child: ExtCellContainer<E>, dX: number, dY: number): void {
    this.array[child.posY][child.posX].addCellContainer(child)

    this.cellMakeChildListeners.forEach((listener) => {
      listener.onCellMakeChild(child, parent, dX, dY)
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
  onCellDivide(
    parent: ExtCellContainer<E>,
    child1: ExtCellContainer<E>,
    dX1: number,
    dY1: number,
    child2: ExtCellContainer<E>,
    dX2: number,
    dY2: number
  ): void {
    this.array[parent.posY][parent.posX].removeCellContainer(parent)
    this.array[child1.posY][child1.posX].addCellContainer(child1)
    this.array[child2.posY][child2.posX].addCellContainer(child2)

    this.cellDivideListeners.forEach((listener) => {
      listener.onCellDivide(parent, child1, dX1, dY1, child2, dX2, dY2)
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
    this.array[cellContainer.posY][cellContainer.posX].removeCellContainer(cellContainer)

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
