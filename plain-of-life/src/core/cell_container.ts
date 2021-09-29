import { Cell } from './cell';
import { SerializablePlainOfLife } from './serializable_plain_of_life';
import { getCellTypeName } from '../cells/cell_names';
import { ExtensionProvider } from "./extension_provider";
import { Plain } from "./plain";
import { checkInt, checkObject } from '../util/type_checks';

// /**
//  * The cell container for module internal usage including all properties returned by {@link Rules.getCellContainerExtension}
//  */
//  export type IntCellContainer<E extends ExtensionProvider> = CellContainer<E> & ReturnType<E['getCellContainerExtension']>

 /**
  * A cell container that includes some standard properties plus all properties returned by {@link Rules.getCellContainerExtension}.
  */
 /*
  * External cell containers can be used safely outside this module by omitting critical properties that could break the
  * internal structure when misused from outside
  */
 export type ExtCellContainer<E extends ExtensionProvider> = Omit<CellContainer<E>, 'init' | 'next'>
 
 /**
  * An iterator to iterate on {@link ExtCellContainer}s
  */
 export class CellContainers<E extends ExtensionProvider> {
   constructor(private first: CellContainer<E>) {}
   *[Symbol.iterator](): Iterator<ExtCellContainer<E>> {
     let r
     for (r = this.first; r.next !== this.first; r = r.next) {
       yield r
     }
     yield r // don't forget the last container where next === first
   }
 }
 

/**
 * The cell container - not for direct usage:
 *
 * Outside the module {@link ExtCellContainer} shall be used
 *
 * Cell containers form a cyclic list. Starting from a seed container {@link makeChild} inserts the child into the cycle, {@link die}
 * removes the child from the cycle. The removed child still points to it's former successor so that it's possible to re-enter
 * the cycle via .next from a removed child. That's important if you somewhere hold a cell container and this cell container dies.
 */
export class CellContainer<E extends ExtensionProvider> {
  /** Predecessor in list */
  private _prev!: CellContainer<E>;
  /** Successor in list */
  private _next!: CellContainer<E>;
  private _posX!: number;
  private _posY!: number;
  private cell!: Cell;
  public cellRecord!: ReturnType<E['createNewCellRecord']>;
  private plain!: Plain<E>;
  private _isDead = false;
  /**
   * Color of the cell container. With {@link makeChild} the color of the child is randomly changed slightly. Thus closely related
   * cell containers have a similar color whereas not related cell containers typically have a different color
   */
  private _color = 0;

  /**
   * Constructor that creates a cell container instance and additionally assigns all properties returned by the extension provider
   * to that instance so that it actually returns a {@link IntCellContainer}.
   *
   * Call {@link initSeedCellContainer} before using the instance.
   *
   * The constructor creates a seed cell container for a new plain of life. Within a plain new cells must be created via
   * {@link makeChild}.
   */
  constructor(private extensionProvider: ExtensionProvider) {

    this.cellRecord = extensionProvider.createNewCellRecord() as ReturnType<E['createNewCellRecord']>;
  }

  /**
   * Init a seed cell container. Normal cells are initialized by {@link makeChild}.
   */
  initSeedCellContainer(plain: Plain<E>, cell: Cell, posX: number, posY: number) {
    // Start with a cyclic list of one (seed) container - the successor and predecessor of this container is the container itself
    this._prev = this._next = this;
    this.plain = plain;
    this.cell = cell;
    this._posX = Plain.modulo(posX, plain.width);
    this._posY = Plain.modulo(posY, plain.height);
  }

  toSerializable(): SerializablePlainOfLife['cellContainers'][number] {
    const serializable = {} as SerializablePlainOfLife['cellContainers'][number];
    const cellTypeName = getCellTypeName(Object.getPrototypeOf(this.cell).constructor);
    if (typeof cellTypeName === 'undefined') {
      throw new Error('Unable to get cell type name from constructor. Forgot to register name for cell implementation?');
    }
    serializable.cellTypeName = cellTypeName;
    serializable['cell'] = this.cell.toSerializable();
    serializable.posX = this._posX;
    serializable.posY = this._posY;
    serializable.color = this._color;

    return serializable;
  }

  initFromSerializable(serializable: SerializablePlainOfLife['cellContainers'][number], plain: Plain<E>, predecessor: CellContainer<E>, successor: CellContainer<E>): void {
    this._prev = predecessor;
    this._next = successor;
    predecessor._next = this;
    successor._prev = this;
    this.plain = plain;

    this._posX = checkInt(serializable.posX,0,plain.width)
    this._posY = checkInt(serializable.posY,0,plain.height)

    this.plain.getAtInt(this._posX, this._posY).addCellContainer(this);
  }

  get next() {
    return this._next;
  }
  get posX() {
    return this._posX;
  }
  get posY() {
    return this._posY;
  }

  /**
   * Create a child.
   *
   * The child is added before the parent to the cell containers. Thus when iterating over the cell containers, the just born child
   * will not be included in the current iteration.
   * @param dX the delta to the parent's x position - e.g. 2 places the child 2 fields on the right of the parent
   * @param dY the delta to the parent's y position - e.g. -2 places the child 2 fields above the parent
   * @returns the child
   */
  makeChild(dX: number, dY: number): ExtCellContainer<E> {
    const childContainer = new CellContainer<E>(this.extensionProvider);

    // Init the child container
    childContainer.plain = this.plain;
    childContainer.cell = this.cell.makeChild();
    childContainer._posX = Plain.modulo(this.posX + dX, this.plain.width);
    childContainer._posY = Plain.modulo(this.posY + dY, this.plain.height);

    childContainer._prev = this._prev;
    childContainer._next = this;
    this._prev._next = childContainer;
    this._prev = childContainer;

    // Don't forget to add the child to the plain
    this.plain.getAtInt(childContainer._posX, childContainer._posY).addCellContainer(childContainer);

    return childContainer;
  }

  die() {
    this._prev._next = this._next;
    this._next._prev = this._prev;
    this._isDead = true;

    // Remove from plain or not???
  }

  get isDead() {
    return this._isDead;
  }
  get color() {
    return this._color;
  }
}
