import { RuleExtensionFactory } from '../../app/pol/core/rule_extension_factory'
import { CellContainer } from '../../app/pol/core/cell_container'

/**
 * A super simplistic rule extension factory for test automates.
 */
export class TestRuleExtensionFactory implements RuleExtensionFactory {
  private static cellRecordId = 1 // Just to easily distinguish cell record instances when debugging
  private static fieldRecordId = 1 // Just to easily distinguish field record instances when debugging

  createNewCellRecord(): { recordId: number } {
    return { recordId: TestRuleExtensionFactory.cellRecordId++ }
  }

  createNewFieldRecord(): { recordId: number } {
    return { recordId: TestRuleExtensionFactory.fieldRecordId } // TODO ++
  }
}

/**
 * A cell or field record with deep structure and cell containers
 */
export type RecordWithCellContainer = {
  a: string
  b: { ba: string; bb: string }
  cellContainer1: null | CellContainer<TestRuleExtensionFactoryWithCellContainer>
  cellContainer2: null | CellContainer<TestRuleExtensionFactoryWithCellContainer>
  c: number
}

/**
 * A rule extension factory for test automates with a deep field and cell record structure including cell containers
 */
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
