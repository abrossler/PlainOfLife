import { Rules } from '../core/rules'
import { ExtPlain } from '../core/plain'
import { CellContainers, ExtCellContainer } from '../core/cell_container'

export class DemoRules extends Rules<DemoRules> {
  getSeedCellHints(): { inputLength: number; recommendedSeedCellOutput: Uint8Array } {
    return {
      inputLength: 3,
      recommendedSeedCellOutput: new Uint8Array([0, 0, 0])
    }
  }

  executeTurn(currentTurn: bigint, plain: ExtPlain<DemoRules>, cellContainers: CellContainers<DemoRules>): void {
    for (const container of cellContainers) {
      container.makeChild(1, 1)
      plain.getAt(0, 0).fieldRecord.owner = container
    }
  }

  createNewCellRecord(): { energy: number } {
    return { energy: 0 }
  }

  createNewFieldRecord(): { temperature: number; owner: ExtCellContainer<DemoRules> | null } {
    return { temperature: 25, owner: null }
  }
}

export class DemoRules2 extends Rules<DemoRules> {
  getSeedCellHints(): { inputLength: number; recommendedSeedCellOutput: Uint8Array } {
    return {
      inputLength: 3,
      recommendedSeedCellOutput: new Uint8Array([0, 0, 0])
    }
  }

  executeTurn(currentTurn: bigint, plain: ExtPlain<DemoRules2>, cellContainers: CellContainers<DemoRules2>): void {
    for (const container of cellContainers) {
      container.makeChild(1, 1)

      plain.getAt(0, 0).fieldRecord.owner = container
    }
  }

  createNewCellRecord(): { energy: number } {
    return { energy: 0 }
  }

  createNewFieldRecord(): { temperature: number; owner: ExtCellContainer<DemoRules2> | null } {
    return { temperature: 25, owner: null }
  }

}
