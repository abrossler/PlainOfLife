import { decode, encode } from 'base64-arraybuffer'
import { CellContainer, CellContainers } from './cell_container'
import { RuleExtensionFactory } from './rule_extension_factory'
import { SerializableFamilyTree } from './serializable_plain_of_life'

const R = 0, // Red
  G = 1, // Green
  B = 2, // Blue
  A = 3, // Alpha (transparency)
  COUNT = 4 // Number of contributing cells
const halfPenWidth = 1 // Shall be >= 1, otherwise artifacts with alpha < 255 in fully covered areas

/**
 * A family tree of plain of life cells: Provides a visualization on how branches of related cells evolve over time.
 */
export class FamilyTree {
  /** Width of the family tree images in pixels */
  private _width = 0
  /** Height of the family tree images in pixels */
  private _height = 0
  /** Scale of each image: Every scale'th turn is one pixel column in the image */
  private scales = [1, 3, 10, 30, 100, 300, 1000, 3000, 10000]
  /** Human readable name for each scale */
  private scaleNames: string[] = []
  /** Smoothing of the cell positions for each scale */
  private smoothing = [1, 1, 3, 40, 40, 60, 80, 100, 110]
  /** The images of the family tree for all scales as RGBA arrays */
  private _images: Uint8ClampedArray[] = []

  /**
   * Transform a family tree to a serializable format (e.g. by a base4 encoding of the image data)
   *
   * @returns a serializable format of the family tree as supported by {@link JSON.stringify}
   */
  toSerializable(): SerializableFamilyTree {
    const encodedImages: string[] = []
    this._images.forEach((image) => {
      encodedImages.push(encode(image))
    })

    return {
      width: this._width,
      height: this._height,
      images: encodedImages
    }
  }

  /**
   * Init a new family tree after creation.
   */
  initNew(width: number, height: number): void {
    this.checkSize(width, height)
    this._width = width
    this._height = height

    this.scales.forEach(() => {
      this._images.push(new Uint8ClampedArray(this._width * this._height * 4)) // *4 => 4 bytes per pixel (RGBA)
    })
    this.createScaleNames()
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
    const imageArrayLength = this._width * this._height * 4 // *4 => 4 bytes per pixel (RGBA)
    serializable.images.forEach((imageAsString) => {
      const array = new Uint8ClampedArray(decode(imageAsString))
      if (array.length !== imageArrayLength) {
        throw new Error('Image size does not fit family tree width and height')
      }
      this._images.push(array)
    })
    this.createScaleNames()
  }

  /**
   * Get the width of the family tree in pixels
   */
  get width(): number {
    return this._width
  }

  /**
   * Get the height of the family tree in pixels
   */
  get height(): number {
    return this._height
  }

