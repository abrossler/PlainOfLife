import { checkInt } from '../util/type_checks'
import { CellContainer, ExtCellContainer } from './cell_container'
import { RuleExtensionFactory } from './rule_extension_factory'

/**
 * A serializable format of a Plain of Life as supported by {@link JSON.stringify}.
 */
export type SerializablePlainOfLife = {
  currentTurn: string
  plainWidth: number
  plainHeight: number
  rulesName: string
  rules: Record<string, unknown>
  fieldRecords: Record<string, unknown>[]
  // Note that plain fields are not part of the serializable plain of life - they hold only redundant information for
  // performance optimization
  cellRecords: Record<string, unknown>[]
  cellContainers: {
    cellTypeName: string
    cell: Record<string, unknown>
    isDead: boolean
    posX: number
    posY: number
    color: number
  }[]
  familyTree: unknown //ToDo
}

/** A serializable format of a cell container as supported by {@link JSON.stringify} */
export type SerializableCellContainer = SerializablePlainOfLife['cellContainers'][number]
/** A serializable format of a cell container list as supported by {@link JSON.stringify} */
export type SerializableCellContainers = SerializablePlainOfLife['cellContainers']
/** A serializable format of a family tree as supported by {@link JSON.stringify} */
export type SerializableFamilyTree = SerializablePlainOfLife['familyTree']

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
export function defaultToSerializable(
  toSerialize: Record<string, unknown>,
  allCellContainers?: ExtCellContainer<RuleExtensionFactory>[]
): Record<string, unknown> {
  // Replace cell containers by index
  const tmp: Record<string, unknown> = {}

  if (allCellContainers) {
    for (const property in toSerialize) {
      if (toSerialize[property] instanceof CellContainer) {
        tmp[property] = toSerialize[property]
        toSerialize[property + getCellContainerSuffix()] = getIndexOrAdd(allCellContainers, toSerialize[property])
        delete toSerialize[property]
      }
    }
  }

  // Make a deep copy
  const result = JSON.parse(JSON.stringify(toSerialize))

  //Revert the original: Switch back from the index to the cell containers
  for (const property in tmp) {
    toSerialize[property] = tmp[property]
    delete toSerialize[property + getCellContainerSuffix()]
  }

  return result
}

/**
 * A default conversion from a serializable to an internal format reverting {@link defaultToSerializable}
 */
export function defaultFromSerializable(
  serializable: Record<string, unknown>,
  allCellContainers?: ExtCellContainer<RuleExtensionFactory>[]
): Record<string, unknown> {
  // Make a deep copy
  const result = JSON.parse(JSON.stringify(serializable))

  // Replace index of cell container by cell container reference in the copy
  if (allCellContainers) {
    for (const property in result) {
      if (property.endsWith(getCellContainerSuffix())) {
        result[property.substring(0, property.length - getCellContainerSuffix().length)] =
          allCellContainers[checkInt(result[property], 0, allCellContainers.length-1)]
        delete result[property]
      }
    }
  }

  return result
}

function getIndexOrAdd<T>(a: T[], t: T): number {
  const i = a.indexOf(t)
  if (i === -1) {
    a.push(t)
    return a.length - 1
  }
  return i
}

/**
 * Get the suffix added to the property name of a cell container if the cell container object is replaced by the index of the
 * cell container object.
 */
export function getCellContainerSuffix(): string {
  return '__CellContainerIndex__'
}
