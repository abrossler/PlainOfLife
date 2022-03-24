import { Cell } from './cell'
import { SerializableCellContainer, SerializableCellContainers } from './serializable_plain_of_life'
import { cellNames } from '../cells/cell_names'
import { RuleExtensionFactory } from './rule_extension_factory'
import { checkBoolean, checkInt, checkNumber, checkString } from '../util/type_checks'
import { modulo } from '../util/modulo'
import { randIntTo } from '../util/rand'

/**
 * Interface to add and remove cell containers from plain fields.
 *
 * Use this interface and don't import Plain and PlainField to break cyclic dependency cell_containers -> plain -> plain_field ->
 * cell_containers
 */
interface Plain<E extends RuleExtensionFactory> {
  get width(): number
  get height(): number
  addCellContainer(cellContainer: ExtCellContainer<E>): void
  onSeedCellAdd(cellContainer: ExtCellContainer<E>): void
  onCellMove(cellContainer: ExtCellContainer<E>, oldX: number, oldY: number, dX: number, dY: number): void
  onCellMakeChild(parent: ExtCellContainer<E>, child: ExtCellContainer<E>, dX: number, dY: number): void
  onCellDivide(
    parent: ExtCellContainer<E>,
    child1: ExtCellContainer<E>,
    dX1: number,
    dY1: number,
    child2: ExtCellContainer<E>,
    dX2: number,
    dY2: number
  ): void
  onCellDeath(cellContainer: ExtCellContainer<E>): void
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
  | 'makeChild'
  | 'divide'
  | 'move'
  | 'executeTurn'
  | 'posX'
  | 'posY'
  | 'color'
  | 'die'
  | 'isDead'
  | 'cellRecord'
  | 'toSerializable'
  | 'next'
>

/**
 * Cell containers are implemented as a cyclic list (where the last element points to the first). FirstCellContainer is the
 * marker for the first container in the cycle and e.g. used as entry point for iterating the list
 */
export type FirstCellContainer<E extends RuleExtensionFactory> = { first: CellContainer<E> }

/**
 * An iterable iterator to iterate on all {@link ExtCellContainer}s of alive cells.
 */
export class CellContainers<E extends RuleExtensionFactory> {
  private current: CellContainer<E> | null = null
  private done = false
  constructor(private firstCellContainer: FirstCellContainer<E>) {}

  [Symbol.iterator]() {
    return this
  }

