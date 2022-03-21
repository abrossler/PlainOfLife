import { TestRules } from '../../../test_stubs/test_rules'
import { ExtPlainOfLife, PlainOfLife } from './plain_of_life'
import { TestCell } from '../../../test_stubs/test_cell'
import { FamilyTree } from './family_tree'
import { Plain } from './plain'
import { CellContainer, CellContainers } from './cell_container'
import { Cell } from './cell'
import { SerializablePlainOfLife } from './serializable_plain_of_life'
import { ruleNames } from '../rules/rules_names'
import { cellNames } from '../cells/cell_names'

describe('Plain of life', () => {
  const plainWidth = 4
  const plainHeight = 3
  const familyTreeWidth = 5
  const familyTreeHeight = 3
  let plainOfLife: ExtPlainOfLife<TestRules>
  let firstCellContainer: CellContainer<TestRules>
  let seedCell: TestCell
  let rules: TestRules
  let plain: Plain<TestRules>
  let familyTree: FamilyTree
  let cellContainers: CellContainers<TestRules> | null
  let executeTurnResult: boolean
  let serializable: SerializablePlainOfLife
  let fromSerializable: ExtPlainOfLife<TestRules>
  let fromSerializableRules: TestRules
  let fromSerializableFamilyTree: FamilyTree

  describe('createNew', () => {
    beforeAll(createPlainOfLife)

    it('creates a plain of life instance with current turn = 0', () => {
      expect(plainOfLife).toBeInstanceOf(PlainOfLife)
      expect(plainOfLife.currentTurn).toBe(0n)
    })
    it('creates and inits rules', () => {
      expect(rules).toBeInstanceOf(TestRules)
      // Check that initNew of the rules was called correctly. The initNew implementation of TestRules sets the temperature to 99...
      expect(plain.getAt(1, 1).fieldRecord.temperature).toBe(99)
    })

    it('creates family tree correctly', () => {
      expect(familyTree).toBeInstanceOf(FamilyTree)
      expect(plainOfLife.familyTreeWidth).toBe(familyTreeWidth)
      expect(plainOfLife.familyTreeHeight).toBe(familyTreeHeight)
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
      // Check that initSeedCell was called correctly by checking if recommendedOutput was initialized
      expect(seedCell.recommendedOutput.length).toBeGreaterThan(0)
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

  describe('getRulesName', () => {
    beforeAll(createPlainOfLife)

    it('returns the rules name correctly and throws an exception if there is no rule name', () => {
      const expectedName = 'estRules'
      expect(() => plainOfLife.getRulesName()).toThrowError()
      spyOn(ruleNames, 'getName').and.returnValue(expectedName)
      expect(plainOfLife.getRulesName()).toBe(expectedName)
    })
  })

  describe('getters for familyTree width and height', () => {
    beforeAll(createPlainOfLife)

    it('return correct results', () => {
      expect(plainOfLife.familyTreeWidth).toBe(familyTreeWidth)
      expect(plainOfLife.familyTreeHeight).toBe(familyTreeHeight)
    })
  })

  describe('executeTurn', () => {
    describe('if not game over (if there are alive cells)', () => {
      beforeAll(() => createPlainOfLifeAndExecuteTurn(false))

      it('increases the current turn and indicates that game is not over', () => {
        expect(executeTurnResult).toBeTrue()
        expect(plainOfLife.isGameOver).toBeFalse()
        expect(plainOfLife.currentTurn).toBe(1n)
      })

      it('calls executeTurn of rules as expected', () => {
        expect(rules.executeTurn).toHaveBeenCalledOnceWith(plain, cellContainers as CellContainers<TestRules>, 0n)
      })

      it('Keeps the number of cells up to date', () => {
        expect(plainOfLife.cellCount).toBe(2)
      })

      it('updates the family tree', () => {
        expect(familyTree.update).toHaveBeenCalledOnceWith(
          cellContainers as CellContainers<TestRules>,
          plainOfLife.cellCount,
          plainOfLife.currentTurn - 1n
        )
      })
    })
    describe('if game over (if there are no alive cells left)', () => {
      beforeAll(() => createPlainOfLifeAndExecuteTurn(true))

      it('does not increases the current turn and indicates that game is over', () => {
        expect(executeTurnResult).toBeFalse()
        expect(plainOfLife.isGameOver).toBeTrue()
        expect(plainOfLife.cellCount).toBe(0)
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
    beforeAll(plainOfLifeToSerializable)

    it('throws an error', () => {
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
      // Check that initFromSerializable was called for the rules: If called, initial season 'Summer' shall be replaced by season 'Winter' from serialized rules
      expect(fromSerializableRules.season).toBe('Winter')
    })

    it('Restores the number of cells', () => {
      expect(plainOfLife.cellCount).toBe(2)
    })

    it('creates family tree', () => {
      expect(fromSerializableFamilyTree).toBeInstanceOf(FamilyTree)
      expect(fromSerializableFamilyTree.height).toEqual(familyTree.height) // Just a spot check for one property
    })
  })

  describe('getFamilyTreeImage', () => {
    beforeAll(createPlainOfLife)

    it('gets the family tree image for the given scale', () => {
      expect(plainOfLife.getFamilyTreeImage('No valid scale')).toBeUndefined()
      const familyTree = (plainOfLife as unknown as { familyTree: FamilyTree }).familyTree
      spyOn(familyTree, 'getImage').and.callThrough()
      for (const scale of plainOfLife.getFamilyTreeScales()) {
        const image = plainOfLife.getFamilyTreeImage(scale)
        expect(image.byteLength).toBeGreaterThan(0)
      }
      expect(familyTree.getImage).toHaveBeenCalledTimes(plainOfLife.getFamilyTreeScales().length)
    })
  })

  describe('getFamilyTreeScales', () => {
    beforeAll(createPlainOfLife)

    it('gets the available scales', () => {
      const familyTree = (plainOfLife as unknown as { familyTree: FamilyTree }).familyTree
      spyOn(familyTree, 'getScales').and.callThrough()
      const scales = plainOfLife.getFamilyTreeScales()
      expect(scales.length).toBeGreaterThan(0)
      expect(familyTree.getScales).toHaveBeenCalledTimes(1)
    })
  })

  /**
   * Create a plain of life and get the most common (private) properties
   */
  function createPlainOfLife(): void {
    plainOfLife = PlainOfLife.createNew(plainWidth, plainHeight, TestRules, TestCell, familyTreeWidth, familyTreeHeight)
    /* eslint-disable @typescript-eslint/no-explicit-any*/
    firstCellContainer = (plainOfLife as any).firstCellContainer.first
    seedCell = (firstCellContainer as any).cell
    rules = (plainOfLife as any).rules
    plain = (plainOfLife as any).plain
    familyTree = (plainOfLife as any).familyTree
    /* eslint-enable @typescript-eslint/no-explicit-any*/
  }

  /**
   * Create a plain of life and execute the first turn
   * @param enforceGameOver enforces the game to end if set by letting all cells die before executing the turn
   */
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
    spyOn(familyTree, 'update').and.callThrough()
    executeTurnResult = plainOfLife.executeTurn()
  }

  /**
   * Create a serializable plain of life from a plain after executing one turn
   */
  function plainOfLifeToSerializable() {
    createPlainOfLifeAndExecuteTurn(false)
    spyOn(ruleNames, 'getName').and.returnValue('TestRules')
    spyOn(cellNames, 'getName').and.returnValue('TestCell')
    serializable = plainOfLife.toSerializable()
  }

  /**
   * Create a plain of life from a previously created serializable plain of life
   */
  function plainOfLifeFromSerializable() {
    plainOfLifeToSerializable()
    spyOn(ruleNames, 'getConstructor').and.returnValue(TestRules)
    spyOn(cellNames, 'getConstructor').and.returnValue(TestCell)
    fromSerializable = PlainOfLife.createFromSerializable(serializable)
    fromSerializableRules = (fromSerializable as unknown as { rules: TestRules }).rules
    fromSerializableFamilyTree = (fromSerializable as unknown as { familyTree: FamilyTree }).familyTree
  }
})
