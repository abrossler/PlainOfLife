import { checkInt } from './type_checks'

export class Indexer<T> {
  private ts: T[] = []

  constructor(ts?: Iterable<T>) {
    if (ts) {
      this.ts = Array.from(ts)
    }
  }

  getIndex(t: T): number {
    const i = this.ts.indexOf(t)
    if (i === -1) {
      this.ts.push(t)
      return this.ts.length - 1
    }
    return i
  }

  get(index: number): T {
    checkInt(index, 0, this.ts.length - 1)
    return this.ts[index]
  }

  get length(): number {
    return this.ts.length
  }

  *[Symbol.iterator](): Iterator<T> {
    for (const t of this.ts) {
      yield t
    }
  }
}
