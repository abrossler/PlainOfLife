import { CellContainer, CellContainers } from '../../src/core/cell_container'
import { ExtPlain } from '../../src/core/plain'
import { Rules } from '../../src/core/rules'

export class TestRules extends Rules<TestRules> {
  season = 'Summer'
  deepObject = { a: { aa: 'AA' } }
  initNewPassed = false
  initWithPlain: ExtPlain<TestRules> | null = null
  initWithCellContainers: CellContainers<TestRules> | null = null

  executeTurn(
    currentTurn: bigint,
    plain: ExtPlain<TestRules>,
    cellContainers: CellContainers<TestRules>
  ): void {
    for (const cellContainer of cellContainers) {
      cellContainer.cellRecord.cellAge++
      if (cellContainer.cellRecord.cellAge > 2) {
        cellContainer.die()
        continue
      }
      if (currentTurn === 0n) {
        cellContainer.makeChild(1, 0)
      }
      if (currentTurn === 1n) {
        cellContainer.makeChild(0, 1)
      }
      if (currentTurn === 2n) {
        cellContainer.move(0, 1)
      }
    }
  }
  createNewCellRecord(): {
    cellAge: number
  } {
    return {
      cellAge: 0
    }
  }
  getRecommendedSeedCellOutput(): Uint8Array {
    return new Uint8Array([1, 2, 3])
  }

  createNewFieldRecord(): {
    owner: CellContainer<TestRules> | null
    temperature: number
  } {
    return {
      owner: null,
      temperature: 25
    }
  }

  initNew(
    plain: ExtPlain<TestRules>,
    cellContainers: CellContainers<TestRules>
  ): void {
    this.initNewPassed = true
    this.initWithPlain = plain
    this.initWithCellContainers = cellContainers
    super.initNew(plain, cellContainers)
  }

  toSerializable(): Record<string, unknown> {
    this.initWithPlain = null
    this.initWithCellContainers = null

    return super.toSerializable()
  }
}
