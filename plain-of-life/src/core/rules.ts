import { Cell } from './cell'
import { SerializablePlainOfLife } from '../core/serializable_plain_of_life'

/**
 * Implement your own Plain of Life rule set by deriving your rules class.
 */
export abstract class Rules<E extends ExtensionProvider> implements ExtensionProvider {
  private plain!: Plain<E>
  private firstCellRecord!: IntCellRecord<E>

  /**
   * Create a new Plain of Life rule set
   * @param width of the plain
   * @param height of the plain
   * @param seedCell the one and only cell life starts with
   */
  //   constructor(width: number, height: number, seedCell: Cell)
  //   constructor(serializableRules: SerializablePlainOfLife<E>['rules'])
  //   constructor(widthOrSR: number | SerializablePlainOfLife<E>['rules'], height?: number, seedCell?: Cell) {
  //     if( typeof widthOrSR === 'number'){
  //         if( typeof height === 'undefined'  ||  typeof seedCell === 'undefined' ) {
  //             throw new Error('Not supported combination of arguments')
  //         }
  //         const width = widthOrSR

  //         const posX = width / 2
  //         const posY = height / 2
  //         this.plain = new Plain<E>(this, width, height)
  //         this.firstCellRecord = new CellRecord<E>(this) as IntCellRecord<E>
  //         this.firstCellRecord.initSeedCellRecord(this.plain, seedCell, posX, posY)
  //         this.plain.getAtInt(posX, posY).addCellRecord(this.firstCellRecord)

  //     }
  //     else if( typeof widthOrSR === 'object'){
  //         if( typeof height !== 'undefined'  ||  typeof seedCell !== 'undefined' ) {
  //             throw new Error('Not supported combination of arguments')
  //         }
  //         this.fromSerializable( widthOrSR )
  //      }
  //      else {
  //         throw new Error('Ups, shall be unreachable')
  //      }
  //   }

  constructor() {}

  init(width: number, height: number, Cell: new () => Cell): void {
    const posX = width / 2
    const posY = height / 2
    this.plain = new Plain<E>(this, width, height)
    this.firstCellRecord = new CellRecord<E>(this) as IntCellRecord<E>
    this.firstCellRecord.initSeedCellRecord(this.plain, new Cell(), posX, posY)
    this.plain.getAtInt(posX, posY).addCellRecord(this.firstCellRecord)
  }

  initFromSerializable(serializableRules: SerializablePlainOfLife<E>['rules']): void {
    this.plain = new Plain<E>(this, serializableRules.plainWidth, serializableRules.plainHeight)
  }

  toSerializable(serializableRules: SerializablePlainOfLife<E>['rules']): void {
    serializableRules['plainWidth'] = this.plain.width
    serializableRules['plainHeight'] = this.plain.height

    //    return serializable
  }

  /**
   * Get the plain to access the individual plain fields by x and y coordinates
   */
  getPlain(): ExtPlain<E> {
    return this.plain
  }

  /**
   * Get the records of all living cells on the plain for iterating
   */
  getCellRecords(): CellRecords<E> | null {
    // Remove leading dead cells
    while (this.firstCellRecord.isDead) {
      this.firstCellRecord = this.firstCellRecord.next

      // Only one last dead cell remaining => game over
      if (this.firstCellRecord.isDead && this.firstCellRecord === this.firstCellRecord.next) {
        return null
      }
    }
    return new CellRecords(this.firstCellRecord)
  }

  /**
   * The main method to implement your own Plain of Life rule set.
   * @param plain to access all plain fields by x and y coordinates
   * @param cellRecords to iterate over the records of all alive cells on the pain
   */
  abstract executeTurn(plain: ExtPlain<E>, cellRecords: CellRecords<E>): void

  /**
   * Provide an object with any property you want to add to all cell records. The properties are e.g. accessible when
   * iterating over {@link CellRecords}.
   *
   * Typical examples might be cellEnergy: number, cellAge: number or any other attribute required by your rules for each cell.
   */
  abstract getCellRecordExtension(): Record<string, unknown>

  /**
   * Provide an object with any property you want to add to all plain fields. The properties are e.g. accessible
   * by the plan fields returned via {@link Plain.getAt}.
   *
   * Typical examples might be fieldTemperature: number, fieldFood: Food or any other attribute required by your rules
   * at plain field level
   */
  abstract getPlainFieldExtension(): Record<string, unknown>
}

