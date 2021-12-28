import { FamilyTree } from './family_tree'
import { Rules } from './rules'
import { RuleExtensionFactory } from './rule_extension_factory'
import { SerializablePlainOfLife } from '../core/serializable_plain_of_life'
import { ruleNames } from '../rules/rules_names'
import { Cell } from './cell'
import { checkBigInt, checkInt, checkObject, checkString } from '../util/type_checks'
import { CellContainer, CellContainers, ExtCellContainer, FirstCellContainer } from './cell_container'
import { Plain } from './plain'

/**
 * The Plain of Life programming game:
 *
 * A plain of fields on which cells live. Turns are executed and according to rules each cell gets input
 * with information about it's surroundings (such as information on food or neighbor cells). The cell calculates an output from
 * this input and it's inner state. Based on the output the rules perform actions such as moving the cell or
 * let the cell reproduce. When reproducing, the copy of the cell includes slight random variations influencing the
 * calculation of the output from the input. These variations might be an advantage for the new cell so that it has
 * a better chance to survive and reproduce further. Or it might be a disadvantage with a higher probability to die. There is
 * a family tree visualizing how branches of related cells evolve over time - some branches die out, other branches split and
 * start replacing other branches.
 *
 * Coding Custom Rules:
 * Implement your own rules by overriding {@link Rules}
 *
 * Coding Custom Cells:
 * Implement your own cells by overriding {@link Cell}
 */
/*
 * External plain of life expose all properties and methods that make sense (and safely can be used) outside the
 * POL core
 */
export type ExtPlainOfLife<E extends RuleExtensionFactory> = Pick<
  PlainOfLife<E>,
  'executeTurn' | 'currentTurn' | 'toSerializable' | 'plainWidth' | 'plainHeight'
>

/**
 * The plain of life - not for direct usage outside of the POL core: Outside {@link ExtPlainOfLife} shall be used.
 */
export class PlainOfLife<E extends RuleExtensionFactory> {
  /** The current turn, incremented by {@link executeTurn} */
  private _currentTurn = 0n
  /** The family tree of this plain of life starting from the first seed cell */
  private familyTree!: FamilyTree<E>
  /** The rules for this plain of life */
  private rules!: Rules<E>
  /** The 2D plain of plain fields */
  private plain!: Plain<E>
  /** The first cell container in the container list of all alive cells  */
  private firstCellContainer!: FirstCellContainer<E>

  /* eslint-disable @typescript-eslint/no-empty-function */
  private constructor() {}
  /* eslint-enable @typescript-eslint/no-empty-function */

  /**
   * Create a new plain of life for a rule set and a first seed cell.
   * @param width  Width of the plain
   * @param height Height of the plain
   * @param Rules Constructor to create the rules that apply to the plain
   * @param Cell Constructor to create a first seed cell on the plain that starts reproducing
   * @returns the new plain of life
   */
  static createNew<E extends RuleExtensionFactory>(
    width: number,
    height: number,
    Rules: new () => Rules<E>,
    Cell: new () => Cell
  ): ExtPlainOfLife<E> {
    // Create plain of life, rules and family tree
    const newPOL = new PlainOfLife<E>()
    newPOL.rules = new Rules()
    newPOL.familyTree = new FamilyTree()
    newPOL.familyTree.initNew()

    // Create plain and add seed cell
    newPOL.plain = new Plain<E>(newPOL.rules, width, height)
    newPOL.rules.initNew( newPOL.plain )
    newPOL.firstCellContainer = { first: new CellContainer(newPOL.rules, newPOL.plain) }
    const seedCell = new Cell()
    const hints = newPOL.rules.getSeedCellHints()
    seedCell.initSeedCell(hints.inputLength, hints.recommendedSeedCellOutput)
    const posX = Math.floor(width / 2)
    const posY = Math.floor(height / 2)
    newPOL.firstCellContainer.first.initSeedCellContainer(seedCell, posX, posY, newPOL.firstCellContainer)

    return newPOL
  }

