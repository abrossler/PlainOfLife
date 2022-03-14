import { decode, encode } from 'base64-arraybuffer'
import { checkInt } from '../util/type_checks'

/**
 * A mapping for any property of an object that is an instance of toMap:
 *
 * To any such property mapTo() is applied in toSerializable() and mapFrom() is applied in fromSerializable(). In the serializable object
 * returned by toSerializable(), mapAs is added as suffix to the mapped properties name. In fromSerializable() the mapFrom() function
 * is applied to any property with a name ending with mapAs.
 */
type Mapping = {
  toMap: new () => unknown
  mapAs: string
  mapTo: (toMap: unknown, objectList: unknown[], serialization: Serialization) => unknown
  mapFrom: (toMap: unknown, objectList: unknown[], serialization: Serialization) => unknown
  /** List of (not mapped) objects that are replaced in the serializable object by an index */
  objectList: unknown[]
}

/**
 * Serialization of a complex objects.
 *
 * Maps with toSerializable() an object to a serializable object that can be converted to a JSON string with JSON.stringify().
 * This mapping can be reverted by fromSerializable( JSON.parse( jsonString) ).
 */
export class Serialization {
  /** All mappings to be applied on properties during serialization and de-serialization */
  private mappings: Mapping[] = []

  /**
   * Constructor of a serialization optionally with default mappings for dates and all typed arrays.
   *
   * The default mapping for dates converts any Date to a string with toSerializable() and back from string to Date with fromSerializable().
   *
   * The default mappings for any typed array convert the buffer of the typed array to a Base64 encoded string with toSerializable() and
   * back to a typed array with fromSerializable().
   * @param withDefaultMappings
   */
  constructor(withDefaultMappings = true) {
    if (withDefaultMappings) {
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
  }

  /**
   * Add a custom mapping to the serialization
   * @param toMap Constructor of the properties to map. The mapping is applied to any property were (property instanceof toMap) is true
   * @param mapAs Suffix to the name of the mapped property in the serializable object
   * @param mapTo Function mapping the property to a serializable format
   * @param mapFrom Function mapping the property back from the serializable to the internal format ( mapFrom must revert mapTo).
   */
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

  /**
   * Add a custom mapping for a class to the serialization that assigns the deserialized properties back to a newly created object instance.
   * @param toMap Constructor of the properties to map. The mapping is applied to any property were (property instanceof toMap) is true
   * @param mapAs Suffix to the name of the mapped property in the serializable object
   */
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

  /**
   * Add a custom indexer mapping that replaces any instance of toMap with the index of the instance in objectList. If the toMap instance
   * is not yet in objectList, it's added.
   *
   * This can be used to serialize objects referencing one object instance multiple times
   * @param toMap Constructor of the properties to index
   * @param mapAs Suffix to the name of the indexed property in the serializable object
   * @param objectList All the object instances found so far
   */
  addIndexer<T>(toMap: new () => T, mapAs: string, objectList: T[]): Serialization {
    this.mappings.push({
      toMap,
      mapAs,
      mapTo: (toMap: unknown, objectList: unknown[]) => {
        // Search toMap
        const i = objectList.indexOf(toMap)
        // Not found => Add and return new index
        if (i === -1) {
          objectList.push(toMap)
          return objectList.length - 1
        }
        // Else return found index
        return i
      },
      mapFrom: (index: unknown, objectList: unknown[]) => objectList[checkInt(index, 0, objectList.length - 1)],
      objectList
    })
    return this
  }

  /**
   * Map an object to a serializable format that can be converted to a JSON string with JSON.stringify().
   *
   * Note that arrays containing objects were a mapping exists must contain only objects matching the same mapping or null or undefined.
   *
   * @param from The original object
   * @returns The serializable object
   */
  toSerializable(from: Record<string, unknown>): Record<string, unknown> {
    return this._toSerializable(from) as Record<string, unknown>
  }

  private _toSerializable(from: unknown): unknown {
    // All kinds of non null and non empty objects...
    if (typeof from === 'object' && from !== {} && from !== null) {
      const to: { [key: string]: unknown } = {}
      // For the values of all properties
      for (let key in from) {
        const value = (from as { [key: string]: unknown })[key]

        // If the value is an array
        if (value instanceof Array) {
          const array = [] as unknown[]
          let mapping: Mapping | undefined = undefined
          let containsNonNull = false
          let lastConstructor: (new (p: unknown) => unknown) | undefined = undefined

          if (value.length > 0) {
            // For each value in the array
            value.forEach((arrayValue) => {
              // Check if there is a mapping
              if (arrayValue) {
                if (typeof arrayValue === 'object') {
                  if (!mapping && (!lastConstructor || arrayValue.constructor !== lastConstructor)) {
                    for (const m of this.mappings) {
                      // Try to find a mapping (if not found so far and there might be a mapping)
                      if (arrayValue instanceof m.toMap) {
                        if (containsNonNull) {
                          // Ups, found a mapping and found non-null elements before
                          throw new Error(
                            'Arrays containing objects were a mapping exists must contain only objects matching the same mapping or null or undefined'
                          )
                        }
                        mapping = m
                        key += mapping.mapAs
                        break
                      }
                    }
                  }
                  if (lastConstructor && mapping && arrayValue.constructor !== lastConstructor) {
                    // Ups, there is already a mapping and found a different constructor
                    throw new Error(
                      'Arrays containing objects were a mapping exists must contain only objects matching the same mapping or null or undefined'
                    )
                  }
                  lastConstructor = arrayValue.constructor
                } else {
                  if (mapping) {
                    // Ups, there is already a mapping so the array must not contain other non-object types such as numbers or strings
                    throw new Error(
                      'Arrays containing objects were a mapping exists must contain only objects matching the same mapping or null or undefined'
                    )
                  }
                }
                containsNonNull = true
              }

              // If there is a mapping, apply it to the array value
              if (mapping && arrayValue) {
                array.push(mapping.mapTo(arrayValue, mapping.objectList, this))
              } else {
                // Else continue recursively with toSerializable
                array.push(this._toSerializable(arrayValue))
              }
            })
          }
          to[key] = array
        }
        // If the value is no array
        else {
          // Try to find a mapping...
          let mapping: Mapping | undefined = undefined
          for (const m of this.mappings) {
            if (value instanceof m.toMap) {
              mapping = m
            }
          }

          // If there is a mapping, apply it to the value
          if (mapping) {
            to[key + mapping.mapAs] = mapping.mapTo(value, mapping.objectList, this)
          } else {
            // Else continue recursively with toSerializable
            to[key] = this._toSerializable(value)
          }
        }
      }
      // Return the mapped object
      return to
    }

    // Just return non-object types such as number, string and function, null, undefined, {}
    return from
  }

  /**
   * Recreate an object from a serializable format as provided by toSerializable().
   *
   * @param from The object in the serializable format
   * @returns The recreated object
   */
  fromSerializable(from: Record<string, unknown>): Record<string, unknown> {
    return this._fromSerializable(from) as Record<string, unknown>
  }

  private _fromSerializable(from: unknown): unknown {
    // All kinds of non null and non empty objects...
    if (typeof from === 'object' && from !== {} && from !== null) {
      const to: { [key: string]: unknown } = {}
      // For all properties
      for (let key in from) {
        const value = (from as { [key: string]: unknown })[key]
        let mapping: Mapping | undefined = undefined
        // Find a mapping from the key suffix...
        for (const m of this.mappings) {
          if (key.endsWith(m.mapAs)) {
            key = key.slice(0, -m.mapAs.length) // ... and remove the suffix from the key
            mapping = m
            break
          }
        }
        // If the property value is an array
        if (value instanceof Array) {
          const array = [] as unknown[]
          // For each value in an array, apply the mapping or continue recursively with toSerializable
          value.forEach((arrayValue) => {
            if (mapping && arrayValue) {
              array.push(mapping.mapFrom(arrayValue, mapping.objectList, this))
            } else {
              array.push(this._fromSerializable(arrayValue))
            }
          })
          to[key] = array
        }
        // If the property is no array, apply the mapping or continue recursively with toSerializable
        else {
          if (mapping) {
            to[key] = mapping.mapFrom(value, mapping.objectList, this)
          } else {
            to[key] = this._fromSerializable(value)
          }
        }
      }
      // Return the mapped object
      return to
    }

    // Just return non-object types such as number, string and function, null, undefined, {}
    return from
  }
}
