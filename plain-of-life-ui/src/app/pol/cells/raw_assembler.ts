import { Cell } from '../core/cell'
import { randIntTo } from '../util/rand'

const memoryBits = 9
const memorySize = 1 << memoryBits
const memoryBitMask = memorySize - 1
const operatorBits = 4
const numberOperators = 1 << operatorBits
const operatorBitMask = numberOperators - 1
const maxOperationsPerTurn = 200
const activeCodeTo = 256 // activeCodeTo shall be < memorySize - inputSize - outputSize - max number of operands of any operator

// Operators
const NOP = 0,
  AND = 1,
  OR = 2,
  MOVE = 3,
  NOT = 4,
  SHIFTL = 5,
  SHIFTR = 6,
  INC = 7,
  DEC = 8,
  ADD = 9,
  SUB = 10,
  MOD = 11,
  MULT = 12,
  DIV = 13,
  JUMPL = 14,
  JUMPE = 15

export class RawAssembler extends Cell {
  private mutationProbability = 500 // Probability of a code mutation per code value when reproducing in % is 1/mutationProbability*100
  private memory = new Uint16Array(memorySize)
  private inputOffset = 0
  private outputOffset = 0

  executeTurn(input: Uint8Array, output: Uint8Array): void {
    // Copy input to memory
    for (let i = 0; i < input.length; i++) this.memory[i + this.inputOffset] = input[i]

    // Execute code
    for (let j = 0, i = 0; i < activeCodeTo && j < maxOperationsPerTurn; i++, j++) {
      switch (this.memory[i] & operatorBitMask) {
        case NOP: {
          // No operation
          break
        }
        case AND: {
          // Binary and
          this.memory[this.memory[++i] & memoryBitMask] &= this.memory[this.memory[++i] & memoryBitMask]
          break
        }
        case OR: {
          // Binary or
          this.memory[this.memory[++i] & memoryBitMask] |= this.memory[this.memory[++i] & memoryBitMask]
          break
        }
        case MOVE: {
          // Move memory from one address to another address
          this.memory[this.memory[++i] & memoryBitMask] = this.memory[this.memory[++i] & memoryBitMask]
          break
        }
        case NOT: {
          // Binary not
          this.memory[this.memory[i] & memoryBitMask] = ~this.memory[this.memory[++i] & memoryBitMask]
          break
        }
        case SHIFTL: {
          // Shift bits left
          this.memory[this.memory[++i] & memoryBitMask] <<= this.memory[this.memory[++i] & memoryBitMask] % 16
          break
        }
        case SHIFTR: {
          // Shift bits right
          this.memory[this.memory[++i] & memoryBitMask] >>>= this.memory[this.memory[++i] & memoryBitMask] % 16
          break
        }
        case INC: {
          // Increment
          this.memory[this.memory[++i] & memoryBitMask]++
          break
        }
        case DEC: {
          // Decrement
          this.memory[this.memory[++i] & memoryBitMask]--
          break
        }
        case ADD: {
          // Add
          this.memory[this.memory[++i] & memoryBitMask] += this.memory[this.memory[++i] & memoryBitMask]
          break
        }
        case SUB: {
          // Subtract
          this.memory[this.memory[++i] & memoryBitMask] -= this.memory[this.memory[++i] & memoryBitMask]
          break
        }
        case MOD: {
          // Modulo
          let divisor = this.memory[this.memory[++i] & memoryBitMask]
          if (divisor == 0) divisor = 1
          this.memory[this.memory[++i] & memoryBitMask] %= divisor
          break
        }
        case MULT: {
          // Multiply
          this.memory[this.memory[++i] & memoryBitMask] *= this.memory[this.memory[++i] & memoryBitMask]
          break
        }
        case DIV: {
          // Divide
          let divisor = this.memory[this.memory[++i] & memoryBitMask]
          if (divisor == 0) divisor = 1
          this.memory[this.memory[++i] & memoryBitMask] /= divisor
          break
        }
        case JUMPL: {
          // Jump if less
          const to = (this.memory[this.memory[++i] & memoryBitMask] & memoryBitMask) % activeCodeTo
          if (this.memory[this.memory[++i] & memoryBitMask] < this.memory[this.memory[++i] & memoryBitMask]) i = to
          break
        }
        case JUMPE: {
          // Jump if equal
          const to = (this.memory[this.memory[++i] & memoryBitMask] & memoryBitMask) % activeCodeTo
          if (this.memory[this.memory[++i] & memoryBitMask] == this.memory[this.memory[++i] & memoryBitMask]) i = to
          break
        }

        default: {
          throw new Error('Unknown operator')
        }
      }
    }
    // Copy memory to output
    for (let i = 0; i < output.length; i++) output[i] = this.memory[i + this.outputOffset]
  }

  makeChild(): Cell {
    const child = new RawAssembler()
    child.inputOffset = this.inputOffset
    child.outputOffset = this.outputOffset

    // Random change of mutation probability
    child.mutationProbability += randIntTo(11) - 5
    if (child.mutationProbability <= 0) {
      child.mutationProbability = 1
    }

    // Take over memory from parent and make random errors (mutations)
    let mutate = randIntTo(child.mutationProbability)
    for (let i = 0; i < memorySize; i++) {
      if (mutate === 0) {
        mutate = randIntTo(child.mutationProbability)
        child.memory[i] = randIntTo(65535)
      } else {
        child.memory[i] = this.memory[i]
        mutate--
      }
    }

    return child
  }

  initSeedCell(inputLength: number, recommendedOutput: Uint8Array): void {
    this.inputOffset = memorySize - inputLength - recommendedOutput.length
    this.outputOffset = memorySize - recommendedOutput.length

    for (let i = 0; i < recommendedOutput.length; i++) {
      this.memory[i + this.outputOffset] = recommendedOutput[i]
    }
  }
}
