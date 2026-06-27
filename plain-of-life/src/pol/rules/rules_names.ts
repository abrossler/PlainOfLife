import { Rules } from '../core/rules'
import { type RuleExtensionFactory } from '../core/rule_extension_factory'
import { Name2ConstructorMap } from '../util/name_2_constructor_map'
import { WinCoherentAreas } from './win_coherent_areas'
import { ClimateAndChemistry } from './claude_rules'

/**
 * Any class extending {@link Rules} must register a unique readable rule name mapped to the rule constructor here to work
 * properly in a Plain of Life.
 *
 * This is e.g. necessary for serialization and de-serialization
 */
export const ruleNames: Name2ConstructorMap<new () => Rules<RuleExtensionFactory>> = new Name2ConstructorMap([
  ['Win Coherent Areas', WinCoherentAreas],
  ['Climate And Chemistry', ClimateAndChemistry]
] as [string, new () => Rules<RuleExtensionFactory>][])
