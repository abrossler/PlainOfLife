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
    colorRed: number
    colorGreen: number
    colorBlue: number
  }[]
  familyTree: unknown //ToDo
}

/** A serializable format of a cell container as supported by {@link JSON.stringify} */
export type SerializableCellContainer = SerializablePlainOfLife['cellContainers'][number]
/** A serializable format of a cell container list as supported by {@link JSON.stringify} */
export type SerializableCellContainers = SerializablePlainOfLife['cellContainers']
/** A serializable format of a family tree as supported by {@link JSON.stringify} */
export type SerializableFamilyTree = SerializablePlainOfLife['familyTree']
