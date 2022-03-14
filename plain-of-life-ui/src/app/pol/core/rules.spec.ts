import { CellContainer, ExtCellContainer } from './cell_container'
import { Plain } from './plain'
import { TestRules } from '../../../test_stubs/test_rules'
import { TestRuleExtensionFactory } from '../../../test_stubs/test_rule_extension_factory'

let rules: TestRules
let serializableRules: Record<string, unknown>
let allCellContainers: ExtCellContainer<TestRules>[]
let cellContainer: CellContainer<TestRules>

describe('Rules', () => {
  beforeEach(() => {
    rules = new TestRules()
    const plain = new Plain(rules, 2, 2)
    cellContainer = new CellContainer(rules, plain)
    serializableRules = rules.toSerializable()
    allCellContainers = []
  })
  describe('default implementation of toSerializable', () => {
    {
      it('makes a copy of the rules properties', () => {
        expect(serializableRules.season).toEqual(rules.season)
        expect(serializableRules.deepObject).toEqual(rules.deepObject)
      })
      it('really makes a deep copy', () => {
        expect(serializableRules.deepObject).not.toBe(rules.deepObject)
        expect((serializableRules.deepObject as { a: unknown }).a).not.toBe(rules.deepObject.a)
      })
    }
  })

  describe('default implementation of cellRecordToSerializable', () => {
    {
      it('returns a result that is a copy of the original cell record', () => {
        const cellRecord = rules.createNewCellRecord()
        const serializableCellRecord = rules.cellRecordToSerializable(cellRecord, allCellContainers)
        expect(serializableCellRecord).not.toBe(cellRecord)
        expect(serializableCellRecord).toEqual(cellRecord)
      })
      it('replaces a referenced cell container with the corresponding index', () => {
        const cellRecord = rules.createNewCellRecord()
        cellRecord.parent = cellContainer
        const serializableCellRecord = rules.cellRecordToSerializable(cellRecord, allCellContainers)
        expect(serializableCellRecord.parent__CellRecord__).toBe(0)
        expect(allCellContainers.length).toBe(1)
        expect(allCellContainers[0]).toBe(cellContainer)
      })
    }
  })

  describe('default implementation of fieldRecordToSerializable', () => {
    {
      it('returns a result that is a copy of the original field record', () => {
        const fieldRecord = rules.createNewFieldRecord()
        const serializableFieldRecord = rules.fieldRecordToSerializable(fieldRecord, allCellContainers)
        expect(serializableFieldRecord).not.toBe(fieldRecord)
        expect(serializableFieldRecord).toEqual(fieldRecord)
      })
      it('replaces a referenced cell container with the corresponding index', () => {
        const fieldRecord = rules.createNewFieldRecord()
        fieldRecord.owner = cellContainer
        allCellContainers.push(cellContainer)
        const serializableFieldRecord = rules.fieldRecordToSerializable(fieldRecord, allCellContainers)
        expect(serializableFieldRecord.owner__CellRecord__).toBe(0)
        expect(allCellContainers.length).toBe(1)
        expect(allCellContainers[0]).toBe(cellContainer)
      })
    }
  })

  describe('default implementation of initFromSerializable', () => {
    {
      it('reverts default implementation of toSerializable', () => {
        const testRules = new TestRules()
        testRules.initFromSerializable(serializableRules, new Plain(new TestRuleExtensionFactory(), 2, 2))
        expect(testRules).toEqual(rules)
      })
    }
  })

  describe('default implementation of initCellRecordFromSerializable', () => {
    let cellRecord: ReturnType<TestRules['createNewCellRecord']>
    let toInit: ReturnType<TestRules['createNewCellRecord']>
    let serializable: Record<string, unknown> 
    beforeEach(() => {
      cellRecord = rules.createNewCellRecord()
      cellRecord.cellAge = 25 // Set an property to a non-default value to see an effect of initCellRecordFromSerializable
      cellRecord.parent = cellContainer // Set a cell container to test that indexing works
      toInit = rules.createNewCellRecord()
      serializable = rules.cellRecordToSerializable(cellRecord, allCellContainers)
    })
    it('reverts default implementation of cellRecordToSerializable', () => {
      rules.initCellRecordFromSerializable(toInit, serializable, allCellContainers)
      expect(toInit).toEqual(cellRecord)
    })
  })

  describe('default implementation of initFieldRecordFromSerializable', () => {
    let fieldRecord: ReturnType<TestRules['createNewFieldRecord']>
    let toInit: ReturnType<TestRules['createNewFieldRecord']>
    let serializable: Record<string, unknown>
    beforeEach(() => {
      fieldRecord = rules.createNewFieldRecord()
      fieldRecord.temperature = 31 // Set an property to a non-default value to see an effect of initFieldRecordFromSerializable
      fieldRecord.owner = cellContainer // Set a cell container to test that indexing works
      toInit = rules.createNewFieldRecord()
      serializable = rules.fieldRecordToSerializable(fieldRecord, allCellContainers)
    })
    it('reverts default implementation of fieldRecordToSerializable', () => {
      rules.initFieldRecordFromSerializable(toInit, serializable, allCellContainers)
      expect(toInit).toEqual(fieldRecord)
    })
  })
})
