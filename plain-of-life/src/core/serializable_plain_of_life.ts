import { ExtensionProvider } from './rules'

export type SerializablePlainOfLife<E extends ExtensionProvider> = {
  currentTurn: string
  rulesName: string
  rules: {
    plainWidth: number
    plainHeight: number
    plainFields: (
      {
        cellRecordProperties:string[] // Names of the properties that hold an index of a cell record (in case that plain field extensions include cell records)
      } & ReturnType<E['getPlainFieldExtension']>)[]
    cellRecords: (
      {
        cellTypeName:string,
        cell: unknown//Record<string, unknown>, // ToDo: Perhaps better - type returned by serialize method of cell
        posX: number,
        posY: number,
        color:number
      } & ReturnType<E['getCellRecordExtension']>)[]
  }
  familyTree: {} //ToDo
}
