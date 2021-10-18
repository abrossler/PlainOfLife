import { Cell } from './cell'
import { SerializableCellContainer, SerializableCellContainers } from './serializable_plain_of_life'
import { cellNames } from '../cells/cell_names'
import { RuleExtensionFactory } from './rule_extension_factory'
import { checkBoolean, checkInt, checkString } from '../util/type_checks'
import { modulo } from '../util/modulo'

/**
 * Interface to add and remove cell containers from plain fields.
 *
 * Use this interface and don't import Plain and PlainField to break cyclic dependency cell_containers -> plain -> plain_field ->
 * cell_containers
 */
interface Plain<E extends RuleExtensionFactory> {
  get width(): number
  get height(): number
  getAtInt(
    posX: number,
    posY: number
  ): { addCellContainer(toAdd: ExtCellContainer<E>): void; removeCellContainer(toRemove: ExtCellContainer<E>): void }
}

/**
 * A cell container with standard cell related methods and properties plus all rule specific properties
 * returned by {@link RuleExtensionFactory.createNewCellRecord}.
 */
/*
 * External cell container exposes all properties and methods that make sense (and safely can be used) outside the
 * POL core
 */
export type ExtCellContainer<E extends RuleExtensionFactory> = Pick<
  CellContainer<E>,
  'makeChild' | 'move' | 'posX' | 'posY' | 'die' | 'isDead' | 'cellRecord' | 'toSerializable' | 'next'
>

/**
 * An iterable iterator to iterate on all {@link ExtCellContainer}s of alive cells.
 */
export class CellContainers<E extends RuleExtensionFactory> {
  constructor(private first: ExtCellContainer<E>) {}
  *[Symbol.iterator](): Iterator<ExtCellContainer<E>> {
    let container
    for (container = this.first; container.next !== this.first; container = container.next) {
      yield container
    }
    yield container // don't forget the last container where next === first
  }
}

/**
 * Cell containers are implemented as a cyclic list (where the last element points to the first). FirstCellContainer is the
 * marker for the first container in the cycle and e.g. used as entry point for iterating the list
 */
export type FirstCellContainer<E extends RuleExtensionFactory> = { first: CellContainer<E> }

/**
 * The container for all cells - not for direct usage outside of the POL core: Outside {@link ExtCellContainer} shall be used
 *
 * Cell containers form a cyclic list of alive cells. Starting from a seed container {@link makeChild} inserts children into the
 * cycle, {@link die} removes the cell container from the cycle.
 *
 * Note that the list of cell containers must never be empty and as exception in case of "game over" the last cell that died
 * is kept as (only) dead cell in the list.
 */
export class CellContainer<E extends RuleExtensionFactory> {
  /** Predecessor in list */
  private _prev!: CellContainer<E>
  /** Successor in list */
  private _next!: CellContainer<E>
  /** The plain where the cell is located on */
  private plain: Plain<E>
  /** The factory to create rule specific cell records */
  private cellRecordFactory: RuleExtensionFactory
  /** X position of the cell on the plain */
  private _posX!: number
  /** Y position of the cell on the plain */
  private _posY!: number
  /** The cell this cell container holds */
  private cell!: Cell
  /** The cell record with rule specific extensions as returned by createNewCellRecord */
  public cellRecord!: ReturnType<E['createNewCellRecord']>
  /** Is the cell dead? */
  private _isDead = false
  /**
   * Exactly one cell container in the cyclic list is marked as first container.
   *
   * Methods might have to shift the first container. For example if a child is added before the first container,
   * this child has to become the new first container.
   */
  private firstCellContainer: FirstCellContainer<E> | undefined
  /**
   * Color of the cell container. With {@link makeChild} the color of the child is randomly changed slightly. Thus closely related
   * cell containers have a similar color whereas not related cell containers typically have a different color
   */
  private _color = 0

  /**
   * Constructor of a cell container instance. Call {@link initSeedCellContainer} or {@link initFromSerializable} before using
   * the instance.
   *
   * Note that rules must create new cells with containers using {@link makeChild}.
   *
   * @param cellRecordFactory
   * @param plain The plain the new container belongs to
   */
  constructor(cellRecordFactory: RuleExtensionFactory, plain: Plain<E>) {
    this.cellRecordFactory = cellRecordFactory
    this.cellRecord = cellRecordFactory.createNewCellRecord() as ReturnType<E['createNewCellRecord']>
    this.plain = plain
  }

