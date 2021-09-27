import { Rules } from '../core/rules'
import { Plain } from '../core/rules'
import { CellRecord, CellRecords } from '../core/rules'
import { Cell } from '../core/cell'

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

  getPlainFieldExtension(): { temperature: number, owner: CellRecord<DemoRules> | null } {
    return { temperature: 25, owner: null }
  }

  initNew(width: number, height: number, Cell: new () => Cell): this {
    super.initNew( width, height, Cell )
    const plainField = this.getPlain().getAt(width/2, height/2)
    plainField.owner = plainField.getCellRecords()[0]

    return this
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

  initNew(width: number, height: number, Cell: new () => Cell): this {
    super.initNew( width, height, Cell )
    const plainField = this.getPlain().getAt(width/2, height/2)
    plainField.owner = plainField.getCellRecords()[0]

    return this
  }
}
