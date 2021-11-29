import { TestRules } from '../stubs/test_rules'
import { ExtPlainOfLife, PlainOfLife } from '../../src/core/plain_of_life'
import { TestCell } from '../stubs/test_cell'
import { FamilyTree } from '../../src/core/family_tree'
import { Plain } from '../../src/core/plain'
import { CellContainer, CellContainers } from '../../src/core/cell_container'
import { Cell } from '../../src/core/cell'
import { SerializablePlainOfLife } from '../../src/core/serializable_plain_of_life'
import { ruleNames } from '../../src/rules/rules_names'
import { cellNames } from '../../src/cells/cell_names'

describe('Plain of life', () => {
  const plainWidth = 4
  const plainHeight = 3
  let plainOfLife: ExtPlainOfLife<TestRules>
  let firstCellContainer: CellContainer<TestRules>
  let seedCell: TestCell
  let rules: TestRules
  let plain: Plain<TestRules>
  let familyTree: FamilyTree<TestRules>
  let cellContainers: CellContainers<TestRules> | null
  let executeTurnResult: boolean
  let serializable: SerializablePlainOfLife
  let fromSerializable: ExtPlainOfLife<TestRules>
  let fromSerializableRules: TestRules
  let fromSerializableFamilyTree: FamilyTree<TestRules>

  describe('createNew', () => {
    beforeAll(createPlainOfLife)

    it('creates a plain of life instance with current turn = 0', () => {
      expect(plainOfLife).toBeInstanceOf(PlainOfLife)
      expect(plainOfLife.currentTurn).toBe(0n)
    })
    it('creates and inits rules', () => {
      expect(rules).toBeInstanceOf(TestRules)
      expect(rules.initNewPassed).toBeTrue()
      // inits rules with correct plain
      expect(rules.initWithPlain).toBe(plain)
      // inits rules with all cell containers holding the one and only container of a new plain of life
      let count = 0
      for (const container of rules.initWithCellContainers as unknown as CellContainers<TestRules>) {
        count++
        expect(container as unknown as CellContainer<TestRules>).toBe(firstCellContainer)
      }
      expect(count).toBe(1)
    })

    it('creates family tree', () => {
      expect(familyTree).toBeInstanceOf(FamilyTree)
    })

    it('creates plain correctly', () => {
      expect(plain).toBeInstanceOf(Plain)
      expect(plain.width).toBe(plainWidth)
      expect(plain.height).toBe(plainHeight)
      expect(rules.createNewFieldRecord()).toEqual(plain.getAt(0, 0).fieldRecord) // Field records are created correctly by rules.createNewFieldRecord()
    })

    it('sets up first cell container correctly with seed cell', () => {
      expect(firstCellContainer).toBeInstanceOf(CellContainer)
      expect(seedCell).toBeInstanceOf(TestCell)
      expect(seedCell.initSeedCellPassed).toBeTrue()
      /* eslint-disable @typescript-eslint/no-explicit-any*/
      expect(plain).toBe((firstCellContainer as any).plain)
      expect(rules).toBe((firstCellContainer as any).cellRecordFactory)
      /* eslint-enable @typescript-eslint/no-explicit-any*/
      expect(firstCellContainer.next).toBe(firstCellContainer)
    })

    it('places seed cell as expected on plain', () => {
      const posX = Math.floor(plainWidth / 2)
      const posY = Math.floor(plainHeight / 2)
      expect((plain.getAt(posX, posY).getCellContainers()[0] as unknown as { cell: Cell }).cell).toBe(seedCell)
    })
  })

  describe('getter for plain width and height', () => {
    beforeAll(createPlainOfLife)

    it('return correct results', () => {
      expect(plainOfLife.plainWidth).toBe(plainWidth)
      expect(plainOfLife.plainHeight).toBe(plainHeight)
    })
  })

  describe('executeTurn', () => {
    describe('if not game over (if there are alive cells)', () => {
      beforeAll(() => createPlainOfLifeAndExecuteTurn(false))

      it('increases the current turn and returns true', () => {
        expect(executeTurnResult).toBeTrue()
        expect(plainOfLife.currentTurn).toBe(1n)
      })

      it('calls executeTurn of rules as expected', () => {
        expect(rules.executeTurn).toHaveBeenCalledOnceWith(0n, plain, cellContainers as CellContainers<TestRules>)
      })

      it('updates the family tree', () => {
        expect(familyTree.update).toHaveBeenCalledOnceWith(cellContainers as CellContainers<TestRules>)
      })
    })
    describe('if game over (if there are no alive cells left)', () => {
      beforeAll(() => createPlainOfLifeAndExecuteTurn(true))

      it('does not increases the current turn and returns false', () => {
        expect(executeTurnResult).toBeFalse()
        expect(plainOfLife.currentTurn).toBe(0n)
      })

      it('does not call executeTurn of rules', () => {
        expect(rules.executeTurn).not.toHaveBeenCalled()
      })

      it('does not updates the family tree', () => {
        expect(familyTree.update).not.toHaveBeenCalled()
      })
    })
  })

  describe('toSerializable()', () => {
    beforeAll(plainOfLifeToSerializable)

    it('converts current turn to string', () => {
      expect(serializable.currentTurn).toBe(plainOfLife.currentTurn.toString())
    })

    it('copies plain width and height', () => {
      expect(serializable.plainWidth).toBe(plainOfLife.plainWidth)
      expect(serializable.plainHeight).toBe(plainOfLife.plainHeight)
    })

    it('fills rules name and converts rules', () => {
      expect(serializable.rulesName).toBe('TestRules')
      expect(serializable.rules).toEqual(rules.toSerializable())
    })

    it('converts family trey', () => {
      expect(serializable.familyTree).toEqual(familyTree.toSerializable())
    })

    it('converts all field records', () => {
      expect(serializable.fieldRecords.length).toBe(plainWidth * plainHeight)
      expect(serializable.fieldRecords[0]).toEqual(
        rules.fieldRecordToSerializable(plain.getAtInt(0, 0).fieldRecord, [])
      )
    })

    it('converts all cell records', () => {
      expect(serializable.cellRecords.length).toBe(2) // Seed cell + 1 child after first turn execution
      expect(serializable.cellRecords[1]).toEqual(rules.cellRecordToSerializable(firstCellContainer.cellRecord, [])) // [1] as after executeTurn the child is the new first cell container and the parent has the index [1]
    })
  })

  describe('createFromSerializable() with not registered rule constructor', () => {
    it('throws an error', () => {
      plainOfLifeToSerializable()
      spyOn(cellNames, 'getConstructor').and.returnValue(TestCell)
      expect(() => PlainOfLife.createFromSerializable(serializable)).toThrowError(Error)
    })
  })

  describe('createFromSerializable()', () => {
    beforeAll(plainOfLifeFromSerializable)

    it('fills current turn', () => {
      expect(fromSerializable.currentTurn).toBe(plainOfLife.currentTurn)
    })

    it('inits rules', () => {
      expect(fromSerializableRules).toBeInstanceOf(TestRules)
      expect(fromSerializableRules.initFromSerializablePassed).toBeTrue()
    })

    it('creates family tree', () => {
      expect(fromSerializableFamilyTree).toBeInstanceOf(FamilyTree)
    })
  })

  function createPlainOfLife(): void {
    plainOfLife = PlainOfLife.createNew(plainWidth, plainHeight, TestRules, TestCell)
    /* eslint-disable @typescript-eslint/no-explicit-any*/
    firstCellContainer = (plainOfLife as any).firstCellContainer.first
    seedCell = (firstCellContainer as any).cell
    rules = (plainOfLife as any).rules
    plain = (plainOfLife as any).plain
    familyTree = (plainOfLife as any).familyTree
    /* eslint-enable @typescript-eslint/no-explicit-any*/
  }

  function createPlainOfLifeAndExecuteTurn(enforceGameOver: boolean): void {
    createPlainOfLife()
    cellContainers = (
      plainOfLife as unknown as { getCellContainers(): CellContainers<TestRules> | null }
    ).getCellContainers()
    if (enforceGameOver) {
      for (const container of cellContainers as CellContainers<TestRules>) {
        container.die()
      }
    }
    spyOn(rules, 'executeTurn').and.callThrough()
    spyOn(familyTree, 'update')
    executeTurnResult = plainOfLife.executeTurn()
  }

  function plainOfLifeToSerializable() {
    createPlainOfLifeAndExecuteTurn(false)
    spyOn(ruleNames, 'getName').and.returnValue('TestRules')
    spyOn(cellNames, 'getName').and.returnValue('TestCell')
    serializable = plainOfLife.toSerializable()
  }

  function plainOfLifeFromSerializable() {
    plainOfLifeToSerializable()
    spyOn(ruleNames, 'getConstructor').and.returnValue(TestRules)
    spyOn(cellNames, 'getConstructor').and.returnValue(TestCell)
    fromSerializable = PlainOfLife.createFromSerializable(serializable)
    fromSerializableRules = (fromSerializable as unknown as { rules: TestRules }).rules
    fromSerializableFamilyTree = (fromSerializable as unknown as { familyTree: FamilyTree<TestRules> }).familyTree
  }
})
