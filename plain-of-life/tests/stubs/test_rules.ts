import { CellContainer, CellContainers } from '../../src/core/cell_container'
import { ExtPlain } from '../../src/core/plain'
import { Rules } from '../../src/core/rules'
import { RuleExtensionFactoryWithCellContainer } from './rule_extension_factory'

export class TestRules extends Rules<RuleExtensionFactoryWithCellContainer> {
  season = 'Summer'
  deepObject = { a: { aa: 'AA' } }

  executeTurn(
    currentTurn: bigint,
    plain: ExtPlain<RuleExtensionFactoryWithCellContainer>,
    cellContainers: CellContainers<RuleExtensionFactoryWithCellContainer>
  ): void {
    for (const cellContainer of cellContainers) {
      cellContainer.cellRecord.c++
      if (cellContainer.cellRecord.c > 2) {
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
  } {
    return {
        owner: null
    }
  }
}
