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
      it('calls defaultToSerializable as expected', () => {
        const cellRecord = rules.createNewCellRecord()
        spyOn(defaultSerialization, 'toSerializable')
        rules.cellRecordToSerializable(cellRecord, allCellContainers)
        expect(defaultSerialization.toSerializable).toHaveBeenCalledWith(cellRecord, allCellContainers)
      })

      it('returns a result that is a copy of the original cell record', () => {
        const cellRecord = rules.createNewCellRecord()
        const serializableCellRecord = rules.cellRecordToSerializable(cellRecord, allCellContainers)
        expect(serializableCellRecord).not.toBe(cellRecord)
        expect(serializableCellRecord).toEqual(cellRecord)
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

      it('returns a result that is a copy of the original field record', () => {
        const fieldRecord = rules.createNewFieldRecord()
        const serializableFieldRecord = rules.fieldRecordToSerializable(fieldRecord, allCellContainers)
        expect(serializableFieldRecord).not.toBe(fieldRecord)
        expect(serializableFieldRecord).toEqual(fieldRecord)
      })
    }
  })

  describe('default implementation of initFromSerializable', () => {
    {
      it('reverts default implementation of toSerializable', () => {
        const testRules = new TestRules()
        testRules.initFromSerializable(serializableRules)
        testRules.initFromSerializablePassed = false // OK, have to set this to false, otherwise test would obviously fail
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
      toInit = rules.createNewCellRecord()
      serializable = rules.cellRecordToSerializable(cellRecord, allCellContainers)
    })
    it('calls defaultFromSerializable as expected', () => {
      spyOn(defaultSerialization, 'fromSerializable')
      rules.initCellRecordFromSerializable(toInit, serializable, allCellContainers)
      expect(defaultSerialization.fromSerializable).toHaveBeenCalledWith(serializable, allCellContainers)
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
      toInit = rules.createNewFieldRecord()
      serializable = rules.fieldRecordToSerializable(fieldRecord, allCellContainers)
    })
    it('calls defaultFromSerializable as expected', () => {
      spyOn(defaultSerialization, 'fromSerializable')
      rules.initFieldRecordFromSerializable(toInit, serializable, allCellContainers)
      expect(defaultSerialization.fromSerializable).toHaveBeenCalledWith(serializable, allCellContainers)
    })
    it('reverts default implementation of fieldRecordToSerializable', () => {
      rules.initFieldRecordFromSerializable(toInit, serializable, allCellContainers)
      expect(toInit).toEqual(fieldRecord)
    })
  })
})
