import { CellRecords, ExtensionProvider } from './rules'
import { SerializablePlainOfLife } from './serializable_plain_of_life'

export class FamilyTree<E extends ExtensionProvider> {

  toSerializable(): SerializablePlainOfLife<E>['familyTree'] {
    const serializable = {} as SerializablePlainOfLife<E>['familyTree']
    return serializable
  }

  initNew(): this {
    return this
  }
  
  initFromSerializable( serializable: SerializablePlainOfLife<E>['familyTree']): this{
    return this
  }

  update(cellRecords: CellRecords<E> | null): void {
    if (cellRecords === null) {
      return
    }

    for (const record in cellRecords) {
      // ToDo
    }
  }
}
