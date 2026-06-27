/**
 * Remove elements equal to (===) toRemove from array
 * @returns number of removed elements
 */
export function removeFromArray<T>(toRemove: T, removeFrom: T[]): number {
  let count = 0
  for (let i = 0; i < removeFrom.length; i++) {
    if (removeFrom[i] === toRemove) {
      removeFrom.splice(i--, 1)
      count++
    }
  }

  return count
}