/**
 * A plain of plain fields that can be accessed by their x and y coordinates.
 */
/*
 * The external plain can be used safely outside this module by omitting critical properties that could break the
 * internal structure when misused from outside
 */
type ExtPlain<E extends ExtensionProvider> = Omit<Plain<E>, 'getAtInt'>
export { ExtPlain as Plain }

/**
 * A plain of plain fields with a torus topography for module internal use only ({@link ExtPlain} is for for external use).
 */
class Plain<E extends ExtensionProvider> {
  private readonly array: IntPlainField<E>[][]

  constructor(extensionProvider: ExtensionProvider, private _width: number, private _height: number) {
    this.array = new Array(_width).fill(new Array(_height).fill(new PlainField<E>(extensionProvider)))
  }

  /**
   * Get a plain field by it's x and y coordinates. The "plain" has a torus topography meaning that
   * if you leave the plain to the right (with a x coordinate value exceeding the plain size), you automatically enter it from
   * the left. The topography behaves accordingly when leaving to the left, top or bottom...
   */
  getAt(posX: number, posY: number): ExtPlainField<E> {
    return this.getAtInt(posX, posY)
  }

  getAtInt(posX: number, posY: number): IntPlainField<E> {
    return this.array[Plain.modulo(posX, this._width)][Plain.modulo(posY, this._height)]
  }

  /**
   * Get the width of the plain
   */
  get width() {
    return this._width
  }

  /**
   * Get the height of the plain
   */
  get height() {
    return this._height
  }

  /**
   * The modulo function working also for negative numbers as needed for a torus topography:
   *
   * ...-3%3=0  -2%3=1  -1%3=2  0%3=0  1%3=1  2%3=2  3%3=0  4%3=1...
   */
  static modulo(n: number, mod: number): number {
    while (n < 0) {
      n += mod
    }
    return n % mod
  }
}

/**
 * The plain field for module internal usage with all properties returned by {@link Rules.getPlainFieldExtension}
 */
type IntPlainField<E extends ExtensionProvider> = PlainField<E> & ReturnType<E['getPlainFieldExtension']>

/**
 * A plain field that includes some standard properties plus all properties returned by {@link Rules.getPlainFieldExtension}.
 */
/*
 * External plain fields can be used safely outside this module by omitting critical properties that could break the
 * internal structure when misused from outside
 */
type ExtPlainField<E extends ExtensionProvider> = Omit<IntPlainField<E>, 'addCellRecord' | 'removeCellRecord'>

export { ExtPlainField as PlainField }

/**
 * The plain field class - not for direct usage:
 *
 * Within the module {@link IntPlainField} shall be used
 *
 * Outside the module {@link ExtPlainField} shall be used
 *
 * Adding or removing cell records, consistency with the cell record itself has to be ensured. For example
 * the cell record holds the x and y coordinated where it is located on the plain.
 *
 */
class PlainField<E extends ExtensionProvider> {
  private cellRecords: IntCellRecord<E>[] = []

  /**
   * Constructor that creates a plain field instance and additionally assigns all properties returned by the extension provider to that instance
   * so that it actually returns a {@link IntPlainField}
   */
  constructor(extensionProvider: ExtensionProvider) {
    Object.assign(this, extensionProvider.getPlainFieldExtension())
  }

  /**
   * Add a cell record to the plain field.
   *
   * For module internal use only
   */
  addCellRecord(toAdd: IntCellRecord<E>): void {
    this.cellRecords.push(toAdd)
  }

  /**
   * Remove a cell record from the plain field.
   *
   * For module internal use only
   */
  removeCellRecord(toRemove: IntCellRecord<E>): void {
    this.cellRecords.splice(this.cellRecords.findIndex((cr) => cr === toRemove))
  }

  /**
   * Get all cell records located on the plain field
   */
  getCellRecords(): Readonly<ExtCellRecord<E>[]> {
    // For usage outside the module, thus returning ExtCellRecord
    return this.cellRecords
  }
}

/**
 * The cell record for module internal usage including all properties returned by {@link Rules.getCellRecordExtension}
 */
type IntCellRecord<E extends ExtensionProvider> = CellRecord<E> & ReturnType<E['getCellRecordExtension']>

/**
 * A cell record that includes some standard properties plus all properties returned by {@link Rules.getCellRecordExtension}.
 */
