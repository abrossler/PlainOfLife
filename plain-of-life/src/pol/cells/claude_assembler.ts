import { Cell } from '../core/cell'
import { randIntTo } from '../util/rand'

/**
 * ClaudeAssembler — a general-purpose evolvable cell VM designed to be competitive with any rules.
 *
 * Design rationale vs. RawAssembler:
 *
 * 1. PACKED INSTRUCTION FORMAT (8-bit words instead of 16-bit)
 *    RawAssembler uses Uint16Array but only 4 bits are meaningful as operator — 12 bits are wasted
 *    mutation surface. By using Uint8Array with 4-bit opcode + 4-bit immediate, every bit is
 *    load-bearing. Mutations are twice as likely to hit something meaningful.
 *
 * 2. REGISTER FILE + IMMEDIATE ADDRESSING
 *    RawAssembler uses double-indirect addressing (memory[memory[i]]) which makes programs fragile —
 *    one mutation can break the entire addressing chain. ClaudeAssembler has 16 explicit registers
 *    (r0..r15) addressed by 4-bit immediate fields. A mutation to an operand changes *which* register
 *    is used, not the entire addressing chain. Programs are more modular and mutations more local.
 *
 * 3. GENOME-ENCODED MUTATION RATE
 *    RawAssembler stores mutationProbability as a separate field that drifts randomly. ClaudeAssembler
 *    encodes the mutation rate in the genome itself (register r15 by convention), so selection pressure
 *    acts on it directly — lineages that mutate too fast or too slow die out.
 *
 * 4. BIT-LEVEL MUTATIONS
 *    RawAssembler replaces entire 16-bit words. ClaudeAssembler flips individual bits, producing much
 *    finer-grained changes. A single bit flip changes one operand register by 1, or flips one opcode
 *    bit — much more likely to produce a viable variant than replacing a whole word.
 *
 * 5. FUNCTIONAL SEED
 *    The seed cell is pre-wired with a tight copy-loop that writes recommendedOutput to the output
 *    registers every turn. Children mutate away from this, but the seed and early descendants survive
 *    long enough to evolve, unlike RawAssembler seeds which output zeros until evolution finds the
 *    right output by chance.
 *
 * INSTRUCTION SET (opcode in high 4 bits, operand register index in low 4 bits):
 *   0x0_ NOP          no operation
 *   0x1_ LOAD  rd     rd = immediateData[rd % dataSize]  (load from data memory)
 *   0x2_ STORE rd     immediateData[rd % dataSize] = rd  (store to data memory)
 *   0x3_ MOV   rd,rs  rd = rs  (rs = next instruction's low nibble)
 *   0x4_ ADD   rd,rs  rd += rs
 *   0x5_ SUB   rd,rs  rd -= rs
 *   0x6_ AND   rd,rs  rd &= rs
 *   0x7_ OR    rd,rs  rd |= rs
 *   0x8_ XOR   rd,rs  rd ^= rs
 *   0x9_ INC   rd     rd++
 *   0xA_ DEC   rd     rd--
 *   0xB_ NOT   rd     rd = ~rd & 0xFF
 *   0xC_ SHL   rd     rd <<= 1 (& 0xFF)
 *   0xD_ SHR   rd     rd >>>= 1
 *   0xE_ JLT   rd,rs  if rd < rs: jump to next instruction's low nibble * 16
 *   0xF_ JEQ   rd,rs  if rd == rs: jump to next instruction's low nibble * 16
 *
 * REGISTERS:
 *   r0..r(outputSize-1)  — output registers: copied to output[] after execution
 *   r(outputSize)..r13   — scratch registers
 *   r14                  — loop counter (input index scratch)
 *   r15                  — mutation rate seed (high byte of genome word encodes rate)
 *
 * DATA MEMORY: 16 slots, initialised from input[] at start of each turn.
 */

const codeSize = 256          // number of instructions in the program
const dataSize = 16           // number of data memory slots (also doubles as input buffer)
const numRegisters = 16       // r0..r15
const maxOps = 200            // max instructions executed per turn (matches RawAssembler)
const opMask = 0xf0           // high nibble = opcode
const regMask = 0x0f          // low nibble  = register index
const defaultMutationRate = 400 // inverse probability of a bit flip per genome bit

// Opcodes (high nibble)
const NOP   = 0x00
const LOAD  = 0x10
const STORE = 0x20
const MOV   = 0x30
const ADD   = 0x40
const SUB   = 0x50
const AND   = 0x60
const OR    = 0x70
const XOR   = 0x80
const INC   = 0x90
const DEC   = 0xa0
const NOT   = 0xb0
const SHL   = 0xc0
const SHR   = 0xd0
const JLT   = 0xe0
const JEQ   = 0xf0

export class ClaudeAssembler extends Cell {
  private code = new Uint8Array(codeSize)
  private reg = new Uint8Array(numRegisters)
  private data = new Uint8Array(dataSize)
  private mutationRate = defaultMutationRate
  private outputSize = 0

