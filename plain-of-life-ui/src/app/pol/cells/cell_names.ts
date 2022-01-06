import { Cell } from '../core/cell'
import { Name2ConstructorMap } from '../util/name_2_constructor_map'
import { DemoCell, DemoCell2 } from './demo_cell'

/**
 * Any class extending {@link Cell} must register a unique readable cell name mapped to the cell constructor here to work
 * properly in a Plain of Life.
 *
 * This is e.g. necessary for serialization and de-serialization
 */
export const cellNames: Name2ConstructorMap<new () => Cell> = new Name2ConstructorMap([
  ['Demo Cell', DemoCell],
  ['Demo Cell 2', DemoCell2]
])
