import { DemoRules, DemoRules2 } from './demo_rules'
import { Rules } from '../core/rules'
import { RuleExtensionFactory } from '../core/rule_extension_factory'

/**
 * Any class extending {@link Rules} most register a unique readable rule name mapped to the rule constructor here to work
 * properly in a Plain of Life.
 *
 * This is e.g. necessary for serialization and de-serialization
 */
const ruleNamesAndConstructors: [string, RuleConstructor][] = [
  ['Demo Rules', DemoRules],
  ['Demo Rules 2', DemoRules2]
]

const nameIndex = 0
const constructorIndex = 1
type RuleConstructor = new () => Rules<RuleExtensionFactory>

/**
 * Mapping of rule names to cell constructors
 */
export const ruleNames = {
  /**
   * Get the names of all implemented Plain of Life rules
   */
  getRuleNames(): string[] {
    return ruleNamesAndConstructors.map((_) => _[nameIndex])
  },

  /**
   * Get the constructor of a Plain of Life rule set by the rules name
   */
  getRuleConstructor(name: string): undefined | RuleConstructor {
    const nameAndConstructor = ruleNamesAndConstructors.find((_) => _[nameIndex] === name)
    if (nameAndConstructor) {
      return nameAndConstructor[constructorIndex]
    }
    return undefined
  },

  /**
   * Get the name of a Plain of Life rule set by the rules constructor
   */
  getRuleName(constructor: RuleConstructor): undefined | string {
    const nameAndConstructor = ruleNamesAndConstructors.find((_) => _[constructorIndex] === constructor)
    if (nameAndConstructor) {
      return nameAndConstructor[nameIndex]
    }
    return undefined
  }
}
