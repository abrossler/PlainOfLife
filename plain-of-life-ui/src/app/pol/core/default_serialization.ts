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
    // let mappings: SerializationMapping<unknown, unknown>[] = [dateMapping/*, Uint16Mapping*/]
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
  mappings: SerializationMapping<unknown, unknown>[]
  objectLists: ObjectLists
} {
  const mappings: SerializationMapping<unknown, unknown>[] = [
    dateMapping as SerializationMapping<unknown, unknown>,
    Uint16Mapping as SerializationMapping<unknown, unknown>
  ]
  const objectLists: ObjectLists = {}
  if (allCellContainers) {
    mappings.push(cellContainerMapping as SerializationMapping<unknown, unknown>)
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

function toSerializable2(
  from: unknown,
  mappings: SerializationMapping<unknown, unknown>[],
  objectLists: ObjectLists = {}
) {
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

function fromSerializable2(
  from: unknown,
  mappings: SerializationMapping<unknown, unknown>[],
  objectLists: ObjectLists = {}
) {
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

type Mapping = {
  toMap: new () => unknown
  mapAs: string
  mapTo: (toMap: unknown, objectList: unknown[], serialization: Serialization) => unknown
  mapFrom: (toMap: unknown, objectList: unknown[], serialization: Serialization) => unknown
  objectList: unknown[]
}

export class Serialization {
  private mappings: Mapping[] = []

  constructor() {
    this.addMapping(
      Date,
      '__Date__',
      (toMap: Date) => toMap.toISOString(),
      (toMap: string) => new Date(toMap)
    )

    this.addMapping(
      Int8Array,
      '__Int8Array__',
      (toMap: Int8Array) => encode(toMap.buffer),
      (toMap: string) => new Int8Array(decode(toMap))
    )
    this.addMapping(
      Int8Array,
      '__Int8Array__',
      (toMap: Int8Array) => encode(toMap.buffer),
      (toMap: string) => new Int8Array(decode(toMap))
    )
    this.addMapping(
      Uint8Array,
      '__Uint8Array__',
      (toMap: Uint8Array) => encode(toMap.buffer),
      (toMap: string) => new Uint8Array(decode(toMap))
    )
    this.addMapping(
      Uint8ClampedArray,
      '__Uint8ClampedArray__',
      (toMap: Uint8ClampedArray) => encode(toMap.buffer),
      (toMap: string) => new Uint8ClampedArray(decode(toMap))
    )
    this.addMapping(
      Int16Array,
      '__Int16Array__',
      (toMap: Int16Array) => encode(toMap.buffer),
      (toMap: string) => new Int16Array(decode(toMap))
    )
    this.addMapping(
      Uint16Array,
      '__Uint16Array__',
      (toMap: Uint16Array) => encode(toMap.buffer),
      (toMap: string) => new Uint16Array(decode(toMap))
    )
    this.addMapping(
      Int32Array,
      '__Int32Array__',
      (toMap: Int32Array) => encode(toMap.buffer),
      (toMap: string) => new Int32Array(decode(toMap))
    )
    this.addMapping(
      Uint32Array,
      '__Uint32Array__',
      (toMap: Uint32Array) => encode(toMap.buffer),
      (toMap: string) => new Uint32Array(decode(toMap))
    )
    this.addMapping(
      Float32Array,
      '__Float32Array__',
      (toMap: Float32Array) => encode(toMap.buffer),
      (toMap: string) => new Float32Array(decode(toMap))
    )
    this.addMapping(
      Float64Array,
      '__Float64Array__',
      (toMap: Float64Array) => encode(toMap.buffer),
      (toMap: string) => new Float64Array(decode(toMap))
    )
    this.addMapping(
      BigInt64Array,
      '__BigInt64Array__',
      (toMap: BigInt64Array) => encode(toMap.buffer),
      (toMap: string) => new BigInt64Array(decode(toMap))
    )
    this.addMapping(
      BigUint64Array,
      '__BigUint64Array__',
      (toMap: BigUint64Array) => encode(toMap.buffer),
      (toMap: string) => new BigUint64Array(decode(toMap))
    )
  }

  addMapping<T, U>(
    toMap: new () => T,
    mapAs: string,
    mapTo: (toMap: T, objectList: unknown[], s: Serialization) => U,
    mapFrom: (toMap: U, objectList: unknown[], s: Serialization) => T
  ): Serialization {
    this.mappings.push({
      toMap,
      mapAs,
      mapTo: mapTo as (toMap: unknown, objectList: unknown[]) => U,
      mapFrom: mapFrom as (toMap: unknown, objectList: unknown[]) => T,
      objectList: []
    })
    return this
  }

  addClassMapping<T>(toMap: new () => T, mapAs: string): Serialization {
    this.mappings.push({
      toMap,
      mapAs,
      mapTo: (toMap: unknown, _objectList, s: Serialization) => {
        return s.toSerializable(toMap as unknown as Record<string, unknown>)
      },
      mapFrom: (objectToMap, _objectList, s: Serialization) => {
        return Object.assign(new toMap(), s.fromSerializable(objectToMap as unknown as Record<string, unknown>))
      },
      objectList: []
    })

    return this
  }

  addIndexer<T>(toMap: new () => T, mapAs: string, objectList: T[]): Serialization {
    this.mappings.push({
      toMap,
      mapAs,
      mapTo: (toMap: unknown, objectList: unknown[]) => {
        const i = objectList.indexOf(toMap)
        if (i === -1) {
          objectList.push(toMap)
          return objectList.length - 1
        }
        return i
      },
      mapFrom: (index: unknown, objectList: unknown[]) => objectList[checkInt(index, 0, objectList.length - 1)],
      objectList
    })
    return this
  }

  toSerializable(from: Record<string, unknown>): Record<string, unknown> {
    return this._toSerializable(from) as Record<string, unknown>
  }

  private _toSerializable(from: unknown): unknown {
    if (from === null) {
      return null
    }

    if (typeof from === 'object' && from !== {}) {
      const to: { [key: string]: unknown } = {}
      for (let k in from) {
        const v = (from as { [key: string]: unknown })[k]

        if (v instanceof Array) {
          const array = [] as unknown[]
          let mapping: Mapping | undefined = undefined
          let containsNonNull = false
          let lastConstructor: (new (p: unknown) => unknown) | undefined = undefined

          if (v.length > 0) {
            v.forEach((vv) => {
              if (vv) {
                if (typeof vv === 'object') {
                  if (!mapping && (!lastConstructor || vv.constructor !== lastConstructor)) {
                    for (const m of this.mappings) {
                      if (vv instanceof m.toMap) {
                        if (containsNonNull) {
                          throw new Error('An array with elements to be mapped must not contain mixed types')
                        }
                        mapping = m
                        k += mapping.mapAs
                        break
                      }
                    }
                  }
                  if (lastConstructor && mapping && vv.constructor !== lastConstructor) {
                    throw new Error('An array with elements to be mapped must not contain mixed types')
                  }
                  lastConstructor = vv.constructor
                } else {
                  if (mapping) {
                    throw new Error('An array with elements to be mapped must not contain mixed types')
                  }
                }
                containsNonNull = true
              }

              if (mapping && vv) {
                array.push(mapping.mapTo(vv, mapping.objectList, this))
              } else {
                array.push(this._toSerializable(vv))
              }
            })
          }
          to[k] = array

          continue
        }

        let mapped = false
        for (const mapping of this.mappings) {
          if (v instanceof mapping.toMap) {
            to[k + mapping.mapAs] = mapping.mapTo(v, mapping.objectList, this)
            mapped = true
            break
          }
        }
        if (mapped) {
          continue
        }

        to[k] = this._toSerializable(v)
      }
      return to
    }
    // if(typeof from === 'function'){
    //   return undefined
    // }

    return from
  }

  fromSerializable(from: Record<string, unknown>): Record<string, unknown> {
    return this._fromSerializable(from) as Record<string, unknown>
  }

  private _fromSerializable(from: unknown): unknown {
    if (from === null) {
      return null
    }

    if (typeof from === 'object' && from !== {}) {
      const to: { [key: string]: unknown } = {}
      for (let k in from) {
        const v = (from as { [key: string]: unknown })[k]
        let matchingMapping: Mapping | undefined = undefined
        for (const mapping of this.mappings) {
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
              array.push(matchingMapping.mapFrom(vv, matchingMapping.objectList, this))
            } else {
              array.push(this._fromSerializable(vv))
            }
          })
          to[k] = array
        } else {
          if (matchingMapping) {
            to[k] = matchingMapping.mapFrom(v, matchingMapping.objectList, this)
          } else {
            to[k] = this._fromSerializable(v)
          }
        }
      }
      return to
    }
    // if(typeof from === 'function'){
    //   return undefined
    // }
    return from
  }
}
