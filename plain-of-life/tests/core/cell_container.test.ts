import { CellNames } from '../../src/cells/cell_names'
import { CellContainer } from '../../src/core/cell_container'
import { Plain } from '../../src/core/plain'
import { SerializableCellContainer } from '../../src/core/serializable_plain_of_life'
import { SimpleRuleExtensionFactory } from '../stubs/rule_extension_factory'
import { TestCell } from '../stubs/test_cell'

const posXOutsidePlain = 3
const posYOutsidePlain = -3
const plainSize = 2
const posXInPlain = 1
const posYInPlain = 1
const ruleExtensionFactory = new SimpleRuleExtensionFactory()
let plain: Plain<SimpleRuleExtensionFactory>
let cellContainer: CellContainer<SimpleRuleExtensionFactory>
let seedCell: TestCell
let firstCellContainer: { first: CellContainer<SimpleRuleExtensionFactory> }
let serializable: SerializableCellContainer
let child1Container: CellContainer<SimpleRuleExtensionFactory>
let child2Container: CellContainer<SimpleRuleExtensionFactory>

beforeEach(() => {
  plain = new Plain(ruleExtensionFactory, plainSize, plainSize)
  cellContainer = new CellContainer(ruleExtensionFactory, plain)
  firstCellContainer = { first: cellContainer }
  seedCell = new TestCell()
  cellContainer.initSeedCellContainer(seedCell, posXOutsidePlain, posYOutsidePlain, firstCellContainer)
})

