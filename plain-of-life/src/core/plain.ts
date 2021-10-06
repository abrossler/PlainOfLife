import { ExtPlainField, PlainField } from './plain_field'
import { RuleExtensionFactory } from './rule_extension_factory'

/**
 * A plain of plain fields that can be accessed by their x and y coordinates.
 */
/*
 * The external plain exposes all properties and methods that make sense (and safely can be used) outside the
 * POL core
 */
export type ExtPlain<E extends RuleExtensionFactory> = Pick<Plain<E>, 'getAt' | 'width' | 'height'>

/**
 * A plain of plain fields with a torus topography for POL core internal use only ({@link ExtPlain} is for for external use).
 */
export class Plain<E extends RuleExtensionFactory> {
  private readonly array: PlainField<E>[][]

  /**
   * Create a new plain of new plain fields with the size width x height
   */
  constructor(fieldRecordFactory: RuleExtensionFactory, private _width: number, private _height: number) {
    this.array = Array.from({ length: _width }, () => {
      return Array.from({ length: _height }, () => {
        return new PlainField<E>(fieldRecordFactory)
      })
    })
  }

  /**
   * Get a plain field by it's x and y coordinates. The "plain" has a torus topography meaning that
   * if you leave the plain to the right (with a x coordinate value exceeding the plain size), you automatically enter it from
   * the left. The topography behaves accordingly when leaving to the left, top or bottom...
   */
  getAt(posX: number, posY: number): ExtPlainField<E> {
    return this.getAtInt(posX, posY)
  }

  /**
   * Get a plain field for POL core internal usage by it's x and y coordinates
   */
  getAtInt(posX: number, posY: number): PlainField<E> {
    return this.array[Plain.modulo(posX, this._width)][Plain.modulo(posY, this._height)]
  }

  /**
   * Get the width of the plain
   */
  get width(): number {
    return this._width
  }

  /**
   * Get the height of the plain
   */
  get height(): number {
    return this._height
  }

  /**
   * The modulo function working also for negative numbers as needed for a torus topography:
   *
   * ...-3%3=0  -2%3=1  -1%3=2  0%3=0  1%3=1  2%3=2  3%3=0  4%3=1...
   */
  static modulo(n: number, mod: number): number {
    while (n < 0) {
      n += mod
    }
    return n % mod
  }
}
