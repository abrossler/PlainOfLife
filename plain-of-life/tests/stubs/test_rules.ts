import { CellContainers, ExtCellContainer } from '../../src/core/cell_container'
import { ExtPlain } from '../../src/core/plain'
import { Rules } from '../../src/core/rules'

/**
 * A simple set of test rules for test automates
 */
export class TestRules extends Rules<TestRules> {
  season = 'Summer' // Sample property on rule level
  deepObject = { a: { aa: 'AA' } } // Other sample property on rule level

  /**
   * Simple executeTurn implementation just letting the cell records do something (reproduce, move, die)
   */
  executeTurn(currentTurn: bigint, plain: ExtPlain<TestRules>, cellContainers: CellContainers<TestRules>): void {
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
        this.move(cellContainer, plain, 0, 1) // ... move in turn 2
      }
    }
  }

  /**
   * Return arbitrary recommended seed cell output
   */
  getRecommendedSeedCellOutput(): Uint8Array {
    return new Uint8Array([1, 2, 3])
  }

  /**
   * Create a cell record with a cell age and a reference to the parent record
   */
  createNewCellRecord(): {
    cellAge: number
    parent: ExtCellContainer<TestRules> | null
  } {
    return {
      cellAge: 0,
      parent: null
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
   * Init the rules for a new plain of life for initial cell containers with seed cells.
   * This means actually to set the owner of the plain fields to the seed cell containers
   */
  initNew(plain: ExtPlain<TestRules>, cellContainers: CellContainers<TestRules>): void {
    super.initNew(plain, cellContainers)
    for (const cellContainer of cellContainers) {
      plain.getAt(cellContainer.posX, cellContainer.posY).fieldRecord.owner = cellContainer
    }
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
    const child = cellContainer.makeChild(dX, dY)
    child.cellRecord.parent = cellContainer
    plain.getAt(child.posX, child.posY).fieldRecord.owner = child
  }

  /**
   * Move a cell container and make the cell container the owner of the field it is moved to
   */
  private move(cellContainer: ExtCellContainer<TestRules>, plain: ExtPlain<TestRules>, dX: number, dY: number): void {
    cellContainer.move(dX, dY)
    plain.getAt(cellContainer.posX, cellContainer.posY).fieldRecord.owner = cellContainer
  }
}
