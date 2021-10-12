import { CellContainer, ExtCellContainer } from '../../src/core/cell_container'
import {
  defaultToSerializable,
  getCellContainerSuffix,
  defaultFromSerializable
} from '../../src/core/default_serialization'
import { Plain } from '../../src/core/plain'
import { RecordWithCellContainer, RuleExtensionFactoryWithCellContainer } from '../stubs/rule_extension_factory'

let ruleExtensionFactory: RuleExtensionFactoryWithCellContainer
let plain: Plain<RuleExtensionFactoryWithCellContainer>
let cellContainer1: CellContainer<RuleExtensionFactoryWithCellContainer>
let cellContainer2: CellContainer<RuleExtensionFactoryWithCellContainer>
let cellContainer3: CellContainer<RuleExtensionFactoryWithCellContainer>
let allCellContainers: ExtCellContainer<RuleExtensionFactoryWithCellContainer>[]
let objectWithCellContainer: RecordWithCellContainer

beforeEach(() => {
  ruleExtensionFactory = new RuleExtensionFactoryWithCellContainer()
  plain = new Plain(ruleExtensionFactory, 2, 2)
  cellContainer1 = new CellContainer(ruleExtensionFactory, plain)
  cellContainer2 = new CellContainer(ruleExtensionFactory, plain)
  cellContainer3 = new CellContainer(ruleExtensionFactory, plain)
  allCellContainers = []
  objectWithCellContainer = ruleExtensionFactory.createNewCellRecord()
  objectWithCellContainer.cellContainer1 = cellContainer1
  objectWithCellContainer.cellContainer2 = cellContainer2
})

describe('defaultToSerializable', () => {
  {
    const object = { a: 'A', b: { ba: 'BA', bb: 'BB' } }
    const serializable = defaultToSerializable(object)
    it('creates copy of object', () => {
      expect(serializable).toEqual(object)
    })
    it('copy of object is really deep', () => {
      expect(serializable.b).not.toBe(object.b)
    })
  }

  it('replaces cell containers with index', () => {
    const serializable = defaultToSerializable(objectWithCellContainer, allCellContainers)
    expect(serializable['cellContainer1' + getCellContainerSuffix()]).toBe(0)
    expect(serializable['cellContainer2' + getCellContainerSuffix()]).toBe(1)
  })

  it('adds new cell container to allCellContainers', () => {
    defaultToSerializable(objectWithCellContainer, allCellContainers)
    expect(allCellContainers[0]).toBe(cellContainer1)
    expect(allCellContainers[1]).toBe(cellContainer2)
  })

  it('finds and uses existing cell container in all cell containers', () => {
    allCellContainers.push(cellContainer1)
    allCellContainers.push(cellContainer2)
    allCellContainers.push(cellContainer3)
    const serializable = defaultToSerializable(objectWithCellContainer, allCellContainers)
    expect(serializable['cellContainer1' + getCellContainerSuffix()]).toBe(0)
    expect(serializable['cellContainer2' + getCellContainerSuffix()]).toBe(1)
  })

  it('does not append a cell container to all cell containers a second time', () => {
    allCellContainers.push(cellContainer1)
    allCellContainers.push(cellContainer2)
    defaultToSerializable(objectWithCellContainer, allCellContainers)
    expect(allCellContainers.length).toBe(2)
  })

  it('does not change the object to serialize', () => {
    const objectWithCellContainer2 = ruleExtensionFactory.createNewCellRecord()
    objectWithCellContainer2.cellContainer1 = cellContainer1
    objectWithCellContainer2.cellContainer2 = cellContainer2
    defaultToSerializable(objectWithCellContainer, allCellContainers)
    expect(objectWithCellContainer).toEqual(objectWithCellContainer2)
  })
})

describe('defaultFromSerializable', () => {
  {
    const serializable = { a: 'A', b: { ba: 'BA', bb: 'BB' } }
    const object = defaultFromSerializable(serializable)
    it('creates deep copy of serializable', () => {
      expect(object).toEqual(serializable)
    })
    it('copy of serializable is really deep', () => {
      expect(object.b).not.toBe(serializable.b)
    })

    it('reverts defaultToSerializable', () => {
      objectWithCellContainer.cellContainer1 = cellContainer1
      objectWithCellContainer.cellContainer2 = cellContainer2
      const serializable = defaultToSerializable(objectWithCellContainer, allCellContainers)
      const objectFromSerializable = defaultFromSerializable(serializable, allCellContainers)
      expect(objectFromSerializable).toEqual(objectWithCellContainer)
    })

    it('throws syntax error if cell container index is out of bounds', () => {
      objectWithCellContainer.cellContainer1 = cellContainer1
      objectWithCellContainer.cellContainer2 = cellContainer2
      const serializable = defaultToSerializable(objectWithCellContainer, allCellContainers)
      allCellContainers.shift() // Invalidate allCellContainers so that we can't find one of the containers
      expect(() => defaultFromSerializable(serializable, allCellContainers)).toThrowError(SyntaxError)
    })

    it('throws syntax error if cell container index is not an integer', () => {
      objectWithCellContainer.cellContainer1 = cellContainer1
      objectWithCellContainer.cellContainer2 = cellContainer2
      const serializable = defaultToSerializable(objectWithCellContainer, allCellContainers)
      serializable['cellContainer2' + getCellContainerSuffix()] = 1.2
      expect(() => defaultFromSerializable(serializable, allCellContainers)).toThrowError(SyntaxError)
    })
  }
})
