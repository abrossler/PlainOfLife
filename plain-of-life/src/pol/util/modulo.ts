/**
 * The modulo function working also for negative numbers as needed for a torus topography:
 *
 * ...-3%3=0  -2%3=1  -1%3=2  0%3=0  1%3=1  2%3=2  3%3=0  4%3=1...
 */
export function modulo(n: number, mod: number): number {
  while (n < 0) {
    n += mod
  }
  return n % mod
}