  /**
   * Init a seed cell container when adding a first seed cell to a plain.
   */
  initSeedCellContainer(cell: Cell, posX: number, posY: number, firstCellContainer: FirstCellContainer<E>): void {
    // Start with a cyclic list of one (seed) container - the successor and predecessor of this container is the container itself
    this._prev = this._next = this
    this.cell = cell
    this._posX = modulo(posX, this.plain.width)
    this._posY = modulo(posY, this.plain.height)

    // Mark this seed container as first container
    this.firstCellContainer = firstCellContainer
    firstCellContainer.first = this

    // Don't forget to add the seed cell container to the plain
    this.plain.getAtInt(posX, posY).addCellContainer(firstCellContainer.first)
  }

  /**
   * Init a cyclic list of cell containers from serializable containers starting with this container as first container.
   * @param serializableContainers All serializable containers to init cell containers from
   * @param firstCellContainer Marker for the first cell container
   * @returns an array containing all cell containers (of alive AND dead cells)
   */
  initFromSerializable(
    serializableContainers: SerializableCellContainers,
    firstCellContainer: FirstCellContainer<E>
  ): ExtCellContainer<E>[] {
    const allCellContainers: ExtCellContainer<E>[] = []

    // Start with this as current, previous and recent container
    /* eslint-disable @typescript-eslint/no-this-alias */
    let currentAlive: CellContainer<E> = this // Current container of an alive cell in the list of all alive containers
    let prev: CellContainer<E> = this // Previous container in the list of all alive containers
    let current: CellContainer<E> = this // Current container of a dead or alive cell (dead cells are not included in the list)
    /* eslint-enable @typescript-eslint/no-this-alias */

    let isFirst = true

    for (const serializable of serializableContainers) {
      const posX = checkInt(serializable.posX, 0, current.plain.width)
      const posY = checkInt(serializable.posY, 0, current.plain.height)
      const isDead = checkBoolean(serializable.isDead)
      const color = checkInt(serializable.color)

      // Init this as the first container
      if (isFirst) {
        this._prev = this._next = this // Cyclic list with just one element
        // Mark this as first container
        this.firstCellContainer = firstCellContainer
        firstCellContainer.first = this
        isFirst = false
      } else {
        current = new CellContainer<E>(this.cellRecordFactory, this.plain)
        // Init container for dead cell
        // Dead cells are not included in the cyclic list of all alive cells but form an isolated cyclic list of just
        // the dead cell (prev = next = this)
        if (isDead) {
          current._prev = current._next = current
          // Init container for alive cell
        } else {
          prev = currentAlive
          currentAlive = current

          // Add alive cell to cyclic list of all alive cells
          prev._next = currentAlive
          this._prev = currentAlive
          currentAlive._prev = prev
          currentAlive._next = this
        }
      }
      allCellContainers.push(current) // Collect all (dead or alive) cell containers
      // cellRecord is de-serialized separately because cell records might hold cell container references and we must
      // collect all cell containers first

      current._posX = posX
      current._posY = posY
      current._isDead = isDead
      current._color = color

      // Create and init the cell of the container
      const cellConstructor = cellNames.getCellConstructor(checkString(serializable.cellTypeName))
      if (typeof cellConstructor === 'undefined') {
        throw new Error(
          'Unable to get constructor from cell type name ' +
            serializable.cellTypeName +
            '. Invalid name or forgot to register the constructor for this name?'
        )
      }
      current.cell = new cellConstructor()
      current.cell.initFromSerializable(serializable.cell)

      if (!isDead) {
        current.plain.getAtInt(posX, posY).addCellContainer(current)
      }
    }
    return allCellContainers
  }

