/// <reference lib="webworker" />
import { LogService } from '../pol/util/log.service'
import { ExtPlainOfLife, PlainOfLife } from '../pol/core/plain_of_life'
import { RuleExtensionFactory } from '../pol/core/rule_extension_factory'
import { SerializablePlainOfLife } from '../pol/core/serializable_plain_of_life'

/** Log every n'th turn */
const logTurn = 100n

/** Return every n'th turn */
const returnPolTurn = 1000n

/**
 * A web worker to run a plain of life in the background.
 *
 * The worker gets a POL with a message, starts with the repeated turn execution and
 * regularly returns the current POL by a message.
 */
class PolWorker {
  private plainOfLife: ExtPlainOfLife<RuleExtensionFactory> | null = null

  constructor(private logger: LogService) {}

  /**
   * Get the POL to run in the serializable format and schedule the turn execution
   */
  onMessage({ data }: { data: SerializablePlainOfLife }): void {
    this.logger.debug('Worker got message')
    this.plainOfLife = PlainOfLife.createFromSerializable(data)
    setInterval(() => this.run(), 0)
  }

  /**
   * Execute the next POL turn in background and regularly return the POL by a message
   */
  private run(): void {
    if (this.plainOfLife === null) {
      throw new Error('Worker running with null Plain of Life')
    }

    const timeStampBefore = performance.now()
    this.plainOfLife.executeTurn()
    if (this.plainOfLife.currentTurn % logTurn === 0n) {
      const cellCount = this.plainOfLife.cellCount
      this.logger.info('Turn ' + this.plainOfLife.currentTurn + ' with ' + cellCount + ' cells')
      this.logger.debug('Time per cell: ' + (performance.now() - timeStampBefore) / cellCount, false)
    }
    if (this.plainOfLife.currentTurn % returnPolTurn === 0n) {
      this.logger.debug('Updating POL from worker')
      postMessage(this.plainOfLife.toSerializable())
    }
  }
}

// Create a worker and register it to the message event
const worker = new PolWorker(new LogService())
addEventListener('message', (data) => worker.onMessage(data))
