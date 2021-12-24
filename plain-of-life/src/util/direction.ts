export type Direction = 'UP' | 'DOWN' | 'RIGHT' | 'LEFT'

/**
 * Returns the positions (X, Y coordinates) of the four neighbors depending on the heading in this order:
 *
 * Ahead, Behind, Left, Right
 */
export function get4Neighbors(
  x: number,
  y: number,
  heading: Direction
): [number, number, number, number, number, number, number, number] {
  switch (heading) {
    case 'UP': {
      return [x, y - 1, x, y + 1, x - 1, y, x + 1, y]
    }
    case 'DOWN': {
      return [x, y + 1, x, y - 1, x + 1, y, x - 1, y]
    }
    case 'RIGHT': {
      return [x + 1, y, x - 1, y, x, y - 1, x, y + 1]
    }
    case 'LEFT': {
      return [x - 1, y, x + 1, y, x, y + 1, x, y - 1]
    }
  }
}

/**
 * @returns the left turned heading - UP becomes LEFT, LEFT becomes DOWN, ...
 */
export function turnLeft(heading: Direction): Direction {
  switch (heading) {
    case 'UP':
      return 'LEFT'
    case 'LEFT':
      return 'DOWN'
    case 'DOWN':
      return 'RIGHT'
    case 'RIGHT':
      return 'UP'
  }
}

/**
 * @returns the right turned heading - UP becomes RIGHT, RIGHT becomes DOWN, ...
 */
export function turnRight(heading: Direction): Direction {
  switch (heading) {
    case 'UP':
      return 'RIGHT'
    case 'RIGHT':
      return 'DOWN'
    case 'DOWN':
      return 'LEFT'
    case 'LEFT':
      return 'UP'
  }
}
