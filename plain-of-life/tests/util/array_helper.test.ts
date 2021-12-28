import { removeFromArray } from '../../src/util/array_helper'

describe('removeFromArray', () => {
  it('works as expected', () => {
    const array = [1, 2, 2, 2, 3]
    const removed = removeFromArray(2, array)
    expect(array).toEqual([1, 3])
    expect(removed).toBe(3)
    expect(removeFromArray(2, array)).toBe(0)
    expect(removeFromArray(1, array)).toBe(1)
    expect(removeFromArray(3, array)).toBe(1)
    expect(array).toEqual([])
    expect(removeFromArray(0, array)).toBe(0)
  })
})