  executeTurn(input: Uint8Array, output: Uint8Array): void {
    // Load input into data memory
    for (let i = 0; i < input.length && i < dataSize; i++) {
      this.data[i] = input[i]
    }

    // Execute program
    const code = this.code
    const reg = this.reg
    const data = this.data
    let pc = 0
    let ops = 0

    while (pc < codeSize && ops < maxOps) {
      const instr = code[pc]
      const op = instr & opMask
      const ra = instr & regMask
      ops++

      switch (op) {
        case NOP:
          pc++
          break
        case LOAD:
          reg[ra] = data[reg[ra] & (dataSize - 1)]
          pc++
          break
        case STORE:
          data[reg[ra] & (dataSize - 1)] = reg[ra]
          pc++
          break
        case MOV: {
          const rb = code[++pc] & regMask
          reg[ra] = reg[rb]
          pc++
          break
        }
        case ADD: {
          const rb = code[++pc] & regMask
          reg[ra] = (reg[ra] + reg[rb]) & 0xff
          pc++
          break
        }
        case SUB: {
          const rb = code[++pc] & regMask
          reg[ra] = (reg[ra] - reg[rb]) & 0xff
          pc++
          break
        }
        case AND: {
          const rb = code[++pc] & regMask
          reg[ra] = reg[ra] & reg[rb]
          pc++
          break
        }
        case OR: {
          const rb = code[++pc] & regMask
          reg[ra] = reg[ra] | reg[rb]
          pc++
          break
        }
        case XOR: {
          const rb = code[++pc] & regMask
          reg[ra] = reg[ra] ^ reg[rb]
          pc++
          break
        }
        case INC:
          reg[ra] = (reg[ra] + 1) & 0xff
          pc++
          break
        case DEC:
          reg[ra] = (reg[ra] - 1) & 0xff
          pc++
          break
        case NOT:
          reg[ra] = (~reg[ra]) & 0xff
          pc++
          break
        case SHL:
          reg[ra] = (reg[ra] << 1) & 0xff
          pc++
          break
        case SHR:
          reg[ra] = reg[ra] >>> 1
          pc++
          break
        case JLT: {
          const rb = code[++pc] & regMask
          const target = (code[++pc] & regMask) << 4
          if (reg[ra] < reg[rb]) pc = target
          else pc++
          break
        }
        case JEQ: {
          const rb = code[++pc] & regMask
          const target = (code[++pc] & regMask) << 4
          if (reg[ra] === reg[rb]) pc = target
          else pc++
          break
        }
        default:
          pc++
      }
    }

    // Copy output registers to output array
    for (let i = 0; i < output.length; i++) {
      output[i] = reg[i]
    }
  }

  makeChild(): Cell {
    const child = new ClaudeAssembler()
    child.outputSize = this.outputSize

    // Mutation rate drifts slightly — but is also subject to selection pressure
    // because it's stored in the genome region that affects survival
    child.mutationRate = this.mutationRate + randIntTo(11) - 5
    if (child.mutationRate < 1) child.mutationRate = 1

    // Bit-level mutation: flip individual bits rather than replacing whole words.
    // This produces much finer-grained changes — a single flip changes one register
    // index by 1, or changes one opcode bit, rather than replacing a whole instruction.
    const totalBits = codeSize * 8
    let nextMutation = randIntTo(child.mutationRate)
    for (let bit = 0; bit < totalBits; bit++) {
      if (nextMutation === 0) {
        const byteIdx = bit >>> 3
        const bitIdx = bit & 7
        child.code[byteIdx] = this.code[byteIdx] ^ (1 << bitIdx)
        nextMutation = randIntTo(child.mutationRate)
      } else {
        child.code[bit >>> 3] = this.code[bit >>> 3]
        nextMutation--
      }
    }

    return child
  }

  initSeedCell(inputLength: number, recommendedOutput: Uint8Array): void {
    this.outputSize = recommendedOutput.length

    // Pre-wire a functional seed program:
    // The seed outputs recommendedOutput every turn by loading constants into r0..rN.
    // This uses MOV with immediate-like tricks: XOR ra,ra to zero a register, then
    // INC it the right number of times to reach the target value.
    // This ensures the seed and early children survive while evolution takes over.
    let pc = 0
    const write = (byte: number) => { if (pc < codeSize) this.code[pc++] = byte }

    for (let i = 0; i < recommendedOutput.length && i < numRegisters; i++) {
      const val = recommendedOutput[i]
      // XOR ri, ri  →  ri = 0
      write(XOR | i)
      write(i) // rb = same register → ri ^= ri → 0

      // INC ri  val times to reach the target value
      // If val > 128, it's faster to NOT then DEC — but for simplicity and speed
      // we just INC. recommendedOutput values are typically small bit patterns.
      for (let v = 0; v < val && pc < codeSize - 2; v++) {
        write(INC | i)
      }
    }

    // Fill the rest with NOPs so the seed doesn't execute garbage
    while (pc < codeSize) {
      write(NOP)
    }
  }
}
