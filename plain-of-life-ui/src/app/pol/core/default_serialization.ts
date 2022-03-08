import { decode, encode } from 'base64-arraybuffer'
import { checkInt } from '../util/type_checks'
import { ExtCellContainer, CellContainer } from './cell_container'
import { RuleExtensionFactory } from './rule_extension_factory'

export const defaultSerialization = {
  /**
   * A default conversion to a serializable format that makes a deep copy of the object to be serialized and replaces
   * any reference to a cell container by an index pointing to the cell container to support multiple references to the
   * same container.
   *
   * Not supported are for example cyclic references or creation of class instances
   * @param toSerialize The object to be converted in an serializable format
   * @param allCellContainers  If provided: An array of all cell containers (of alive and dead cells) to replace cell container
   * references in the serializable format by the index of the cell container in the array
   * @returns The serializable object
   */
  toSerializable(
    toSerialize: Record<string, unknown>,
    allCellContainers?: ExtCellContainer<RuleExtensionFactory>[]
  ): Record<string, unknown> {
    // let mappings: SerializationMapping<any, any>[] = [dateMapping/*, Uint16Mapping*/]
    // let objectLists: any = { }
    // if( allCellContainers ){
    //   mappings.push(cellContainerMapping)
    //   objectLists[defaultSerialization.getCellContainerSuffix()] = allCellContainers
    // }

    const prep = prepare(allCellContainers)
    return toSerializable2(toSerialize, prep.mappings, prep.objectLists) as Record<string, unknown>
    // // Replace cell containers by index
    // const tmp: Record<string, unknown> = {}

    // if (allCellContainers) {
    //   for (const property in toSerialize) {
    //     if (toSerialize[property] instanceof CellContainer) {
    //       tmp[property] = toSerialize[property]
    //       toSerialize[property + defaultSerialization.getCellContainerSuffix()] = getIndexOrAdd(
    //         allCellContainers,
    //         toSerialize[property]
    //       )
    //       delete toSerialize[property]
    //     }
    //   }
    // }

    // // Make a deep copy
    // const result = JSON.parse(JSON.stringify(toSerialize))

    // //Revert the original: Switch back from the index to the cell containers
    // for (const property in tmp) {
    //   toSerialize[property] = tmp[property]
    //   delete toSerialize[property + defaultSerialization.getCellContainerSuffix()]
    // }

    // return result
  },

  /**
   * A default conversion from a serializable to an internal format reverting {@link defaultToSerializable}
   */
  fromSerializable(
    serializable: Record<string, unknown>,
    allCellContainers?: ExtCellContainer<RuleExtensionFactory>[]
  ): Record<string, unknown> {
    const prep = prepare(allCellContainers)
    return fromSerializable2(serializable, prep.mappings, prep.objectLists) as Record<string, unknown>
    // // Make a deep copy
    // const result = JSON.parse(JSON.stringify(serializable))

    // // Replace index of cell container by cell container reference in the copy
    // if (allCellContainers) {
    //   for (const property in result) {
    //     if (property.endsWith(defaultSerialization.getCellContainerSuffix())) {
    //       result[property.substring(0, property.length - defaultSerialization.getCellContainerSuffix().length)] =
    //         allCellContainers[checkInt(result[property], 0, allCellContainers.length - 1)]
    //       delete result[property]
    //     }
    //   }
    // }

    // return result
  },

  /**
   * Get the suffix added to the property name of a cell container if the cell container object is replaced by the index of the
   * cell container object.
   */
  getCellContainerSuffix(): string {
    return '__CellContainerIndex__'
  }
}

/**
 * Helper to get the index of t in an array a adding t to the array if not yet in...
 */
function getIndexOrAdd<T>(a: unknown[], t: T): number {
  const i = a.indexOf(t)
  if (i === -1) {
    a.push(t)
    return a.length - 1
  }
  return i
}

function prepare(allCellContainers?: ExtCellContainer<RuleExtensionFactory>[]): {
  mappings: SerializationMapping<any, any>[]
  objectLists: ObjectLists
} {
  const mappings: SerializationMapping<any, any>[] = [dateMapping, Uint16Mapping]
  const objectLists: ObjectLists = {}
  if (allCellContainers) {
    mappings.push(cellContainerMapping)
    objectLists[defaultSerialization.getCellContainerSuffix()] = allCellContainers
  }
  return { mappings, objectLists }
}

// class TestClass {
//   tst = 'tst'
//   constructor(private fromConst?: string) {
//     if (!fromConst) {
//       this.fromConst = 'fromConst'
//     }
//   }
// }

