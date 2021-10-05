import { DemoCell, DemoCell2 } from './demo_cell'
import { Cell } from '../core/cell'

/**
 * Any class extending {@link Cell} most register a unique readable cell name mapped to the cell constructor here to work
 * properly in a Plain of Life.
 *
 * This is e.g. necessary for serialization and de-serialization
 */
const cellNamesAndConstructors: [string, CellConstructor][] = [
  ['Demo Cell', DemoCell],
  ['Demo Cell 2', DemoCell2]
]

const nameIndex = 0
const constructorIndex = 1
type CellConstructor = new () => Cell

/**
 * Get the names of all implemented Plain of Life cell types
 */
export function getCellTypeNames(): string[] {
  return cellNamesAndConstructors.map((_) => _[nameIndex])
}

/**
 * Get the constructor of a Plain of Life cell class by the cell type name
 */
export function getCellConstructor(name: string): undefined | CellConstructor {
  const nameAndConstructor = cellNamesAndConstructors.find((_) => _[nameIndex] === name)
  if (nameAndConstructor) {
    return nameAndConstructor[constructorIndex]
  }
  return undefined
}

/**
 * Get the name of a Plain of Life cell type by the cell class constructor
 */
export function getCellTypeName(constructor: CellConstructor): undefined | string {
  const nameAndConstructor = cellNamesAndConstructors.find((_) => _[constructorIndex] === constructor)
  if (nameAndConstructor) {
    return nameAndConstructor[nameIndex]
  }
  return undefined
}
