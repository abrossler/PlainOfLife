import { DemoRules, DemoRules2 } from './demo_rules'
import { Rules } from '../core/rules'
import { RuleExtensionFactory } from '../core/rule_extension_factory'
import { Name2ConstructorMap } from '../util/name_2_constructor_map'
import { WinCoherentAreas } from './win_coherent_areas'

/**
 * Any class extending {@link Rules} must register a unique readable rule name mapped to the rule constructor here to work
 * properly in a Plain of Life.
 *
 * This is e.g. necessary for serialization and de-serialization
 */
export const ruleNames: Name2ConstructorMap<new () => Rules<RuleExtensionFactory>> = new Name2ConstructorMap([
  ['Demo Rules', DemoRules],
  ['Demo Rules 2', DemoRules2],
  ['Win Coherent Areas', WinCoherentAreas]
] as [string, new () => Rules<RuleExtensionFactory>][])
