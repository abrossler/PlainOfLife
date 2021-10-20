import { RuleExtensionFactory } from '../../src/core/rule_extension_factory'
import { CellContainer } from '../../src/core/cell_container'

export type RecordWithCellContainer = {
  a: string
  b: { ba: string; bb: string }
  cellContainer1: null | CellContainer<TestRuleExtensionFactoryWithCellContainer>
  cellContainer2: null | CellContainer<TestRuleExtensionFactoryWithCellContainer>
  c: number
}

export class TestRuleExtensionFactoryWithCellContainer implements RuleExtensionFactory {
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
      c: 0
    }
  }
}

export class TestRuleExtensionFactory implements RuleExtensionFactory {
  private static cellRecordId = 1
  private static fieldRecordId = 1

  createNewCellRecord(): { recordId: number } {
    return { recordId: TestRuleExtensionFactory.cellRecordId++ }
  }

  createNewFieldRecord(): { recordId: number } {
    return { recordId: TestRuleExtensionFactory.fieldRecordId++ }
  }
}
