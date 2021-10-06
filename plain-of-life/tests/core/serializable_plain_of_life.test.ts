import { CellContainer, ExtCellContainer } from '../../src/core/cell_container'
import { Plain } from '../../src/core/plain'
import {
  defaultFromSerializable,
  defaultToSerializable,
  getCellContainerSuffix
} from '../../src/core/serializable_plain_of_life'
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
})

describe('defaultToSerializable', () => {
  {
    const object = { a: 'A', b: { ba: 'BA', bb: 'BB' } }
    const serializable = defaultToSerializable(object)
    test('creates deep copy of object', () => {
      expect(serializable).toStrictEqual(object)
    })
    test('does not return identical object', () => {
      expect(serializable).not.toBe(object)
    })
  }

  test('replaces cell containers with index', () => {
    objectWithCellContainer.cellContainer1 = cellContainer1
    objectWithCellContainer.cellContainer2 = cellContainer2
    const serializable = defaultToSerializable(objectWithCellContainer, allCellContainers)
    expect(serializable['cellContainer1' + getCellContainerSuffix()]).toBe(0)
    expect(serializable['cellContainer2' + getCellContainerSuffix()]).toBe(1)
  })

  test('adds new cell container to allCellContainers', () => {
    objectWithCellContainer.cellContainer1 = cellContainer1
    objectWithCellContainer.cellContainer2 = cellContainer2
    defaultToSerializable(objectWithCellContainer, allCellContainers)
    expect(allCellContainers[0]).toBe(cellContainer1)
    expect(allCellContainers[1]).toBe(cellContainer2)
  })

  test('finds and uses existing cell container in all cell containers', () => {
    objectWithCellContainer.cellContainer1 = cellContainer1
    objectWithCellContainer.cellContainer2 = cellContainer2
    allCellContainers.push(cellContainer1)
    allCellContainers.push(cellContainer2)
    allCellContainers.push(cellContainer3)
    const serializable = defaultToSerializable(objectWithCellContainer, allCellContainers)
    expect(serializable['cellContainer1' + getCellContainerSuffix()]).toBe(0)
    expect(serializable['cellContainer2' + getCellContainerSuffix()]).toBe(1)
  })

  test('does not append a cell container to all cell containers a second time', () => {
    objectWithCellContainer.cellContainer1 = cellContainer1
    objectWithCellContainer.cellContainer2 = cellContainer2
    allCellContainers.push(cellContainer1)
    allCellContainers.push(cellContainer2)
    defaultToSerializable(objectWithCellContainer, allCellContainers)
    expect(allCellContainers.length).toBe(2)
  })

  test('does not change the object to serialize', () => {
    const objectWithCellContainer2 = ruleExtensionFactory.createNewCellRecord()
    objectWithCellContainer.cellContainer1 = cellContainer1
    objectWithCellContainer2.cellContainer1 = cellContainer1
    defaultToSerializable(objectWithCellContainer, allCellContainers)
    expect(objectWithCellContainer).toStrictEqual(objectWithCellContainer2)
  })
})

describe('defaultFromSerializable', () => {
  {
    const serializable = { a: 'A', b: { ba: 'BA', bb: 'BB' } }
    const object = defaultFromSerializable(serializable)
    test('creates deep copy of serializable', () => {
      expect(object).toStrictEqual(serializable)
    })
    test('does not return identical serializable', () => {
      expect(object).not.toBe(serializable)
    })

    test('reverts defaultToSerializable', () => {
      objectWithCellContainer.cellContainer1 = cellContainer1
      objectWithCellContainer.cellContainer2 = cellContainer2
      const serializable = defaultToSerializable(objectWithCellContainer, allCellContainers)
      const objectFromSerializable = defaultFromSerializable(serializable, allCellContainers)
      expect(objectFromSerializable).toStrictEqual(objectWithCellContainer)
    })

    test('throws syntax error if cell container index is out of bounds', () => {
      objectWithCellContainer.cellContainer1 = cellContainer1
      objectWithCellContainer.cellContainer2 = cellContainer2
      const serializable = defaultToSerializable(objectWithCellContainer, allCellContainers)
      allCellContainers.shift() // Invalidate allCellContainers so that we can't find one container
      expect(() => defaultFromSerializable(serializable, allCellContainers)).toThrow(SyntaxError)
    })

    test('throws syntax error if cell container index is not an integer', () => {
      objectWithCellContainer.cellContainer1 = cellContainer1
      objectWithCellContainer.cellContainer2 = cellContainer2
      const serializable = defaultToSerializable(objectWithCellContainer, allCellContainers)
      serializable['cellContainer2' + getCellContainerSuffix()] = 1.2
      expect(() => defaultFromSerializable(serializable, allCellContainers)).toThrow(SyntaxError)
    })
  }
})
