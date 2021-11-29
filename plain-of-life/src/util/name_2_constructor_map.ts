const nameIndex = 0
const constructorIndex = 1

/**
 * A mapping of readable class names to constructors.
 *
 * Note that the name shall be a human readable name that not necessarily has to match exactly the class name of the
 * class the constructor belongs to.
 */
export class Name2ConstructorMap<Constructor extends new () => unknown> {
  /**
   * Create a new (immutable) mapping
   */
  constructor(private namesAndConstructors: [string, Constructor][]) {}

  /**
   * Get all names in the map
   */
  getNames(): string[] {
    return this.namesAndConstructors.map((_) => _[nameIndex])
  }

  /**
   * Get the constructor for a name
   */
  getConstructor(name: string): undefined | Constructor {
    const nameAndConstructor = this.namesAndConstructors.find((_) => _[nameIndex] === name)
    if (nameAndConstructor) {
      return nameAndConstructor[constructorIndex]
    }
    return undefined
  }

  /**
   * Get the name for a constructor
   */
  getName(constructor: Constructor): undefined | string {
    const nameAndConstructor = this.namesAndConstructors.find((_) => _[constructorIndex] === constructor)
    if (nameAndConstructor) {
      return nameAndConstructor[nameIndex]
    }
    return undefined
  }
}
