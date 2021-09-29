import { CellContainer, ExtCellContainer } from './cell_container';
import { ExtensionProvider } from "./extension_provider";


/**
 * The plain field for module internal usage with all properties returned by {@link Rules.getPlainFieldExtension}
 */
 export type IntPlainField<E extends ExtensionProvider> = PlainField<E> & ReturnType<E['createNewPlainField']>

 /**
  * A plain field that includes some standard properties plus all properties returned by {@link Rules.getPlainFieldExtension}.
  */
 /*
  * External plain fields can be used safely outside this module by omitting critical properties that could break the
  * internal structure when misused from outside
  */
 export type ExtPlainField<E extends ExtensionProvider> = Omit<IntPlainField<E>, 'addCellContainer' | 'removeCellContainer'>

/**
 * The plain field class - not for direct usage:
 *
 * Within the module {@link IntPlainField} shall be used
 *
 * Outside the module {@link ExtPlainField} shall be used
 *
 * Adding or removing cell containers, consistency with the cell container itself has to be ensured. For example
 * the cell container holds the x and y coordinated where it is located on the plain.
 *
 */
export class PlainField<E extends ExtensionProvider> {
  private cellContainers: CellContainer<E>[] = [];

  /**
   * Constructor that creates a plain field instance and additionally assigns all properties returned by the extension provider to that instance
   * so that it actually returns a {@link IntPlainField}
   */
  constructor(extensionProvider: ExtensionProvider) {
    Object.assign(this, extensionProvider.createNewPlainField());
  }

  /**
   * Add a cell container to the plain field.
   *
   * For module internal use only
   */
  addCellContainer(toAdd: CellContainer<E>): void {
    this.cellContainers.push(toAdd);
  }

  /**
   * Remove a cell container from the plain field.
   *
   * For module internal use only
   */
  removeCellContainer(toRemove: CellContainer<E>): void {
    this.cellContainers.splice(this.cellContainers.findIndex((cr) => cr === toRemove));
  }

  /**
   * Get all cell containers located on the plain field
   */
  getCellContainers(): Readonly<ExtCellContainer<E>[]> {
    // For usage outside the module, thus returning ExtCellContainer
    return this.cellContainers;
  }
}
