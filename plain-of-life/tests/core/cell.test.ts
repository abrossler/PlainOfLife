import { TestCell } from '../stubs/test_cell'

let testCell: TestCell

beforeEach(() => {
  testCell = new TestCell()
})
describe('Cell default implementation toSerializable', () => {
  {
    testCell = new TestCell()
    const serializableCell = testCell.toSerializable()
    // test('makes copy of cell', () => {
    //   expect(serializableCell).toStrictEqual(testCell)
    // })
    test('does not return identical cell', () => {
      expect(serializableCell).not.toBe(testCell)
    })
  }
})
