const nameIndex = 0
const constructorIndex = 1

/**
 * A mapping of readable class names to constructors. Names and constructors must be unique per map.
 *
 * Note that the name shall be a human readable name that not necessarily has to match exactly the class name of the
 * class the constructor belongs to.
 */
export class Name2ConstructorMap<Constructor extends new () => unknown> {
  /**
   * Create a new (immutable) mapping
   */
  constructor(private namesAndConstructors: [string, Constructor][]) {
    if (new Set(this.getNames()).size != namesAndConstructors.length) {
      throw new Error('Names are not unique. Unable to create map.')
    }

    if (new Set(this.getConstructors()).size != namesAndConstructors.length) {
      throw new Error('Constructors are not unique. Unable to create map.')
    }
  }

  /**
   * Get all names in the map
   */
  getNames(): string[] {
    return this.namesAndConstructors.map((_) => _[nameIndex])
  }

  /**
   * Get all constructors in the map
   */
  private getConstructors(): Constructor[] {
    return this.namesAndConstructors.map((_) => _[constructorIndex])
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
