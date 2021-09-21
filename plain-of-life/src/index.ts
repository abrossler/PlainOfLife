import 'reflect-metadata';
import { Expose } from 'class-transformer';
import { plainToClass } from 'class-transformer';
import { classToPlain } from 'class-transformer';
import { serialize } from 'class-transformer';
import { deserialize } from 'class-transformer';
import { PlainOfLife } from './core/plain_of_life'
import { DemoRules } from './rules/demo_rules'
import { DemoCell } from './cells/demo_cell'
import * as Rules from './rules/rules_names'

export function sayHello(): string {
  console.log('Hello')
  return 'Hello'
}

sayHello()

//const plainOfLife = new PlainOfLife(new DemoRules(2, 2, new DemoCell()))
const plainOfLife = PlainOfLife.createNew( 2, 2, DemoRules, DemoCell )
plainOfLife.executeTurn()
let serializablePOL = plainOfLife.toSerializable()
console.log( serializablePOL )
//const plainOfLife2 = new PlainOfLife( serializablePOL )
const plainOfLife2 = PlainOfLife.createFromSerializable( serializablePOL )
sayHello()
// console.log( Rules.getRuleNames() )
// console.log( Rules.getRuleName( DemoRules) )
// const constructor = Rules.getRuleConstructor( Rules.getRuleNames()[0] )
// if( typeof constructor !== 'undefined'){
//     const rules = new constructor(2, 2, new DemoCell())
// }

// PlainOfLife.createFromSerializable( serializable )
// PlainIfLife.createNew( 2, 2, DemoRules, DemoCell )

//var jsonString = JSON.stringify(a);
//const obj = JSON.parse('{"name":"John", "age":30, "city":"New York"}');


// class POL{
//     @Expose() turn = 0
// }

// const pol = new POL()
// pol.turn = 2

// const plainPol = classToPlain( pol )
// console.log( plainPol )
// const pol2 = plainToClass(POL, plainPol)

// const serializedPol = serialize( pol )
// console.log( 'serialize: ', serializedPol )
// console.log( 'stringify: ', JSON.stringify( pol ) )
// const pol3 = deserialize (POL, serializedPol )

// const unsafePol = {
//     turn: 2,
//     //turn: '22' // Not detected that this is a string were a number is expected. There is no type checking
//     surprise: 'unexpected'
// }

// const serializedUnsafePol = serialize( unsafePol )
// const pol4 = deserialize(POL, serializedUnsafePol )
// console.log( pol4 )

// const serializedUnsafePol2 = serialize( unsafePol )
// const pol5 = deserialize(POL, serializedUnsafePol, { excludeExtraneousValues: true } )
// console.log( pol5 ) // Hides unexpected properties

// function getCellConstructorsAndNames(): {constructor: new()=>Cell, name: string}[] {
//     return [
//         { constructor: Cell1, name: 'cell1' },
//         { constructor: Cell2, name: 'cell2' }
//     ]
// }

// abstract class Cell{
//     getConstructorAndName(){
//         for( const cm in getCellConstructorsAndNames() ){
            
//         }
//     }
// }

// class Cell1 extends Cell{
//     myData = 'ABCD'
// }

// class Cell2 extends Cell{
//     memory = '1234'
//     code = 'abc'
// }

//console.log( new (getCellConstructorsAndNames())[0].constructor() )



// class PlainOfLifeModel{

//     cells: Cell[] = [new Cell1(), new Cell2() ]
// }

// console.log( JSON.stringify(new PlainOfLifeModel()))

