// From https://en.wikipedia.org/wiki/Flood_fill

// fn fill(x, y):
export function floodFill<T>(
  x: number,
  y: number,
  fillWith: T,
  plainToFill: T[][],
  plainWidth: number,
  plainHeight: number
): void {
  //   if not Inside(x, y) then return
  const toReplace = plainToFill[y][x]
  if (fillWith === toReplace) {
    return
  }

  // ####
  //   x += 256*plainWidth
  //   y += 256*plainHeight

  //   let s = new empty queue or stack
  // [startX, endX, y, parentY]
  const queue: Array<[number, number, number, number]> = []
  //   Add (x, x, y, 1) to s
  queue.push([x, x, y, 1])
  //   Add (x, x, y - 1, -1) to s
  queue.push([x, x, y - 1, -1])

  //   while s is not empty:
  while (queue.length > 0) {
    //     Remove an (x1, x2, y, dy) from s
    let line = queue.shift() as [number, number, number, number]
    let x1 = line[0]
    let x2 = line[1]
    let y = line[2]
    let dy = line[3]
    //     let x = x1
    let x = x1
    //     if Inside(x, y):
    if (plainToFill[y % plainHeight][x % plainWidth] === toReplace) {
      //       while Inside(x - 1, y):
      while (plainToFill[y % plainHeight][(x - 1) % plainWidth] === toReplace) {
        //         Set(x - 1, y)
        plainToFill[y % plainHeight][(x - 1) % plainWidth] = fillWith
        //         x = x - 1
        x -= 1
      }
    }
    //     if x < x1:
    if (x < x1) {
      //       Add (x, x1-1, y-dy, -dy) to s
      queue.push([x, x1 - 1, y - dy, -dy])
    }
    //     while x1 < x2:
    while (x1 < x2) {
      //       while Inside(x1, y):
      while (plainToFill[y % plainHeight][x1 % plainWidth] === toReplace) {
        //         Set(x1, y)
        plainToFill[y % plainHeight][x1 % plainWidth] = fillWith
        //         x1 = x1 + 1
        x1 += 1
      }
      //       Add (x, x1 - 1, y+dy, dy) to s
      queue.push([x, x1 - 1, y + dy, dy])
      //       if x1 - 1 > x2:
      if (x1 - 1 > x2) {
        //         Add (x2 + 1, x1 - 1, y-dy, -dy)
        queue.push([x2 + 1, x1 - 1, y - dy, -dy])
      }
      //       while x1 < x2 and not Inside(x1, y):
      while (x1 < x2 && plainToFill[y % plainHeight][x1 % plainWidth] !== toReplace) {
        //         x1 = x1 + 1
        x1 += 1
      }
      //       x = x1
      x = x1
    }
  }
}

// From https://github.com/pavelkukov/q-floodfill/blob/master/src/FloodFill.ts

// import {
//     isSameColor,
//     setColorAtPixel,
//     getColorAtPixel,
//     colorToRGBA,
//     ColorRGBA,
// } from './util/colorUtils'

// type PixelCoords = {
//     x: number
//     y: number
// }
type PixelCoords = {
  x: number
  y: number
}

// /**
//  * [startX, endX, y, parentY]
//  */
// type LineQueued = [number, number, number, number]
type LineQueued = [number, number, number, number]

// export default class FloodFill {
export class FloodFill<T> {
  //     public imageData: ImageData
  public imageData: T[][]
  //     public isSameColor: typeof isSameColor
  //     public setColorAtPixel: typeof setColorAtPixel
  //     public getColorAtPixel: typeof getColorAtPixel
  //     public colorToRGBA: typeof colorToRGBA
  //     public collectModifiedPixels = false
  //     public modifiedPixelsCount = 0
  //     public modifiedPixels: Set<string> = new Set()

  //     private _tolerance = 0
  //     private _queue: Array<LineQueued> = []
  private _queue: Array<LineQueued> = []
  //     private _replacedColor: ColorRGBA
  private _replacedColor!: T
  //     private _newColor: ColorRGBA
  private _newColor!: T

