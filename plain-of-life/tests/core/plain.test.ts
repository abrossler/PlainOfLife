import { CellContainer } from '../../src/core/cell_container'
import { Plain } from '../../src/core/plain'
import { PlainField } from '../../src/core/plain_field'
import { TestRuleExtensionFactory } from '../stubs/test_rule_extension_factory'

/* eslint-disable @typescript-eslint/no-explicit-any*/

describe('Plain', () => {
  const plainWidth = 3
  const plainHeight = 2
  let ruleExtensionFactory: TestRuleExtensionFactory
  let plain: Plain<TestRuleExtensionFactory>

  beforeAll(() => {
    ruleExtensionFactory = new TestRuleExtensionFactory()
  })
  beforeEach(() => {
    plain = new Plain(ruleExtensionFactory, plainWidth, plainHeight)
  })
  it('construction inits properties correctly', () => {
    expect(plain.width).toBe(plainWidth)
    expect(plain.height).toBe(plainHeight)
    expect((plain as any).array.length).toBe(plainWidth)
    expect((plain as any).array[0].length).toBe(plainHeight)
    expect((plain as any).array[1].length).toBe(plainHeight)
    expect((plain as any).array[2].length).toBe(plainHeight)
    expect((plain as any).array[0][0]).toBeInstanceOf(PlainField)
  })

  it('construction checks plain size', () => {
    expect(() => new Plain(ruleExtensionFactory, 1, plainHeight)).toThrowError(Error) // Too small
    expect(() => new Plain(ruleExtensionFactory, plainWidth, 1)).toThrowError(Error) // Too small
    expect(() => new Plain(ruleExtensionFactory, 5.5, plainHeight)).toThrowError(Error) // No int
    expect(() => new Plain(ruleExtensionFactory, plainWidth, 5.5)).toThrowError(Error) // No int
    expect(() => new Plain(ruleExtensionFactory, 100000, 100000)).toThrowError(Error) // Too huge
  })

  it('getAt and getAtInt get individual plain fields', () => {
    expect(plain.getAt(0, 1)).toBe((plain as any).array[0][1])
    expect(plain.getAtInt(0, 1)).toBe((plain as any).array[0][1])
  })

  describe('on cell events', () => {
    let cellContainer: CellContainer<TestRuleExtensionFactory>
    {
      beforeEach(() => {
        cellContainer = new CellContainer(ruleExtensionFactory, plain)
        ;(cellContainer as unknown as { _posX: number })._posX = 0
        ;(cellContainer as unknown as { _posY: number })._posY = 1
        plain.getAtInt(0, 1).addCellContainer(cellContainer)
      })
    }

    describe('onSeedCellAdd', () => {
      it('places seed cell on plain considering torus topography', () => {
        const pos = plain.onSeedCellAdd(cellContainer, -1, -1)
        expect(plain.getAt(2, 1).getCellContainers()[0]).toBe(cellContainer)
        expect(pos).toEqual([2, 1])
      })
    })

    describe('addCellContainer', () => {
      it('places container on plain considering torus topography', () => {
        const pos = plain.addCellContainer(cellContainer, 3, 2)
        expect(plain.getAt(0, 0).getCellContainers()[0]).toBe(cellContainer)
        expect(pos).toEqual([0, 0])
      })
    })

    describe('onCellMove', () => {
      {
        beforeEach(() => {
          plain.onCellMove(cellContainer, 1, 0)
          ;(cellContainer as unknown as { _posX: number })._posX = 1
          ;(cellContainer as unknown as { _posY: number })._posY = 1
        })
      }
      it('moves position of cell container on plain', () => {
        expect(plain.getAt(0, 1).getCellContainers().length).toBe(0)
        expect(plain.getAt(1, 1).getCellContainers()[0]).toBe(cellContainer)
      })

      it('returns new position considering torus topography', () => {
        expect(plain.onCellMove(cellContainer, 2, -2)).toEqual([0, 1])
      })
    })

    describe('onCellMakeChild', () => {
      let child: CellContainer<TestRuleExtensionFactory>
      {
        beforeEach(() => {
          child = new CellContainer(ruleExtensionFactory, plain)
          plain.onCellMakeChild(cellContainer, child, -1, 1)
        })
      }
      it('places child on plain considering torus topography', () => {
        expect(plain.getAt(2, 0).getCellContainers()[0]).toBe(child)
      })

      it('keeps parent unchanged on plain', () => {
        expect(plain.getAt(0, 1).getCellContainers()[0]).toBe(cellContainer)
      })

      it('works also correctly if child is placed on same field as parent', () => {
        plain.onCellMakeChild(cellContainer, child, 0, 0)
        expect(plain.getAt(0, 1).getCellContainers()[0]).toBe(cellContainer)
        expect(plain.getAt(0, 1).getCellContainers()[1]).toBe(child)
      })
    })

    describe('onCellDivide', () => {
      let child1: CellContainer<TestRuleExtensionFactory>
      let child2: CellContainer<TestRuleExtensionFactory>
      {
        beforeEach(() => {
          child1 = new CellContainer(ruleExtensionFactory, plain)
          child2 = new CellContainer(ruleExtensionFactory, plain)
          plain.onCellDivide(cellContainer, child1, 1, -1, child2, 2, -1)
        })
      }
      it('removes parent container from plain', () => {
        expect(plain.getAt(0, 1).getCellContainers().length).toBe(0)
      })

      it('places child containers on plain', () => {
        expect(plain.getAt(1, 0).getCellContainers()[0]).toBe(child1)
        expect(plain.getAt(2, 0).getCellContainers()[0]).toBe(child2)
      })
    })

    describe('onCellDeath', () => {
      it('removes cell container from the plain', () => {
        plain.onCellDeath(cellContainer)
        expect(plain.getAt(0, 1).getCellContainers().length).toBe(0)
      })
    })
  })

  it('has expected torus topography', () => {
    // Exit to the right => enter from the left
    expect(plain.getAt(0 + plainWidth, 1)).toBe(plain.getAt(0, 1))
    expect(plain.getAt(1 + plainWidth, 1)).toBe(plain.getAt(1, 1))
    expect(plain.getAt(1 + 2 * plainWidth, 1)).toBe(plain.getAt(1, 1)) // Multiples of plainWidth shall have no impact...
    expect(plain.getAt(2 + plainWidth, 1)).toBe(plain.getAt(2, 1))
    expect(plain.getAt(2 + 3 * plainWidth, 1)).toBe(plain.getAt(2, 1)) // Multiples of plainWidth shall have no impact...

    // Exit to the left => enter from the right
    expect(plain.getAt(-1, 1)).toBe(plain.getAt(plainWidth - 1, 1))
    expect(plain.getAt(-1 - 2 * plainWidth, 1)).toBe(plain.getAt(plainWidth - 1, 1)) // Multiples of plainWidth shall have no impact...
    expect(plain.getAt(-2, 1)).toBe(plain.getAt(plainWidth - 2, 1))
    expect(plain.getAt(-3, 1)).toBe(plain.getAt(plainWidth - 3, 1))

    // Exit at the bottom => enter from the top
    expect(plain.getAt(0, 0 + plainHeight)).toBe(plain.getAt(0, 0))
    expect(plain.getAt(0, 1 + plainHeight)).toBe(plain.getAt(0, 1))
    expect(plain.getAt(0, 1 + 2 * plainHeight)).toBe(plain.getAt(0, 1)) // Multiples of plainHeight shall have no impact...

    // Exit at the top => enter from the bottom
    expect(plain.getAt(0, -1)).toBe(plain.getAt(0, plainHeight - 1))
    expect(plain.getAt(0, -2)).toBe(plain.getAt(0, plainHeight - 2))
    expect(plain.getAt(0, -2 - 2 * plainHeight)).toBe(plain.getAt(0, plainHeight - 2)) // Multiples of plainHeight shall have no impact...
  })
})
