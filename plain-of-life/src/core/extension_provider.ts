

export interface ExtensionProvider {
  createNewCellRecord(): Record<string, unknown>
  createNewPlainField(): Record<string, unknown>
}
