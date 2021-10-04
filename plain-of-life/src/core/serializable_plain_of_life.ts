import { Indexer } from '../util/indexer'
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
 * @param cellContainerIndexer  If provided: An indexer that replaces cell container references by an index
 * @returns The serializable object
 */
export function defaultToSerializable(
  toSerialize: any,
  cellContainerIndexer?: Indexer<ExtCellContainer<RuleExtensionFactory>>,
): Record<string, unknown> {
  // Replace cell containers by index
  const tmp: Record<string, unknown> = {}
  if (cellContainerIndexer) {
    for (const property in toSerialize) {
      if (toSerialize[property] instanceof CellContainer) {
        tmp[property] = toSerialize[property]
        delete toSerialize[property]
        toSerialize[property + '__CellContainerIndex__'] = cellContainerIndexer.getIndex(toSerialize[property])
      }
    }
  }

  // Make a deep copy
  const result = JSON.parse(JSON.stringify(toSerialize))

  // Revert the original: Switch back from the index to the cell containers
  for (const property in tmp) {
    toSerialize[property] = tmp[property]
  }

  return result
}

/**
 * A default conversion from a serializable to an internal format reverting {@link defaultToSerializable}
 */
export function defaultFromSerializable(
  serializable: Record<string, unknown>,
  cellContainerIndexer?: Indexer<ExtCellContainer<RuleExtensionFactory>>,
): Record<string, unknown> {
  // Make a deep copy
  const result = JSON.parse(JSON.stringify(serializable))

  // Replace index of cell container by cell container reference in the copy
  if (cellContainerIndexer) {
    for (const property in result) {
      if (property.endsWith('__CellContainerIndex__')) {
        delete result[property]
        serializable[property.substring(0, property.length - '__CellContainerIndex__'.length)] =
          cellContainerIndexer.get(checkInt(result[property], 0))
      }
    }
  }

  return result
}
