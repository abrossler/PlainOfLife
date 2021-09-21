import { ExtensionProvider } from './rules'

export type SerializablePlainOfLife<E extends ExtensionProvider> = {
  currentTurn: string
  rulesName: string
  rules: {
    plainWidth: number
    plainHeight: number
    plainFields: ({} & ReturnType<E['getPlainFieldExtension']>)[]
  }
}
