import { encode } from 'base64-arraybuffer'
import { TestCell } from 'src/test_stubs/test_cell'
import { TestRuleExtensionFactory } from 'src/test_stubs/test_rule_extension_factory'
import { CellContainer, CellContainers } from './cell_container'
import { FamilyTree } from './family_tree'
import { Plain } from './plain'
import { SerializableFamilyTree } from './serializable_plain_of_life'

describe('Family Tree', () => {
  const familyTreeWidth = 4
  const familyTreeHeight = 3
  let familyTree: FamilyTree
  let serializableFamilyTree: SerializableFamilyTree

  beforeEach(() => {
    familyTree = new FamilyTree()
  })

  describe('construction and initNew', () => {
    it('sets the size correctly', () => {
      familyTree.initNew(familyTreeWidth, familyTreeHeight)
      expect(familyTree.width).toBe(familyTreeWidth)
      expect(familyTree.height).toBe(familyTreeHeight)
    })

    it('checks the size and throws errors if size is not OK', () => {
      expect(() => familyTree.initNew(2, familyTreeHeight)).toThrowError()
      expect(() => familyTree.initNew(familyTreeWidth, -123)).toThrowError()
      expect(() => familyTree.initNew(familyTreeWidth, 6.1)).toThrowError()
    })

    it('inits the scale names and creates the images', () => {
      familyTree.initNew(familyTreeWidth, familyTreeHeight)
      expect(familyTree.getScales().length).toBeGreaterThan(1)
      for (const name of familyTree.getScales()) {
        expect(familyTree.getImage(name).byteLength).toBe(familyTreeWidth * familyTreeHeight * 4)
      }
    })
  })

  describe('toSerializable', () => {
    beforeEach(() => {
      familyTree.initNew(familyTreeWidth, familyTreeHeight)
      serializableFamilyTree = familyTree.toSerializable()
    })
    it('serializes size correctly', () => {
      expect(serializableFamilyTree.width).toBe(familyTreeWidth)
      expect(serializableFamilyTree.height).toBe(familyTreeHeight)
    })
    it('serializes images correctly', () => {
      expect(serializableFamilyTree.images[0]).toEqual(encode(familyTree.getImage(familyTree.getScales()[0])))
      expect(serializableFamilyTree.images.length).toBe(familyTree.getScales().length)
    })
  })

  describe('initFromSerializable', () => {
    let deserializedFamilyTree: FamilyTree
    beforeEach(() => {
      familyTree.initNew(familyTreeWidth, familyTreeHeight)
      serializableFamilyTree = familyTree.toSerializable()
      deserializedFamilyTree = new FamilyTree()
    })

    it('de-serializes size correctly', () => {
      deserializedFamilyTree.initFromSerializable(serializableFamilyTree)
      expect(deserializedFamilyTree.width).toBe(familyTreeWidth)
      expect(deserializedFamilyTree.height).toBe(familyTreeHeight)
    })

    it('checks the size and throws errors if size is not OK', () => {
      serializableFamilyTree.height = 2
      expect(() => deserializedFamilyTree.initFromSerializable(serializableFamilyTree)).toThrowError()
    })

    it('de-serializes images correctly', () => {
      deserializedFamilyTree.initFromSerializable(serializableFamilyTree)
      for (let i = 0; i < familyTree.getScales().length; i++) {
        expect(deserializedFamilyTree.getImage(familyTree.getScales()[0])).toEqual(
          familyTree.getImage(familyTree.getScales()[0])
        )
      }
    })
  })

  describe('width and height', () => {
    beforeEach(() => {
      familyTree.initNew(familyTreeWidth, familyTreeHeight)
    })
    it('return correct results', () => {
      expect(familyTree.width).toBe(familyTreeWidth)
      expect(familyTree.height).toBe(familyTreeHeight)
    })
  })

  describe('getInitialCellContainerPositions', () => {
    beforeEach(() => {
      familyTree.initNew(familyTreeWidth, familyTreeHeight)
    })
    it('returns initial position for each scale', () => {
      const positions = familyTree.getInitialCellContainerPositions()
      expect(positions.length).toBe(familyTree.getScales().length)
      for (const pos of positions) {
        expect(pos).toBe((familyTree.height - 1) / 2)
      }
    })
  })

  // Only some spot checks on update - the exact formula is a heuristic that only can be checked by the visual result
  describe('update', () => {
    const plainSize = 2
    const ruleExtensionFactory = new TestRuleExtensionFactory()
    let plain: Plain<TestRuleExtensionFactory>
    let cellContainer: CellContainer<TestRuleExtensionFactory>
    let seedCell: TestCell
    let firstCellContainer: { first: CellContainer<TestRuleExtensionFactory> }

    beforeEach(() => {
      familyTree.initNew(familyTreeWidth, familyTreeHeight)
      plain = new Plain(ruleExtensionFactory, plainSize, plainSize)
      cellContainer = new CellContainer(ruleExtensionFactory, plain)
      firstCellContainer = { first: cellContainer }
      seedCell = new TestCell()
      cellContainer.initSeedCellContainer(
        seedCell,
        1,
        1,
        firstCellContainer,
        familyTree.getInitialCellContainerPositions()
      )
      familyTree.update(new CellContainers(firstCellContainer), 1, 0n)
    })

    it('does not change the initial position in the family tree if there is nothing to change after turn 0', () => {
      expect(cellContainer.positionsInFamilyTree).toEqual(familyTree.getInitialCellContainerPositions())
    })

    it('updates all images after turn 0', () => {
      for (const scale of familyTree.getScales()) {
        expect(familyTree.getImage(scale)[3]).not.toBe(0) // Spot check on alpha value of top pixel
      }
      expect(cellContainer.positionsInFamilyTree).toEqual(familyTree.getInitialCellContainerPositions())
    })

    it('updates the positions in the family tree in subsequent turns and keeps order of the cells', () => {
      for (let i=0; i<familyTree.getScales().length; i++) {
        const scale = (familyTree as unknown as { scales: number[] }).scales[i]
        firstCellContainer.first.divide(0, 0, 0, 0)
        familyTree.update(new CellContainers(firstCellContainer), i + 2, BigInt(scale))
        let lastPos = -1
        for (const container of new CellContainers(firstCellContainer)) {
          const currentPos = (container as CellContainer<TestRuleExtensionFactory>).positionsInFamilyTree[i]
          expect(currentPos).toBeGreaterThanOrEqual(0)
          expect(currentPos).toBeGreaterThan(lastPos)
          expect(currentPos).toBeLessThanOrEqual(familyTreeHeight - 1)
          lastPos = currentPos
        }
        i++
      }
    })
  })
})
