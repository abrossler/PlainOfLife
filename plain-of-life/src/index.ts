import { PlainOfLife } from './core/plain_of_life'
import { DemoRules } from './rules/demo_rules'
import { DemoCell } from './cells/demo_cell'
import { defaultToSerializable } from './core/serializable_plain_of_life'

export function sayHello(): string {
  console.log('Hello')
  return 'Hello'
}

sayHello()
try {
  const plainOfLife = PlainOfLife.createNew(2, 2, DemoRules, DemoCell)
  plainOfLife.executeTurn()
  const serializablePOL = plainOfLife.toSerializable()
  console.log(serializablePOL)
  const serializedPOL = JSON.stringify(serializablePOL)
  console.log(serializedPOL)
  const serializablePOL2 = JSON.parse(serializedPOL)
  console.log(serializablePOL2)
  /*const plainOfLife2 = */ PlainOfLife.createFromSerializable(serializablePOL2)
} catch (e) {
  if (e instanceof Error) {
    console.log(e)
    console.log(e.message)
    console.log(e.stack)
  }
}

sayHello()
