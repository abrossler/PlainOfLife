/// <reference lib="webworker" />

import { ExtPlainOfLife, PlainOfLife } from "../pol/core/plain_of_life"
import { RuleExtensionFactory } from "../pol/core/rule_extension_factory"
import { SerializablePlainOfLife } from "../pol/core/serializable_plain_of_life"

class Tst {
  private plainOfLife: ExtPlainOfLife<RuleExtensionFactory> | null = null
  m({ data }: any): void {
    console.log('Worker got message')

    const command = (data as { command: string }).command

    switch (command) {
      case 'setPOL':
        console.log('Command setPOL')
        this.plainOfLife = PlainOfLife.createFromSerializable((data as {plainOfLife: SerializablePlainOfLife}).plainOfLife)

        setInterval(() => {
          if (this.plainOfLife !== null) {
            this.plainOfLife.executeTurn()
            if (this.plainOfLife.currentTurn % 100n === 0n) {
              console.log(
                'WORKER Turn: ' +
                  this.plainOfLife.currentTurn
              )
            }
            if (this.plainOfLife.currentTurn % 1000n === 0n) {
              console.log( 'Returning current POL' )
              postMessage(this.plainOfLife?.toSerializable())
            }

          }
 
        }, 1) 
        break
      // case 'getPOL':
      //   console.log('Command getPOL')

      //   postMessage(this.plainOfLife?.toSerializable())

      //   break
      default:
        throw new Error('Unknown command: ' + data.command)
    }

    //   postMessage(response)
  }
}

const tst = new Tst()

addEventListener('message', tst.m)
