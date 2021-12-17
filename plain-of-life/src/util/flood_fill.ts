// Inspired by https://github.com/pavelkukov/q-floodfill/blob/master/src/FloodFill.ts

/**
 * A flood fill implementation filling an area of a plain considering 4 directions (left, right, top and bottom).
 *
 * For the plain a torus topography is assumed - leaving the plain at the top, you re-enter
 * it at the bottom, leaving it to the right, you re-enter it from the left. And vice versa...
 */
export class FloodFill<T> {
  private plainToFill: T[][]
  private plainWidth: number
  private plainHeight: number

  // Number of filled points on the plain with the latest fill run
  private filledCount = 0

  // Queue with information on lines during a fill run: minX, maxX, y, parentY
  private queue: Array<[number, number, number, number | undefined]> = []

  // Maximum number of tapings a shape can have in a torus topography (higher numbers break the flood fill algorithm)
  private static maxTaping = 256

  /**
   * @param plainToFill A 2D array of an arbitrary type T to be flood filled. Each line of the array is expected to have the same length
   * @param isEqual An optional custom comparison function - with {@link defaultIsEqual} as default (just comparing with ===)
   * @param replace An optional custom replacement function - with {@link defaultReplace} as default (just assigning with =)
   */
  constructor(
    plainToFill: T[][],
    private isEqual: (t1: T, t2: T) => boolean = defaultIsEqual,
    private replace: (plainToFill: T[][], fillWith: T, x: number, y: number) => void = defaultReplace
  ) {
    this.plainToFill = plainToFill
    this.plainWidth = plainToFill[0].length
    this.plainHeight = plainToFill.length
  }

  /**
   * Flood fill a plain starting at (x, y): Every neighbor of (x,y) on the plain that is equal to the current (x,y)
   * is replaced by fillWith
   * @returns The number of points that was filled
   */
  public fill(fillWith: T, x: number, y: number): number {
    this.filledCount = 0
    const toReplace = this.plainToFill[y][x]

    if (this.isEqual(fillWith, toReplace)) {
      return this.filledCount
    }

    // Needed for support of torus topography
    x += FloodFill.maxTaping * this.plainWidth // Avoid x to become < 0 when leaving the plain to the left
    y += FloodFill.maxTaping * this.plainHeight // Avoid y to become < 0 when leaving the plain to the top

    this.queue.push([x, x, y, undefined])
    this.fillQueue(toReplace, fillWith)
    return this.filledCount
  }

  /**
   * Helper to fill the queue with lines to be processed
   */
  private fillQueue(toReplace: T, fillWith: T): void {
    let line = this.queue.pop()
    while (line) {
      const [minX, maxX, y, parentY] = line
      let currX = minX
      while (currX <= maxX) {
        const [lineStart, lineEnd] = this.fillLineAt(currX, y, toReplace, fillWith)
        if (lineStart !== undefined && lineEnd !== undefined) {
          if (lineStart >= minX && lineEnd <= maxX && parentY !== undefined) {
            if (parentY < y) {
              this.queue.push([lineStart, lineEnd, y + 1, y])
            }
            if (parentY > y) {
              this.queue.push([lineStart, lineEnd, y - 1, y])
            }
          } else {
            this.queue.push([lineStart, lineEnd, y - 1, y])
            this.queue.push([lineStart, lineEnd, y + 1, y])
          }
        }
        if (lineEnd === undefined && currX <= maxX) {
          currX += 1
        } else if (lineEnd !== undefined) {
          currX = lineEnd + 1
        }
      }
      line = this.queue.pop()
    }
  }

