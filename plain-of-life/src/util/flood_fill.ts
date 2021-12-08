// From https://github.com/pavelkukov/q-floodfill/blob/master/src/FloodFill.ts

// /**
//  * [startX, endX, y, parentY]
//  */
type QueuedLine = [number, number, number, number]

export class FloodFill<T> {
  public plainToFill: T[][]
  private plainWidth: number
  private plainHeight: number
  public replacedCount = 0
  private queue: Array<QueuedLine> = []
  private toReplace!: T
  private replaceWith!: T

  constructor(plainToFill: T[][]) {
    this.plainToFill = plainToFill
    this.plainWidth = plainToFill[0].length
    this.plainHeight = plainToFill.length
  }

  public fill(replaceWith: T, x: number, y: number): void {
    this.replaceWith = replaceWith
    this.toReplace = this.plainToFill[y][x]

    if (this.replaceWith === this.toReplace) {
      return
    }

    this.queue.push([x, x, y, -1])
    this.fillQueue()
  }

  private fillQueue(): void {
    let line = this.queue.pop()
    while (line) {
      const [minX, maxX, y, parentY] = line
      let currX = minX
      while (/*currX !== -1 &&*/ currX <= maxX) {
        // currX !== -1 most likely not needed
        const [lineStart, lineEnd] = this.fillLineAt(currX, y)
        if (lineStart !== undefined && lineEnd !== undefined) {
          if (lineStart >= minX && lineEnd <= maxX && parentY !== -1) {
            if (parentY < y && y + 1 < this.plainHeight) {
              this.queue.push([lineStart, lineEnd, y + 1, y])
            }
            if (parentY > y && y > 0) {
              this.queue.push([lineStart, lineEnd, y - 1, y])
            }
          } else {
            if (y > 0) {
              this.queue.push([lineStart, lineEnd, y - 1, y])
            }
            if (y + 1 < this.plainHeight) {
              this.queue.push([lineStart, lineEnd, y + 1, y])
            }
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

  private fillLineAt(x: number, y: number): [number | undefined, number | undefined] {
    if (this.plainToFill[y][x] !== this.toReplace) {
      return [undefined, undefined]
    }
    this.replace(this.replaceWith, x, y)
    let minX = x
    let maxX = x

    let currX = minX - 1
    while (currX >= 0 && this.plainToFill[y][currX] === this.toReplace) {
      this.replace(this.replaceWith, currX, y)
      minX = currX
      currX -= 1
    }

    currX = maxX + 1
    while (currX < this.plainWidth && this.plainToFill[y][currX] === this.toReplace) {
      this.replace(this.replaceWith, currX, y)
      maxX = currX
      currX += 1
    }
    return [minX, maxX]
  }

  private replace(color: T, x: number, y: number): void {
    this.plainToFill[y][x] = color
    this.replacedCount++
  }
}
