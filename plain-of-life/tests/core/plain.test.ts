import { CellContainer } from '../../src/core/cell_container'
import { Plain } from '../../src/core/plain'
import { PlainField } from '../../src/core/plain_field'
import { TestRuleExtensionFactory } from '../stubs/test_rule_extension_factory'
import {
  MyCellDeathListener,
  MyCellDivideListener,
  MyCellMakeChildListener,
  MyCellMoveListener,
  MySeedCellAddListener
} from '../stubs/plain_listeners'

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
    expect((plain as any).array.length).toBe(plainHeight)
    expect((plain as any).array[0].length).toBe(plainWidth)
    expect((plain as any).array[1].length).toBe(plainWidth)
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
    expect(plain.getAt(0, 1)).toBe((plain as any).array[1][0])
    expect(plain.getAtInt(0, 1)).toBe((plain as any).array[1][0])
  })

  describe('event listeners', () => {
    let cellContainer: CellContainer<TestRuleExtensionFactory>
    let child1: CellContainer<TestRuleExtensionFactory>
    let child2: CellContainer<TestRuleExtensionFactory>
    {
      beforeEach(() => {
        cellContainer = new CellContainer(ruleExtensionFactory, plain)
        ;(cellContainer as unknown as { _posX: number })._posX = 1
        ;(cellContainer as unknown as { _posY: number })._posY = 1

        child1 = new CellContainer(ruleExtensionFactory, plain)
        ;(child1 as unknown as { _posX: number })._posX = 1
        ;(child1 as unknown as { _posY: number })._posY = 0

        child2 = new CellContainer(ruleExtensionFactory, plain)
        ;(child2 as unknown as { _posX: number })._posX = 0
        ;(child2 as unknown as { _posY: number })._posY = 1
      })
    }
    describe('SeedCellAddListener', () => {
      let seedCellAddListener: MySeedCellAddListener<TestRuleExtensionFactory>
      let seedCellAddListener2: MySeedCellAddListener<TestRuleExtensionFactory>
      {
        beforeEach(() => {
          seedCellAddListener = new MySeedCellAddListener()
          seedCellAddListener2 = new MySeedCellAddListener()
          plain.addSeedCellAddListener(seedCellAddListener)
          plain.addSeedCellAddListener(seedCellAddListener2)
          plain.addSeedCellAddListener(seedCellAddListener)
          spyOn(seedCellAddListener, 'onSeedCellAdd').and.callThrough()
          spyOn(seedCellAddListener2, 'onSeedCellAdd').and.callThrough()
        })
      }
      it('is called like expected', () => {
        plain.onSeedCellAdd(cellContainer)
        expect(seedCellAddListener.onSeedCellAdd).toHaveBeenCalledTimes(2)
        expect(seedCellAddListener2.onSeedCellAdd).toHaveBeenCalledTimes(1)
        expect(seedCellAddListener2.onSeedCellAdd).toHaveBeenCalledWith(cellContainer)
      })

      it('can be removed', () => {
        const removed = plain.removeSeedCellAddListener(seedCellAddListener)
        expect(removed).toBe(2)
        plain.onSeedCellAdd(cellContainer)
        expect(seedCellAddListener.onSeedCellAdd).toHaveBeenCalledTimes(0)
        expect(seedCellAddListener2.onSeedCellAdd).toHaveBeenCalledTimes(1)
      })
    })

    describe('CellMoveListener', () => {
      let cellMoveListener: MyCellMoveListener<TestRuleExtensionFactory>
      let cellMoveListener2: MyCellMoveListener<TestRuleExtensionFactory>
      {
        beforeEach(() => {
          cellMoveListener = new MyCellMoveListener()
          cellMoveListener2 = new MyCellMoveListener()
          plain.addCellMoveListener(cellMoveListener)
          plain.addCellMoveListener(cellMoveListener2)
          plain.addCellMoveListener(cellMoveListener)
          spyOn(cellMoveListener, 'onCellMove').and.callThrough()
          spyOn(cellMoveListener2, 'onCellMove').and.callThrough()
          plain.onSeedCellAdd(cellContainer)
        })
      }
      it('is called like expected', () => {
        plain.onCellMove(cellContainer, 1, 1, -1, -1)
        expect(cellMoveListener.onCellMove).toHaveBeenCalledTimes(2)
        expect(cellMoveListener2.onCellMove).toHaveBeenCalledTimes(1)
        expect(cellMoveListener2.onCellMove).toHaveBeenCalledWith(cellContainer, 1, 1, -1, -1)
      })

      it('can be removed', () => {
        const removed = plain.removeCellMoveListener(cellMoveListener)
        expect(removed).toBe(2)
        plain.onCellMove(cellContainer, 1, 1, -1, -1)
        expect(cellMoveListener.onCellMove).toHaveBeenCalledTimes(0)
        expect(cellMoveListener2.onCellMove).toHaveBeenCalledTimes(1)
      })
    })

    describe('CellMakeChildListener', () => {
      let cellMakeChildListener: MyCellMakeChildListener<TestRuleExtensionFactory>
      {
        beforeEach(() => {
          cellMakeChildListener = new MyCellMakeChildListener()
          plain.addCellMakeChildListener(cellMakeChildListener)
          spyOn(cellMakeChildListener, 'onCellMakeChild').and.callThrough()
          plain.onSeedCellAdd(cellContainer)
        })
      }
      it('is called like expected', () => {
        plain.onCellMakeChild(cellContainer, child1, 0, -1)
        expect(cellMakeChildListener.onCellMakeChild).toHaveBeenCalledTimes(1)
        expect(cellMakeChildListener.onCellMakeChild).toHaveBeenCalledWith(child1, cellContainer, 0, -1)
      })

      it('can be removed', () => {
        const removed = plain.removeCellMakeChildListener(cellMakeChildListener)
        expect(removed).toBe(1)
        plain.onCellMakeChild(cellContainer, child1, 0, -1)
        expect(cellMakeChildListener.onCellMakeChild).toHaveBeenCalledTimes(0)
      })
    })

    describe('CellDivideListener', () => {
      let cellDivideListener: MyCellDivideListener<TestRuleExtensionFactory>
      {
        beforeEach(() => {
          cellDivideListener = new MyCellDivideListener()
          plain.addCellDivideListener(cellDivideListener)
          spyOn(cellDivideListener, 'onCellDivide').and.callThrough()
          plain.onSeedCellAdd(cellContainer)
        })
      }
      it('is called like expected', () => {
        plain.onCellDivide(cellContainer, child1, 0, -1, child2, -1, 0)
        expect(cellDivideListener.onCellDivide).toHaveBeenCalledTimes(1)
        expect(cellDivideListener.onCellDivide).toHaveBeenCalledWith(cellContainer, child1, 0, -1, child2, -1, 0)
      })

      it('can be removed', () => {
        const removed = plain.removeCellDivideListener(cellDivideListener)
        expect(removed).toBe(1)
        plain.onCellDivide(cellContainer, child1, 0, -1, child2, -1, 0)
        expect(cellDivideListener.onCellDivide).toHaveBeenCalledTimes(0)
      })
    })

    describe('CellDeathListener', () => {
      let cellDeathListener: MyCellDeathListener<TestRuleExtensionFactory>
      {
        beforeEach(() => {
          cellDeathListener = new MyCellDeathListener()
          plain.addCellDeathListener(cellDeathListener)
          spyOn(cellDeathListener, 'onCellDeath').and.callThrough()
          plain.onSeedCellAdd(cellContainer)
        })
      }
      it('is called like expected', () => {
        plain.onCellDeath(cellContainer)
        expect(cellDeathListener.onCellDeath).toHaveBeenCalledTimes(1)
        expect(cellDeathListener.onCellDeath).toHaveBeenCalledWith(cellContainer)
      })

      it('can be removed', () => {
        const removed = plain.removeCellDeathListener(cellDeathListener)
        expect(removed).toBe(1)
        plain.onCellDeath(cellContainer)
        expect(cellDeathListener.onCellDeath).toHaveBeenCalledTimes(0)
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
