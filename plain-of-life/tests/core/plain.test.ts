import { Plain } from '../../src/core/plain'
import { PlainField } from '../../src/core/plain_field'
import { SimpleRuleExtensionFactory } from '../stubs/rule_extension_factory'

const plainWidth = 3
const plainHeight = 2

const ruleExtensionFactory = new SimpleRuleExtensionFactory()
let plain: Plain<SimpleRuleExtensionFactory>

beforeEach(() => {
  plain = new Plain(ruleExtensionFactory, plainWidth, plainHeight)
})

describe('Plain', () => {
  it('construction inits properties correctly', () => {
    expect(plain.width).toBe(plainWidth)
    expect(plain.height).toBe(plainHeight)
    expect((plain as any).array.length).toBe(plainWidth)
    expect((plain as any).array[0].length).toBe(plainHeight)
    expect((plain as any).array[1].length).toBe(plainHeight)
    expect((plain as any).array[2].length).toBe(plainHeight)
    expect((plain as any).array[0][0]).toBeInstanceOf(PlainField)
  })

  it('getAt and getAtInt get individual plain fields', () => {
    expect(plain.getAt(0,1)).toBe((plain as any).array[0][1])
    expect(plain.getAtInt(0,1)).toBe((plain as any).array[0][1])
  })

  it('has expected torus topography', () => {
    expect(plain.getAt(0+plainWidth,1)).toBe(plain.getAt(0,1))
    expect(plain.getAt(1+2*plainWidth,1)).toBe(plain.getAt(1,1))
    expect(plain.getAt(2+3*plainWidth,1)).toBe(plain.getAt(2,1))

    expect(plain.getAt(0-plainWidth,1)).toBe(plain.getAt(0,1))
    expect(plain.getAt(1-2*plainWidth,1)).toBe(plain.getAt(1,1))
    expect(plain.getAt(2-3*plainWidth,1)).toBe(plain.getAt(2,1))

    expect(plain.getAt(0,0+plainHeight)).toBe(plain.getAt(0,0))
    expect(plain.getAt(0,1+2*plainHeight)).toBe(plain.getAt(0,1))

    expect(plain.getAt(0,0-plainHeight)).toBe(plain.getAt(0,0))
    expect(plain.getAt(0,1-2*plainHeight)).toBe(plain.getAt(0,1))
  })

})