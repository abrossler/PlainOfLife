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
    // Replace cell containers by index
    const tmp: Record<string, unknown> = {}

    if (allCellContainers) {
      for (const property in toSerialize) {
        if (toSerialize[property] instanceof CellContainer) {
          tmp[property] = toSerialize[property]
          toSerialize[property + defaultSerialization.getCellContainerSuffix()] = getIndexOrAdd(
            allCellContainers,
            toSerialize[property]
          )
          delete toSerialize[property]
        }
      }
    }

    // Make a deep copy
    const result = JSON.parse(JSON.stringify(toSerialize))

    //Revert the original: Switch back from the index to the cell containers
    for (const property in tmp) {
      toSerialize[property] = tmp[property]
      delete toSerialize[property + defaultSerialization.getCellContainerSuffix()]
    }

    return result
  },

  /**
   * A default conversion from a serializable to an internal format reverting {@link defaultToSerializable}
   */
  fromSerializable(
    serializable: Record<string, unknown>,
    allCellContainers?: ExtCellContainer<RuleExtensionFactory>[]
  ): Record<string, unknown> {
    // Make a deep copy
    const result = JSON.parse(JSON.stringify(serializable))

    // Replace index of cell container by cell container reference in the copy
    if (allCellContainers) {
      for (const property in result) {
        if (property.endsWith(defaultSerialization.getCellContainerSuffix())) {
          result[property.substring(0, property.length - defaultSerialization.getCellContainerSuffix().length)] =
            allCellContainers[checkInt(result[property], 0, allCellContainers.length - 1)]
          delete result[property]
        }
      }
    }

    return result
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
function getIndexOrAdd<T>(a: T[], t: T): number {
  const i = a.indexOf(t)
  if (i === -1) {
    a.push(t)
    return a.length - 1
  }
  return i
}
