import { CoherentAreasManager } from './coherent_areas_manager'
import { Plain } from '../core/plain'
import { ExtCellContainer } from '../core/cell_container'
import { PlainOfLife } from '../core/plain_of_life'
import { TestRules } from '../../../test_stubs/test_rules'
import { TestCell } from '../../../test_stubs/test_cell'
import { FloodFill } from '../util/flood_fill'

describe('CoherentAreasManager', () => {
  describe('test', () => {
    it('compares plains correctly', () => {
      // Test the test - make sure that there is no difference found for identical plains
      const plainBefore = [
        ['  ', ' A', 'a '],
        ['B', 'CD', 'Fa'],
        ['GHg', ' I', 'a '],
        ['', 'J', '   ']
      ]
      const expectedPlainAfter = [
        [' ', 'A', 'a'],
        ['B', 'CD', 'Fa'],
        ['GHg', ' I ', 'a '],
        [' ', ' J', '   ']
      ]
      const plain = prepare(plainBefore).plain
      expect(compare(plain, expectedPlainAfter)).toEqual('')
    })
  })

  describe('onCellMove', () => {
    it('performs simple move up correctly (considering torus topography and keeping ownership of neighbor)', () => {
      const plainBefore = [
        [' ', ' ', ' '],
        ['a', 'A', ' '],
        [' ', ' ', ' ']
      ]
      const expectedPlainAfter = [
        [' ', 'a', ' '],
        ['a', 'a', ' '],
        [' ', 'A', ' ']
      ]
      const prep = prepare(plainBefore)
      const a = prep.plain.getAt(1, 1).getCellContainers()[0]
      a.move(0, -1)
      a.move(0, -1)
      expect(compare(prep.plain, expectedPlainAfter)).toEqual('')
      expect(a.cellRecord.ownedFieldsCount).toBe(4)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(0)
    })

    it('performs simple move right correctly (considering torus topography and keeping ownership of neighbor)', () => {
      const plainBefore = [
        [' ', 'a', ' '],
        [' ', 'A', ' '],
        ['B', 'b', 'b']
      ]
      const expectedPlainAfter = [
        [' ', 'a', ' '],
        ['A', 'a', 'a'],
        ['B', 'b', 'b']
      ]
      const plain = prepare(plainBefore).plain
      const a = plain.getAt(1, 1).getCellContainers()[0]
      a.move(1, 0)
      a.move(1, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
    })

    it('performs simple move down correctly (considering torus topography)', () => {
      const plainBefore = [
        [' ', ' ', ' '],
        [' ', 'A', ' '],
        [' ', ' ', ' ']
      ]
      const expectedPlainAfter = [
        [' ', 'A', ' '],
        [' ', 'a', ' '],
        [' ', 'a', ' ']
      ]
      const plain = prepare(plainBefore).plain
      const a = plain.getAt(1, 1).getCellContainers()[0]
      a.move(0, 1)
      a.move(0, 1)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
    })

    it('performs simple move left correctly (considering torus topography and keeping ownership of neighbor)', () => {
      const plainBefore = [
        [' ', ' ', ' '],
        [' ', 'A', ' '],
        [' ', 'a', ' ']
      ]
      const expectedPlainAfter = [
        [' ', ' ', ' '],
        ['a', 'A', 'a'],
        [' ', 'a', ' ']
      ]
      const plain = prepare(plainBefore).plain
      const a = plain.getAt(1, 1).getCellContainers()[0]
      a.move(-1, 0)
      a.move(-1, 0)
      a.move(-1, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(a.cellRecord.ownedFieldsCount).toBe(4)
    })

    it('looses all owned fields if moving 2 steps up and being disconnected (considering torus topography)', () => {
      const plainBefore = [
        ['a', ' ', ' ', 'a'],
        ['a', 'a', 'A', 'a'],
        [' ', ' ', ' ', ' '],
        ['a', ' ', ' ', ' ']
      ]
      const expectedPlainAfter = [
        [' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' '],
        [' ', ' ', 'A', ' ']
      ]
      const prep = prepare(plainBefore)
      const a = prep.plain.getAt(2, 1).getCellContainers()[0]
      a.move(0, -2)
      expect(compare(prep.plain, expectedPlainAfter)).toEqual('')
      expect(a.cellRecord.ownedFieldsCount).toBe(1)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(1)
    })

    it('looses all owned fields if moving 2 steps right and being disconnected (considering torus topography)', () => {
      const plainBefore = [
        [' ', ' ', 'A', ' '],
        [' ', ' ', 'a', ' ']
      ]
      const expectedPlainAfter = [
        ['A', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ']
      ]
      const plain = prepare(plainBefore).plain
      const a = plain.getAt(2, 0).getCellContainers()[0]
      a.move(2, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
    })

    it('looses all owned fields if moving 2 steps down and being disconnected (considering torus topography)', () => {
      const plainBefore = [
        [' ', 'b', 'B', ' '],
        [' ', ' ', ' ', ' '],
        [' ', 'a', 'A', ' '],
        [' ', 'a', ' ', ' ']
      ]
      const expectedPlainAfter = [
        [' ', ' ', 'BA', ' '],
        [' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ']
      ]
      const plain = prepare(plainBefore).plain
      const a = plain.getAt(2, 2).getCellContainers()[0]
      a.move(0, 2)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
    })

    it('looses all owned fields if moving 2 steps left and being disconnected (considering torus topography)', () => {
      const plainBefore = [
        [' ', 'a', 'b', 'b'],
        [' ', 'A', 'B', ' ']
      ]
      const expectedPlainAfter = [
        [' ', ' ', 'b', 'b'],
        [' ', ' ', 'B', 'A']
      ]
      const plain = prepare(plainBefore).plain
      const a = plain.getAt(1, 1).getCellContainers()[0]
      a.move(-2, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
    })

    it('does not loose owned fields if moving 2 steps but still is connected', () => {
      let plainBefore = [
        [' ', ' ', ' ', ' '],
        ['A', 'a', ' ', ' '],
        [' ', ' ', ' ', ' ']
      ]
      let expectedPlainAfter = [
        [' ', ' ', ' ', ' '],
        ['a', 'a', 'A', ' '],
        [' ', ' ', ' ', ' ']
      ]
      let plain = prepare(plainBefore).plain
      let a = plain.getAt(0, 1).getCellContainers()[0]
      a.move(2, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(a.cellRecord.ownedFieldsCount).toBe(3)

      plainBefore = [
        [' ', ' ', 'B', ' '],
        ['A', ' ', ' ', 'a'],
        [' ', ' ', ' ', ' ']
      ]
      expectedPlainAfter = [
        [' ', ' ', 'B', ' '],
        ['a', ' ', 'A', 'a'],
        [' ', ' ', ' ', ' ']
      ]
      plain = prepare(plainBefore).plain
      a = plain.getAt(0, 1).getCellContainers()[0]
      a.move(2, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')

      plainBefore = [
        ['a', 'a', 'a', ' '],
        ['A', 'B', 'C', ' '],
        [' ', 'D', 'E', ' ']
      ]
      expectedPlainAfter = [
        ['a', 'a', 'a', ' '],
        ['a', 'B', 'CA', ' '],
        [' ', 'D', 'E', ' ']
      ]
      plain = prepare(plainBefore).plain
      a = plain.getAt(0, 1).getCellContainers()[0]
      a.move(2, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')

      plainBefore = [
        [' ', ' ', ' ', ' '],
        ['A', ' ', ' ', ' '],
        ['a', 'a', 'a', ' ']
      ]
      expectedPlainAfter = [
        [' ', ' ', ' ', ' '],
        ['a', ' ', 'A', ' '],
        ['a', 'a', 'a', ' ']
      ]
      plain = prepare(plainBefore).plain
      a = plain.getAt(0, 1).getCellContainers()[0]
      a.move(2, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
    })

    it('does not change anything if moving on already owned field', () => {
      const plainBefore = [
        [' ', ' ', ' '],
        ['a', 'A', ' ']
      ]
      const expectedPlainAfter = [
        [' ', ' ', ' '],
        ['A', 'a', ' ']
      ]
      const plain = prepare(plainBefore).plain
      const a = plain.getAt(1, 1).getCellContainers()[0]
      a.move(-1, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(a.cellRecord.ownedFieldsCount).toBe(2)
    })

    it('lets the old owner loose all fields if directly moving on the old owner', () => {
      const plainBefore = [
        [' ', ' ', 'b'],
        ['A', 'B', 'b'],
        ['b', ' ', 'b']
      ]
      let expectedPlainAfter = [
        [' ', ' ', ' '],
        ['a', 'BA', ' '],
        [' ', ' ', ' ']
      ]
      const prep = prepare(plainBefore)
      const a = prep.plain.getAt(0, 1).getCellContainers()[0]
      const b = prep.plain.getAt(1, 1).getCellContainers()[0]
      a.move(1, 0)
      expect(compare(prep.plain, expectedPlainAfter)).toEqual('')
      expect(a.cellRecord.ownedFieldsCount).toBe(2)
      expect(b.cellRecord.ownedFieldsCount).toBe(0)
      a.move(1, 0)
      expectedPlainAfter = [
        [' ', ' ', ' '],
        ['a', 'Ba', 'A'],
        [' ', ' ', ' ']
      ]
      expect(compare(prep.plain, expectedPlainAfter)).toEqual('')
      expect(a.cellRecord.ownedFieldsCount).toBe(3)
      expect(b.cellRecord.ownedFieldsCount).toBe(0)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(1)
    })

    it('just takes away one field from the old owner if there is max one more neighbor of the same old owner', () => {
      let plainBefore = [
        [' ', ' ', ' '],
        ['A', 'b', ' '],
        [' ', 'B', ' ']
      ]
      let expectedPlainAfter = [
        [' ', ' ', ' '],
        ['a', 'A', ' '],
        [' ', 'B', ' ']
      ]
      const prep = prepare(plainBefore)
      let plain = prep.plain
      let a = plain.getAt(0, 1).getCellContainers()[0]
      let b = plain.getAt(1, 2).getCellContainers()[0]
      a.move(1, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(a.cellRecord.ownedFieldsCount).toBe(2)
      expect(b.cellRecord.ownedFieldsCount).toBe(1)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(0)

      plainBefore = [
        [' ', 'B', ' '],
        ['A', 'b', ' '],
        [' ', ' ', ' ']
      ]
      expectedPlainAfter = [
        [' ', 'B', ' '],
        ['a', 'A', ' '],
        [' ', ' ', ' ']
      ]
      plain = prepare(plainBefore).plain
      a = plain.getAt(0, 1).getCellContainers()[0]
      b = plain.getAt(1, 0).getCellContainers()[0]
      a.move(1, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')

      plainBefore = [
        [' ', ' ', ' '],
        ['A', 'b', 'B'],
        [' ', ' ', ' ']
      ]
      expectedPlainAfter = [
        [' ', ' ', ' '],
        ['a', 'A', 'B'],
        [' ', ' ', ' ']
      ]
      plain = prepare(plainBefore).plain
      a = plain.getAt(0, 1).getCellContainers()[0]
      b = plain.getAt(2, 1).getCellContainers()[0]
      a.move(1, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')

      plainBefore = [
        [' ', ' ', ' '],
        ['B', 'b', 'A'],
        [' ', ' ', ' ']
      ]
      expectedPlainAfter = [
        [' ', ' ', ' '],
        ['B', 'A', 'a'],
        [' ', ' ', ' ']
      ]
      plain = prepare(plainBefore).plain
      a = plain.getAt(2, 1).getCellContainers()[0]
      b = plain.getAt(0, 1).getCellContainers()[0]
      a.move(-1, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
    })

    it('considers two neighbor fields (up and right) owned by the old owner correctly', () => {
      // Direct bridge in corner
      let plainBefore = [
        [' ', 'B', ' ', ' '],
        [' ', 'b', 'b', ' '],
        ['A', 'b', 'b', ' '],
        [' ', ' ', ' ', ' ']
      ]
      let expectedPlainAfter = [
        [' ', 'B', ' ', ' '],
        [' ', 'b', 'b', ' '],
        ['a', 'A', 'b', ' '],
        [' ', ' ', ' ', ' ']
      ]
      let prep = prepare(plainBefore)
      let plain = prep.plain
      let a = plain.getAt(0, 2).getCellContainers()[0]
      let b = plain.getAt(1, 0).getCellContainers()[0]
      a.move(1, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(a.cellRecord.ownedFieldsCount).toBe(2)
      expect(b.cellRecord.ownedFieldsCount).toBe(4)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(0)

      // Indirect bridge, not in corner
      plainBefore = [
        [' ', 'B', 'b', 'b'],
        [' ', 'b', ' ', 'b'],
        ['A', 'b', 'b', 'b'],
        [' ', ' ', ' ', ' ']
      ]
      expectedPlainAfter = [
        [' ', 'B', 'b', 'b'],
        [' ', 'b', ' ', 'b'],
        ['a', 'A', 'b', 'b'],
        [' ', ' ', ' ', ' ']
      ]
      prep = prepare(plainBefore)
      plain = prep.plain
      a = plain.getAt(0, 2).getCellContainers()[0]
      b = plain.getAt(1, 0).getCellContainers()[0]
      a.move(1, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(a.cellRecord.ownedFieldsCount).toBe(2)
      expect(b.cellRecord.ownedFieldsCount).toBe(7)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(1)

      // No bridge, B is closer to connected edge => optimized to call flood fill only once
      plainBefore = [
        [' ', 'B', ' ', ' '],
        [' ', 'b', ' ', 'b'],
        ['A', 'b', 'b', 'b'],
        [' ', ' ', ' ', ' ']
      ]
      expectedPlainAfter = [
        [' ', 'B', ' ', ' '],
        [' ', 'b', ' ', ' '],
        ['a', 'A', ' ', ' '],
        [' ', ' ', ' ', ' ']
      ]
      prep = prepare(plainBefore)
      plain = prep.plain
      a = plain.getAt(0, 2).getCellContainers()[0]
      b = plain.getAt(1, 0).getCellContainers()[0]
      a.move(1, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(b.cellRecord.ownedFieldsCount).toBe(2)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(1)

      // No bridge, B is closer to disconnected edge => algorithm is fooled and flood fill is called twice
      plainBefore = [
        [' ', ' ', 'B', 'b', ' '],
        ['b', 'b', ' ', 'b', ' '],
        ['A', 'b', 'b', 'b', ' '],
        [' ', ' ', ' ', ' ', ' ']
      ]
      expectedPlainAfter = [
        [' ', ' ', 'B', 'b', ' '],
        [' ', ' ', ' ', 'b', ' '],
        ['a', 'A', 'b', 'b', ' '],
        [' ', ' ', ' ', ' ', ' ']
      ]
      prep = prepare(plainBefore)
      plain = prep.plain
      a = plain.getAt(0, 2).getCellContainers()[0]
      b = plain.getAt(2, 0).getCellContainers()[0]
      a.move(1, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(b.cellRecord.ownedFieldsCount).toBe(5)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(2)
    })

    it('considers two neighbor fields (right and down) owned by the old owner correctly', () => {
      // Direct bridge in corner
      let plainBefore = [
        [' ', ' ', ' ', ' '],
        ['A', 'b', 'b', 'B'],
        [' ', 'b', 'b', ' ']
      ]
      let expectedPlainAfter = [
        [' ', ' ', ' ', ' '],
        ['a', 'A', 'b', 'B'],
        [' ', 'b', 'b', ' ']
      ]
      let prep = prepare(plainBefore)
      let plain = prep.plain
      let a = plain.getAt(0, 1).getCellContainers()[0]
      let b = plain.getAt(3, 1).getCellContainers()[0]
      a.move(1, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(b.cellRecord.ownedFieldsCount).toBe(4)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(0)

      // Indirect bridge, not in corner C
      plainBefore = [
        [' ', ' ', ' ', ' '],
        ['A', 'b', 'b', 'B'],
        [' ', 'b', 'C', 'b'],
        [' ', 'b', 'b', 'b']
      ]
      expectedPlainAfter = [
        [' ', ' ', ' ', ' '],
        ['a', 'A', 'b', 'B'],
        [' ', 'b', 'C', 'b'],
        [' ', 'b', 'b', 'b']
      ]
      prep = prepare(plainBefore)
      plain = prep.plain
      a = plain.getAt(0, 1).getCellContainers()[0]
      b = plain.getAt(3, 1).getCellContainers()[0]
      a.move(1, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(b.cellRecord.ownedFieldsCount).toBe(7)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(1)

      // No bridge, B is closer to connected edge => optimized to call flood fill only once
      plainBefore = [
        [' ', ' ', ' ', ' '],
        ['A', 'b', 'b', 'B'],
        [' ', 'b', ' ', ' '],
        ['b', 'b', ' ', ' ']
      ]
      expectedPlainAfter = [
        [' ', ' ', ' ', ' '],
        ['a', 'A', 'b', 'B'],
        [' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ']
      ]
      prep = prepare(plainBefore)
      plain = prep.plain
      a = plain.getAt(0, 1).getCellContainers()[0]
      b = plain.getAt(3, 1).getCellContainers()[0]
      a.move(1, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(b.cellRecord.ownedFieldsCount).toBe(2)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(1)

      // No bridge, B is closer to disconnected edge => algorithm is fooled and flood fill is called twice
      // Other neighbors (X) have no influence
      plainBefore = [
        ['X', 'x', 'x', 'x'],
        ['A', 'b', 'b', 'x'],
        ['x', 'b', 'x', 'B'],
        ['x', 'b', 'b', 'b']
      ]
      expectedPlainAfter = [
        ['X', 'x', 'x', 'x'],
        ['a', 'A', ' ', 'x'],
        ['x', 'b', 'x', 'B'],
        ['x', 'b', 'b', 'b']
      ]
      prep = prepare(plainBefore)
      plain = prep.plain
      a = plain.getAt(0, 1).getCellContainers()[0]
      b = plain.getAt(3, 2).getCellContainers()[0]
      a.move(1, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(b.cellRecord.ownedFieldsCount).toBe(5)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(2)
    })

    it('considers two neighbor fields (down and left) owned by the old owner correctly', () => {
      // Direct bridge in corner
      let plainBefore = [
        [' ', ' ', ' '],
        ['B', 'b', 'A'],
        ['b', 'b', ' ']
      ]
      let expectedPlainAfter = [
        [' ', ' ', ' '],
        ['B', 'A', 'a'],
        ['b', 'b', ' ']
      ]
      let prep = prepare(plainBefore)
      let plain = prep.plain
      let a = plain.getAt(2, 1).getCellContainers()[0]
      let b = plain.getAt(0, 1).getCellContainers()[0]
      a.move(-1, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(b.cellRecord.ownedFieldsCount).toBe(3)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(0)

      // Indirect bridge (considering torus topography of plain), not in corner X
      plainBefore = [
        [' ', ' ', ' ', ' '],
        ['b', 'B', 'b', 'A'],
        ['b', 'X', 'b', 'b']
      ]
      expectedPlainAfter = [
        [' ', ' ', ' ', ' '],
        ['b', 'B', 'A', 'a'],
        ['b', 'X', 'b', 'b']
      ]
      prep = prepare(plainBefore)
      plain = prep.plain
      a = plain.getAt(3, 1).getCellContainers()[0]
      b = plain.getAt(1, 1).getCellContainers()[0]
      a.move(-1, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(b.cellRecord.ownedFieldsCount).toBe(5)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(1)

      // No bridge, B is closer to connected edge => optimized to call flood fill only once
      plainBefore = [
        [' ', ' ', ' ', ' '],
        ['b', 'b', 'b', 'A'],
        [' ', ' ', 'b', ' '],
        [' ', ' ', 'b', ' '],
        [' ', ' ', 'b', 'B']
      ]
      expectedPlainAfter = [
        [' ', ' ', ' ', ' '],
        [' ', ' ', 'A', 'a'],
        [' ', ' ', 'b', ' '],
        [' ', ' ', 'b', ' '],
        [' ', ' ', 'b', 'B']
      ]
      prep = prepare(plainBefore)
      plain = prep.plain
      a = plain.getAt(3, 1).getCellContainers()[0]
      b = plain.getAt(3, 4).getCellContainers()[0]
      a.move(-1, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(b.cellRecord.ownedFieldsCount).toBe(4)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(1)

      // No bridge, B is closer to disconnected edge => algorithm is fooled and flood fill is called twice
      plainBefore = [
        ['B', ' ', ' ', ' ', ' '],
        ['b', ' ', 'b', 'b', 'A'],
        ['b', ' ', ' ', 'b', ' '],
        ['b', 'b', 'b', 'b', ' '],
        [' ', ' ', ' ', ' ', ' ']
      ]
      expectedPlainAfter = [
        ['B', ' ', ' ', ' ', ' '],
        ['b', ' ', ' ', 'A', 'a'],
        ['b', ' ', ' ', 'b', ' '],
        ['b', 'b', 'b', 'b', ' '],
        [' ', ' ', ' ', ' ', ' ']
      ]
      prep = prepare(plainBefore)
      plain = prep.plain
      a = plain.getAt(4, 1).getCellContainers()[0]
      b = plain.getAt(0, 0).getCellContainers()[0]
      a.move(-1, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(b.cellRecord.ownedFieldsCount).toBe(8)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(2)
    })

    it('considers two neighbor fields (left and up) owned by the old owner correctly', () => {
      // Direct bridge in corner
      let plainBefore = [
        ['b', 'b', ' '],
        ['B', 'b', 'A'],
        [' ', ' ', ' ']
      ]
      let expectedPlainAfter = [
        ['b', 'b', ' '],
        ['B', 'A', 'a'],
        [' ', ' ', ' ']
      ]
      let prep = prepare(plainBefore)
      let plain = prep.plain
      let a = plain.getAt(2, 1).getCellContainers()[0]
      let b = plain.getAt(0, 1).getCellContainers()[0]
      a.move(-1, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(b.cellRecord.ownedFieldsCount).toBe(3)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(0)

      // Indirect bridge (considering torus topography of plain), not in corner X
      plainBefore = [
        ['b', 'X', 'b', 'b'],
        ['b', 'B', 'b', 'A'],
        [' ', ' ', ' ', ' ']
      ]
      expectedPlainAfter = [
        ['b', 'X', 'b', 'b'],
        ['b', 'B', 'A', 'a'],
        [' ', ' ', ' ', ' ']
      ]
      prep = prepare(plainBefore)
      plain = prep.plain
      a = plain.getAt(3, 1).getCellContainers()[0]
      b = plain.getAt(1, 1).getCellContainers()[0]
      a.move(-1, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(b.cellRecord.ownedFieldsCount).toBe(5)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(1)
    })

    it('considers two neighbor fields forming a horizontal line owned by the old owner correctly', () => {
      // Disconnected
      let plainBefore = [
        [' ', ' ', ' ', ' '],
        ['B', 'b', 'b', ' '],
        [' ', 'A', ' ', ' ']
      ]
      let expectedPlainAfter = [
        [' ', ' ', ' ', ' '],
        ['B', 'A', ' ', ' '],
        [' ', 'a', ' ', ' ']
      ]
      let prep = prepare(plainBefore)
      let plain = prep.plain
      let a = plain.getAt(1, 2).getCellContainers()[0]
      let b = plain.getAt(0, 1).getCellContainers()[0]
      a.move(0, -1)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(b.cellRecord.ownedFieldsCount).toBe(1)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(1)

      // Indirect bridge
      plainBefore = [
        [' ', 'A', ' ', ' '],
        ['B', 'b', 'b', ' '],
        ['b', ' ', 'b', ' '],
        ['b', 'b', 'b', ' ']
      ]
      expectedPlainAfter = [
        [' ', 'a', ' ', ' '],
        ['B', 'A', 'b', ' '],
        ['b', ' ', 'b', ' '],
        ['b', 'b', 'b', ' ']
      ]
      prep = prepare(plainBefore)
      plain = prep.plain
      a = plain.getAt(1, 0).getCellContainers()[0]
      b = plain.getAt(0, 1).getCellContainers()[0]
      a.move(0, 1)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(b.cellRecord.ownedFieldsCount).toBe(7)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(1)

      // Disconnected, B is closer to disconnected end => algorithm is fooled and flood fill is called twice
      plainBefore = [
        [' ', ' ', ' ', ' '],
        ['b', 'b', 'b', 'B'],
        ['b', ' ', ' ', ' '],
        ['b', 'b', 'b', ' '],
        [' ', 'A', ' ', ' ']
      ]
      expectedPlainAfter = [
        [' ', ' ', ' ', ' '],
        ['b', 'b', 'b', 'B'],
        ['b', ' ', ' ', ' '],
        ['b', 'A', ' ', ' '],
        [' ', 'a', ' ', ' ']
      ]
      prep = prepare(plainBefore)
      plain = prep.plain
      a = plain.getAt(1, 4).getCellContainers()[0]
      b = plain.getAt(3, 1).getCellContainers()[0]
      a.move(0, -1)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(b.cellRecord.ownedFieldsCount).toBe(6)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(2)
    })

    it('considers two neighbor fields forming a vertical line owned by the old owner correctly', () => {
      // Disconnected
      let plainBefore = [
        [' ', 'b', ' '],
        ['A', 'b', ' '],
        [' ', 'B', ' '],
        [' ', ' ', ' ']
      ]
      let expectedPlainAfter = [
        [' ', ' ', ' '],
        ['a', 'A', ' '],
        [' ', 'B', ' '],
        [' ', ' ', ' ']
      ]
      let prep = prepare(plainBefore)
      let plain = prep.plain
      let a = plain.getAt(0, 1).getCellContainers()[0]
      let b = plain.getAt(1, 2).getCellContainers()[0]
      a.move(1, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(b.cellRecord.ownedFieldsCount).toBe(1)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(1)

      // Indirect bridge considering torus topography of plain
      plainBefore = [
        [' ', 'b', ' '],
        ['A', 'b', ' '],
        [' ', 'B', ' ']
      ]
      expectedPlainAfter = [
        [' ', 'b', ' '],
        ['a', 'A', ' '],
        [' ', 'B', ' ']
      ]
      prep = prepare(plainBefore)
      plain = prep.plain
      a = plain.getAt(0, 1).getCellContainers()[0]
      b = plain.getAt(1, 2).getCellContainers()[0]
      a.move(1, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(b.cellRecord.ownedFieldsCount).toBe(2)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(1)
    })

    it('considers three neighbor fields (only not up) owned by the old owner correctly', () => {
      // All 3 neighbors connected by bridges in both corners
      let plainBefore = [
        [' ', 'A', ' ', ' '],
        ['b', 'b', 'b', ' '],
        ['b', 'b', 'B', ' ']
      ]
      let expectedPlainAfter = [
        [' ', 'a', ' ', ' '],
        ['b', 'A', 'b', ' '],
        ['b', 'b', 'B', ' ']
      ]
      let prep = prepare(plainBefore)
      let plain = prep.plain
      let a = plain.getAt(1, 0).getCellContainers()[0]
      let b = plain.getAt(2, 2).getCellContainers()[0]
      a.move(0, 1)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(a.cellRecord.ownedFieldsCount).toBe(2)
      expect(b.cellRecord.ownedFieldsCount).toBe(5)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(0)

      // Neighbors not connected by bridges in corners at all
      plainBefore = [
        [' ', 'A', ' ', ' '],
        ['b', 'b', 'B', ' '],
        [' ', 'b', ' ', ' ']
      ]
      expectedPlainAfter = [
        [' ', 'a', ' ', ' '],
        [' ', 'A', 'B', ' '],
        [' ', ' ', ' ', ' ']
      ]
      prep = prepare(plainBefore)
      plain = prep.plain
      a = plain.getAt(1, 0).getCellContainers()[0]
      b = plain.getAt(2, 1).getCellContainers()[0]
      a.move(0, 1)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(a.cellRecord.ownedFieldsCount).toBe(2)
      expect(b.cellRecord.ownedFieldsCount).toBe(1)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(2)

      // Two neighbors not connected to B are connected by indirect bridge
      plainBefore = [
        [' ', 'A', ' ', ' ', ' '],
        ['B', 'b', 'b', 'b', ' '],
        [' ', 'b', ' ', 'b', ' '],
        [' ', 'b', 'b', 'b', ' '],
        [' ', ' ', ' ', ' ', ' ']
      ]
      expectedPlainAfter = [
        [' ', 'a', ' ', ' ', ' '],
        ['B', 'A', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ']
      ]
      prep = prepare(plainBefore)
      plain = prep.plain
      a = plain.getAt(1, 0).getCellContainers()[0]
      b = plain.getAt(0, 1).getCellContainers()[0]
      a.move(0, 1)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(b.cellRecord.ownedFieldsCount).toBe(1)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(1)

      // Two neighbors connected to B are connected by indirect bridge
      plainBefore = [
        [' ', 'A', ' ', ' ', ' '],
        ['b', 'b', 'b', 'b', ' '],
        [' ', 'b', ' ', 'b', ' '],
        [' ', 'b', 'b', 'B', ' '],
        [' ', ' ', ' ', ' ', ' ']
      ]
      expectedPlainAfter = [
        [' ', 'a', ' ', ' ', ' '],
        [' ', 'A', 'b', 'b', ' '],
        [' ', 'b', ' ', 'b', ' '],
        [' ', 'b', 'b', 'B', ' '],
        [' ', ' ', ' ', ' ', ' ']
      ]
      prep = prepare(plainBefore)
      plain = prep.plain
      a = plain.getAt(1, 0).getCellContainers()[0]
      b = plain.getAt(3, 3).getCellContainers()[0]
      a.move(0, 1)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(b.cellRecord.ownedFieldsCount).toBe(7)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(2)

      // All three neighbors connected by indirect bridges (considering torus topography of plain)
      plainBefore = [
        [' ', 'A', ' ', ' ', ' '],
        ['b', 'b', 'b', 'b', 'b'],
        [' ', 'b', ' ', 'b', ' '],
        [' ', 'b', 'b', 'B', ' '],
        [' ', ' ', ' ', ' ', ' ']
      ]
      expectedPlainAfter = [
        [' ', 'a', ' ', ' ', ' '],
        ['b', 'A', 'b', 'b', 'b'],
        [' ', 'b', ' ', 'b', ' '],
        [' ', 'b', 'b', 'B', ' '],
        [' ', ' ', ' ', ' ', ' ']
      ]
      prep = prepare(plainBefore)
      plain = prep.plain
      a = plain.getAt(1, 0).getCellContainers()[0]
      b = plain.getAt(3, 3).getCellContainers()[0]
      a.move(0, 1)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(b.cellRecord.ownedFieldsCount).toBe(9)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(1)

      // Only 2 neighbors are connected by a bridge in a corner, B is closer to connected corners so that flood fill is only called once...
      plainBefore = [
        [' ', 'A', ' ', ' '],
        ['b', 'b', 'b', ' '],
        ['b', 'b', ' ', ' '],
        [' ', 'b', 'B', ' ']
      ]
      expectedPlainAfter = [
        [' ', 'a', ' ', ' '],
        ['b', 'A', ' ', ' '],
        ['b', 'b', ' ', ' '],
        [' ', 'b', 'B', ' ']
      ]
      prep = prepare(plainBefore)
      plain = prep.plain
      a = plain.getAt(1, 0).getCellContainers()[0]
      b = plain.getAt(2, 3).getCellContainers()[0]
      a.move(0, 1)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(b.cellRecord.ownedFieldsCount).toBe(5)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(1)

      // Only 2 neighbors are connected by a bridge in a corner, B is closer to disconnected corner so that flood fill is called twice...
      plainBefore = [
        [' ', 'A', ' ', ' ', ' '],
        ['b', 'b', 'b', ' ', ' '],
        ['b', 'b', ' ', 'B', ' '],
        [' ', 'b', 'b', 'b', ' ']
      ]
      expectedPlainAfter = [
        [' ', 'a', ' ', ' ', ' '],
        ['b', 'A', ' ', ' ', ' '],
        ['b', 'b', ' ', 'B', ' '],
        [' ', 'b', 'b', 'b', ' ']
      ]
      prep = prepare(plainBefore)
      plain = prep.plain
      a = plain.getAt(1, 0).getCellContainers()[0]
      b = plain.getAt(3, 2).getCellContainers()[0]
      a.move(0, 1)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(b.cellRecord.ownedFieldsCount).toBe(7)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(2)

      // Only 2 neighbors are connected by a bridge in a corner, but these 2 neighbors are not connected to B
      plainBefore = [
        [' ', 'A', ' ', ' '],
        ['B', 'b', 'b', ' '],
        [' ', 'b', 'b', ' ']
      ]
      expectedPlainAfter = [
        [' ', 'a', ' ', ' '],
        ['B', 'A', ' ', ' '],
        [' ', ' ', ' ', ' ']
      ]
      prep = prepare(plainBefore)
      plain = prep.plain
      a = plain.getAt(1, 0).getCellContainers()[0]
      b = plain.getAt(0, 1).getCellContainers()[0]
      a.move(0, 1)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(b.cellRecord.ownedFieldsCount).toBe(1)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(1)
    })

    it('considers three neighbor fields (only not right) owned by the old owner correctly', () => {
      // All 3 neighbors connected by bridges in both corners
      let plainBefore = [
        ['B', 'b', ' '],
        ['b', 'b', 'A'],
        ['b', 'b', ' '],
        [' ', ' ', ' ']
      ]
      let expectedPlainAfter = [
        ['B', 'b', ' '],
        ['b', 'A', 'a'],
        ['b', 'b', ' '],
        [' ', ' ', ' ']
      ]
      let prep = prepare(plainBefore)
      let plain = prep.plain
      let a = plain.getAt(2, 1).getCellContainers()[0]
      a.move(-1, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(0)

      // Neighbors not connected by bridges in corners at all
      plainBefore = [
        [' ', 'b', ' '],
        ['B', 'b', 'A'],
        [' ', 'b', ' '],
        [' ', ' ', ' ']
      ]
      expectedPlainAfter = [
        [' ', ' ', ' '],
        ['B', 'A', 'a'],
        [' ', ' ', ' '],
        [' ', ' ', ' ']
      ]
      prep = prepare(plainBefore)
      plain = prep.plain
      a = plain.getAt(2, 1).getCellContainers()[0]
      a.move(-1, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(2)
    })

    it('considers three neighbor fields (only not down) owned by the old owner correctly', () => {
      // All 3 neighbors connected by bridges in both corners
      let plainBefore = [
        ['b', 'b', 'b', ' '],
        ['b', 'b', 'B', ' '],
        [' ', 'A', ' ', ' ']
      ]
      let expectedPlainAfter = [
        ['b', 'b', 'b', ' '],
        ['b', 'A', 'B', ' '],
        [' ', 'a', ' ', ' ']
      ]
      let prep = prepare(plainBefore)
      let plain = prep.plain
      let a = plain.getAt(1, 2).getCellContainers()[0]
      a.move(0, -1)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(0)

      // 2 neighbors connected by bridge in one corner
      plainBefore = [
        ['b', 'b', ' ', ' '],
        ['b', 'b', 'B', ' '],
        [' ', 'A', ' ', ' ']
      ]
      expectedPlainAfter = [
        [' ', ' ', ' ', ' '],
        [' ', 'A', 'B', ' '],
        [' ', 'a', ' ', ' ']
      ]
      prep = prepare(plainBefore)
      plain = prep.plain
      a = plain.getAt(1, 2).getCellContainers()[0]
      a.move(0, -1)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(1)
    })

    it('considers three neighbor fields (only not left) owned by the old owner correctly', () => {
      // All 3 neighbors connected by bridges in both corners
      let plainBefore = [
        [' ', 'B', 'b'],
        ['A', 'b', 'b'],
        [' ', 'b', 'b'],
        [' ', ' ', ' ']
      ]
      let expectedPlainAfter = [
        [' ', 'B', 'b'],
        ['a', 'A', 'b'],
        [' ', 'b', 'b'],
        [' ', ' ', ' ']
      ]
      let prep = prepare(plainBefore)
      let plain = prep.plain
      let a = plain.getAt(0, 1).getCellContainers()[0]
      a.move(1, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(0)

      // 2 neighbors connected by bridge in one corner
      plainBefore = [
        [' ', 'B', 'b'],
        ['A', 'b', 'b'],
        [' ', 'b', ' '],
        [' ', ' ', ' ']
      ]
      expectedPlainAfter = [
        [' ', 'B', 'b'],
        ['a', 'A', 'b'],
        [' ', ' ', ' '],
        [' ', ' ', ' ']
      ]
      prep = prepare(plainBefore)
      plain = prep.plain
      a = plain.getAt(0, 1).getCellContainers()[0]
      a.move(1, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(1)
    })

    it('considers all four neighbor fields owned by the old owner correctly', () => {
      // All 4 neighbors connected by bridges in all corners
      let plainBefore = [
        [' ', 'B', 'b', 'b'],
        ['A', 'b', 'b', 'b'],
        [' ', 'b', 'b', 'b'],
        [' ', ' ', ' ', ' ']
      ]
      let expectedPlainAfter = [
        [' ', 'B', 'b', 'b'],
        [' ', 'b', 'A', 'b'],
        [' ', 'b', 'b', 'b'],
        [' ', ' ', ' ', ' ']
      ]
      let prep = prepare(plainBefore)
      let plain = prep.plain
      let a = plain.getAt(0, 1).getCellContainers()[0]
      let b = plain.getAt(1, 0).getCellContainers()[0]
      a.move(2, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(b.cellRecord.ownedFieldsCount).toBe(8)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(1) // Called one time when filling old position of A, independent from B

      // All 4 neighbors connected by bridges in three corners
      plainBefore = [
        [' ', 'B', 'b', 'b'],
        ['A', 'b', 'b', 'b'],
        [' ', 'b', 'b', ' '],
        [' ', ' ', ' ', ' ']
      ]
      expectedPlainAfter = [
        [' ', 'B', 'b', 'b'],
        [' ', 'b', 'A', 'b'],
        [' ', 'b', 'b', ' '],
        [' ', ' ', ' ', ' ']
      ]
      prep = prepare(plainBefore)
      plain = prep.plain
      a = plain.getAt(0, 1).getCellContainers()[0]
      b = plain.getAt(1, 0).getCellContainers()[0]
      a.move(2, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(b.cellRecord.ownedFieldsCount).toBe(7)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(1) // Called one time when filling old position of A, independent from B

      // The 4 neighbors are connected to two pairs by bridges in two corners
      plainBefore = [
        [' ', 'B', 'b', ' '],
        ['A', 'b', 'b', 'b'],
        [' ', ' ', 'b', 'b'],
        [' ', ' ', ' ', ' ']
      ]
      expectedPlainAfter = [
        [' ', 'B', 'b', ' '],
        [' ', 'b', 'A', ' '],
        [' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ']
      ]
      prep = prepare(plainBefore)
      plain = prep.plain
      a = plain.getAt(0, 1).getCellContainers()[0]
      b = plain.getAt(1, 0).getCellContainers()[0]
      a.move(2, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(b.cellRecord.ownedFieldsCount).toBe(3)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(2) // Called one time when filling old position of A, independent from B

      // The 4 neighbors are connected to two one triple and one isolated neighbor by bridges in two corners, B is connected to the triple
      plainBefore = [
        [' ', 'B', 'b', ' '],
        ['A', 'b', 'b', 'b'],
        [' ', 'b', 'b', ' ']
      ]
      expectedPlainAfter = [
        [' ', 'B', 'b', ' '],
        [' ', 'b', 'A', ' '],
        [' ', 'b', 'b', ' ']
      ]
      prep = prepare(plainBefore)
      plain = prep.plain
      a = plain.getAt(0, 1).getCellContainers()[0]
      b = plain.getAt(1, 0).getCellContainers()[0]
      a.move(2, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(b.cellRecord.ownedFieldsCount).toBe(5)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(2) // Called one time when filling old position of A, independent from B

      // The 4 neighbors are connected to two one triple and one isolated neighbor by bridges in two corners, B is connected to the isolated neighbor
      plainBefore = [
        [' ', 'b', 'b', ' '],
        ['A', 'b', 'b', 'B'],
        [' ', 'b', 'b', ' ']
      ]
      expectedPlainAfter = [
        [' ', ' ', ' ', ' '],
        [' ', ' ', 'A', 'B'],
        [' ', ' ', ' ', ' ']
      ]
      prep = prepare(plainBefore)
      plain = prep.plain
      a = plain.getAt(0, 1).getCellContainers()[0]
      b = plain.getAt(3, 1).getCellContainers()[0]
      a.move(2, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(b.cellRecord.ownedFieldsCount).toBe(1)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(2) // Called one time when filling old position of A, independent from B

      // 2 neighbors are connected by one bridge
      plainBefore = [
        [' ', 'B', 'b', ' '],
        ['A', 'b', 'b', 'b'],
        [' ', ' ', 'b', ' '],
        [' ', ' ', ' ', ' ']
      ]
      expectedPlainAfter = [
        [' ', 'B', 'b', ' '],
        [' ', 'b', 'A', ' '],
        [' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ']
      ]
      prep = prepare(plainBefore)
      plain = prep.plain
      a = plain.getAt(0, 1).getCellContainers()[0]
      b = plain.getAt(1, 0).getCellContainers()[0]
      a.move(2, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(b.cellRecord.ownedFieldsCount).toBe(3)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(3) // Called one time when filling old position of A, independent from B

      // 2 neighbors are connected by one bridge and there is an additional indirect bridge (considering the torus topography of the plain)
      plainBefore = [
        [' ', 'b', 'b', ' '],
        ['A', 'b', 'b', 'b'],
        [' ', ' ', 'B', ' ']
      ]
      expectedPlainAfter = [
        [' ', 'b', 'b', ' '],
        [' ', 'b', 'A', ' '],
        [' ', ' ', 'B', ' ']
      ]
      prep = prepare(plainBefore)
      plain = prep.plain
      a = plain.getAt(0, 1).getCellContainers()[0]
      a.move(2, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(3) // Called one time when filling old position of A, independent from B

      // No bridges at all
      plainBefore = [
        [' ', ' ', 'b', ' '],
        ['A', 'b', 'b', 'b'],
        [' ', ' ', 'B', ' '],
        [' ', ' ', ' ', ' ']
      ]
      expectedPlainAfter = [
        [' ', ' ', ' ', ' '],
        [' ', ' ', 'A', ' '],
        [' ', ' ', 'B', ' '],
        [' ', ' ', ' ', ' ']
      ]
      prep = prepare(plainBefore)
      plain = prep.plain
      a = plain.getAt(0, 1).getCellContainers()[0]
      a.move(2, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(4) // Called one time when filling old position of A, independent from B

      // Just one indirect bridge (considering torus topography of plain)
      plainBefore = [
        [' ', ' ', 'b', ' '],
        ['A', 'b', 'b', 'B'],
        [' ', ' ', 'b', ' ']
      ]
      expectedPlainAfter = [
        [' ', ' ', ' ', ' '],
        [' ', ' ', 'A', 'B'],
        [' ', ' ', ' ', ' ']
      ]
      prep = prepare(plainBefore)
      plain = prep.plain
      a = plain.getAt(0, 1).getCellContainers()[0]
      a.move(2, 0)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(4) // Called one time when filling old position of A, independent from B
    })
  })

  describe('onCellMakeChild', () => {
    it('makes the child the owner of the field where it is placed', () => {
      const plainBefore = [
        ['A', ' '],
        [' ', ' ']
      ]
      const expectedPlainAfter = [
        ['A', 'S'],
        ['T', ' ']
      ]
      const prep = prepare(plainBefore)
      const a = prep.plain.getAt(0, 0).getCellContainers()[0]
      a.makeChild(1, 0)
      a.makeChild(0, 1)
      const s = prep.plain.getAt(1, 0).getCellContainers()[0]
      const t = prep.plain.getAt(0, 1).getCellContainers()[0]
      expect(compare(prep.plain, expectedPlainAfter)).toEqual('')
      expect(a.cellRecord.ownedFieldsCount).toBe(1)
      expect(s.cellRecord.ownedFieldsCount).toBe(1)
      expect(t.cellRecord.ownedFieldsCount).toBe(1)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(0)
    })

    it('is able to place multiple children on the same field', () => {
      const plainBefore = [
        ['A', ' '],
        [' ', ' ']
      ]
      const expectedPlainAfter = [
        ['AS', 'TU'],
        [' ', ' ']
      ]
      const prep = prepare(plainBefore)
      const a = prep.plain.getAt(0, 0).getCellContainers()[0]
      a.makeChild(0, 0)
      a.makeChild(1, 0)
      a.makeChild(1, 0)
      expect(compare(prep.plain, expectedPlainAfter)).toEqual('')
    })

    it('handles an old owner of the field where the child is placed correctly', () => {
      const plainBefore = [
        ['A', ' ', ' ', ' '],
        ['B', 'b', 'b', ' '],
        [' ', ' ', 'b', ' ']
      ]
      const expectedPlainAfter = [
        ['A', ' ', ' ', ' '],
        ['B', 'S', ' ', ' '],
        [' ', ' ', ' ', ' ']
      ]
      const prep = prepare(plainBefore)
      const a = prep.plain.getAt(0, 0).getCellContainers()[0]
      a.makeChild(1, 1)
      expect(compare(prep.plain, expectedPlainAfter)).toEqual('')
    })
  })

  describe('onCellDivide', () => {
    it('divides a cell in two children and makes the children the owners of the fields they are placed on', () => {
      const plainBefore = [
        [' ', ' ', 'A', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ']
      ]
      const expectedPlainAfter = [
        ['S', ' ', ' ', ' ', 'T'],
        [' ', ' ', ' ', ' ', ' ']
      ]
      const prep = prepare(plainBefore)
      const a = prep.plain.getAt(2, 0).getCellContainers()[0]
      a.divide(-2, 0, 2, 0)
      const s = prep.plain.getAt(0, 0).getCellContainers()[0]
      const t = prep.plain.getAt(4, 0).getCellContainers()[0]
      expect(compare(prep.plain, expectedPlainAfter)).toEqual('')
      expect(a.isDead).toBeTrue
      expect(a.cellRecord.ownedFieldsCount).toBe(0)
      expect(s.cellRecord.ownedFieldsCount).toBe(1)
      expect(t.cellRecord.ownedFieldsCount).toBe(1)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(3)
    })

    it('inherits the owned fields from the parent to the closest child including a fair distribution of fields with the same distance to both children', () => {
      const plainBefore = [
        [' ', 'a', 'A', 'a', ' '],
        [' ', 'a', 'a', 'a', ' '],
        [' ', 'a', 'a', 'a', ' '],
        [' ', ' ', ' ', ' ', ' ']
      ]
      const expectedPlainAfter = [
        [' ', 'S', 's', 'T', ' '],
        [' ', 's', 't', 't', ' '],
        [' ', 's', 's', 't', ' '],
        [' ', ' ', ' ', ' ', ' ']
      ]
      const prep = prepare(plainBefore)
      const a = prep.plain.getAt(2, 0).getCellContainers()[0]
      a.divide(-1, 0, 1, 0)
      const s = prep.plain.getAt(1, 0).getCellContainers()[0]
      const t = prep.plain.getAt(3, 0).getCellContainers()[0]
      expect(compare(prep.plain, expectedPlainAfter)).toEqual('')
      expect(s.cellRecord.ownedFieldsCount).toBe(5)
      expect(t.cellRecord.ownedFieldsCount).toBe(4)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(3)
    })

    it('handles the old owners of the fields where the children are placed correctly', () => {
      const plainBefore = [
        ['B', 'a', 'A', 'a', 'C', ' '],
        ['b', 'a', 'a', 'a', 'c', ' '],
        ['b', 'a', 'a', 'a', 'c', ' '],
        ['b', 'b', ' ', 'c', 'c', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ']
      ]
      const expectedPlainAfter = [
        ['B', 's', 's', 't', 'C', ' '],
        ['S', 's', 's', 't', 'c', ' '],
        [' ', 's', 't', 't', 'T', ' '],
        [' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ']
      ]
      const prep = prepare(plainBefore)
      const a = prep.plain.getAt(2, 0).getCellContainers()[0]
      a.divide(-2, 1, 2, 2)
      expect(compare(prep.plain, expectedPlainAfter)).toEqual('')
    })

    it('cuts of inherited disconnected parts from children', () => {
      const plainBefore = [
        [' ', 'a', 'A', 'a', 'a', 'a', ' '],
        [' ', 'a', ' ', ' ', ' ', 'a', ' '],
        [' ', 'a', 'a', 'a', ' ', 'a', ' '],
        [' ', ' ', ' ', 'a', ' ', 'a', ' '],
        [' ', 'a', ' ', ' ', ' ', 'a', ' '],
        [' ', 'a', 'a', 'a', 'a', 'a', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ']
      ]
      const expectedPlainAfter = [
        [' ', 'S', 's', 't', 'T', 't', ' '],
        [' ', 's', ' ', ' ', ' ', 't', ' '],
        [' ', 's', 's', ' ', ' ', 't', ' '],
        [' ', ' ', ' ', ' ', ' ', 't', ' '],
        [' ', ' ', ' ', ' ', ' ', 't', ' '],
        [' ', ' ', ' ', 't', 't', 't', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ']
      ]
      const prep = prepare(plainBefore)
      const a = prep.plain.getAt(2, 0).getCellContainers()[0]
      a.divide(-1, 0, 2, 0)
      expect(compare(prep.plain, expectedPlainAfter)).toEqual('')
    })

    it('considers tours topography of plain with decision which is the closest child', () => {
      const plainBefore = [
        ['A', 'a', 'a', 'a', 'a', 'a', 'a', 'a'],
        ['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a'],
        ['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a'],
        ['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a'],
        ['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a'],
        ['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a']
      ]
      const expectedPlainAfter = [
        ['S', 's', 's', 't', 't', 't', 's', 's'],
        ['s', 's', 't', 't', 't', 't', 's', 's'],
        ['s', 't', 't', 'T', 't', 't', 's', 's'],
        ['s', 't', 't', 't', 't', 't', 't', 's'],
        ['s', 's', 't', 't', 't', 't', 's', 's'],
        ['s', 's', 's', 't', 't', 's', 's', 's']
      ]
      const prep = prepare(plainBefore)
      const a = prep.plain.getAt(0, 0).getCellContainers()[0]
      a.divide(0, 0, 3, 2)
      expect(compare(prep.plain, expectedPlainAfter)).toEqual('')
    })

    it('does not inherit parent owned fields if both children are placed on the same field', () => {
      const plainBefore = [
        ['A', 'a', 'a'],
        ['a', 'a', 'a']
      ]
      const expectedPlainAfter = [
        [' ', 'ST', ' '],
        [' ', ' ', ' ']
      ]
      const prep = prepare(plainBefore)
      const a = prep.plain.getAt(0, 0).getCellContainers()[0]
      a.divide(1, 0, 1, 0)
      expect(compare(prep.plain, expectedPlainAfter)).toEqual('')
    })
  })

  describe('onCellDeath', () => {
    it('releases all field owned by the cell that died', () => {
      const plainBefore = [
        ['A', ' ', 'a'],
        [' ', 'B', 'a'],
        ['a', 'b', 'a']
      ]
      const expectedPlainAfter = [
        [' ', ' ', ' '],
        [' ', 'B', ' '],
        [' ', 'b', ' ']
      ]
      const prep = prepare(plainBefore)
      const a = prep.plain.getAt(0, 0).getCellContainers()[0]
      a.die()
      expect(compare(prep.plain, expectedPlainAfter)).toEqual('')
      expect(a.isDead).toBeTrue
      expect(a.cellRecord.ownedFieldsCount).toBe(0)
      expect(prep.floodFill.fill).toHaveBeenCalledTimes(1)
    })
  })
})

function prepare(plainToPrepare: string[][]): {
  plain: Plain<TestRules>
  floodFill: FloodFill<ReturnType<TestRules['createNewFieldRecord']>>
} {
  const width = plainToPrepare[0].length
  const height = plainToPrepare.length
  const plainOfLife = PlainOfLife.createNew(width, height, TestRules, TestCell)
  /* eslint-disable @typescript-eslint/no-explicit-any*/
  const plain: Plain<TestRules> = (plainOfLife as any).plain
  const seedCellContainer: ExtCellContainer<TestRules> = (plainOfLife as any).firstCellContainer.first
  /* eslint-enable @typescript-eslint/no-explicit-any*/
  seedCellContainer.move(-seedCellContainer.posX, -seedCellContainer.posY)

  const stringContainerMap = new Map<string, ExtCellContainer<TestRules>>()

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const s = plainToPrepare[y][x].trim()

      if (s !== '' && !/^[a-zA-Z]+$/.test(s)) {
        throw new Error('Only letters (a-z or A-Z) and white spaces are allowed')
      }

      const newContainers = s.replace(/[^A-Z]/g, '') // All uppercase letters

      for (const c of newContainers) {
        if (!stringContainerMap.has(c)) {
          const container = seedCellContainer.makeChild(x, y)
          container.cellRecord.name = c
          stringContainerMap.set(c, container)
        } else {
          throw new Error(
            'Container "' + c + '" is not unique on the plain (= each upper case letter must exist only once)'
          )
        }
      }
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const s = plainToPrepare[y][x].trim()

      let owner = s.replace(/[^a-z]/g, '') // All lowercase letters
      if (owner.length > 1) {
        throw new Error('Only one owner (=lower case letter) per field supported.')
      }
      if (owner.length == 0) {
        const records = s.replace(/[^A-Z]/g, '') // All uppercase letters
        if (records.length > 0) {
          owner = records.substring(records.length - 1)
        }
      } else if (!s.endsWith(owner)) {
        throw new Error('Owners must be defined at the end (=lower case letter must be at the end)')
      }

      owner = owner.toUpperCase()
      if (owner) {
        const container = stringContainerMap.get(owner)
        if (container) {
          plain.getAt(x, y).fieldRecord.owner = container
          container.cellRecord.ownedFieldsCount++
        } else {
          throw new Error(
            'Container for owner "' +
              owner +
              '" missing (=for each different lower case letter there must be exactly one corresponding upper case letter)'
          )
        }
      }
    }
  }

  seedCellContainer.die()
  const coherentAreasManager = new CoherentAreasManager(plain)
  /* eslint-disable @typescript-eslint/no-explicit-any*/
  const floodFill: FloodFill<ReturnType<TestRules['createNewFieldRecord']>> = (coherentAreasManager as any).floodFill
  /* eslint-enable @typescript-eslint/no-explicit-any*/
  spyOn(floodFill, 'fill').and.callThrough()
  return { plain, floodFill }
}

function compare(plain: Plain<TestRules>, expectedPlainAfter: string[][], startChildNamesFrom = 'S'): string {
  let differences = ''
  const width = plain.width
  const height = plain.height
  let currentChildChar = startChildNamesFrom.charCodeAt(0)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const f = plain.getAt(x, y)
      const expected = expectedPlainAfter[y][x].trim()

      let found = ''
      for (const container of f.getCellContainers()) {
        if (container.cellRecord.name === '') {
          container.cellRecord.name = String.fromCharCode(currentChildChar++)
        }
        found += container.cellRecord.name
      }
      const owner = f.fieldRecord.owner

      if (owner) {
        if (owner.cellRecord.name === '') {
          owner.cellRecord.name = String.fromCharCode(currentChildChar++)
        }
        if (owner.cellRecord.name !== found.substring(found.length - 1)) {
          found += owner.cellRecord.name.toLowerCase()
        }
      }

      if (found !== expected) {
        differences += 'At x=' + x + ', y=' + y + ' expected "' + expected + '" but found "' + found + '"\n'
      }
    }
  }
  return differences
}
