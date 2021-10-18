import { TestRules } from '../stubs/test_rules'
import { ExtPlainOfLife, PlainOfLife } from '../../src/core/plain_of_life'
import { TestCell } from '../stubs/test_cell'
import { FamilyTree } from '../../src/core/family_tree'

describe('Plain of life', () => {

  describe('createNew', () => {
    {
        let plainOfLife: ExtPlainOfLife<TestRules>

        beforeAll(() => {
          plainOfLife = PlainOfLife.createNew(3, 3, TestRules, TestCell)
        })

      it('creates a plain of life instance', () => {
        expect(plainOfLife).toBeInstanceOf(PlainOfLife)
      })
      it('creates rules', () => {
        expect((plainOfLife as any).rules).toBeInstanceOf(TestRules)
      })

      it('creates family tree', () => {
        expect((plainOfLife as any).familyTree).toBeInstanceOf(FamilyTree)
      })
    }
  })
})
