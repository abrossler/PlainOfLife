import { Rules } from '../core/rules'
import { type ExtPlain } from '../core/plain'
import { CellContainers, type ExtCellContainer } from '../core/cell_container'
import { type ExtPlainField } from '../core/plain_field'
import { type Direction, North, East, South, West, turnLeft, turnRight, getRelativeDirections } from '../util/direction'

// ─── Tuning constants ────────────────────────────────────────────────────────

/** Maximum nutrients a field can hold */
const maxNutrients = 200
/** Nutrients regenerated per turn on each field */
const nutrientRegen = 2
/** Nutrients a cell consumes when it occupies a field (per turn it stays on it) */
const nutrientConsumePerTurn = 6
/** Energy gained per unit of nutrient consumed */
const energyPerNutrient = 6
/** Pheromone emitted by a cell per turn */
const pheromoneEmit = 30
/** Fraction of pheromone that diffuses to each of 4 neighbors per turn (keep sum < 1) */
const pheromoneDiffuse = 0.15
/** Fraction of pheromone that decays per turn */
const pheromoneDecay = 0.08
/** Energy cost of moving */
const costMove = 40
/** Energy cost of turning */
const costTurn = 10
/** Energy cost of dividing (each child starts with this fraction of parent energy) */
const energyFractionPerChild = 0.45
/** Minimum energy to divide */
const minEnergyToDivide = 400
/** Minimum energy to act at all */
const minEnergyToAct = 100
/** Energy cost of simply being alive per turn */
const costLiving = 3
/** Maximum lifetime in turns */
const maxLifetime = 200
/** Minimum maturity (age) before a cell may divide */
const minAgeToDiv = 5

// ─── Types ────────────────────────────────────────────────────────────────────

type CellRecord = {
  heading: Direction
  energy: number
  age: number
  remainingLifetime: number
}