  //     constructor(imageData: ImageData) {
  //         this.imageData = imageData
  //         // Allow for custom implementations of the following methods
  //         this.isSameColor = isSameColor
  //         this.setColorAtPixel = setColorAtPixel
  //         this.getColorAtPixel = getColorAtPixel
  //         this.colorToRGBA = colorToRGBA
  //     }

  constructor(imageData: T[][]) {
    this.imageData = imageData
  }

  //     /**
  //      * color should be in CSS format - rgba, rgb, or HEX
  //      */
  //     public fill(color: string, x: number, y: number, tolerance: number): void {
  public fill(color: T, x: number, y: number): void {
    //         this._newColor = this.colorToRGBA(color)
    this._newColor = color
    //         this._replacedColor = this.getColorAtPixel(this.imageData, x, y)
    this._replacedColor = this.imageData[y][x]
    //         this._tolerance = tolerance
    //         if (
    //             this.isSameColor(
    //                 this._replacedColor,
    //                 this._newColor,
    //                 this._tolerance,
    //             )
    //         ) {
    //             return
    //         }
    if (this._newColor === this._replacedColor) {
      return
    }

    //         this.addToQueue([x, x, y, -1])
    this.addToQueue([x, x, y, -1])
    //         this.fillQueue()
    this.fillQueue()
    //     }
  }
  //     private addToQueue(line: LineQueued): void {
  //         this._queue.push(line)
  //     }
  private addToQueue(line: LineQueued): void {
    this._queue.push(line)
  }

  //     private popFromQueue(): LineQueued | null {
  //         if (!this._queue.length) {
  //             return null
  //         }
  //         return this._queue.pop()
  //     }
  private popFromQueue(): LineQueued | null {
    if (!this._queue.length) {
      return null
    }
    return this._queue.pop() as LineQueued
  }

  //     private isValidTarget(pixel: PixelCoords | null): boolean {
  //         if (pixel === null) {
  //             return
  //         }
  //         const pixelColor = this.getColorAtPixel(
  //             this.imageData,
  //             pixel.x,
  //             pixel.y,
  //         )
  //         return this.isSameColor(
  //             this._replacedColor,
  //             pixelColor,
  //             this._tolerance,
  //         )
  //     }

  private isValidTarget(pixel: PixelCoords | null): boolean {
    if (pixel === null) {
      return false
    }

    return this.imageData[pixel.y][pixel.x] === this._replacedColor
  }

  //     private fillLineAt(x: number, y: number): [number, number] {
  private fillLineAt(x: number, y: number): [number, number] {
    //         if (!this.isValidTarget({ x, y })) {
    //             return [-1, -1]
    //         }
    if (!this.isValidTarget({ x, y })) {
      return [-1, -1]
    }
    //         this.setPixelColor(this._newColor, { x, y })
    this.setPixelColor(this._newColor, { x, y })
    //         let minX = x
    let minX = x
    //         let maxX = x
    let maxX = x
    //         let px = this.getPixelNeighbour('left', minX, y)
    let px = this.getPixelNeighbour('left', minX, y)
    //         while (px && this.isValidTarget(px)) {
    while (px && this.isValidTarget(px)) {
      //             this.setPixelColor(this._newColor, px)
      this.setPixelColor(this._newColor, px)
      //             minX = px.x
      minX = px.x
      //             px = this.getPixelNeighbour('left', minX, y)
      px = this.getPixelNeighbour('left', minX, y)
      //         }
    }
    //         px = this.getPixelNeighbour('right', maxX, y)
    px = this.getPixelNeighbour('right', maxX, y)
    //         while (px && this.isValidTarget(px)) {
    while (px && this.isValidTarget(px)) {
      //             this.setPixelColor(this._newColor, px)
      this.setPixelColor(this._newColor, px)
      //             maxX = px.x
      maxX = px.x
      //             px = this.getPixelNeighbour('right', maxX, y)
      px = this.getPixelNeighbour('right', maxX, y)
      //         }
    }
    //         return [minX, maxX]
    return [minX, maxX]
    //     }
  }