type SerializationMapping<T, U> = {
  toMap: new () => T
  mapAs: string
  mapTo: (toMap: T, mapAs: string, objectLists: ObjectLists) => U
  mapFrom: (toMap: U, mapAs: string, objectLists: ObjectLists) => T
}
type ObjectLists = { [key: string]: { [key: string]: unknown }[] }

// function getIndexOrAdd<T>(a: unknown[], t: T): number {
//     const i = a.indexOf(t)
//     if (i === -1) {
//       a.push(t)
//       return a.length - 1
//     }
//     return i
// }

function mapToIndex<T>(toMap: T, mapAs: string, objectLists: ObjectLists): number {
  if (objectLists[mapAs] === undefined) {
    objectLists[mapAs] = []
  }
  return getIndexOrAdd(objectLists[mapAs], toMap)
}

function mapFromIndex<T>(index: number, mapAs: string, objectLists: ObjectLists): T {
  return objectLists[mapAs][checkInt(index, 0, objectLists[mapAs].length - 1)] as unknown as T
}

// const testClassMapping: SerializationMapping<TestClass, number> = {
//   toMap: TestClass,
//   mapAs: '__TestClass__',
//   mapTo: mapToIndex,
//   mapFrom: mapFromIndex
// }

const cellContainerMapping: SerializationMapping<CellContainer<RuleExtensionFactory>, number> = {
  toMap: CellContainer as new () => CellContainer<RuleExtensionFactory>,
  mapAs: defaultSerialization.getCellContainerSuffix(),
  mapTo: mapToIndex,
  mapFrom: mapFromIndex
}

const dateMapping: SerializationMapping<Date, string> = {
  toMap: Date,
  mapAs: '__Date__',
  mapTo: (toMap: Date) => toMap.toISOString(),
  mapFrom: (toMap: string) => new Date(toMap)
}

const Uint16Mapping: SerializationMapping<Uint16Array, string> = {
  toMap: Uint16Array,
  mapAs: '__Uint16Array__',
  mapTo: (toMap: Uint16Array) => encode(toMap),
  mapFrom: (toMap: string) => new Uint16Array(decode(toMap))
}

function toSerializable2(from: unknown, mappings: SerializationMapping<any, any>[], objectLists: ObjectLists = {}) {
  if (from === null) {
    return null
  }

  if (typeof from === 'object' && from !== {}) {
    const to: { [key: string]: unknown } = {}
    for (let k in from) {
      const v = (from as { [key: string]: unknown })[k]

      if (v instanceof Array) {
        const array = [] as unknown[]
        let mapping: SerializationMapping<unknown, unknown> | undefined = undefined

        if (v.length > 0) {
          for (const m of mappings) {
            if (v[0] instanceof m.toMap) {
              mapping = m
              k += mapping.mapAs
              break
            }
          }

          v.forEach((vv) => {
            if (mapping && vv) {
              if (!(vv instanceof mapping.toMap)) {
                throw new Error('An array with elements to be mapped must not contain mixed types')
              }
              array.push(mapping.mapTo(vv, mapping.mapAs, objectLists))
            } else {
              array.push(toSerializable2(vv, mappings, objectLists))
            }
          })
        }
        to[k] = array

        continue
      }

      let mapped = false
      for (const mapping of mappings) {
        if (v instanceof mapping.toMap) {
          to[k + mapping.mapAs] = mapping.mapTo(v, mapping.mapAs, objectLists)
          mapped = true
          break
        }
      }
      if (mapped) {
        continue
      }

      to[k] = toSerializable2(v, mappings, objectLists)
    }
    return to
  }

  return from
}

function fromSerializable2(from: unknown, mappings: SerializationMapping<any, any>[], objectLists: ObjectLists = {}) {
  if (from === null) {
    return null
  }

  if (typeof from === 'object' && from !== {}) {
    const to: { [key: string]: unknown } = {}
    for (let k in from) {
      const v = (from as { [key: string]: unknown })[k]
      let matchingMapping: SerializationMapping<unknown, unknown> | undefined = undefined
      for (const mapping of mappings) {
        if (k.endsWith(mapping.mapAs)) {
          k = k.slice(0, -mapping.mapAs.length)
          matchingMapping = mapping
          break
        }
      }
      if (v instanceof Array) {
        const array = [] as unknown[]
        v.forEach((vv) => {
          if (matchingMapping && vv) {
            array.push(matchingMapping.mapFrom(vv, matchingMapping.mapAs, objectLists))
          } else {
            array.push(toSerializable2(vv, mappings, objectLists))
          }
        })
        to[k] = array
      } else {
        if (matchingMapping) {
          to[k] = matchingMapping.mapFrom(v, matchingMapping.mapAs, objectLists)
        } else {
          to[k] = toSerializable2(v, mappings, objectLists)
        }
      }
    }
    return to
  }

  return from
}
