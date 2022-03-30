import { Rules } from '../core/rules'
import { ExtPlain } from '../core/plain'
import { CellContainers, ExtCellContainer } from '../core/cell_container'
import { CoherentAreasManager } from '../ownership_managers/coherent_areas_manager'
import { Direction, turnLeft, turnRight, getRelativeDirections } from '../util/direction'
import { ExtPlainField } from '../core/plain_field'

const maxCellLifeTime = 50
const minCellEnergy = 400
const costCellTurn = 20
const costCellMove = 100
const percentageEnergyPerChildOnDivide = 45
const percentageEnergyOnEat = 50

const minIrradiance = 4
const maxIrradiance = 20

export class WinCoherentAreas extends Rules<WinCoherentAreas> {
  irradiance: number[] = []

  getSeedCellHints(): { inputLength: number; recommendedSeedCellOutput: Uint8Array } {
    return {
      inputLength: 4,
      recommendedSeedCellOutput: new Uint8Array([0b00000001, 0b00000011, 0b00000000])
    }
  }

  executeTurn(plain: ExtPlain<WinCoherentAreas>, cellContainers: CellContainers<WinCoherentAreas>): void {
    const input = new Uint8Array(4)
    const output = new Uint8Array(3)
    for (const container of cellContainers) {
      const record = container.cellRecord
      const currentField = container.plainField

      // Let too old cells die
      if (record.remainingLifeTime === 0) {
        container.die()
        continue
      }
      record.remainingLifeTime--

      // Cells with too less energy become inactive and can't do anything
      if (record.energy >= minCellEnergy) {
        // Get depending on the cell heading the 4 relative neighbor directions
        let [ahead, atRight, behind, atLeft] = getRelativeDirections(record.heading)

        // Prepare input for cell
        this.prepareInput(input, 0, currentField.getNeighbor(ahead), container, record)
        this.prepareInput(input, 1, currentField.getNeighbor(behind), container, record)
        this.prepareInput(input, 2, currentField.getNeighbor(atRight), container, record)
        this.prepareInput(input, 3, currentField.getNeighbor(atLeft), container, record)

        // Execute turn for cell
        output[0] = output[1] = output[2] = 0
        container.executeTurn(input, output)

        // Turn cell according to output:
        // [0] bit 0: Turn cell (Yes / No)?
        // [0] bit 1: Turn left if true, turn right if false
        if (output[0] & 0b00000001) {
          if (output[0] & 0b00000010) {
            record.heading = turnLeft(record.heading)
          } else {
            record.heading = turnRight(record.heading)
          }
          record.energy -= costCellTurn
          // With turning the relative directions change
          ;[ahead, atRight, behind, atLeft] = getRelativeDirections(record.heading)
        }

        // Divide cell according to output:
        // [1] bit 0: Divide cell (Yes / No)? Dividing is only possible if the fields left and right from the current cell are not occupied by other cells.
        // [1] bit 1: Turn child 1 away from the parent (Yes / No)?
        // [1] bit 2: Turn child 2 away from the parent (Yes / No)?
        // If the cell is divided, it dies. Child 1 is placed left, child 2 right from the parent relative to the parent's heading.
        // If child 1 is turned, it turns to the left away from the parent.
        // If child 2 is turned, it turns to the right away from the parent.
        if (
          output[1] & 0b00000001 &&
          currentField.getNeighbor(atLeft).isFree() &&
          currentField.getNeighbor(atRight).isFree()
        ) {
          const [child1, child2] = container.divide(atLeft, atRight)
          const childEnergy = ((record.energy * percentageEnergyPerChildOnDivide) / 100) | 0
          const record1 = child1.cellRecord
          record1.energy = childEnergy
          if (output[1] & 0b00000010) {
            record1.heading = turnLeft(record.heading)
          } else {
            record1.heading = record.heading
          }
          const record2 = child2.cellRecord
          record2.energy = childEnergy
          if (output[1] & 0b00100) {
            record2.heading = turnRight(record.heading)
          } else {
            record2.heading = record.heading
          }
          continue
        }

        // Move cells according to output
        // [2] bit 0: Move cell (Yes / No)?
        // [2] bit 1: Move forward if true, move backward if false
        // If the plain field where to move is occupied by another cell, it's checked which cell is stronger (has more energy): If
        // the moving cell is stronger, it eats the attacked cell and gains a share of the eaten cell's energy. If the attacked
        // cell is stronger the attack fails and the moving cell just dies.
        if (output[2] & 0b00000001) {
          const moveDirection = output[2] & 0b00000010 ? ahead : behind
          const targetField = currentField.getNeighbor(moveDirection)
          if (!targetField.isFree()) {
            const targetCellContainer = targetField.getCellContainers()[0]
            if (targetCellContainer.cellRecord.energy > record.energy) {
              container.die()
              continue
            } else {
              record.energy += ((targetCellContainer.cellRecord.energy * percentageEnergyOnEat) / 100) | 0
              targetCellContainer.die()
            }
          }
          container.move(moveDirection)
          record.energy -= costCellMove
        }
      }

      // Gain energy from owned fields
      record.energy += record.ownedFieldsCount * this.irradiance[currentField.posY]
    }
  }

