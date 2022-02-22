import { CellContainers } from './cell_container'
import { RuleExtensionFactory } from './rule_extension_factory'
import { SerializableFamilyTree } from './serializable_plain_of_life'

/**
 * A family tree of cells: Provides a visualization on how branches of related cells evolve over time.
 */
export class FamilyTree {
  private _width = 0
  private _height = 0
  private _image: Uint8ClampedArray = new Uint8ClampedArray(0)

  /**
   * Transform a family tree to a serializable format (e.g. without cyclic object references).
   *
   * @returns a serializable format of the family tree as supported by {@link JSON.stringify}
   */
  toSerializable(): SerializableFamilyTree {
    return {
      width: this._width,
      height: this._height
    }
  }

  /**
   * Init a new family tree after creation.
   */
  initNew(width: number, height: number): void {
    this.checkSize(width, height)
    this._width = width
    this._height = height

    this._image = new Uint8ClampedArray(this._width*this._height*4) // *4 => 4 bytes per pixel (RGBA)
  }

  /**
   * Check the size of the family tree before setting it
   */
  private checkSize(width: number, height: number): void {
    if (width < 3) {
      throw new Error('The minimum width for a family tree is 3 but got ' + width)
    }

    if (height < 3) {
      throw new Error('The minimum height for a family tree is 3 but got ' + height)
    }

    if (!Number.isInteger(width) || !Number.isInteger(height)) {
      throw new Error('Width and height for a family tree must be integer numbers')
    }
  }

  /**
   * Init a family tree after creation from a serializable format as returned by {@link toSerializable}
   */
  initFromSerializable(serializable: SerializableFamilyTree): void {
    this.checkSize(serializable.width, serializable.height)
    this._width = serializable.width
    this._height = serializable.height
  }

  /**
   * Get the width of the family tree
   */
  get width(): number {
    return this._width
  }

  /**
   * Get the height of the family tree
   */
  get height(): number {
    return this._height
  }

  update(cellContainers: CellContainers<RuleExtensionFactory>, cellCount: number, currentTurn: bigint): void {
    if(currentTurn%50n == 0n){
      let t = Number(currentTurn / 50n)
    const x = Number( t % this._width ) * 4 // * 4 => 4 byte per pixel - RGBA
    const width4 = this._width * 4
    if( cellCount < this.height){
      let y = ((this.height-cellCount)/2|0) * width4
      for(const container of cellContainers){
        let i = x+y
        this._image[i++] = container.color[0]
        this._image[i++] = container.color[1]
        this._image[i++] = container.color[2]
        this._image[i] = 255
        y += width4
      }
    } else {
      const dy = (this._height/cellCount)
      let y = 0
      for(const container of cellContainers){
        let i = x + (y|0) * width4
        this._image[i++] = container.color[0]
        this._image[i++] = container.color[1]
        this._image[i++] = container.color[2]
        this._image[i] = 255
        y += dy
      }
    }
  }
  }

  get image() {
    return this._image
  }
}
