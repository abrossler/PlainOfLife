// Inspired by https://github.com/pavelkukov/q-floodfill/blob/master/src/FloodFill.ts

export type Point = { x: number; y: number }

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
   * Note that isEqual and replace don't work on deep attributes of an object if T is an object.
   *
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
  public fill(fillWith: T, x: number, y: number, filledPoints?: Point[]): number {
    this.filledCount = 0

    let toReplace: T = this.plainToFill[y][x]
    if (typeof toReplace === 'object') {
      toReplace = { ...toReplace } // Limitation: Only a shallow copy => isEqual() and replace() must not work on deep properties
    }

    if (this.isEqual(fillWith, toReplace)) {
      return this.filledCount
    }

    // Needed for support of torus topography
    x += FloodFill.maxTaping * this.plainWidth // Avoid x to become < 0 when leaving the plain to the left
    y += FloodFill.maxTaping * this.plainHeight // Avoid y to become < 0 when leaving the plain to the top

    this.queue.push([x, x, y, undefined])
    this.fillQueue(toReplace, fillWith, filledPoints)
    return this.filledCount
  }

  /**
   * Helper to fill the queue with lines to be processed
   */
  private fillQueue(toReplace: T, fillWith: T, filledPoints?: Point[]): void {
    let line = this.queue.pop()
    while (line) {
      const [minX, maxX, y, parentY] = line
      let currX = minX
      while (currX <= maxX) {
        const [lineStart, lineEnd] = this.fillLineAt(currX, y, toReplace, fillWith, filledPoints)
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
  private fillLineAt(
    x: number,
    y: number,
    toReplace: T,
    fillWith: T,
    filledPoints?: Point[]
  ): [number | undefined, number | undefined] {
    const adjustedY = y % this.plainHeight
    let adjustedX = x % this.plainWidth

    if (!this.isEqual(this.plainToFill[adjustedY][adjustedX], toReplace)) {
      return [undefined, undefined]
    }
    this.replace(this.plainToFill, fillWith, adjustedX, adjustedY)
    if (filledPoints) {
      filledPoints.push({ x: adjustedX, y: adjustedY })
    }
    this.filledCount++
    let minX = x
    let maxX = x

    let currX = minX - 1
    adjustedX = currX % this.plainWidth
    while (this.isEqual(this.plainToFill[adjustedY][adjustedX], toReplace)) {
      this.replace(this.plainToFill, fillWith, adjustedX, adjustedY)
      if (filledPoints) {
        filledPoints.push({ x: adjustedX, y: adjustedY })
      }
      this.filledCount++
      minX = currX--
      adjustedX = currX % this.plainWidth
    }

    currX = maxX + 1
    adjustedX = currX % this.plainWidth
    while (this.isEqual(this.plainToFill[adjustedY][adjustedX], toReplace)) {
      this.replace(this.plainToFill, fillWith, adjustedX, adjustedY)
      if (filledPoints) {
        filledPoints.push({ x: adjustedX, y: adjustedY })
      }
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
