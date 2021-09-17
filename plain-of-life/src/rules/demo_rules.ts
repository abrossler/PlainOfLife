import {ExtensionProvider, Rules} from '../core/rules' 
import {ExtPlain} from '../core/rules'
import {ExtCellRecord, CellRecords} from '../core/rules'


export class DemoRules extends Rules<DemoRules> implements ExtensionProvider{
    executeTurn( plain: ExtPlain<DemoRules>, cellRecords: CellRecords<DemoRules> ): void {
        for( const record of cellRecords ){
            record.makeChild( 1, 1 )
            plain.getAt(0,0).owner = record
        }
    }

    getCellRecordExtension(): { energy: number} {
        return { energy: 0 }
    }

    getPlainFieldExtension(): {owner:ExtCellRecord<DemoRules> | null} {
        return { owner: null }
    }
}

export class DemoRules2 extends Rules<DemoRules> {
    executeTurn( plain: ExtPlain<DemoRules>, cellRecords: CellRecords<DemoRules> ): void {
        for( const record of cellRecords ){
            record.makeChild( 1, 1 )
            plain.getAt(0,0).owner = record
        }
    }

    getCellRecordExtension(): { energy: number} {
        return { energy: 0 }
    }

    getPlainFieldExtension(): {owner:ExtCellRecord<DemoRules> | null} {
        return { owner: null }
    }
}


