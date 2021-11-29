import { CellContainers, ExtCellContainer } from '../../src/core/cell_container'
import { ExtPlain } from '../../src/core/plain'
import { Rules } from '../../src/core/rules'

export class TestRules extends Rules<TestRules> {
  season = 'Summer'
  deepObject = { a: { aa: 'AA' } }
  initNewPassed = false
  initWithPlain: ExtPlain<TestRules> | null = null
  initWithCellContainers: CellContainers<TestRules> | null = null
  initFromSerializablePassed = false

  executeTurn(currentTurn: bigint, plain: ExtPlain<TestRules>, cellContainers: CellContainers<TestRules>): void {
    for (const cellContainer of cellContainers) {
      cellContainer.cellRecord.cellAge++
      if (cellContainer.cellRecord.cellAge > 2) {
        cellContainer.die()
        continue
      }
      if (currentTurn === 0n) {
        this.makeChild(cellContainer, plain, 1, 0)
      }
      if (currentTurn === 1n) {
        this.makeChild(cellContainer, plain, 0, 1)
      }
      if (currentTurn === 2n) {
        this.move(cellContainer, plain, 0, 1)
      }
    }
  }
  createNewCellRecord(): {
    cellAge: number
    parent: ExtCellContainer<TestRules> | null
  } {
    return {
      cellAge: 0,
      parent: null
    }
  }
  getRecommendedSeedCellOutput(): Uint8Array {
    return new Uint8Array([1, 2, 3])
  }

  createNewFieldRecord(): {
    owner: ExtCellContainer<TestRules> | null
    temperature: number
  } {
    return {
      owner: null,
      temperature: 25
    }
  }

  initNew(plain: ExtPlain<TestRules>, cellContainers: CellContainers<TestRules>): void {
    super.initNew(plain, cellContainers)
    this.initNewPassed = true
    this.initWithPlain = plain
    this.initWithCellContainers = cellContainers
  }

  initFromSerializable(serializable: Record<string, unknown>): void {
    super.initFromSerializable(serializable)
    this.initFromSerializablePassed = true
  }

  toSerializable(): Record<string, unknown> {
    this.initWithPlain = null
    this.initWithCellContainers = null

    return super.toSerializable()
  }

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

  private move(cellContainer: ExtCellContainer<TestRules>, plain: ExtPlain<TestRules>, dX: number, dY: number): void {
    cellContainer.move(dX, dY)
    plain.getAt(cellContainer.posX, cellContainer.posY).fieldRecord.owner = cellContainer
  }
}
