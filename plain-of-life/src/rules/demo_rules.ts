import { Rules } from '../core/rules'
import { Plain } from '../core/rules'
import { CellRecord, CellRecords } from '../core/rules'

export class DemoRules extends Rules<DemoRules> {
  executeTurn(plain: Plain<DemoRules>, cellRecords: CellRecords<DemoRules>): void {
    for (const record of cellRecords) {
      record.makeChild(1, 1)
      plain.getAt(0, 0).owner = record
    }
  }

  getCellRecordExtension(): { energy: number } {
    return { energy: 0 }
  }

  getPlainFieldExtension(): { owner: CellRecord<DemoRules> | null } {
    return { owner: null }
  }
}

export class DemoRules2 extends Rules<DemoRules> {
  executeTurn(plain: Plain<DemoRules>, cellRecords: CellRecords<DemoRules>): void {
    for (const record of cellRecords) {
      record.makeChild(1, 1)
      plain.getAt(0, 0).owner = record
    }
  }

  getCellRecordExtension(): { energy: number } {
    return { energy: 0 }
  }

  getPlainFieldExtension(): { owner: CellRecord<DemoRules> | null } {
    return { owner: null }
  }
}
