import { DemoRules, DemoRules2 } from './demo_rules'
import { ExtensionProvider, Rules } from '../core/rules'
import { Cell } from '../core/cell'
import { SerializablePlainOfLife } from '../core/serializable_plain_of_life'

/**
 * Any class extending {@link Rules} most register a unique readable rule name mapped to the rule constructor here to work
 * properly in a Plain of Life.
 *
 * This is e.g. necessary for serialization and de-serialization
 */
const ruleNamesAndConstructors: [string, RuleConstructor][] = [
  ['Demo Rules', DemoRules],
  ['Demo Rules 2', DemoRules2],
]

const nameIndex = 0
const constructorIndex = 1
type RuleConstructor = new () => Rules<any>

/**
 * Get the names of all implemented Plain of Life rules
 */
export function getRuleNames(): string[] {
  return ruleNamesAndConstructors.map((_) => _[nameIndex])
}

/**
 * Get the constructor of a Plain of Life rule set by the rules name
 */
export function getRuleConstructor(name: string): undefined | RuleConstructor {
  const nameAndConstructor = ruleNamesAndConstructors.find((_) => _[nameIndex] === name)
  if (nameAndConstructor) {
    return nameAndConstructor[constructorIndex]
  }
  return undefined
}

/**
 * Get the name of a Plain of Life rule set by the rules constructor
 */
export function getRuleName(constructor: RuleConstructor): undefined | string {
  const nameAndConstructor = ruleNamesAndConstructors.find((_) => _[constructorIndex] === constructor)
  if (nameAndConstructor) {
    return nameAndConstructor[nameIndex]
  }
  return undefined
}
