import { CellContainers } from "./cell_container"
import { ExtensionProvider } from "./extension_provider"
import { SerializablePlainOfLife } from './serializable_plain_of_life'

export class FamilyTree<E extends ExtensionProvider> {

  toSerializable(): SerializablePlainOfLife['familyTree'] {
    const serializable = {} as SerializablePlainOfLife['familyTree']
    return serializable
  }

  initNew(): this {
    return this
  }
  
  initFromSerializable( serializable: SerializablePlainOfLife['familyTree']): this{
    return this
  }

  update(cellContainers: CellContainers<E> | null): void {
    if (cellContainers === null) {
      return
    }

    for (const container in cellContainers) {
      // ToDo
    }
  }
}
