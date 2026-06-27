/// <reference lib="webworker" />
import { LogService } from '../pol/util/log.service'
import { type ExtPlainOfLife, PlainOfLife } from '../pol/core/plain_of_life'
import { type RuleExtensionFactory } from '../pol/core/rule_extension_factory'
import { type SerializablePlainOfLife } from '../pol/core/serializable_plain_of_life'

/** Log every n'th turn */
const logTurn = 100n

/**
 * A web worker to run a plain of life in the background.
 *
 * The worker gets a POL with a message, starts with the repeated turn execution and
 * regularly returns the current POL by a message.
 *
 * Sending the string 'flush' as a message causes the worker to immediately post back
 * the current POL state (used by the driver to get the latest state before switching
 * back to foreground execution).
 */
class PolWorker {
  private plainOfLife: ExtPlainOfLife<RuleExtensionFactory> | null = null
  // MessageChannel trick: posting to a MessageChannel port is not throttled by the
  // browser the way setInterval(0) is in background workers, so turns run at full speed.
  private channel = new MessageChannel()

  constructor(private logger: LogService) {
    this.channel.port2.onmessage = () => this.run()
  }

  /**
   * Handle messages from the driver:
   * - SerializablePlainOfLife object: start running from that state
   * - 'flush': immediately post back the current state and return
   */
  onMessage({ data }: { data: SerializablePlainOfLife | 'flush' }): void {
    if (data === 'flush') {
      if (this.plainOfLife !== null) {
        this.logger.debug('Worker flushing state on request')
        postMessage(this.plainOfLife.toSerializable())
      }
      return
    }
    this.logger.debug('Worker got message')
    this.plainOfLife = PlainOfLife.createFromSerializable(data)
    this.channel.port1.postMessage(null) // kick off the loop
  }

  /**
   * Execute the next POL turn in background and schedule the next one via MessageChannel.
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

    this.channel.port1.postMessage(null) // schedule next turn
  }
}

// Create a worker and register it to the message event
const worker = new PolWorker(new LogService())
addEventListener('message', (data) => worker.onMessage(data))
