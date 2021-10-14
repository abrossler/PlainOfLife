import { RuleExtensionFactory } from '../../src/core/rule_extension_factory'
import { CellContainer } from '../../src/core/cell_container'

export type RecordWithCellContainer = {
  a: string
  b: { ba: string; bb: string }
  cellContainer1: null | CellContainer<RuleExtensionFactoryWithCellContainer>
  cellContainer2: null | CellContainer<RuleExtensionFactoryWithCellContainer>
  c: number
}

export class RuleExtensionFactoryWithCellContainer implements RuleExtensionFactory {
  createNewCellRecord(): RecordWithCellContainer {
    return this.createRecord()
  }

  createNewFieldRecord(): RecordWithCellContainer {
    return this.createRecord()
  }

  private createRecord(): RecordWithCellContainer {
    return {
      a: 'A',
      b: { ba: 'BA', bb: 'BB' },
      cellContainer1: null,
      cellContainer2: null,
      c: 1
    }
  }
}

export class SimpleRuleExtensionFactory implements RuleExtensionFactory {
  private static cellRecordId = 1
  private static fieldRecordId = 1

  createNewCellRecord(): { recordId: number } {
    return { recordId: SimpleRuleExtensionFactory.cellRecordId++ }
  }

  createNewFieldRecord(): { recordId: number } {
    return { recordId: SimpleRuleExtensionFactory.fieldRecordId++ }
  }
}