  /**
   * Transform a cell container to a serializable format (e.g. without cyclic object references).
   */
  toSerializable(): SerializableCellContainer {
    const serializable = {} as SerializableCellContainer
    const cellTypeName = cellNames.getCellTypeName(Object.getPrototypeOf(this.cell).constructor)
    if (typeof cellTypeName === 'undefined') {
      throw new Error('Unable to get cell type name from constructor. Forgot to register name for cell implementation?')
    }
    serializable.cellTypeName = cellTypeName
    serializable.cell = this.cell.toSerializable()
    serializable.isDead = this._isDead
    serializable.posX = this._posX
    serializable.posY = this._posY
    serializable.color = this._color

    // _next, _prev and plain are not serialized but reconstructed during de-serialization

    // cellRecord is serialized separately (technically because cell records might hold cell container
    // references and we have to break the cyclic object references)

    return serializable
  }

  /**
   * Get the next cell container from the container list of alive cells.
   *
   * Note that the list forms a cyclic loop with the last container pointing to the first.
   */
  get next(): CellContainer<E> {
    return this._next
  }

  /**
   * Get the X position of the cell on the plain
   */
  get posX(): number {
    return this._posX
  }

  /**
   * Get the Y position of the cell on the plain
   */
  get posY(): number {
    return this._posY
  }

  /**
   * Is the cell in the container dead?
   */
  get isDead(): boolean {
    return this._isDead
  }

  /**
   * Get the color of the cell container. With {@link makeChild} the color of the child is randomly changed slightly. Thus
   * closely related cell containers have a similar color whereas not related cell containers typically have a different color.
   */
  get color(): number {
    return this._color
  }

  /**
   * Create a child.
   *
   * The child is added before the parent to the cell containers. Thus when iterating on the cell containers, the just born child
   * will not be included in the current iteration.
   * @param dX the delta to the parent's x position - e.g. 2 places the child 2 fields on the right of the parent
   * @param dY the delta to the parent's y position - e.g. -2 places the child 2 fields above the parent
   * @returns the child
   */
  makeChild(dX: number, dY: number): ExtCellContainer<E> {
    checkInt(dX)
    checkInt(dY)

    const childContainer = new CellContainer<E>(this.cellRecordFactory, this.plain)

    // Init the child container
    childContainer.plain = this.plain
    childContainer.cell = this.cell.makeChild()
    childContainer._posX = modulo(this.posX + dX, this.plain.width)
    childContainer._posY = modulo(this.posY + dY, this.plain.height)

    // Insert child before parent
    childContainer._prev = this._prev
    childContainer._next = this
    this._prev._next = childContainer
    this._prev = childContainer

    // If child is inserted before first, move first to child
    if (this.firstCellContainer) {
      this.firstCellContainer.first = this._prev
      this._prev.firstCellContainer = this.firstCellContainer
      delete this.firstCellContainer
    }

    // Don't forget to add the child to the plain
    this.plain.getAtInt(childContainer._posX, childContainer._posY).addCellContainer(childContainer)

    return childContainer
  }

  /**
   * Let the cell die.
   *
   * The cell container is automatically removed from the container list of alive cells and from the plain field.
   *
   * Rule specific cell records or field records still might hold references to the container of the dead cell.
   * For example a grandpa reference from a cell record to a dead grandpa is totally valid
   */
  die(): void {
    this._isDead = true

    // Remove dead cell from plain
    this.plain.getAtInt(this._posX, this._posY).removeCellContainer(this)

    // Game over: If the last cell dies it just stays dead (as first and only cell) in the cell list
    if (this._next === this) {
      return
    }

    // If the first cell dies, move first to next
    if (this.firstCellContainer) {
      this.firstCellContainer.first = this.next
      this._next.firstCellContainer = this.firstCellContainer
      delete this.firstCellContainer
    }

    // Remove dead cell from cell list
    this._prev._next = this._next
    this._next._prev = this._prev
    this._prev = this._next = this // For a dead cell prev and next point to the cell itself
  }

  /**
   * Move a cell container on the plain.
   * @param dX the delta to the current x position - e.g. 2 moves the container 2 fields to the right
   * @param dY the delta to the current y position - e.g. -2 moves the container 2 fields up
   */
  move(dX: number, dY: number): void {
    checkInt(dX)
    checkInt(dY)

    if (dX === 0 && dY === 0) {
      return
    }

    this.plain.getAtInt(this._posX, this._posY).removeCellContainer(this)

    this._posX = modulo(this.posX + dX, this.plain.width)
    this._posY = modulo(this.posY + dY, this.plain.height)

    this.plain.getAtInt(this._posX, this._posY).addCellContainer(this)
  }
}
