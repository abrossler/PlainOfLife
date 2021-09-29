import { ExtensionProvider } from "./extension_provider"

export type SerializablePlainOfLife/*<E extends ExtensionProvider>*/ = {
  currentTurn: string
  plainWidth: number
  plainHeight: number
  rulesName: string
  rules: Record<string, unknown>//unknown // ReturnType<E['toSerializable']>
  plainFields: Record<string, unknown>[]//ReturnType<E['createNewPlainField']>[] // ToDo: Must be return type of plainFieldExtensionToSerializable
  cellContainers: {
    cellTypeName:string,
    cell: Record<string, unknown>//Container<string, unknown>, // ToDo: Perhaps better - type returned by serialize method of cell
    cellRecord: Record<string, unknown>//ReturnType<E['createNewCellRecord']>[]// ToDo: Must be return type of cellContainerExtensionToSerializable
    posX: number,
    posY: number,
    color:number
  } []
  familyTree: {} //ToDo
}

export function defaultToSerializable( toSerialize: unknown ): Record<string, unknown> {
  return JSON.parse(JSON.stringify(toSerialize))
} 
