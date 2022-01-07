import { TestCell } from '../../../test_stubs/test_cell'

describe('Cell', () => {
  let testCell: TestCell

  beforeEach(() => {
    testCell = new TestCell()
  })
  describe('default implementation toSerializable', () => {
    {
      const serializableCell = new TestCell().toSerializable()
      it('makes a copy of cell', () => {
        expect(serializableCell.recommendedOutput).toEqual(testCell.recommendedOutput)
        expect(serializableCell.deepObject).toEqual(testCell.deepObject)
      })
      it('copy of cell is really a deep copy', () => {
        expect(serializableCell.recommendedOutput).not.toBe(testCell.recommendedOutput)
        expect((serializableCell.deepObject as { a: unknown }).a).not.toBe(testCell.deepObject.a)
      })
    }
  })

  describe('default implementation initFromSerializable', () => {
    {
      const testCell = new TestCell()
      testCell.deepObject.a.b = 'bbb'
      const fromSerializable = new TestCell()
      fromSerializable.initFromSerializable(testCell.toSerializable())
      it('reverts default implementation of toSerializable', () => {
        expect(fromSerializable).toEqual(testCell)
      })
    }
  })
})