  /**
   * Helper to actually fill a line from the queue
   * @returns min and max x of the line
   */
  private fillLineAt(x: number, y: number, toReplace: T, fillWith: T): [number | undefined, number | undefined] {
    const adjustedY = y % this.plainHeight

    if (!this.isEqual(this.plainToFill[adjustedY][x % this.plainWidth], toReplace)) {
      return [undefined, undefined]
    }
    this.replace(this.plainToFill, fillWith, x % this.plainWidth, adjustedY)
    this.filledCount++
    let minX = x
    let maxX = x

    let currX = minX - 1
    let adjustedX = currX % this.plainWidth
    while (this.isEqual(this.plainToFill[adjustedY][adjustedX], toReplace)) {
      this.replace(this.plainToFill, fillWith, adjustedX, adjustedY)
      this.filledCount++
      minX = currX--
      adjustedX = currX % this.plainWidth
    }

    currX = maxX + 1
    adjustedX = currX % this.plainWidth
    while (this.isEqual(this.plainToFill[adjustedY][adjustedX], toReplace)) {
      this.replace(this.plainToFill, fillWith, adjustedX, adjustedY)
      this.filledCount++
      maxX = currX++
      adjustedX = currX % this.plainWidth
    }
    return [minX, maxX]
  }
}

/**
 * Default === based comparison implementation
 */
function defaultIsEqual<T>(t1: T, t2: T): boolean {
  return t1 === t2
}

/**
 * Default replace implementation just replacing a point on the plain by fillWith.
 */
function defaultReplace<T>(plainToFill: T[][], fillWith: T, x: number, y: number): void {
  plainToFill[y][x] = fillWith
}

// For reference - flood fill with non-torus topography
// type QueuedLine = [number, number, number, number]

// export class FloodFill<T> {
//   public plainToFill: T[][]
//   private plainWidth: number
//   private plainHeight: number
//   public replacedCount = 0
//   private queue: Array<QueuedLine> = []
//   private toReplace!: T
//   private replaceWith!: T

//   constructor(plainToFill: T[][]) {
//     this.plainToFill = plainToFill
//     this.plainWidth = plainToFill[0].length
//     this.plainHeight = plainToFill.length
//   }

//   public fill(replaceWith: T, x: number, y: number): void {
//     this.replaceWith = replaceWith
//     this.toReplace = this.plainToFill[y][x]

//     if (this.replaceWith === this.toReplace) {
//       return
//     }

//     this.queue.push([x, x, y, -1])
//     this.fillQueue()
//   }

//   private fillQueue(): void {
//     let line = this.queue.pop()
//     while (line) {
//       const [minX, maxX, y, parentY] = line
//       let currX = minX
//       while (/*currX !== -1 &&*/ currX <= maxX) {
//         // currX !== -1 most likely not needed
//         const [lineStart, lineEnd] = this.fillLineAt(currX, y)
//         if (lineStart !== undefined && lineEnd !== undefined) {
//           if (lineStart >= minX && lineEnd <= maxX && parentY !== -1) {
//             if (parentY < y && y + 1 < this.plainHeight) {
//               this.queue.push([lineStart, lineEnd, y + 1, y])
//             }
//             if (parentY > y && y > 0) {
//               this.queue.push([lineStart, lineEnd, y - 1, y])
//             }
//           } else {
//             if (y > 0) {
//               this.queue.push([lineStart, lineEnd, y - 1, y])
//             }
//             if (y + 1 < this.plainHeight) {
//               this.queue.push([lineStart, lineEnd, y + 1, y])
//             }
//           }
//         }
//         if (lineEnd === undefined && currX <= maxX) {
//           currX += 1
//         } else if (lineEnd !== undefined) {
//           currX = lineEnd + 1
//         }
//       }
//       line = this.queue.pop()
//     }
//   }

//   private fillLineAt(x: number, y: number): [number | undefined, number | undefined] {
//     if (this.plainToFill[y][x] !== this.toReplace) {
//       return [undefined, undefined]
//     }
//     this.replace(this.replaceWith, x, y)
//     let minX = x
//     let maxX = x

//     let currX = minX - 1
//     while (currX >= 0 && this.plainToFill[y][currX] === this.toReplace) {
//       this.replace(this.replaceWith, currX, y)
//       minX = currX
//       currX -= 1
//     }

//     currX = maxX + 1
//     while (currX < this.plainWidth && this.plainToFill[y][currX] === this.toReplace) {
//       this.replace(this.replaceWith, currX, y)
//       maxX = currX
//       currX += 1
//     }
//     return [minX, maxX]
//   }

//   private replace(color: T, x: number, y: number): void {
//     this.plainToFill[y][x] = color
//     this.replacedCount++
//   }
// }