  /**
   * Create a new plain of life from a serializable plain of life.
   * @param serializable A serializable plan of life as returned by {@link toSerializable}
   * @returns the new plain of life
   */
  static createFromSerializable<E extends RuleExtensionFactory>(serializable: SerializablePlainOfLife): PlainOfLife<E> {
    // Create the plain of life
    const newPOL = new PlainOfLife<E>()
    newPOL._currentTurn = checkBigInt(BigInt(checkString(serializable.currentTurn)), 0n)

    // Create the rules
    const ruleConstructor = ruleNames.getConstructor(checkString(serializable.rulesName))
    if (typeof ruleConstructor === 'undefined') {
      throw new Error(
        'Unable to get constructor from rules name ' +
          serializable.rulesName +
          '. Invalid name or forgot to register the constructor for this name?'
      )
    }
    newPOL.rules = new ruleConstructor()
    newPOL.rules.initFromSerializable(checkObject(serializable.rules))

    // Create the family tree
    newPOL.familyTree = new FamilyTree()
    newPOL.familyTree.initFromSerializable(checkObject(serializable.familyTree))

    // Create the plain
    const width = checkInt(serializable.plainWidth)
    const height = checkInt(serializable.plainHeight)
    newPOL.plain = new Plain<E>(newPOL.rules, width, height)

    // Create the cell containers
    if (serializable.cellContainers.length < 1) {
      throw new Error('There must be at least one container in cell containers')
    }
    newPOL.firstCellContainer = { first: new CellContainer(newPOL.rules, newPOL.plain) }
    const allCellContainers = newPOL.firstCellContainer.first.initFromSerializable(
      serializable.cellContainers,
      newPOL.firstCellContainer
    )

    // Init the cell records in the cell containers and the field records in the plain fields after all containers are created
    // (as cell records and field records might hold references to containers)
    let i = 0
    for (const container of allCellContainers) {
      newPOL.rules.initCellRecordFromSerializable(
        container.cellRecord,
        serializable.cellRecords[i++],
        allCellContainers
      )
    }
    i = 0
    if (serializable.fieldRecords.length != width * height) {
      throw new Error('Incorrect number of plain fields - number must be width * height of plain.')
    }
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        newPOL.rules.initFieldRecordFromSerializable(
          newPOL.plain.getAtInt(x, y).fieldRecord,
          serializable.fieldRecords[i++],
          allCellContainers
        )
      }
    }

    return newPOL
  }

  /**
   * Convert a plain of life (that has data structures optimized for turn execution) in a serializable format.
   * @returns a serializable format of the plain of life as supported by {@link JSON.stringify}
   */
  toSerializable(): SerializablePlainOfLife {
    // Create serializable
    const serializable: SerializablePlainOfLife = {} as SerializablePlainOfLife

    // Add some flat properties
    serializable['currentTurn'] = this.currentTurn.toString()
    const width = this.plain.width
    const height = this.plain.height
    serializable['plainWidth'] = width
    serializable['plainHeight'] = height

    // Add rules
    const rulesName = ruleNames.getName(Object.getPrototypeOf(this.rules).constructor)
    if (typeof rulesName === 'undefined') {
      throw new Error('Unable to get rules name from constructor. Forgot to register name for rules implementation?')
    }
    serializable['rulesName'] = rulesName
    serializable['rules'] = this.rules.toSerializable()

    // Add family tree
    serializable['familyTree'] = this.familyTree.toSerializable()

    // Add cell containers of all alive cells to allCellContainers
    // We will have to replace all references to cell containers by the index of the cell container as the same container
    // might be referenced from multiple places. For this we collect allCellContainers...
    let allCellContainers: ExtCellContainer<E>[] = [] // Containers of all (alive and dead) cells
    const containers = this.getCellContainers()
    if (containers) {
      allCellContainers = [...containers]
    }

    // Add field records. The field records might hold cell container references that are replaced by the corresponding index
    // in allCellContainers.
    // Note that the field records might hold references to the containers of dead cells that are not yet added to
    // allCellContainers and have to be added now.
    serializable['fieldRecords'] = []
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        serializable.fieldRecords.push(
          this.rules.fieldRecordToSerializable(this.plain.getAtInt(x, y).fieldRecord, allCellContainers)
        )
      }
    }

    // Add (rule specific) cell records. If the cell records hold cell container references, replaced them by the corresponding
    // index in allCellContainers.
    // Note that the cell records might hold references to the containers of dead cells that are not yet added to
    // allCellContainers and have to be added now.
    let fromIndex = 0
    let toIndex = allCellContainers.length
    serializable['cellRecords'] = []
    while (fromIndex !== toIndex) {
      // Deeply follow dead cells records pointing to dead cell containers not yet included in allCellContainers
      for (let i = fromIndex; i < toIndex; i++) {
        serializable.cellRecords.push(
          this.rules.cellRecordToSerializable(allCellContainers[i].cellRecord, allCellContainers)
        )
      }
      fromIndex = toIndex
      toIndex = allCellContainers.length
    }

    // Add all cell records (of alive and dead cells) to serializable plain of life
    serializable['cellContainers'] = []
    for (const cellContainer of allCellContainers) {
      serializable.cellContainers.push(cellContainer.toSerializable())
    }

    return serializable
  }

  /**
   * Execute a turn and update the family tree. During execution each alive cell gets input according to the rules and
   * produces a corresponding output. The rules interpret this output and trigger actions like moving the cell or let the
   * cell make children.
   * @returns False if all cells died (game over), otherwise true
   */
  executeTurn(): boolean {
    const cellContainers = this.getCellContainers()
    if (cellContainers === null) {
      return false // All cells are dead, game over
    }

    this.rules.executeTurn(this._currentTurn, this.plain, cellContainers)
    this.familyTree.update(cellContainers)
    this._currentTurn++
    return true
  }

  /**
   * Get the current turn of the plain of life. The current turn is increased each time a turn is executed.
   */
  get currentTurn(): bigint {
    return this._currentTurn
  }

  /**
   * Get the containers of all living cells on the plain for iterating
   */
  private getCellContainers(): CellContainers<E> | null {
    if (this.firstCellContainer.first.isDead) {
      return null // Game over - there is only one last dead cell
    }
    return new CellContainers(this.firstCellContainer.first)
  }

  /**
   * Get the width of the plain
   */
  get plainWidth(): number {
    return this.plain.width
  }

  /**
   * Get the height of teh plain
   */
  get plainHeight(): number {
    return this.plain.height
  }
}
