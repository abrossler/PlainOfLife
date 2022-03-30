import { CellContainers, ExtCellContainer } from '../app/pol/core/cell_container'
import { ExtPlain } from '../app/pol/core/plain'
import { Rules } from '../app/pol/core/rules'

/**
 * A simple set of test rules for test automates
 */
export class TestRules extends Rules<TestRules> {
  season = 'Summer' // Sample property on rule level
  deepObject = { a: { aa: 'AA' } } // Other sample property on rule level

  /**
   * Simple executeTurn implementation just letting the cell records do something (reproduce, move, die)
   */
  executeTurn(plain: ExtPlain<TestRules>, cellContainers: CellContainers<TestRules>, currentTurn: bigint): void {
    // Toggle between summer and winter every turn...
    if (this.season === 'Summer') {
      this.season = 'Winter'
    } else {
      this.season = 'Summer'
    }

    // For all cell containers ...
    for (const cellContainer of cellContainers) {
      cellContainer.cellRecord.cellAge++
      if (cellContainer.cellRecord.cellAge > 2) {
        // ... die if elder than 2 turns
        cellContainer.die()
        continue
      }
      if (currentTurn === 0n) {
        this.makeChild(cellContainer, plain, 1, 0) // ... reproduce in turn 0
      }
      if (currentTurn === 1n) {
        this.makeChild(cellContainer, plain, 0, 1) // ... reproduce in turn 1
      }
      if (currentTurn === 2n) {
        this.moveTo(cellContainer, plain, 0, 1) // ... move in turn 2
      }
    }
  }

  /**
   * Return arbitrary recommended seed cell output
   */
  getSeedCellHints(): { inputLength: number; recommendedSeedCellOutput: Uint8Array } {
    return {
      inputLength: 3,
      recommendedSeedCellOutput: new Uint8Array([1, 2, 3])
    }
  }

  /**
   * Create a cell record with a cell age and a reference to the parent record
   */
  createNewCellRecord(): {
    cellAge: number
    parent: ExtCellContainer<TestRules> | null
    ownedFieldsCount: number
    name: string
  } {
    return {
      cellAge: 0,
      parent: null,
      ownedFieldsCount: 0,
      name: ''
    }
  }

  /**
   * Create a field record with a field temperature and a owner record of the field
   */
  createNewFieldRecord(): {
    owner: ExtCellContainer<TestRules> | null
    temperature: number
  } {
    return {
      owner: null,
      temperature: 25
    }
  }

  /**
   * Init the rules for a new plain of life and set the temperature of a field record.
   */
  initNew(plain: ExtPlain<TestRules>): void {
    super.initNew(plain)
    plain.getAt(1, 1).fieldRecord.temperature = 99
  }

  /**
   * Make a child and set the parent of the child. Make the child the owner of the field it is located on.
   */
  private makeChild(
    cellContainer: ExtCellContainer<TestRules>,
    plain: ExtPlain<TestRules>,
    dX: number,
    dY: number
  ): void {
    const child = cellContainer.makeChildTo(dX, dY)
    child.cellRecord.parent = cellContainer
    plain.getAt(child.posX, child.posY).fieldRecord.owner = child
  }

  /**
   * Move a cell container and make the cell container the owner of the field it is moved to
   */
  private moveTo(cellContainer: ExtCellContainer<TestRules>, plain: ExtPlain<TestRules>, dX: number, dY: number): void {
    cellContainer.moveTo(dX, dY)
    plain.getAt(cellContainer.posX, cellContainer.posY).fieldRecord.owner = cellContainer
  }
}
