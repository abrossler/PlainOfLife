/// <reference lib="webworker" />
import { LogService2 } from '../log.service2'
import { ExtPlainOfLife, PlainOfLife } from '../pol/core/plain_of_life'
import { RuleExtensionFactory } from '../pol/core/rule_extension_factory'
import { SerializablePlainOfLife } from '../pol/core/serializable_plain_of_life'

class Tst {
  private plainOfLife: ExtPlainOfLife<RuleExtensionFactory> | null = null

  constructor(private logger: LogService2) {}
  
  m({ data }: any): void {
    this.logger.debug('Worker got message')

    const command = (data as { command: string }).command

    switch (command) {
      case 'setPOL':
        this.logger.debug('Command setPOL')
        this.plainOfLife = PlainOfLife.createFromSerializable(
          (data as { plainOfLife: SerializablePlainOfLife }).plainOfLife
        )

        setInterval(() => {
          if (this.plainOfLife !== null) {
            this.plainOfLife.executeTurn()
            if (this.plainOfLife.currentTurn % 100n === 0n) {
              this.logger.info('WORKER Turn: ' + this.plainOfLife.currentTurn)
            }
            if (this.plainOfLife.currentTurn % 1000n === 0n) {
              this.logger.debug('Returning current POL')
              postMessage(this.plainOfLife?.toSerializable())
            }
          }
        }, 1)
        break

      default:
        throw new Error('Unknown command: ' + data.command)
    }
  }
}

const tst = new Tst(new LogService2())

addEventListener('message', (data) => tst.m(data))