type FieldRecord = {
  nutrients: number
  pheromone: number
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * ClimateAndChemistry — an alternative rule set designed to produce rich, complex evolved
 * cell behaviours through two independent interacting resource systems:
 *
 * NUTRIENTS
 *   Every field holds nutrients (0..maxNutrients) that regenerate slowly each turn.
 *   A cell standing on a field consumes nutrients and converts them to energy. Moving
 *   to a nutrient-rich field is rewarding; staying too long on a depleted field starves
 *   the cell. This creates continuous foraging pressure — cells that evolve efficient
 *   exploration patterns out-compete those that stay still.
 *
 * PHEROMONES
 *   Every turn each cell emits a pheromone signal onto its field. Pheromones diffuse to
 *   neighbouring fields and decay. The cell receives pheromone levels for all 4 relative
 *   neighbours as part of its input. This allows evolution to discover:
 *   - Trail following (move toward high pheromone = toward own kind)
 *   - Trail avoidance (move away from high pheromone = find unvisited territory)
 *   - Chemical territoriality (own pheromone vs. foreign pheromone — not distinguished
 *     here deliberately, keeping input simple and letting evolution figure out what to do)
 *
 * ACTIONS (decoded from cell output)
 *   output[0] bits 0-1: turn (00=none, 01=right, 10=left, 11=reverse)  — activating signal
 *   output[1] bit  0:   move forward (1=move, 0=stay) — activating signal
 *   output[2] bit  0:   suppress divide (1=don't divide, 0=divide when mature+energy sufficient)
 *
 * INPUT (8 bytes, one per relative direction × 2 resources):
 *   [0] nutrients ahead    (0..255, scaled)
 *   [1] nutrients right    (0..255, scaled)
 *   [2] nutrients behind   (0..255, scaled)
 *   [3] nutrients left     (0..255, scaled)
 *   [4] pheromone ahead    (0..255, scaled, clamped)
 *   [5] pheromone right    (0..255, scaled, clamped)
 *   [6] pheromone behind   (0..255, scaled, clamped)
 *   [7] pheromone left     (0..255, scaled, clamped)
 *
 * COMPLEXITY drivers:
 *   - Nutrients are depleted and regenerate → boom-bust cycles, no stable static strategy
 *   - Pheromone gradients are spatial signals → evolved trail / avoidance strategies
 *   - Age gate on division → tradeoff between growing fast and dividing at right time
 *   - Predation: moving into an occupied field starts an energy contest → combat + eating
 *   - No territory ownership → completely orthogonal to WinCoherentAreas
 */
export class ClimateAndChemistry extends Rules<ClimateAndChemistry> {
  // Flat typed arrays for nutrient and pheromone fields — one entry per (x + y*width).
  // Stored flat for cache-friendly sequential access during the diffusion pass.
  private nutrients!: Float32Array
  private pheromone!: Float32Array
  private pheromoneNext!: Float32Array // Scratch buffer for diffusion
  private width = 0
  private height = 0

  // ── Rules interface ──────────────────────────────────────────────────────

  getSeedCellHints(): { inputLength: number; recommendedSeedCellOutput: Uint8Array } {
    return {
      inputLength: 8,
      // Turn right + move forward + divide — keeps the population alive while evolution takes over
      recommendedSeedCellOutput: new Uint8Array([0x00, 0x00, 0x00])
    }
  }

  createNewCellRecord(): CellRecord {
    // Start with enough energy to sustain several generations while evolution takes over
    return { heading: North, energy: minEnergyToDivide * 6, age: 0, remainingLifetime: maxLifetime }
  }

  createNewFieldRecord(): FieldRecord {
    return { nutrients: maxNutrients / 2, pheromone: 0 }
  }

  initNew(plain: ExtPlain<ClimateAndChemistry>): void {
    this.initFields(plain)
  }

  initFromSerializable(serializable: Record<string, unknown>, plain: ExtPlain<ClimateAndChemistry>): void {
    super.initFromSerializable(serializable, plain)
    this.initFields(plain)
  }

  executeTurn(plain: ExtPlain<ClimateAndChemistry>, cellContainers: CellContainers<ClimateAndChemistry>): void {
    // ── Phase 1: nutrient regeneration + pheromone diffusion/decay ──────────
    this.diffuseAndDecayPheromone(plain)
    this.regenerateNutrients(plain)

    // ── Phase 2: cell turns ─────────────────────────────────────────────────
    const input = new Uint8Array(8)
    const output = new Uint8Array(3)

    for (const container of cellContainers) {
      const record = container.cellRecord

      // Age and lifetime
      if (record.remainingLifetime === 0) {
        container.die()
        continue
      }
      record.remainingLifetime--
      record.age++

      // Living cost
      record.energy -= costLiving
      if (record.energy <= 0) {
        container.die()
        continue
      }

      // Nutrient consumption from current field
      const field = container.plainField
      const fieldRecord = field.fieldRecord
      const consumed = Math.min(fieldRecord.nutrients, nutrientConsumePerTurn)
      fieldRecord.nutrients -= consumed
      record.energy += consumed * energyPerNutrient

      // Pheromone emission
      fieldRecord.pheromone += pheromoneEmit

      // Cells with too little energy can't act
      if (record.energy < minEnergyToAct) continue

      // Prepare input
      const [ahead, right, behind, left] = getRelativeDirections(record.heading)
      this.prepareInput(input, field, ahead, right, behind, left)

      // Execute cell turn
      output[0] = output[1] = output[2] = 0
      container.executeTurn(input, output)

      // ── Turn ──────────────────────────────────────────────────────────────
      const turnBits = output[0] & 0x03
      if (turnBits === 1) {
        record.heading = turnRight(record.heading)
        record.energy -= costTurn
      } else if (turnBits === 2) {
        record.heading = turnLeft(record.heading)
        record.energy -= costTurn
      } else if (turnBits === 3) {
        record.heading = turnRight(turnRight(record.heading))
        record.energy -= costTurn * 2
      }

      const [aheadNow] = getRelativeDirections(record.heading)

      // ── Divide ────────────────────────────────────────────────────────────
      // Divide by default when mature + energy is sufficient; output[2] bit 0 *suppresses* division.
      // This way zero-output (unevolved) cells still reproduce — evolution selects *when not* to divide.
      if (
        !(output[2] & 0x01) &&
        record.age >= minAgeToDiv &&
        record.energy >= minEnergyToDivide
      ) {
        const [, childRight, , childLeft] = getRelativeDirections(record.heading)
        const leftField = field.getNeighbor(childLeft)
        const rightField = field.getNeighbor(childRight)
        if (leftField.isFree() && rightField.isFree()) {
          const childEnergy = (record.energy * energyFractionPerChild) | 0
          const [child1, child2] = container.divide(childLeft, childRight)
          child1.cellRecord.energy = childEnergy
          child1.cellRecord.heading = record.heading
          child2.cellRecord.energy = childEnergy
          child2.cellRecord.heading = record.heading
          continue
        }
      }

      // ── Move ──────────────────────────────────────────────────────────────
      // Move only when output[1] bit 0 activates it (explicit foraging signal).
      if (output[1] & 0x01) {
        const targetField = field.getNeighbor(aheadNow)
        if (!targetField.isFree()) {
          const targetContainer = targetField.getCellContainers()[0]
          const targetRecord = targetContainer.cellRecord
          if (targetRecord.energy >= record.energy) {
            // Defender is stronger — attacker dies
            container.die()
            continue
          } else {
            // Attacker is stronger — eats defender, gains half its energy
            record.energy += (targetRecord.energy * 0.5) | 0
            targetContainer.die()
          }
        }
        container.move(aheadNow)
        record.energy -= costMove
      }
    }
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private initFields(plain: ExtPlain<ClimateAndChemistry>): void {
    this.width = plain.width
    this.height = plain.height
    const size = this.width * this.height
    this.nutrients = new Float32Array(size)
    this.pheromone = new Float32Array(size)
    this.pheromoneNext = new Float32Array(size)

    // Nutrients start half-full with slight spatial variation for interesting gradients
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = x + y * this.width
        // Cosine pattern creates patches of richness — breaks symmetry from the start
        this.nutrients[idx] =
          maxNutrients *
          (0.75 + 0.25 * Math.cos((x / this.width) * Math.PI * 4) * Math.cos((y / this.height) * Math.PI * 4))
        // Sync with the field record so serialization is consistent
        plain.getAt(x, y).fieldRecord.nutrients = this.nutrients[idx]
      }
    }
  }

  private regenerateNutrients(plain: ExtPlain<ClimateAndChemistry>): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const fieldRecord = plain.getAt(x, y).fieldRecord
        if (fieldRecord.nutrients < maxNutrients) {
          fieldRecord.nutrients = Math.min(maxNutrients, fieldRecord.nutrients + nutrientRegen)
        }
        // Keep flat array in sync (used for diffusion)
        this.nutrients[x + y * this.width] = fieldRecord.nutrients
      }
    }
  }

  private diffuseAndDecayPheromone(plain: ExtPlain<ClimateAndChemistry>): void {
    const w = this.width
    const h = this.height

    // First, copy current field pheromones into flat array
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        this.pheromone[x + y * w] = plain.getAt(x, y).fieldRecord.pheromone
      }
    }

    // Compute diffused values into pheromoneNext
    // keep must be positive — if pheromoneDiffuse * 4 + pheromoneDecay >= 1, pheromone amplifies instead of decaying
    const keep = 1 - pheromoneDiffuse * 4 - pheromoneDecay
    if (keep <= 0) throw new Error(`Pheromone diffusion is unstable: keep=${keep}. Reduce pheromoneDiffuse or pheromoneDecay.`)
    for (let y = 0; y < h; y++) {
      const yN = y === 0 ? h - 1 : y - 1
      const yS = y === h - 1 ? 0 : y + 1
      for (let x = 0; x < w; x++) {
        const xW = x === 0 ? w - 1 : x - 1
        const xE = x === w - 1 ? 0 : x + 1
        this.pheromoneNext[x + y * w] =
          this.pheromone[x + y * w] * keep +
          this.pheromone[x + yN * w] * pheromoneDiffuse +
          this.pheromone[x + yS * w] * pheromoneDiffuse +
          this.pheromone[xE + y * w] * pheromoneDiffuse +
          this.pheromone[xW + y * w] * pheromoneDiffuse
      }
    }

    // Write back to field records
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        plain.getAt(x, y).fieldRecord.pheromone = Math.max(0, this.pheromoneNext[x + y * w])
      }
    }
  }

  private prepareInput(
    input: Uint8Array,
    field: ExtPlainField<ClimateAndChemistry>,
    ahead: Direction,
    right: Direction,
    behind: Direction,
    left: Direction
  ): void {
    const dirs: Direction[] = [ahead, right, behind, left]
    for (let i = 0; i < 4; i++) {
      const neighbor = field.getNeighbor(dirs[i]).fieldRecord
      // Nutrients: scale 0..maxNutrients → 0..255
      input[i] = Math.min(255, (neighbor.nutrients / maxNutrients * 255) | 0)
      // Pheromone: clamp to 0..255 (can exceed 255 in dense areas — that's intentional signal saturation)
      input[i + 4] = Math.min(255, neighbor.pheromone | 0)
    }
  }
}
