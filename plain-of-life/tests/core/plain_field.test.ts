import { CellContainer } from '../../src/core/cell_container'
import { Plain } from '../../src/core/plain'
import { PlainField } from '../../src/core/plain_field'
import { TestRuleExtensionFactory } from '../stubs/test_rule_extension_factory'

describe('Plain Field', () => {
  const plainSize = 2
  const ruleExtensionFactory = new TestRuleExtensionFactory()
  let plain: Plain<TestRuleExtensionFactory>
  let cellContainers: CellContainer<TestRuleExtensionFactory>[]
  let initialPlainField: PlainField<TestRuleExtensionFactory>
  let plainFieldWithContainers: PlainField<TestRuleExtensionFactory>

  beforeEach(() => {
    plain = new Plain(ruleExtensionFactory, plainSize, plainSize)
    cellContainers = [
      new CellContainer(ruleExtensionFactory, plain),
      new CellContainer(ruleExtensionFactory, plain),
      new CellContainer(ruleExtensionFactory, plain)
    ]
    initialPlainField = plain.getAtInt(0, 0)
    plainFieldWithContainers = plain.getAtInt(1, 1)
    plainFieldWithContainers.addCellContainer(cellContainers[0])
    plainFieldWithContainers.addCellContainer(cellContainers[1])
    plainFieldWithContainers.addCellContainer(cellContainers[2])
  })
  it('construction inits properties correctly', () => {
    expect(initialPlainField.fieldRecord.recordId).toBeGreaterThan(0)
    expect(initialPlainField.getCellContainers().length).toBe(0)
  })

  it('adds and gets cell containers correctly', () => {
    expect(plainFieldWithContainers.getCellContainers().length).toBe(3)
    expect(plainFieldWithContainers.getCellContainers()[0]).toBe(cellContainers[0])
    expect(plainFieldWithContainers.getCellContainers()[1]).toBe(cellContainers[1])
    expect(plainFieldWithContainers.getCellContainers()[2]).toBe(cellContainers[2])
  })

  it('removes cell containers correctly', () => {
    // Remove container in the middle
    plainFieldWithContainers.removeCellContainer(cellContainers[1])
    expect(plainFieldWithContainers.getCellContainers().length).toBe(2)
    expect(plainFieldWithContainers.getCellContainers()[0]).toBe(cellContainers[0])
    expect(plainFieldWithContainers.getCellContainers()[1]).toBe(cellContainers[2])

    // Remove first cell container
    plainFieldWithContainers.removeCellContainer(cellContainers[0])
    expect(plainFieldWithContainers.getCellContainers().length).toBe(1)
    expect(plainFieldWithContainers.getCellContainers()[0]).toBe(cellContainers[2])

    // Remove last cell container
    plainFieldWithContainers.removeCellContainer(cellContainers[2])
    expect(plainFieldWithContainers.getCellContainers().length).toBe(0)
  })

  it('throws an error if trying to remove a container not included in cell containers', () => {
    expect(() =>
      plainFieldWithContainers.removeCellContainer(new CellContainer(ruleExtensionFactory, plain))
    ).toThrowError(Error)
  })
})
