import { ExtCellContainer } from '../../src/core/cell_container'
import { defaultSerialization } from '../../src/core/default_serialization'
import { RuleExtensionFactoryWithCellContainer } from '../stubs/rule_extension_factory'
import { TestRules } from '../stubs/test_rules'

let rules: TestRules
let serializableRules: Record<string, unknown>
let allCellContainers: ExtCellContainer<RuleExtensionFactoryWithCellContainer>[]

describe('Rules', () => {
  beforeEach(() => {
    rules = new TestRules()
    serializableRules = rules.toSerializable()
    allCellContainers = []
  })
  describe('default implementation of toSerializable', () => {
    {
      it('makes a copy of rules', () => {
        expect(serializableRules.season).toEqual(rules.season)
        expect(serializableRules.deepObject).toEqual(rules.deepObject)
      })
      it('copy of rules is really a deep copy', () => {
        expect(serializableRules.deepObject).not.toBe(rules.deepObject)
        expect((serializableRules.deepObject as { a: unknown }).a).not.toBe(rules.deepObject.a)
      })
    }
  })

  describe('default implementation of cellRecordToSerializable', () => {
    {
      it('calls defaultToSerializable as expected', () => {
        let cellRecord = new RuleExtensionFactoryWithCellContainer().createNewCellRecord()
        spyOn(defaultSerialization, 'toSerializable')
        rules.cellRecordToSerializable(cellRecord, allCellContainers)
        expect(defaultSerialization.toSerializable).toHaveBeenCalledWith(cellRecord, allCellContainers)
      })

      it('returns a result that is a copy with the expected properties', () => {
        let cellRecord = new RuleExtensionFactoryWithCellContainer().createNewCellRecord()
        expect(rules.cellRecordToSerializable(cellRecord, allCellContainers)).not.toBe(cellRecord)
        expect(rules.cellRecordToSerializable(cellRecord, allCellContainers)).toEqual(cellRecord)
      })
    }
  })

  describe('default implementation of fieldRecordToSerializable', () => {
    {
      it('calls defaultToSerializable as expected', () => {
        let fieldRecord = new RuleExtensionFactoryWithCellContainer().createNewFieldRecord()
        spyOn(defaultSerialization, 'toSerializable')
        rules.cellRecordToSerializable(fieldRecord, allCellContainers)
        expect(defaultSerialization.toSerializable).toHaveBeenCalledWith(fieldRecord, allCellContainers)
      })

      it('returns a result that is a copy with the expected properties', () => {
        let fieldRecord = new RuleExtensionFactoryWithCellContainer().createNewFieldRecord()
        expect(rules.cellRecordToSerializable(fieldRecord, allCellContainers)).not.toBe(fieldRecord)
        expect(rules.cellRecordToSerializable(fieldRecord, allCellContainers)).toEqual(fieldRecord)
      })
    }
  })

  describe('default implementation of initFromSerializable', () => {
    {
      it('reverts default implementation of toSerializable', () => {
        let testRules = new TestRules()
        testRules.initFromSerializable(serializableRules)
        expect(testRules.season).toBe(rules.season)
        expect(testRules.deepObject).toEqual(rules.deepObject)
      })
    }
  })

  describe('default implementation of initCellRecordFromSerializable', () => {
    {
      it('calls defaultFromSerializable as expected', () => {
        let cellRecord = new RuleExtensionFactoryWithCellContainer().createNewCellRecord()
        let toInit = new RuleExtensionFactoryWithCellContainer().createNewCellRecord()
        let serializable = rules.cellRecordToSerializable(cellRecord, allCellContainers)
        spyOn(defaultSerialization, 'fromSerializable')
        rules.initCellRecordFromSerializable(toInit, serializable, allCellContainers)
        expect(defaultSerialization.fromSerializable).toHaveBeenCalledWith(serializable, allCellContainers)
      })
      it('reverts default implementation of cellRecordToSerializable', () => {
        let cellRecord = new RuleExtensionFactoryWithCellContainer().createNewCellRecord()
        cellRecord.a = 'AA'
        let toInit = new RuleExtensionFactoryWithCellContainer().createNewCellRecord()
        let serializable = rules.cellRecordToSerializable(cellRecord, allCellContainers)
        rules.initCellRecordFromSerializable(toInit, serializable, allCellContainers)
        expect(toInit).toEqual(cellRecord)
      })
    }
  })

  describe('default implementation of initFieldRecordFromSerializable', () => {
    {
      it('calls defaultFromSerializable as expected', () => {
        let fieldRecord = new RuleExtensionFactoryWithCellContainer().createNewFieldRecord()
        let toInit = new RuleExtensionFactoryWithCellContainer().createNewFieldRecord()
        let serializable = rules.fieldRecordToSerializable(fieldRecord, allCellContainers)
        spyOn(defaultSerialization, 'fromSerializable')
        rules.initFieldRecordFromSerializable(toInit, serializable, allCellContainers)
        expect(defaultSerialization.fromSerializable).toHaveBeenCalledWith(serializable, allCellContainers)
      })
      it('reverts default implementation of fieldRecordToSerializable', () => {
        let fieldRecord = new RuleExtensionFactoryWithCellContainer().createNewFieldRecord()
        fieldRecord.b.ba = 'Bb Aa'
        let toInit = new RuleExtensionFactoryWithCellContainer().createNewFieldRecord()
        let serializable = rules.fieldRecordToSerializable(fieldRecord, allCellContainers)
        rules.initFieldRecordFromSerializable(toInit, serializable, allCellContainers)
        expect(toInit).toEqual(fieldRecord)
      })
    }
  })
})
