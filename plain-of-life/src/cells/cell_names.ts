import { Cell } from '../core/cell'
import { DemoCell, DemoCell2 } from './demo_cell'

type CellConstructor = new () => Cell
const nameIndex = 0
const constructorIndex = 1

/**
 * Mapping of cell names to cell constructors
 */
export class CellNames {
  /**
   * Any class extending {@link Cell} most register a unique readable cell name mapped to the cell constructor here to work
   * properly in a Plain of Life.
   *
   * This is e.g. necessary for serialization and de-serialization
   */
  private static cellNamesAndConstructors: [string, CellConstructor][] = [
    ['Demo Cell', DemoCell],
    ['Demo Cell 2', DemoCell2]
  ]

  /**
   * Get the names of all implemented Plain of Life cell types
   */
  static getCellTypeNames(): string[] {
    return CellNames.cellNamesAndConstructors.map((_) => _[nameIndex])
  }

  /**
   * Get the constructor of a Plain of Life cell class by the cell type name
   */
  static getCellConstructor(name: string): undefined | CellConstructor {
    const nameAndConstructor = CellNames.cellNamesAndConstructors.find((_) => _[nameIndex] === name)
    if (nameAndConstructor) {
      return nameAndConstructor[constructorIndex]
    }
    return undefined
  }

  /**
   * Get the name of a Plain of Life cell type by the cell class constructor
   */
  static getCellTypeName(constructor: CellConstructor): undefined | string {
    const nameAndConstructor = CellNames.cellNamesAndConstructors.find((_) => _[constructorIndex] === constructor)
    if (nameAndConstructor) {
      return nameAndConstructor[nameIndex]
    }
    return undefined
  }
}