  //     private fillQueue(): void {
  private fillQueue(): void {
    //         let line = this.popFromQueue()
    let line = this.popFromQueue()
    //         while (line) {
    while (line) {
      //             const [start, end, y, parentY] = line
      const [start, end, y, parentY] = line
      //             let currX = start
      let currX = start
      //             while (currX !== -1 && currX <= end) {
      while (currX !== -1 && currX <= end) {
        //                 const [lineStart, lineEnd] = this.fillLineAt(currX, y)
        const [lineStart, lineEnd] = this.fillLineAt(currX, y)
        //                 if (lineStart !== -1) {
        //                     if (
        //                         lineStart >= start &&
        //                         lineEnd <= end &&
        //                         parentY !== -1
        //                     ) {
        //                         if (parentY < y && y + 1 < this.imageData.height) {
        //                             this.addToQueue([lineStart, lineEnd, y + 1, y])
        //                         }
        //                         if (parentY > y && y > 0) {
        //                             this.addToQueue([lineStart, lineEnd, y - 1, y])
        //                         }
        //                     } else {
        //                         if (y > 0) {
        //                             this.addToQueue([lineStart, lineEnd, y - 1, y])
        //                         }
        //                         if (y + 1 < this.imageData.height) {
        //                             this.addToQueue([lineStart, lineEnd, y + 1, y])
        //                         }
        //                     }
        //                 }
        //                 if (lineEnd === -1 && currX <= end) {
        //                     currX += 1
        //                 } else {
        //                     currX = lineEnd + 1
        //                 }

        if (lineStart !== -1) {
          if (lineStart >= start && lineEnd <= end && parentY !== -1) {
            if (parentY < y && y + 1 < this.imageData.length) {
              this.addToQueue([lineStart, lineEnd, y + 1, y])
            }
            if (parentY > y && y > 0) {
              this.addToQueue([lineStart, lineEnd, y - 1, y])
            }
          } else {
            if (y > 0) {
              this.addToQueue([lineStart, lineEnd, y - 1, y])
            }
            if (y + 1 < this.imageData.length) {
              this.addToQueue([lineStart, lineEnd, y + 1, y])
            }
          }
        }
        if (lineEnd === -1 && currX <= end) {
          currX += 1
        } else {
          currX = lineEnd + 1
        }

        //             }
      }
      //             line = this.popFromQueue()
      line = this.popFromQueue()
      //         }
    }
    //     }
  }

  //     private setPixelColor(color: ColorRGBA, pixel: PixelCoords): void {
  //         this.setColorAtPixel(this.imageData, color, pixel.x, pixel.y)
  //         this.modifiedPixelsCount++
  //         this.collectModifiedPixels &&
  //             this.modifiedPixels.add(`${pixel.x}|${pixel.y}`)
  //     }

  private setPixelColor(color: T, pixel: PixelCoords): void {
    this.imageData[pixel.y][pixel.x] = color
    //        this.modifiedPixelsCount++
  }

  //     private getPixelNeighbour(
  //         direction: 'left' | 'right',
  //         x: number,
  //         y: number,
  //     ): PixelCoords | null {
  //         x = x | 0
  //         y = y | 0
  //         let coords: PixelCoords
  //         switch (direction) {
  //             case 'right':
  //                 coords = { x: (x + 1) | 0, y }
  //                 break
  //             case 'left':
  //                 coords = { x: (x - 1) | 0, y }
  //                 break
  //         }
  //         if (coords.x >= 0 && coords.x < this.imageData.width) {
  //             return coords
  //         }
  //         return null
  //     }

  private getPixelNeighbour(direction: 'left' | 'right', x: number, y: number): PixelCoords | null {
    x = x | 0
    y = y | 0
    let coords: PixelCoords
    switch (direction) {
      case 'right':
        coords = { x: (x + 1) | 0, y }
        break
      case 'left':
        coords = { x: (x - 1) | 0, y }
        break
    }
    
    if (coords.x >= 0 && coords.x < this.imageData[0].length) {
      return coords
    }
    return null
  }

  // }
}
