import { FamilyTree } from './family_tree'
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
  })
  describe('initFromSerializable', () => {
    let deserializedFamilyTree: FamilyTree
    beforeEach(() => {
      familyTree.initNew(familyTreeWidth, familyTreeHeight)
      serializableFamilyTree = familyTree.toSerializable()
      deserializedFamilyTree = new FamilyTree()
    })
    it('serializes size correctly', () => {
      deserializedFamilyTree.initFromSerializable(serializableFamilyTree)
      expect(deserializedFamilyTree.width).toBe(familyTreeWidth)
      expect(deserializedFamilyTree.height).toBe(familyTreeHeight)
    })

    it('checks the size and throws errors if size is not OK', () => {
      serializableFamilyTree.height = 2
      expect(() => deserializedFamilyTree.initFromSerializable(serializableFamilyTree)).toThrowError()
    })
  })
})