describe('Cell Container', () => {
  describe('construction', () => {
    it('fills properties correctly', () => {
      expect(cellContainer.isDead).toBeFalse()
      expect((cellContainer as any).plain).toBe(plain)
      expect((cellContainer as any).cellRecordFactory).toBe(ruleExtensionFactory)
      expect((cellContainer as any).cellRecord).toBeDefined()
      expect((cellContainer as any).cell).toBe(seedCell)
    })
    it('creates a correct cyclic list of one cell container', () => {
      expect((cellContainer as any).next === cellContainer).toBeTrue()
      expect((cellContainer as any)._prev === cellContainer).toBeTrue()
    })
    it('sets up first cell container correctly', () => {
      expect((cellContainer as any).firstCellContainer).toBe(firstCellContainer)
      expect(firstCellContainer.first).toBe(cellContainer)
    })
    it('fits cell position to plain size', () => {
      expect(cellContainer.posX).toBe(posXInPlain)
      expect(cellContainer.posY).toBe(posYInPlain)
    })
    it('places cell container on plain', () => {
      expect(cellContainer).toBe(
        plain.getAt(posXInPlain, posYInPlain).getCellContainers()[0] as CellContainer<SimpleRuleExtensionFactory>
      )
    })
  })

  describe('makeChild', () => {
    let child1Container: CellContainer<SimpleRuleExtensionFactory>

    beforeEach(() => {
      child1Container = cellContainer.makeChild(1, 1) as CellContainer<SimpleRuleExtensionFactory>
    })
    it('throws a syntax error if arguments dx or dy are no integer', () => {
      expect(() => cellContainer.makeChild(1.1, 1)).toThrowError(SyntaxError)
      expect(() => cellContainer.makeChild(1, '1' as unknown as number)).toThrowError(SyntaxError)
    })

    it('creates a child container', () => {
      expect(child1Container).toBeInstanceOf(CellContainer)
    })

    it('creates a child cell by calling cell.makeChild', () => {
      expect((child1Container as any).cell).toBeInstanceOf(TestCell)
      spyOn(cellContainer, 'makeChild')
      cellContainer.makeChild(0, 1)
      expect(cellContainer.makeChild).toHaveBeenCalledTimes(1)
    })

    it('places the child container on the plain', () => {
      expect(child1Container.posX).toBe(0)
      expect(child1Container.posY).toBe(0)
      expect(plain.getAt(0, 0).getCellContainers()[0]).toBe(child1Container)
    })

    it('moves the first cell container to the child if the first container makes a child', () => {
      expect(firstCellContainer.first).toBe(child1Container)
      expect((child1Container as any).firstCellContainer).toBe(firstCellContainer)
      expect((cellContainer as any).firstCellContainer).toBeUndefined()
    })

    it('does not move the first cell container if another container than the first makes a child', () => {
      cellContainer.makeChild(0, 1) // If second container makes child...
      expect(firstCellContainer.first).toBe(child1Container) // ...first isn't moved
      expect((child1Container as any).firstCellContainer).toBe(firstCellContainer)
    })

    it('adds a child before the parent container', () => {
      let child2Container = cellContainer.makeChild(0, 1)
      expect((cellContainer as any)._prev).toBe(child2Container)
    })

    it('creates a cyclic list of parent and children', () => {
      cellContainer.makeChild(0, 1)
      expect((cellContainer as any).next.next.next).toBe(cellContainer)
      expect((cellContainer as any)._prev._prev._prev).toBe(cellContainer)
    })
  })

  describe('die', () => {
    beforeEach(() => {
      child1Container = cellContainer.makeChild(1, 1) as CellContainer<SimpleRuleExtensionFactory>
      child2Container = cellContainer.makeChild(-1, 0) as CellContainer<SimpleRuleExtensionFactory>
      child2Container.die()
    })
    it('marks the died container as dead', () => {
      expect(child2Container.isDead).toBeTrue()
    })
    it('removes the dead container from the cyclic list of all alive containers', () => {
      expect((cellContainer as any).next.next).toBe(cellContainer)
      expect((cellContainer as any)._prev._prev).toBe(cellContainer)
      expect((cellContainer as any).next).not.toBe(child2Container)
      expect((cellContainer as any)._prev).not.toBe(child2Container)
    })
    it('lets the dead container form a cyclic list with just one element (the dead container itself)', () => {
      expect((child2Container as any).next).toBe(child2Container)
      expect((child2Container as any)._prev).toBe(child2Container)
    })
    it('removes the dead container from the plain but keeps the last posX and posY in the container', () => {
      expect(child2Container.posX).toBe(0)
      expect(child2Container.posY).toBe(1)
      expect(plain.getAt(0, 1).getCellContainers.length).toBe(0)
    })
    it('moves the first container to next if the first container dies', () => {
      expect(child1Container).toBe(firstCellContainer.first)
      child1Container.die()
      expect((child1Container as any).firstCellContainer).toBeUndefined()
      expect((cellContainer as any).firstCellContainer).toBe(firstCellContainer)
      expect(cellContainer).toBe(firstCellContainer.first)
    })
    it('cleaned up all cells on plain after the last cell died', () => {
      child1Container.die()
      cellContainer.die()
      for (let x = 0; x < plain.width; x++) {
        for (let y = 0; y < plain.height; y++) {
          expect(plain.getAt(x, y).getCellContainers.length).toBe(0)
        }
      }
    })

    it('keeps the last cell in the list of all cells if it dies', () => {
      child1Container.die()
      cellContainer.die()
      expect(cellContainer.isDead).toBeTrue()
      expect((cellContainer as any).firstCellContainer).toBe(firstCellContainer)
      expect(cellContainer).toBe(firstCellContainer.first)
    })
  })
  describe('move', () => {
    beforeEach(() => {
      cellContainer.move(1, -1)
    })

    it('throws a syntax error if arguments dx or dy are no integer', () => {
      expect(() => cellContainer.move(1.1, 1)).toThrowError(SyntaxError)
      expect(() => cellContainer.move(1, '1' as unknown as number)).toThrowError(SyntaxError)
    })

    it('adjusts posX and posY of the container', () => {
      expect(cellContainer.posX).toBe(0)
      expect(cellContainer.posY).toBe(0)
    })

    it('moves the container on the plain', () => {
      expect(plain.getAt(0, 0).getCellContainers()[0]).toBe(cellContainer)
      expect(plain.getAt(0, 1).getCellContainers().length).toBe(0)
      expect(plain.getAt(1, 0).getCellContainers().length).toBe(0)
      expect(plain.getAt(1, 1).getCellContainers().length).toBe(0)
    })
  })

  describe('toSerializable', () => {
    it('throws an error if cell class is not registered', () => {
      // TestCell used for this test is not registered
      expect(() => cellContainer.toSerializable()).toThrowError(Error)
    })
  })

  describe('toSerializable', () => {
    beforeEach(() => {
      spyOn(CellNames, 'getCellTypeName').and.returnValue('TestCell')
      serializable = cellContainer.toSerializable()
    })

    it('copies all relevant properties correctly', () => {
      expect(serializable.cellTypeName).toBe('TestCell')
      expect(serializable.cell).toEqual(seedCell.toSerializable())
      expect(serializable.isDead).toBe(cellContainer.isDead)
      expect(serializable.posX).toBe(cellContainer.posX)
      expect(serializable.posY).toBe(cellContainer.posY)
      expect(serializable.color).toBe(cellContainer.color)
    })

    it('does not copy unexpected properties', () => {
      expect(Object.getOwnPropertyNames(serializable).length).toEqual(6) // Exactly the six properties from above: cellTypeName, ...
    })
  })

  describe('initFromSerializable', () => {
    it('throws an error if cell class is not registered', () => {
      spyOn(CellNames, 'getCellTypeName').and.returnValue('TestCell') // Spy for toSerializable
      let allSerializableCellContainers = [cellContainer.toSerializable()]
      let fromSerializable = new CellContainer(ruleExtensionFactory, new Plain(ruleExtensionFactory, 2, 2))
      // TestCell used for this test is not registered
      expect(() => fromSerializable.initFromSerializable(allSerializableCellContainers, firstCellContainer)).toThrowError(Error)
    })
  })

  describe('initFromSerializable', () => {
    let allSerializableCellContainers: SerializableCellContainer[]
    let fromSerializable: CellContainer<SimpleRuleExtensionFactory>
    let fromSerializablePlain: Plain<SimpleRuleExtensionFactory>
    let allCellContainers: CellContainer<SimpleRuleExtensionFactory>[]
  
    beforeEach(() => {
      child1Container = cellContainer.makeChild(1, 0) as CellContainer<SimpleRuleExtensionFactory>
      child2Container = cellContainer.makeChild(0, 1) as CellContainer<SimpleRuleExtensionFactory>
      child2Container.die()
      spyOn(CellNames, 'getCellTypeName').and.returnValue('TestCell')
      allSerializableCellContainers = [cellContainer.toSerializable(), child1Container.toSerializable(), child2Container.toSerializable()]
      fromSerializablePlain = new Plain(ruleExtensionFactory, 2, 2)
      fromSerializable = new CellContainer(ruleExtensionFactory, fromSerializablePlain)
      spyOn(CellNames, 'getCellConstructor').and.returnValue(TestCell)
      allCellContainers = fromSerializable.initFromSerializable(allSerializableCellContainers, firstCellContainer) as CellContainer<SimpleRuleExtensionFactory>[]
    })
    it('processes all serializable containers and sets first cell container correctly', () => {
      expect(allCellContainers.length).toEqual(allSerializableCellContainers.length)
      expect((fromSerializable as any).firstCellContainer).toBe(firstCellContainer)
      expect(firstCellContainer.first).toBe(fromSerializable)
      expect((fromSerializable.next as any).firstCellContainer).toBeUndefined()
    })

    it('sets up the list of all alive cells correctly', () => {
      expect(fromSerializable.next.next).toBe(fromSerializable)
      expect((fromSerializable as any)._prev._prev).toBe(fromSerializable)
      expect(fromSerializable.isDead).toBeFalse()
      expect(fromSerializable.next.isDead).toBeFalse()
    })

    it('handles dead cells correctly', () => {
      let dead = allCellContainers[2]
      expect(dead.isDead).toBeTrue()
      expect(dead.next).toBe(dead)
      expect((dead as any)._prev).toBe(dead)
    })

    it('places cell containers of alive cells correctly on plain', () => {
      expect(fromSerializable.posX).toBe(cellContainer.posX)
      expect(fromSerializable.posY).toBe(cellContainer.posY)
      expect(fromSerializablePlain.getAt(fromSerializable.posX, fromSerializable.posY).getCellContainers()[0]).toBe(fromSerializable)
      let next = fromSerializable.next
      expect(next.posX).toBe(child1Container.posX)
      expect(next.posY).toBe(child1Container.posY)
      expect(fromSerializablePlain.getAt(next.posX, next.posY).getCellContainers()[0]).toBe(next)
    })

    it('does not place containers of dead cells on plain but fills position of container', () => {
      let dead = allCellContainers[2]
      expect(dead.posX).toBe(child2Container.posX)
      expect(dead.posY).toBe(child2Container.posY)
      expect(fromSerializablePlain.getAt(dead.posX, dead.posY).getCellContainers().length).toBe(0)
    })

    it('creates cell correctly', () => {
      expect((allCellContainers[0] as any).cell.cellId).toBe((cellContainer as any).cell.cellId)
      expect((allCellContainers[1] as any).cell.cellId).toBe((child1Container as any).cell.cellId)
      expect((allCellContainers[2] as any).cell.cellId).toBe((child2Container as any).cell.cellId)
    })
  })
})
