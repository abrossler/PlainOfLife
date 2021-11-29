import { ExtCellContainer } from '../../src/core/cell_container'
import { defaultSerialization } from '../../src/core/default_serialization'
import { TestRules } from '../stubs/test_rules'

let rules: TestRules
let serializableRules: Record<string, unknown>
let allCellContainers: ExtCellContainer<TestRules>[]

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
        const cellRecord = rules.createNewCellRecord()
        spyOn(defaultSerialization, 'toSerializable')
        rules.cellRecordToSerializable(cellRecord, allCellContainers)
        expect(defaultSerialization.toSerializable).toHaveBeenCalledWith(cellRecord, allCellContainers)
      })

      it('returns a result that is a copy with the expected properties', () => {
        const cellRecord = rules.createNewCellRecord()
        expect(rules.cellRecordToSerializable(cellRecord, allCellContainers)).not.toBe(cellRecord)
        expect(rules.cellRecordToSerializable(cellRecord, allCellContainers)).toEqual(cellRecord)
      })
    }
  })

  describe('default implementation of fieldRecordToSerializable', () => {
    {
      it('calls defaultToSerializable as expected', () => {
        const fieldRecord = rules.createNewFieldRecord()
        spyOn(defaultSerialization, 'toSerializable')
        rules.fieldRecordToSerializable(fieldRecord, allCellContainers)
        expect(defaultSerialization.toSerializable).toHaveBeenCalledWith(fieldRecord, allCellContainers)
      })

      it('returns a result that is a copy with the expected properties', () => {
        const fieldRecord = rules.createNewFieldRecord()
        expect(rules.fieldRecordToSerializable(fieldRecord, allCellContainers)).not.toBe(fieldRecord)
        expect(rules.fieldRecordToSerializable(fieldRecord, allCellContainers)).toEqual(fieldRecord)
      })
    }
  })

  describe('default implementation of initFromSerializable', () => {
    {
      it('reverts default implementation of toSerializable', () => {
        const testRules = new TestRules()
        testRules.initFromSerializable(serializableRules)
        expect(testRules.season).toBe(rules.season)
        expect(testRules.deepObject).toEqual(rules.deepObject)
      })
    }
  })

  describe('default implementation of initCellRecordFromSerializable', () => {
    {
      it('calls defaultFromSerializable as expected', () => {
        const cellRecord = rules.createNewCellRecord()
        const toInit = rules.createNewCellRecord()
        const serializable = rules.cellRecordToSerializable(cellRecord, allCellContainers)
        spyOn(defaultSerialization, 'fromSerializable')
        rules.initCellRecordFromSerializable(toInit, serializable, allCellContainers)
        expect(defaultSerialization.fromSerializable).toHaveBeenCalledWith(serializable, allCellContainers)
      })
      it('reverts default implementation of cellRecordToSerializable', () => {
        const cellRecord = rules.createNewCellRecord()
        cellRecord.cellAge = 25
        const toInit = rules.createNewCellRecord()
        const serializable = rules.cellRecordToSerializable(cellRecord, allCellContainers)
        rules.initCellRecordFromSerializable(toInit, serializable, allCellContainers)
        expect(toInit).toEqual(cellRecord)
      })
    }
  })

  describe('default implementation of initFieldRecordFromSerializable', () => {
    {
      it('calls defaultFromSerializable as expected', () => {
        const fieldRecord = rules.createNewFieldRecord()
        const toInit = rules.createNewFieldRecord()
        const serializable = rules.fieldRecordToSerializable(fieldRecord, allCellContainers)
        spyOn(defaultSerialization, 'fromSerializable')
        rules.initFieldRecordFromSerializable(toInit, serializable, allCellContainers)
        expect(defaultSerialization.fromSerializable).toHaveBeenCalledWith(serializable, allCellContainers)
      })
      it('reverts default implementation of fieldRecordToSerializable', () => {
        const fieldRecord = rules.createNewFieldRecord()
        fieldRecord.temperature = 31
        const toInit = rules.createNewFieldRecord()
        const serializable = rules.fieldRecordToSerializable(fieldRecord, allCellContainers)
        rules.initFieldRecordFromSerializable(toInit, serializable, allCellContainers)
        expect(toInit).toEqual(fieldRecord)
      })
    }
  })
})
