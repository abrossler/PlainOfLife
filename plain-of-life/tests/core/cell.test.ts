import { TestCell } from '../stubs/test_cell'

let testCell: TestCell

beforeEach(() => {
  testCell = new TestCell()
})
describe('Cell default implementation toSerializable', () => {
  {
    const serializableCell = new TestCell().toSerializable()
    it('makes a copy of cell', () => {
      expect(serializableCell.memory).toEqual(testCell.memory)
      expect(serializableCell.deepObject).toEqual(testCell.deepObject)
    })
    it('copy of cell is really a deep copy', () => {
      expect(serializableCell.memory).not.toBe(testCell.memory)
      expect((serializableCell.deepObject as { a: unknown }).a).not.toBe(testCell.deepObject.a)
    })
  }
})

describe('Cell default implementation initFromSerializable', () => {
  {
    const testCell = new TestCell()
    const fromSerializable = new TestCell()
    fromSerializable.initFromSerializable(testCell.toSerializable())
    it('reverts default implementation of toSerializable', () => {
      expect(fromSerializable).toEqual(testCell)
    })
  }
})
