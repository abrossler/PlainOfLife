import {Rules} from './rules'

export class PlainOfLife<R extends Rules<R> > {
    private _currentTurn = 0n

    constructor( private rules: R ) { }

    executeTurn(): boolean {
        let cellRecords = this.rules.getCellRecords()
        if( cellRecords === null ){
            return false // All cells are dead, game over
        }

        this.rules.executeTurn(  this.rules.getPlain(), cellRecords )
        this._currentTurn++
        return true
    }

    get currentTurn( ) { return this._currentTurn }
}