  createNewCellRecord(): { heading: Direction; energy: number; remainingLifeTime: number; ownedFieldsCount: number } {
    return { heading: 0, energy: 0, remainingLifeTime: maxCellLifeTime, ownedFieldsCount: 0 }
  }

  createNewFieldRecord(): { owner: ExtCellContainer<WinCoherentAreas> | null } {
    return { owner: null }
  }

  initNew(plain: ExtPlain<WinCoherentAreas>): void {
    for (let i = 0; i < plain.height; i++) {
      // Calculate irradiance depending on the y position on plain:
      // Start from minIrradiance at the North Pole (y=0) and grow with a shifted and scaled sinus function up to maxIrradiance
      // at the equator (y=plainHeight/2) and from there go down again to minIrradiance at the South Pole (y=plainHeight-1)
      this.irradiance[i] = Math.floor(
        minIrradiance +
          ((maxIrradiance - minIrradiance) * (1 - Math.sin(Math.PI / 2 + (i / (plain.height - 1)) * Math.PI * 2))) / 2
      )
    }

    new CoherentAreasManager(plain)
  }

  initFromSerializable(serializable: Record<string, unknown>, plain: ExtPlain<WinCoherentAreas>): void {
    super.initFromSerializable(serializable, plain)
    new CoherentAreasManager(plain)
  }

  /**
   * Prepares the input that is passed to a cell when executing a turn. The input is provided to the cell for the 4 neighbor
   * fields.
   *
   * Meaning of the input (bits from right to left):
   * - Bit 0: Has the field a owner (true / false)?
   * - Bit 1: Is the current cell that gets the input the owner of the field (true / false)?
   *
   * If false, all further bits are 0
   * - Bit 2: Has the field a owner that is different from the current cell (true / false)?
   * - Bit 3: Has the owner more or equal energy than the current cell (true / false)?
   * - Bit 4: Has the owner less energy than the current cell (true / false)?
   * - Bit 5: Is the field occupied by a cell (true / false)?
   * - Bit 6: Is the field occupied by a cell with more or equal energy than the current cell (true / false)?
   * - Bit 7: Is the field occupied by a cell with less energy than the current cell (true / false)?
   */
  private prepareInput(
    input: Uint8Array,
    i: number,
    neighbor: ExtPlainField<WinCoherentAreas>,
    container: ExtCellContainer<WinCoherentAreas>,
    cellRecord: ReturnType<WinCoherentAreas['createNewCellRecord']>
  ): void {
    const neighborOwner = neighbor.fieldRecord.owner
    if (!neighborOwner) {
      input[i] = 0b00000000 // No owner
    } else if (neighborOwner === container) {
      input[i] = 0b00000011 // Current cell is owner
    } else if (neighborOwner.cellRecord.energy >= cellRecord.energy) {
      if (neighbor.isFree()) {
        input[i] = 0b00001101 // A cell with more energy is owner, but not occupied
      } else {
        input[i] = 0b01101101 // A cell with more energy is owner and occupied (by this cell)
      }
    } else {
      if (neighbor.isFree()) {
        input[i] = 0b00010101 // A cell with less energy is owner, but not occupied
      } else {
        input[i] = 0b10110101 // A cell with less energy is owner and occupied (by this cell)
      }
    }
  }
}
