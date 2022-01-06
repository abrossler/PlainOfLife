/**
 * Get an integer pseudo-random number >= min and < max
 * @param min
 * @param max
 * @returns random number
 */
export function randIntBetween(min: number, max: number): number {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min)) + min
}

/**
 * Get an integer pseudo-random number between 0 and max (exclusive)
 * @param max
 * @returns random number
 */
export function randIntTo(max: number): number {
  return Math.floor(Math.random() * max)
}