/*
 * External cell records can be used safely outside this module by omitting critical properties that could break the
 * internal structure when misused from outside
 */
type ExtCellRecord<E extends ExtensionProvider> = Omit<IntCellRecord<E>, 'init' | 'next'>
export { ExtCellRecord as CellRecord }

/**
 * An iterator to iterate on {@link ExtCellRecord}s
 */
export class CellRecords<E extends ExtensionProvider> {
  constructor(private first: IntCellRecord<E>) {}
  *[Symbol.iterator](): Iterator<ExtCellRecord<E>> {
    for (let r = this.first; r.next !== this.first; r = r.next) {
      yield r
    }
  }
}

/**
 * The cell record - not for direct usage:
 *
 * Within the module {@link IntCellRecord} shall be used
 *
 * Outside the module {@link ExtCellRecord} shall be used
 *
 * Cell records form a cyclic list. Starting from a seed record {@link makeChild} inserts the child into the cycle, {@link die}
 * removes the child from the cycle. The removed child still points to it's former successor so that it's possible to re-enter
 * the cycle via .next from a removed child. That's important if you somewhere hold a cell record and this cell record dies.
 */
class CellRecord<E extends ExtensionProvider> {
  /** Predecessor in list */
  private _prev!: IntCellRecord<E>
  /** Successor in list */
  private _next!: IntCellRecord<E>
  private _posX!: number
  private _posY!: number
  private cell!: Cell
  private plain!: Plain<E>
  private _isDead = false
  /**
   * Color of the cell record. With {@link makeChild} the color of the child is randomly changed slightly. Thus closely related
   * cell records have a similar color whereas not related cell records typically have a different color
   */
  private _color = 0

  /**
   * Constructor that creates a cell record instance and additionally assigns all properties returned by the extension provider
   * to that instance so that it actually returns a {@link IntCellRecord}.
   *
   * Call {@link initSeedCellRecord} before using the instance.
   *
   * The constructor creates a seed cell record for a new plain of life. Within a plain new cells must be created via
   * {@link makeChild}.
   */
  constructor(private extensionProvider: ExtensionProvider) {
    Object.assign(this, extensionProvider.getCellRecordExtension())
  }

  /**
   * Init a seed cell record. Normal cells are initialized by {@link makeChild}.
   */
  initSeedCellRecord(plain: Plain<E>, cell: Cell, posX: number, posY: number) {
    // Start with a cyclic list of one (seed) record - the successor and predecessor of this record is the record itself
    this._prev = this._next = this as IntCellRecord<E>
    this.plain = plain
    this.cell = cell
    this._posX = Plain.modulo(posX, plain.width)
    this._posY = Plain.modulo(posY, plain.height)
  }

  get next() {
    return this._next
  }
  get posX() {
    return this._posX
  }
  get posY() {
    return this._posY
  }

  /**
   * Create a child.
   *
   * The child is added before the parent to the cell records. Thus when iterating over the cell records, the just born child
   * will not be included in the current iteration.
   * @param dX the delta to the parent's x position - e.g. 2 places the child 2 fields on the right of the parent
   * @param dY the delta to the parent's y position - e.g. -2 places the child 2 fields above the parent
   * @returns the child
   */
  makeChild(dX: number, dY: number): ExtCellRecord<E> {
    const childRecord = new CellRecord<E>(this.extensionProvider) as IntCellRecord<E>

    // Init the child record
    childRecord.plain = this.plain
    childRecord.cell = this.cell.makeChild()
    childRecord._posX = Plain.modulo(this.posX + dX, this.plain.width)
    childRecord._posY = Plain.modulo(this.posY + dY, this.plain.height)

    childRecord._prev = this._prev
    childRecord._next = this as IntCellRecord<E>
    this._prev._next = childRecord
    this._prev = childRecord

    // Don't forget to add the child to the plain
    this.plain.getAtInt(childRecord._posX, childRecord._posY).addCellRecord(childRecord)

    return childRecord
  }

  die() {
    this._prev._next = this._next
    this._next._prev = this._prev
    this._isDead = true

    // Remove from plain or not???
  }

  get isDead() {
    return this._isDead
  }
  get color() {
    return this._color
  }
}

export interface ExtensionProvider {
  getCellRecordExtension: () => Record<string, unknown>
  getPlainFieldExtension: () => Record<string, unknown>
}
