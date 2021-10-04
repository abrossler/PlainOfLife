import { CellContainers } from './cell_container'
import { RuleExtensionFactory } from './rule_extension_factory'
import { SerializableFamilyTree } from './serializable_plain_of_life'

/**
 * A family tree of cells: Provides a visualization on how branches of related cells evolve over time.
 */
export class FamilyTree<E extends RuleExtensionFactory> {
  /**
   * Transform a family tree to a serializable format (e.g. without cyclic object references).
   *
   * @returns a serializable format of the family tree as supported by {@link JSON.stringify}
   */
  toSerializable(): SerializableFamilyTree {
    // ToDo
    const serializable = {} as SerializableFamilyTree
    return serializable
  }

  /**
   * Init a new family tree after creation.
   */
  initNew(): void {
    // ToDo
  }

  /**
   * Init a family tree after creation from a serializable format as returned by {@link toSerializable}
   */
  initFromSerializable(serializable: SerializableFamilyTree): void {
    // ToDo
  }

  update(cellContainers: CellContainers<E> | null): void {
    if (cellContainers === null) {
      return
    }

    // for (const container in cellContainers) {
    //   // ToDo
    // }
  }
}
