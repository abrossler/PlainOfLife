/** {@link Direction} North */
export const North = 0
/** {@link Direction} East */
export const East = 1
/** {@link Direction} South */
export const South = 2
/** {@link Direction} West */
export const West = 3

/** 0 = North, 1 = East, 2 = South, 3 = West */
export type Direction = 0 | 1 | 2 | 3

/**
 * @returns the left turned heading - North becomes West, West becomes South, ...
 */
export function turnLeft(heading: Direction): Direction {
  switch (heading) {
    case North:
      return West
    case West:
      return South
    case South:
      return East
    case East:
      return North
  }
}

/**
 * @returns the right turned heading - North becomes East, East becomes South, ...
 */
export function turnRight(heading: Direction): Direction {
  switch (heading) {
    case North:
      return East
    case East:
      return South
    case South:
      return West
    case West:
      return North
  }
}

/**
 * Get for a given heading in an absolute direction (North, East, South or West) the relative directions in the order Ahead, ToRight, Back, ToLeft.
 *
 * Example: For a heading to the East the relative directions are
 * - Ahead = East
 * - ToRight = South
 * - Back = West
 * - ToLeft = North
 */
export function getRelativeDirections(heading: Direction): [Direction, Direction, Direction, Direction] {
  switch (heading) {
    case North:
      return [North, East, South, West]
    case East:
      return [East, South, West, North]
    case South:
      return [South, West, North, East]
    case West:
      return [West, North, East, South]
  }
}
