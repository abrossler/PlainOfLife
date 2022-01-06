import { CellContainer, ExtCellContainer } from '../../../../src/app/pol/core/cell_container'
import { defaultSerialization } from '../../../../src/app/pol/core/default_serialization'
import { Plain } from '../../../../src/app/pol/core/plain'
import {
  RecordWithCellContainer,
  TestRuleExtensionFactoryWithCellContainer
} from '../stubs/test_rule_extension_factory'

describe('Default serialization', () => {
  let ruleExtensionFactory: TestRuleExtensionFactoryWithCellContainer
  let plain: Plain<TestRuleExtensionFactoryWithCellContainer>
  let cellContainer1: CellContainer<TestRuleExtensionFactoryWithCellContainer>
  let cellContainer2: CellContainer<TestRuleExtensionFactoryWithCellContainer>
  let cellContainer3: CellContainer<TestRuleExtensionFactoryWithCellContainer>
  let allCellContainers: ExtCellContainer<TestRuleExtensionFactoryWithCellContainer>[]
  let objectWithCellContainer: RecordWithCellContainer

  beforeAll(() => {
    ruleExtensionFactory = new TestRuleExtensionFactoryWithCellContainer()
    plain = new Plain(ruleExtensionFactory, 2, 2)
    cellContainer1 = new CellContainer(ruleExtensionFactory, plain)
    cellContainer2 = new CellContainer(ruleExtensionFactory, plain)
    cellContainer3 = new CellContainer(ruleExtensionFactory, plain)
  })

  beforeEach(() => {
    allCellContainers = []
    objectWithCellContainer = ruleExtensionFactory.createNewCellRecord()
    objectWithCellContainer.cellContainer1 = cellContainer1
    objectWithCellContainer.cellContainer2 = cellContainer2
  })

  describe('toSerializable', () => {
    {
      const object = { a: 'A', b: { ba: 'BA', bb: 'BB' } }
      const serializable = defaultSerialization.toSerializable(object)
      it('creates copy of object', () => {
        expect(serializable).toEqual(object)
      })
      it('copy of object is really deep', () => {
        expect(serializable).not.toBe(object)
        expect(serializable.b).not.toBe(object.b)
      })
    }

    it('replaces cell containers with index', () => {
      const serializable = defaultSerialization.toSerializable(objectWithCellContainer, allCellContainers)
      expect(serializable['cellContainer1' + defaultSerialization.getCellContainerSuffix()]).toBe(0)
      expect(serializable['cellContainer2' + defaultSerialization.getCellContainerSuffix()]).toBe(1)
    })

    it('ignores cell containers that are null', () => {
      objectWithCellContainer.cellContainer1 = null
      const serializable = defaultSerialization.toSerializable(objectWithCellContainer, allCellContainers)
      expect(serializable['cellContainer1' + defaultSerialization.getCellContainerSuffix()]).toBeUndefined()
      expect(serializable['cellContainer2' + defaultSerialization.getCellContainerSuffix()]).toBe(0)
    })

    it('adds new cell container to allCellContainers', () => {
      defaultSerialization.toSerializable(objectWithCellContainer, allCellContainers)
      expect(allCellContainers[0]).toBe(cellContainer1)
      expect(allCellContainers[1]).toBe(cellContainer2)
    })

    it('finds and uses existing cell container in all cell containers', () => {
      allCellContainers.push(cellContainer1)
      allCellContainers.push(cellContainer3)
      allCellContainers.push(cellContainer2)
      const serializable = defaultSerialization.toSerializable(objectWithCellContainer, allCellContainers)
      expect(serializable['cellContainer1' + defaultSerialization.getCellContainerSuffix()]).toBe(0)
      expect(serializable['cellContainer2' + defaultSerialization.getCellContainerSuffix()]).toBe(2) // Not 1 as at index 1 cellContainer3 was inserted
    })

    it('does not append a cell container to all cell containers a second time', () => {
      allCellContainers.push(cellContainer2)
      const serializable = defaultSerialization.toSerializable(objectWithCellContainer, allCellContainers)
      expect(allCellContainers.length).toBe(2) // Container2 was already pushed to all containers and Container 1 was added by defaultSerialization
      expect(serializable['cellContainer1' + defaultSerialization.getCellContainerSuffix()]).toBe(1) // 1 (and not 0) as Container1 was added after Container2
    })

    it('does not change the object to serialize', () => {
      const objectWithCellContainer2 = ruleExtensionFactory.createNewCellRecord()
      objectWithCellContainer2.cellContainer1 = cellContainer1
      objectWithCellContainer2.cellContainer2 = cellContainer2
      defaultSerialization.toSerializable(objectWithCellContainer, allCellContainers)
      expect(objectWithCellContainer).toEqual(objectWithCellContainer2)
    })
  })

  describe('defaultFromSerializable', () => {
    {
      const serializable = { a: 'A', b: { ba: 'BA', bb: 'BB' } }
      const object = defaultSerialization.fromSerializable(serializable)
      it('creates deep copy of serializable', () => {
        expect(object).toEqual(serializable)
      })
      it('copy of serializable is really deep', () => {
        expect(object).not.toBe(serializable)
        expect(object.b).not.toBe(serializable.b)
      })

      it('reverts defaultToSerializable', () => {
        const serializable = defaultSerialization.toSerializable(objectWithCellContainer, allCellContainers)
        const objectFromSerializable = defaultSerialization.fromSerializable(serializable, allCellContainers)
        expect(objectFromSerializable).toEqual(objectWithCellContainer)
      })

      it('throws syntax error if cell container index is out of bounds', () => {
        const serializable = defaultSerialization.toSerializable(objectWithCellContainer, allCellContainers)
        allCellContainers.shift() // Invalidate allCellContainers so that we can't find one of the containers
        expect(() => defaultSerialization.fromSerializable(serializable, allCellContainers)).toThrowError(SyntaxError)
      })

      it('throws syntax error if cell container index is not an integer', () => {
        const serializable = defaultSerialization.toSerializable(objectWithCellContainer, allCellContainers)
        serializable['cellContainer2' + defaultSerialization.getCellContainerSuffix()] = 1.2
        expect(() => defaultSerialization.fromSerializable(serializable, allCellContainers)).toThrowError(SyntaxError)
      })
    }
  })
})
