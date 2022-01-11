import { cellNames } from '../cells/cell_names'
import { CellContainer } from './cell_container'
import { Plain } from './plain'
import { SerializableCellContainer } from './serializable_plain_of_life'
import { TestRuleExtensionFactory } from '../../../test_stubs/test_rule_extension_factory'
import { TestCell } from '../../../test_stubs/test_cell'

/* eslint-disable @typescript-eslint/no-explicit-any*/

describe('Cell Container', () => {
  const posXOutsidePlain = 3
  const posYOutsidePlain = -3
  const plainSize = 2
  const posXInPlain = 1
  const posYInPlain = 1
  const ruleExtensionFactory = new TestRuleExtensionFactory()
  let plain: Plain<TestRuleExtensionFactory>
  let cellContainer: CellContainer<TestRuleExtensionFactory>
  let seedCell: TestCell
  let firstCellContainer: { first: CellContainer<TestRuleExtensionFactory> }
  let serializable: SerializableCellContainer
  let child1Container: CellContainer<TestRuleExtensionFactory>
  let child2Container: CellContainer<TestRuleExtensionFactory>

  beforeEach(() => {
    plain = new Plain(ruleExtensionFactory, plainSize, plainSize)
    cellContainer = new CellContainer(ruleExtensionFactory, plain)
    firstCellContainer = { first: cellContainer }
    seedCell = new TestCell()
    cellContainer.initSeedCellContainer(seedCell, posXOutsidePlain, posYOutsidePlain, firstCellContainer)
  })

  describe('construction', () => {
    it('fills properties correctly', () => {
      expect(cellContainer.isDead).toBeFalse()
      expect((cellContainer as any).plain).toBe(plain)
      expect((cellContainer as any).cellRecordFactory).toBe(ruleExtensionFactory)
      expect((cellContainer as any).cellRecord).toBeDefined()
      expect((cellContainer as any).cell).toBe(seedCell)
    })
    it('creates a correct cyclic list of one cell container', () => {
      expect(cellContainer.next === cellContainer).toBeTrue()
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
        plain.getAt(posXInPlain, posYInPlain).getCellContainers()[0] as CellContainer<TestRuleExtensionFactory>
      )
    })
    it('inits the number of cells correctly', () => {
      expect(plain.cellCount).toBe(1)
    })
  })

  describe('makeChild', () => {
    let child1Container: CellContainer<TestRuleExtensionFactory>

    beforeEach(() => {
      child1Container = cellContainer.makeChild(1, 1) as CellContainer<TestRuleExtensionFactory>
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
      spyOn(seedCell, 'makeChild')
      cellContainer.makeChild(0, 1)
      expect(seedCell.makeChild).toHaveBeenCalledTimes(1)
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
      const child2Container = cellContainer.makeChild(0, 1)
      expect((cellContainer as any)._prev).toBe(child2Container)
    })

    it('creates a cyclic list of parent and children', () => {
      cellContainer.makeChild(0, 1)
      expect((cellContainer as any).next.next.next).toBe(cellContainer)
      expect((cellContainer as any)._prev._prev._prev).toBe(cellContainer)
    })

    it('considers the torus topography when making a child', () => {
      expect(cellContainer.makeChild(0, 1).posY).toBe(0)
      expect(cellContainer.makeChild(1, 0).posX).toBe(0)
    })

    it('increases the number of cells', () => {
      expect(plain.cellCount).toBe(2)
    })
  })

  describe('divide', () => {
    let child1Container: CellContainer<TestRuleExtensionFactory>
    let child2Container: CellContainer<TestRuleExtensionFactory>

    beforeEach(() => {
      ;[child1Container, child2Container] = cellContainer.divide(-1, 0, 0, -1) as [
        CellContainer<TestRuleExtensionFactory>,
        CellContainer<TestRuleExtensionFactory>
      ]
    })
    it('throws a syntax error if arguments for dx or dy are no integer', () => {
      expect(() => cellContainer.divide(1.1, 1, 1, 1)).toThrowError(SyntaxError)
      expect(() => cellContainer.divide(1, 1.1, 1, 1)).toThrowError(SyntaxError)
      expect(() => cellContainer.divide(1, 1, 1.1, 1)).toThrowError(SyntaxError)
      expect(() => cellContainer.divide(1, 1, 1, 1.1)).toThrowError(SyntaxError)
    })

    it('creates the two child containers', () => {
      expect(child1Container).toBeInstanceOf(CellContainer)
      expect(child2Container).toBeInstanceOf(CellContainer)
    })

    it('lets the parent die', () => {
      expect(cellContainer.isDead).toBe(true)
    })

    it('places the child containers on the plain', () => {
      expect(child1Container.posX).toBe(0)
      expect(child1Container.posY).toBe(1)
      expect(plain.getAt(0, 1).getCellContainers()[0]).toBe(child1Container)

      expect(child2Container.posX).toBe(1)
      expect(child2Container.posY).toBe(0)
      expect(plain.getAt(1, 0).getCellContainers()[0]).toBe(child2Container)
    })

    it('creates a cyclic list of parent and children', () => {
      expect(child1Container.next).toBe(child2Container)
      expect(child2Container.next).toBe(child1Container)
    })

    it('considers the torus topography for both children when dividing', () => {
      const grandChildren = child1Container.divide(-2, 1, 2, -3)
      expect(grandChildren[0].posX).toBe(0)
      expect(grandChildren[0].posY).toBe(0)
      expect(grandChildren[1].posX).toBe(0)
      expect(grandChildren[1].posY).toBe(0)
    })

    it('increases the number of cells', () => {
      expect(plain.cellCount).toBe(2)
    })
  })

  describe('die', () => {
    beforeEach(() => {
      child1Container = cellContainer.makeChild(1, 1) as CellContainer<TestRuleExtensionFactory>
      child2Container = cellContainer.makeChild(-1, 0) as CellContainer<TestRuleExtensionFactory>
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
    it('lets the dead container still point to the former next and prev container', () => {
      expect((child2Container as any).next).toBe(cellContainer)
      expect((child2Container as any)._prev).toBe(child1Container)
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

    it('decreases the number of cells', () => {
      expect(plain.cellCount).toBe(2)
    })
  })

  describe('move', () => {
    beforeEach(() => {
      cellContainer.move(-1, -1)
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

    it('considers the torus topography when moving', () => {
      cellContainer.move(-3, 0)
      expect(cellContainer.posX).toBe(1)
      cellContainer.move(0, -3)
      expect(cellContainer.posY).toBe(1)
      cellContainer.move(3, 0)
      expect(cellContainer.posX).toBe(0)
      cellContainer.move(0, 3)
      expect(cellContainer.posY).toBe(0)
    })
  })

  describe('executeTurn', () => {
    it('calls executeTurn of the hosted cell', () => {
      const cell = (cellContainer as any).cell
      spyOn(cell, 'executeTurn').and.callThrough()
      cellContainer.executeTurn(new Uint8Array(3), new Uint8Array(3))
      expect(cell.executeTurn).toHaveBeenCalledTimes(1)
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
      spyOn(cellNames, 'getName').and.returnValue('TestCell')
      serializable = cellContainer.toSerializable()
    })

    it('copies all relevant properties correctly', () => {
      expect(serializable.cellTypeName).toBe('TestCell')
      expect(serializable.cell).toEqual(seedCell.toSerializable())
      expect(serializable.isDead).toBe(cellContainer.isDead)
      expect(serializable.posX).toBe(cellContainer.posX)
      expect(serializable.posY).toBe(cellContainer.posY)
      expect(serializable.colorRed).toBe(cellContainer.color[0])
      expect(serializable.colorGreen).toBe(cellContainer.color[1])
      expect(serializable.colorBlue).toBe(cellContainer.color[2])
    })

    it('does not copy unexpected properties', () => {
      expect(Object.getOwnPropertyNames(serializable).length).toEqual(8) // Exactly the eight properties from above: cellTypeName, ...
    })
  })

  describe('initFromSerializable', () => {
    it('throws an error if cell class is not registered', () => {
      spyOn(cellNames, 'getName').and.returnValue('TestCell') // Spy for toSerializable
      const allSerializableCellContainers = [cellContainer.toSerializable()]
      const fromSerializable = new CellContainer(ruleExtensionFactory, new Plain(ruleExtensionFactory, 2, 2))
      // TestCell used for this test is not registered
      expect(() =>
        fromSerializable.initFromSerializable(allSerializableCellContainers, firstCellContainer)
      ).toThrowError(Error)
    })
  })

  describe('initFromSerializable', () => {
    let allSerializableCellContainers: SerializableCellContainer[]
    let fromSerializable: CellContainer<TestRuleExtensionFactory>
    let fromSerializablePlain: Plain<TestRuleExtensionFactory>
    let allCellContainers: CellContainer<TestRuleExtensionFactory>[]

    beforeEach(() => {
      child1Container = cellContainer.makeChild(1, 0) as CellContainer<TestRuleExtensionFactory>
      child2Container = cellContainer.makeChild(0, 1) as CellContainer<TestRuleExtensionFactory>
      child2Container.die()
      spyOn(cellNames, 'getName').and.returnValue('TestCell')
      allSerializableCellContainers = [
        cellContainer.toSerializable(),
        child1Container.toSerializable(),
        child2Container.toSerializable()
      ]
      fromSerializablePlain = new Plain(ruleExtensionFactory, 2, 2)
      fromSerializable = new CellContainer(ruleExtensionFactory, fromSerializablePlain)
      spyOn(cellNames, 'getConstructor').and.returnValue(TestCell)
      allCellContainers = fromSerializable.initFromSerializable(
        allSerializableCellContainers,
        firstCellContainer
      ) as CellContainer<TestRuleExtensionFactory>[]
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
      const dead = allCellContainers[2]
      expect(dead.isDead).toBeTrue()
      expect(dead.next).toBe(dead)
      expect((dead as any)._prev).toBe(dead)
    })

    it('places cell containers of alive cells correctly on plain', () => {
      expect(fromSerializable.posX).toBe(cellContainer.posX)
      expect(fromSerializable.posY).toBe(cellContainer.posY)
      expect(fromSerializablePlain.getAt(fromSerializable.posX, fromSerializable.posY).getCellContainers()[0]).toBe(
        fromSerializable
      )
      const next = fromSerializable.next
      expect(next.posX).toBe(child1Container.posX)
      expect(next.posY).toBe(child1Container.posY)
      expect(fromSerializablePlain.getAt(next.posX, next.posY).getCellContainers()[0]).toBe(next)
    })

    it('does not place containers of dead cells on plain but fills position of container', () => {
      const dead = allCellContainers[2]
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
