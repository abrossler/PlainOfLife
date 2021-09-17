import {PlainOfLife} from './core/plain_of_life'
import {DemoRules} from './rules/demo_rules'
import {DemoCell} from './cells/demo_cell'

export function sayHello(): string {
  console.log('Hello')
  return 'Hello'
}

sayHello()

let plainOfLife = new PlainOfLife( new DemoRules( 2, 2, new DemoCell )  )
plainOfLife.executeTurn( )
