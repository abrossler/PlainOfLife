// import {Cell} from './cell'

// export abstract class Rules<R extends Rules<R>> {
//     private plain: Plain<R>
//     private firstCellRecord: IntCellRecord<R>

//     constructor( width: number, height: number, seedCell: Cell ) {
//         let posX = width/2
//         let posY = height/2
//         this.plain = new Plain<R>( this, width, height )
//         this.firstCellRecord = new CellRecord<R>( this ) as IntCellRecord<R>
//         this.firstCellRecord.init( this.plain, seedCell, posX, posY )
//         this.plain.getAtInt(posX, posY).addCellRecord( this.firstCellRecord )
//     }

//     getPlain():ExtPlain<R> { return this.plain }
//     getCellRecords(): CellRecords<R> | null {
//         while( this.firstCellRecord.isDead ) {
//             this.firstCellRecord = this.firstCellRecord.next
            
//             // Only one last dead cell remaining => game over
//             if( this.firstCellRecord.isDead && this.firstCellRecord === this.firstCellRecord.next ) {
//                 return null
//             }
//         }
//         return new CellRecords( this.firstCellRecord )

//     }

//     abstract executeTurn( plain: ExtPlain<R>, cellRecords: CellRecords<R> ): void

//     abstract getCellRecordExtension(): Record<string, unknown>
//     abstract getPlainFieldExtension(): Record<string, unknown>
// }

// export type ExtPlain<R extends Rules<R>> = Omit< Plain<R>, 'getAtInt' >

// class Plain<R extends Rules<R>> {
//     private readonly array: IntPlainField<R>[][]

//     constructor( extensionProvider: PlainFieldExtensionProvider, private width: number, private height: number ) {
//         this.array = new Array(width).fill( new Array(height). fill( new PlainField<R>( extensionProvider ) ) )
//     }

//     getAt( posX: number, posY: number ):ExtPlainField<R> {
//         return this.getAtInt( posX, posY )
//     }

//     getAtInt( posX: number, posY: number ):IntPlainField<R> {
//         return this.array[ Plain.modulo(posX, this.width) ][ Plain.modulo(posY, this.height) ]
//     }

//     private static modulo( n:number, mod:number ): number {
//         while(n<0) { n += mod }
//         return n%mod
//     }
// }

// type IntPlainField<R extends Rules<R>> = PlainField<R> & ReturnType<R['getPlainFieldExtension']>
// export type ExtPlainField<R extends Rules<R>> = Omit< IntPlainField<R>, 'addCellRecord' | 'removeCellRecord' | 'getAtInt' >

// class PlainField<R extends Rules<R>> {
//     private cellRecords: IntCellRecord<R>[] = []

//     constructor( extensionProvider: PlainFieldExtensionProvider ) {
//         Object.assign(this, extensionProvider.getPlainFieldExtension())
//     }

//     addCellRecord( toAdd: IntCellRecord<R> ): void {
//         this.cellRecords.push( toAdd )
//     }

//     removeCellRecord( toRemove: IntCellRecord<R> ): void {
//         this.cellRecords.splice( this.cellRecords.findIndex( cr => cr === toRemove ))
//     }

//     getCellRecords(): Readonly<ExtCellRecord<R>[]> {
//         return this.cellRecords
//     }
// }

// type IntCellRecord<R extends Rules<R>> = CellRecord<R> & ReturnType<R['getCellRecordExtension']>
// export type ExtCellRecord<R extends Rules<R>> = Omit< IntCellRecord<R>, 'init' | 'next' >

// export class CellRecords<R extends Rules<R>> {

//     constructor( private first: IntCellRecord<R> ) { }
//     *[Symbol.iterator](): Iterator<ExtCellRecord<R>> { for( let r = this.first; r.next !== this.first; r = r.next) { yield r } }
// }

// class CellRecord<R extends Rules<R>> {

//     private _prev!: IntCellRecord<R>
//     private _next!: IntCellRecord<R>
//     private _posX!: number
//     private _posY!: number
//     private cell!: Cell
//     private plain!: Plain<R>
//     private _isDead: boolean = false
//     private _color = 0

//     constructor( private extensionProvider: CellRecordExtensionProvider ) {
//         Object.assign(this, extensionProvider.getCellRecordExtension())
//     }

//     init(plain: Plain<R>, cell:Cell, posX: number, posY: number) {
//         this._prev = this._next = this as IntCellRecord<R>
//         this.plain = plain
//         this.cell = cell
//         this._posX = posX
//         this._posY = posY
//     }

//     get next(){ return this._next }
//     get posX(){ return this._posX }
//     get posY(){ return this._posY }

//     makeChild( childPosX: number, childPosY: number ): ExtCellRecord<R> {
//         let childRecord = new CellRecord<R>(this.extensionProvider) as IntCellRecord<R>
//         childRecord.plain = this.plain
//         childRecord.cell = this.cell.makeChild()
//         childRecord._posX = childPosX
//         childRecord._posY = childPosY

//         childRecord._prev = this._prev
//         childRecord._next = this as IntCellRecord<R>
//         this._prev._next = childRecord
//         this._prev = childRecord

//         this.plain.getAtInt( childPosX, childPosY).addCellRecord( childRecord )
//         return childRecord
//     }

//     die( ) {
//         this._prev._next = this._next
//         this._next._prev = this._prev
//         this._isDead = true
//     }

//     get isDead() { return this._isDead }
//     get color() { return this._color }

// }

