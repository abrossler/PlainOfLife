import { CellRecords, Rules } from './rules'

export class FamilyTree<R extends Rules<R>> {
  update(cellRecords: CellRecords<R> | null): void {
    if (cellRecords === null) {
      return
    }

    for (const record in cellRecords) {
      // ToDo
    }
  }
}