  /**
   * Update the family tree after each execution of a plain of life turn
   * @param cellContainers The containers of all alive cells
   * @param containerCount The number of all alive cells
   * @param currentTurn The number of the current turn
   */
  update(cellContainers: CellContainers<RuleExtensionFactory>, containerCount: number, currentTurn: bigint): void {
    // Update the images of the family tree for all scales
    for (let currentScale = 0; currentScale < this.scales.length; currentScale++) {
      // If the current scale is to be updated in the current turn...
      if (currentTurn % BigInt(this.scales[currentScale]) === 0n) {
        /** The new pixel column as Uint32 array allowing to sum per pixel the RGB values of multiple cells */
        const newColumn = new Uint32Array(this.height * 5) // * 5 => R, G, B, A and count of cells contributing to this value
        /** The weight of the cell's old position in the family tree when calculating the smoothed new position */
        const weightOldPos = 1 - 1 / this.smoothing[currentScale]
        /** The weight of the cells current scale independent position in the family tree when calculating the smoothed new position  */
        const weightCurrentPos = this.height / (this.smoothing[currentScale] * containerCount)
        /**
         * The x-position of the new column in the family tree image array.
         * Note that the position is modulo the family tree width: If the right end of the image is reached,
         * it continues from the very left...
         */
        const x = Number((currentTurn / BigInt(this.scales[currentScale])) % BigInt(this._width)) * 4 // * 4 => 4 byte per pixel - RGBA
        const width4 = this._width * 4
        const image = this._images[currentScale]

        let containerNumber = 0
        /** The new smoothed position of the current container in the family tree */
        let newPosition
        for (const container of cellContainers) {
          // Calculate the new position of the cell in the family tree
          const oldPosition = (container as CellContainer<RuleExtensionFactory>).positionsInFamilyTree[currentScale]
          // If there is at least room for one pixel height per cell...
          if (containerCount <= this.height) {
            newPosition = // The new position is...
              oldPosition * weightOldPos + // ... the weighted old position plus ...
              ((this.height - containerCount) / 2 + containerNumber) / this.smoothing[currentScale] // ... the smoothed current position assuming 1 pixel height per cell
          }
          // If there is less room than 1 pixel per cell
          else {
            newPosition = // The new position is...
              oldPosition * weightOldPos + // ... the weighted old position plus ...
              containerNumber * weightCurrentPos // the weighted current position
          }

          // Paint the current cell to the the new column of the family tree
          /** Sub-pixel exact position from were to fill the new column */
          let from
          /** Sub-pixel exact position to were to fill the new column */
          let to
          if (Math.abs(newPosition - oldPosition) < 1) {
            from = newPosition - halfPenWidth
            to = newPosition + halfPenWidth
          } else {
            if (newPosition < oldPosition) {
              from = newPosition - halfPenWidth
              to = oldPosition - 1 + halfPenWidth
            } else {
              from = oldPosition + 1 - halfPenWidth
              to = newPosition + halfPenWidth
            }
          }

          /** Pixel exact min y position from were to fill the new column */
          const minY = Math.floor(from)
          /** Pixel exact max y position to were to fill the new column */
          const maxY = Math.ceil(to)
          // For all pixel to be filled...
          for (let y = minY; y < maxY; y++) {
            let i = y * 5
            // Add the color of the cell to each pixel
            newColumn[i++] += container.color[R]
            newColumn[i++] += container.color[G]
            newColumn[i++] += container.color[B]
            // The alpha values don't sum up. The alpha value is just the max alpha value for all cells contributing to the pixel
            // For the top pixel the alpha value corresponds to the share of the pixel that is covered by 'from'.
            if (y === minY) {
              newColumn[i] = Math.max(newColumn[i], (minY + 1 - from) * 255)
            }
            // The same for the bottom pixel, but just from the other side.
            else if (y === maxY - 1) {
              newColumn[i] = Math.max(newColumn[i], (to + 1 - maxY) * 255)
            }
            // All other pixels in the middle are fully opaque
            else {
              newColumn[i] = 255
            }
            i++
            // Increase the number of cells contributing to this pixel
            newColumn[i]++
          }

          ;(container as CellContainer<RuleExtensionFactory>).positionsInFamilyTree[currentScale] = newPosition
          containerNumber++
        }

        // Calculate the actual colors from the data in 'newColumn' and update the image
        for (let y = 0; y < this.height; y++) {
          let j = x + y * width4
          const i = y * 5
          // The colors are calculated as average color from all contributing cells
          image[j++] = newColumn[i + R] / newColumn[i + COUNT]
          image[j++] = newColumn[i + G] / newColumn[i + COUNT]
          image[j++] = newColumn[i + B] / newColumn[i + COUNT]
          image[j] = newColumn[i + A]
        }
      }
    }
  }

  /**
   * Get the current image for a given scale name as provided by {@link getScales}
   */
  getImage(scaleName: string) {
    return this._images[this.scaleNames.indexOf(scaleName)]
  }

  /**
   * Get the human readable names of all scales supported by the family tree
   */
  getScales() {
    return this.scaleNames.slice()
  }

  /**
   * Get the x position where the image (for the given scale) of the family tree is cut for the current turn:
   *
   * The family tree images are painted from left to right and if the total x position exceeds the width of the image,
   * it continues painting from the very left (actually painting the column at total x modulo width). At this position
   * the image is cut...
   */
  getFamilyTreeImageCutX(currentTurn: bigint, scaleName: string): number {
    const scale = this.scales[this.scaleNames.indexOf(scaleName)]
    const totalX = currentTurn / BigInt(scale)
    // The full image width of the family tree is not yet filled, thus there is no cut
    if (totalX < BigInt(this._width)) {
      return 0
    }
    // The cut is at the column next right to the current total x position modulo the family tree width
    return Number(totalX % BigInt(this._width)) + 1
  }

  /**
   * @returns The initial positions of a cell container in the family tree per scale
   */
  getInitialCellContainerPositions() {
    const result: number[] = []
    const pos = (this._height - 1) / 2
    this.scales.forEach(() => result.push(pos))
    return result
  }

  /**
   * Create a human readable name for each scale
   */
  private createScaleNames() {
    this.scales.forEach((scale) => this.scaleNames.push('1 : ' + scale))
  }
}