// type CellRecordExtensionProvider = { getCellRecordExtension: () => Record<string, unknown> }
// type PlainFieldExtensionProvider = { getPlainFieldExtension: () => Record<string, unknown> }

import {Cell} from './cell'

export abstract class Rules<E extends ExtensionProvider> {
    private plain: Plain<E>
    private firstCellRecord: IntCellRecord<E>

    constructor( width: number, height: number, seedCell: Cell ) {
        let posX = width/2
        let posY = height/2
        this.plain = new Plain<E>( this, width, height )
        this.firstCellRecord = new CellRecord<E>( this ) as IntCellRecord<E>
        this.firstCellRecord.init( this.plain, seedCell, posX, posY )
        this.plain.getAtInt(posX, posY).addCellRecord( this.firstCellRecord )
    }

    getPlain():ExtPlain<E> { return this.plain }
    getCellRecords(): CellRecords<E> | null {
        while( this.firstCellRecord.isDead ) {
            this.firstCellRecord = this.firstCellRecord.next
            
            // Only one last dead cell remaining => game over
            if( this.firstCellRecord.isDead && this.firstCellRecord === this.firstCellRecord.next ) {
                return null
            }
        }
        return new CellRecords( this.firstCellRecord )

    }

    abstract executeTurn( plain: ExtPlain<E>, cellRecords: CellRecords<E> ): void

    abstract getCellRecordExtension(): Record<string, unknown>
    abstract getPlainFieldExtension(): Record<string, unknown>
}

export type ExtPlain<E extends ExtensionProvider> = Omit< Plain<E>, 'getAtInt' >

class Plain<E extends ExtensionProvider> {
    private readonly array: IntPlainField<E>[][]

    constructor( extensionProvider: ExtensionProvider, private width: number, private height: number ) {
        this.array = new Array(width).fill( new Array(height). fill( new PlainField<E>( extensionProvider ) ) )
    }

    getAt( posX: number, posY: number ):ExtPlainField<E> {
        return this.getAtInt( posX, posY )
    }

    getAtInt( posX: number, posY: number ):IntPlainField<E> {
        return this.array[ Plain.modulo(posX, this.width) ][ Plain.modulo(posY, this.height) ]
    }

    private static modulo( n:number, mod:number ): number {
        while(n<0) { n += mod }
        return n%mod
    }
}

type IntPlainField<E extends ExtensionProvider> = PlainField<E> & ReturnType<E['getPlainFieldExtension']>
export type ExtPlainField<E extends ExtensionProvider> = Omit< IntPlainField<E>, 'addCellRecord' | 'removeCellRecord' | 'getAtInt' >

class PlainField<E extends ExtensionProvider> {
    private cellRecords: IntCellRecord<E>[] = []

    constructor( extensionProvider: ExtensionProvider ) {
        Object.assign(this, extensionProvider.getPlainFieldExtension())
    }

    addCellRecord( toAdd: IntCellRecord<E> ): void {
        this.cellRecords.push( toAdd )
    }

    removeCellRecord( toRemove: IntCellRecord<E> ): void {
        this.cellRecords.splice( this.cellRecords.findIndex( cr => cr === toRemove ))
    }

    getCellRecords(): Readonly<ExtCellRecord<E>[]> {
        return this.cellRecords
    }
}

type IntCellRecord<E extends ExtensionProvider> = CellRecord<E> & ReturnType<E['getCellRecordExtension']>
export type ExtCellRecord<E extends ExtensionProvider> = Omit< IntCellRecord<E>, 'init' | 'next' >

export class CellRecords<E extends ExtensionProvider> {

    constructor( private first: IntCellRecord<E> ) { }
    *[Symbol.iterator](): Iterator<ExtCellRecord<E>> { for( let r = this.first; r.next !== this.first; r = r.next) { yield r } }
}

class CellRecord<E extends ExtensionProvider> {

    private _prev!: IntCellRecord<E>
    private _next!: IntCellRecord<E>
    private _posX!: number
    private _posY!: number
    private cell!: Cell
    private plain!: Plain<E>
    private _isDead: boolean = false
    private _color = 0

    constructor( private extensionProvider: ExtensionProvider ) {
        Object.assign(this, extensionProvider.getCellRecordExtension())
    }

    init(plain: Plain<E>, cell:Cell, posX: number, posY: number) {
        this._prev = this._next = this as IntCellRecord<E>
        this.plain = plain
        this.cell = cell
        this._posX = posX
        this._posY = posY
    }

    get next(){ return this._next }
    get posX(){ return this._posX }
    get posY(){ return this._posY }

    makeChild( childPosX: number, childPosY: number ): ExtCellRecord<E> {
        let childRecord = new CellRecord<E>(this.extensionProvider) as IntCellRecord<E>
        childRecord.plain = this.plain
        childRecord.cell = this.cell.makeChild()
        childRecord._posX = childPosX
        childRecord._posY = childPosY

        childRecord._prev = this._prev
        childRecord._next = this as IntCellRecord<E>
        this._prev._next = childRecord
        this._prev = childRecord

        this.plain.getAtInt( childPosX, childPosY).addCellRecord( childRecord )
        return childRecord
    }

    die( ) {
        this._prev._next = this._next
        this._next._prev = this._prev
        this._isDead = true
    }

    get isDead() { return this._isDead }
    get color() { return this._color }

}

export interface ExtensionProvider { 
    getCellRecordExtension: () => Record<string, unknown>,
    getPlainFieldExtension: () => Record<string, unknown>
 }
