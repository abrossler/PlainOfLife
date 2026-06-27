import { Cell } from '../core/cell'
import { Name2ConstructorMap } from '../util/name_2_constructor_map'
import { RawAssembler } from './raw_assembler'
import { ClaudeAssembler } from './claude_assembler'

/**
 * Any class extending {@link Cell} must register a unique readable cell name mapped to the cell constructor here to work
 * properly in a Plain of Life.
 *
 * This is e.g. necessary for serialization and de-serialization
 */
export const cellNames: Name2ConstructorMap<new () => Cell> = new Name2ConstructorMap([
  ['Raw Assembler', RawAssembler],
  ['Claude Assembler', ClaudeAssembler]
] as [string, new () => Cell][])