  next() {
    if (!this.current) {
      this.current = this.firstCellContainer.first
    } else if (this.done) {
      const result = this.current
      this.done = false
      this.current = null
      return { value: result, done: true }
    } else {
      this.current = this.current.next
    }

    if (this.current.next === this.firstCellContainer.first) this.done = true
    return { value: this.current, done: false }
  }
}

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
  color = new Uint8ClampedArray([128, 0, 255, 255])
  /**
   * Smoothed position of the container in the family tree per family tree scale.
   * Controlled by family tree.
   */
  positionsInFamilyTree: number[] = []

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
  initSeedCellContainer(
    cell: Cell,
    posX: number,
    posY: number,
    firstCellContainer: FirstCellContainer<E>,
    positionsInFamilyTree: number[]
  ): void {
    // Start with a cyclic list of one (seed) container - the successor and predecessor of this container is the container itself
    this._prev = this._next = this
    this.cell = cell

    // Mark this seed container as first container
    this.firstCellContainer = firstCellContainer
    firstCellContainer.first = this

    // Don't forget to set the position of the container and to add the seed cell container to the plain
    this._posX = modulo(posX, this.plain.width)
    this._posY = modulo(posY, this.plain.height)
    this.plain.onSeedCellAdd(this)

    // Copy the initial positions in the family tree to a new array
    this.positionsInFamilyTree = positionsInFamilyTree.slice()
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
      const colorRed = checkInt(serializable.colorRed, 0, 255)
      const colorGreen = checkInt(serializable.colorGreen, 0, 255)
      const colorBlue = checkInt(serializable.colorBlue, 0, 255)
      serializable.positionsInFamilyTree.forEach((pos) => checkNumber(pos))

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
        // the dead cell (prev = next = this). Note that this is different compared to a non-deserialized list were dead
        // cells still point to the original prev and next to not break running iterators on the list id a cell dies.
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

      current._posX = modulo(posX, this.plain.width)
      current._posY = modulo(posY, this.plain.height)
      current._isDead = isDead
      current.color[0] = colorRed
      current.color[1] = colorGreen
      current.color[2] = colorBlue
      current.positionsInFamilyTree = serializable.positionsInFamilyTree.slice()

      // Create and init the cell of the container
      const cellConstructor = cellNames.getConstructor(checkString(serializable.cellTypeName))
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
        current.plain.addCellContainer(current)
      }
    }
    return allCellContainers
  }

  /**
   * Transform a cell container to a serializable format (e.g. without cyclic object references).
   */
  toSerializable(): SerializableCellContainer {
    const serializable = {} as SerializableCellContainer
    const cellTypeName = cellNames.getName(Object.getPrototypeOf(this.cell).constructor)
    if (typeof cellTypeName === 'undefined') {
      throw new Error('Unable to get cell type name from constructor. Forgot to register name for cell implementation?')
    }
    serializable.cellTypeName = cellTypeName
    serializable.cell = this.cell.toSerializable()
    serializable.isDead = this._isDead
    serializable.posX = this._posX
    serializable.posY = this._posY
    serializable.colorRed = this.color[0]
    serializable.colorGreen = this.color[1]
    serializable.colorBlue = this.color[2]
    serializable.positionsInFamilyTree = this.positionsInFamilyTree.slice()

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
   * Execute a turn for the cell hosted by the container: Provide the cell a rule specific input to calculate an output.
   * The rules interpret the output and perform actions like moving the cell based on the output.
   */
  executeTurn(input: Uint8Array, output: Uint8Array): void {
    this.cell.executeTurn(input, output)
  }

  /**
   * Let a cell move on the plain.
   * @param dX the delta to the current x position - e.g. 2 moves the container 2 fields to the right
   * @param dY the delta to the current y position - e.g. -2 moves the container 2 fields up
   */
  move(dX: number, dY: number): void {
    checkInt(dX)
    checkInt(dY)

    if (dX === 0 && dY === 0) {
      return
    }

    const oldX = this._posX
    const oldY = this._posY

    this._posX = modulo(oldX + dX, this.plain.width)
    this._posY = modulo(oldY + dY, this.plain.height)
    this.plain.onCellMove(this, oldX, oldY, dX, dY)
  }

  /**
   * Let a cell make a child.
   *
   * The child is added before the parent to the cell containers. Thus when iterating on the cell containers, the just born child
   * will not be included in the current iteration.
   * @param dX the delta to the parent's x position - e.g. 2 places the child 2 fields on the right of the parent
   * @param dY the delta to the parent's y position - e.g. -2 places the child 2 fields above the parent
   * @returns the cell container of the child
   */
  makeChild(dX: number, dY: number): ExtCellContainer<E> {
    checkInt(dX)
    checkInt(dY)

    const childContainer = this.createChildContainer(this._posX + dX, this._posY + dY)
    this.plain.onCellMakeChild(this, childContainer, dX, dY)

    return childContainer
  }

  /**
   * Let a cell divide in two children.
   *
   * The parent cell dies. The two children are added before the parent to the cell containers. Thus when iterating on the cell
   * containers, the just created children will not be included in the current iteration.
   * @param dX1 the delta of child 1 to the parent's x position
   * @param dY1 the delta of child 1 to the parent's y position
   * @param dX2 the delta of child 2 to the parent's x position
   * @param dY2 the delta of child 2 to the parent's y position
   * @returns the cell containers of the two children
   */
  divide(dX1: number, dY1: number, dX2: number, dY2: number): [ExtCellContainer<E>, ExtCellContainer<E>] {
    checkInt(dX1)
    checkInt(dY1)
    checkInt(dX2)
    checkInt(dY2)

    const childContainer1 = this.createChildContainer(this._posX + dX1, this._posY + dY1)
    const childContainer2 = this.createChildContainer(this._posX + dX2, this._posY + dY2)

    this._isDead = true
    this.removeDead()
    this.plain.onCellDivide(this, childContainer1, dX1, dY1, childContainer2, dX2, dY2)

    return [childContainer1, childContainer2]
  }

  /**
   * Let the cell die.
   *
   * The cell container is removed from the container list of alive cells and from the plain field. The last posX and posY of
   * the container are still accessible.
   *
   * Rule specific cell records or field records still might hold references to the container of the dead cell.
   * For example a grandpa reference from a cell record to a dead grandpa is totally valid
   */
  die(): void {
    this._isDead = true

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
    this.removeDead()

    // Remove cell from plain
    this.plain.onCellDeath(this)
  }
  /**
   * Create and init the cell container of a new child
   * @returns the cell container
   */
  private createChildContainer(posX: number, posY: number): CellContainer<E> {
    const childContainer = new CellContainer<E>(this.cellRecordFactory, this.plain)

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

    // Create the child cell
    childContainer.cell = this.cell.makeChild()

    // Set the position of the child on the plain
    childContainer._posX = modulo(posX, this.plain.width)
    childContainer._posY = modulo(posY, this.plain.height)

    // Random drift of colors to indicate how close cells are related: Similar colors (likely) indicate that cells are
    // closely related
    childContainer.color.set(this.color)
    const childColor = childContainer.color
    childColor[0] += randIntTo(3) - 1
    childColor[1] += randIntTo(3) - 1
    childColor[2] += randIntTo(3) - 1

    // Avoid to dark colors: If red, green and blue all are quite dark make brightest color component brighter
    if (childColor[0] < 128 && childColor[1] < 128 && childColor[2] < 128) {
      if (childColor[0] > childColor[1] && childColor[0] > childColor[2]) {
        childColor[0]++
      } else if (childColor[1] > childColor[2]) {
        childColor[1]++
      } else {
        childColor[2]++
      }
    }

    // Avoid to bright colors: If red, green and blue all are quite bright make darkest color component darker
    if (childColor[0] > 128 && childColor[1] > 128 && childColor[2] > 128) {
      if (childColor[0] < childColor[1] && childColor[0] < childColor[2]) {
        childColor[0]--
      } else if (childColor[1] < childColor[2]) {
        childColor[1]--
      } else {
        childColor[2]--
      }
    }

    // Child inherits positions in family tree from parent
    childContainer.positionsInFamilyTree = this.positionsInFamilyTree.slice()

    return childContainer
  }

  /**
   * Remove the container of a dead cell from the list of all alive cells.
   *
   * Some reusable parts only - e.g. logic to handle removal of first cell and for game over missing...
   */
  private removeDead() {
    // Remove dead cell from cell list
    this._prev._next = this._next
    this._next._prev = this._prev
    // Important: Don't adjust this._next and this._prev here to not break running iterators (class CellContainers) on the list of
    // alive cells here
  }
}
