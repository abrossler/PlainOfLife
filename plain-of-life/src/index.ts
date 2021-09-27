import { PlainOfLife } from './core/plain_of_life'
import { DemoRules } from './rules/demo_rules'
import { DemoCell } from './cells/demo_cell'

export function sayHello(): string {
  console.log('Hello')
  return 'Hello'
}

sayHello()
try{
  const plainOfLife = PlainOfLife.createNew(2, 2, DemoRules, DemoCell)
  plainOfLife.executeTurn()
  let serializablePOL = plainOfLife.toSerializable()
  console.log(serializablePOL)
  let serializedPOL = JSON.stringify( serializablePOL )
  console.log(serializedPOL)
  let serializablePOL2 = JSON.parse( serializedPOL )
  console.log(serializablePOL2)
  const plainOfLife2 = PlainOfLife.createFromSerializable(serializablePOL2)
} catch(e){
  if( e instanceof Error ){

  }
}

sayHello()





// interface I {
//   f(s:string):void
// }

// function checkIfI(toTest: any): toTest is I {
//   return 'f' in toTest
// }

// class IsI {
//   f(s:string):void{}
// }

// class IsNotI {
//   f(s:number):void{}
// }

// const isI: any = new IsI()
// const isNotI: any = new IsNotI()

// if( checkIfI(isI) ){
//   isI.f('Hi')
// }

// if(checkIfI(isNotI)){
//   isNotI.f('Ups')
// }


// interface I {
//   kind: 'I'
//   f(s:string):void
// }

// function checkIfI(toTest: any): toTest is I {
//   //return 'f' in toTest
//   return toTest.kind === 'I'
// }

// class IsI implements I{
//   kind:'I' = 'I'
//   f(s:string):void{}
// }

// class IsNotI {
//   f(s:number):void{}
// }

// const isI: any = new IsI()
// const isNotI: any = new IsNotI()

// if( checkIfI(isI) ){
//   isI.f('Hi')
// }

// if(checkIfI(isNotI)){
//   isNotI.f('Ups')
// }

abstract class A {

}

abstract class APlus extends A{

}

class C extends A{

}


class CPlus extends APlus{

}

const c = new C()
const cPlus = new CPlus()

console.log( 'c is instance of APlus: ' + (c instanceof APlus))
console.log( 'cPlus is instance of APlus: ' + (cPlus instanceof APlus))

