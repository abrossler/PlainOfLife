import { ExtPlainField, IntPlainField, PlainField } from './plain_field';
import { ExtensionProvider } from "./extension_provider";


/**
 * A plain of plain fields that can be accessed by their x and y coordinates.
 */
/*
 * The external plain can be used safely outside this module by omitting critical properties that could break the
 * internal structure when misused from outside
 */
export type ExtPlain<E extends ExtensionProvider> = Omit<Plain<E>, 'getAtInt' | 'init' | 'initFromSerializable' | 'toSerializable'>

/**
 * A plain of plain fields with a torus topography for module internal use only ({@link ExtPlain} is for for external use).
 */


export class Plain<E extends ExtensionProvider> {
  private readonly array: IntPlainField<E>[][];

  constructor(extensionProvider: ExtensionProvider, private _width: number, private _height: number) {
    if (_width < 2 || _height < 2) {
      throw new Error('Width and height of a plain must be at least 2');
    }
    //    this.array = new Array(_width).fill(new Array(_height).fill(new PlainField<E>(extensionProvider)))
    this.array = Array.from({ length: _width }, () => { return Array.from({ length: _height }, () => { return new PlainField<E>(extensionProvider) as IntPlainField<E>; }); });

  }

  /**
   * Get a plain field by it's x and y coordinates. The "plain" has a torus topography meaning that
   * if you leave the plain to the right (with a x coordinate value exceeding the plain size), you automatically enter it from
   * the left. The topography behaves accordingly when leaving to the left, top or bottom...
   */
  getAt(posX: number, posY: number): ExtPlainField<E> {
    return this.getAtInt(posX, posY);
  }

  getAtInt(posX: number, posY: number): IntPlainField<E> {
    return this.array[Plain.modulo(posX, this._width)][Plain.modulo(posY, this._height)];
  }

  /**
   * Get the width of the plain
   */
  get width() {
    return this._width;
  }

  /**
   * Get the height of the plain
   */
  get height() {
    return this._height;
  }

  /**
   * The modulo function working also for negative numbers as needed for a torus topography:
   *
   * ...-3%3=0  -2%3=1  -1%3=2  0%3=0  1%3=1  2%3=2  3%3=0  4%3=1...
   */
  static modulo(n: number, mod: number): number {
    while (n < 0) {
      n += mod;
    }
    return n % mod;
  }
}
