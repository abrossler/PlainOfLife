import { Rules } from '../core/rules'
import { ExtPlain } from '../core/plain'
import { CellContainers, ExtCellContainer } from '../core/cell_container'
import { CoherentAreasManager } from '../ownership_managers/coherent_areas_manager'
import { Direction, get4Neighbors, turnLeft, turnRight } from '../util/direction'

const maxCellLifeTime = 30
const minIrradiance = 10
const maxIrradiance = 1000

export class WinCoherentAreas extends Rules<WinCoherentAreas> {
  irradiance: number[] = []

  getSeedCellHints(): { inputLength: number; recommendedSeedCellOutput: Uint8Array } {
    return {
      inputLength: 4,
      recommendedSeedCellOutput: new Uint8Array([0])
    }
  }

  executeTurn(
    currentTurn: bigint,
    plain: ExtPlain<WinCoherentAreas>,
    cellContainers: CellContainers<WinCoherentAreas>
  ): void {
    const input = new Uint8Array(4)
    const output = new Uint8Array(1)
    for (const container of cellContainers) {
      //const mC = new CoherentAreasManager()
      // mC.f(container, plain.getAt(0,0))

      const record = container.cellRecord
      const x = container.posX
      const y = container.posY

      // Let too old cells die
      if (record.remainingLifeTime === 0) {
        container.die()
        //plain.floodFillFieldRecords('owner', null, x, y) // Clear field record owner
        record.ownedFieldsCount = 0
        continue
      }
      record.remainingLifeTime--

      // Get depending on the cell heading the relative positions of the neighbors
      const [xAhead, yAhead, xBehind, yBehind, xAtLeft, yAtLeft, xAtRight, yAtRight] = get4Neighbors(
        x,
        y,
        record.heading
      )

      // Gain energy from owned fields
      record.energy += record.ownedFieldsCount * this.irradiance[container.posY]

      // Prepare input for cell
      this.prepareInput(input, 0, xAhead, yAhead, plain, container, record)
      this.prepareInput(input, 1, xBehind, yBehind, plain, container, record)
      this.prepareInput(input, 2, xAtRight, yAtRight, plain, container, record)
      this.prepareInput(input, 3, xAtLeft, yAtLeft, plain, container, record)

      // Execute turn for cell
      output[0] = 0
      container.executeTurn(input, output)

      // Turn according to output:
      // Bit 0: Turn cell (True / False)?
      // Bit 1: Turn left if true, turn right if false
      if (output[0] & 0b00000001) {
        if (output[0] & 0b00000010) {
          record.heading = turnLeft(record.heading)
        } else {
          record.heading = turnRight(record.heading)
        }
      }

      // Move according to output
      // Bit 2: Move cell (True / False)?
      // Bit 3: Move forward if true, move backward if false
      if (output[0] & 0b00000100) {
        if (output[0] & 0b00001000) {
          move(plain, container, record, x, y, xAhead, yAhead)
        } else {
          move(plain, container, record, x, y, xBehind, yBehind)
        }
      }

      // Make child according to output
    }
  }

  createNewCellRecord(): { heading: Direction; energy: number; remainingLifeTime: number; ownedFieldsCount: number } {
    return { heading: 'UP', energy: 0, remainingLifeTime: maxCellLifeTime, ownedFieldsCount: 1 }
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
   * Bit 0: Has the field a owner (true / false)?
   * Bit 1: Is the current cell that gets the input the owner of the field (true / false)?
   * If false, all further bits are 0
   * Bit 2: Has the field a owner that is different from the current cell (true / false)?
   * Bit 3: Has the owner more or equal energy than the current cell (true / false)?
   * Bit 4: Has the owner less energy than the current cell (true / false)?
   * Bit 5: Is the field occupied by a cell (true / false)?
   * Bit 6: Is the field occupied by a cell with more or equal energy than the current cell (true / false)?
   * Bit 7: Is the field occupied by a cell with less energy than the current cell (true / false)?
   */
  private prepareInput(
    input: Uint8Array,
    i: number,
    x: number,
    y: number,
    plain: ExtPlain<WinCoherentAreas>,
    container: ExtCellContainer<WinCoherentAreas>,
    cellRecord: ReturnType<WinCoherentAreas['createNewCellRecord']>
  ): void {
    const field = plain.getAt(x, y)
    const fieldRecordOwner = field.fieldRecord.owner
    if (!fieldRecordOwner) {
      input[i] = 0b00000000 // No owner
    } else if (fieldRecordOwner === container) {
      input[i] = 0b00000011 // Current cell is owner
    } else if (fieldRecordOwner.cellRecord.energy >= cellRecord.energy) {
      if (field.getCellContainers().length === 0) {
        input[i] = 0b00001101 // A cell with more energy is owner, but not occupied
      } else {
        input[i] = 0b01101101 // A cell with more energy is owner and occupied (by this cell)
      }
    } else {
      if (field.getCellContainers().length === 0) {
        input[i] = 0b00010101 // A cell with less energy is owner, but not occupied
      } else {
        input[i] = 0b10110101 // A cell with less energy is owner and occupied (by this cell)
      }
    }
  }
}

function move(
  plain: ExtPlain<WinCoherentAreas>,
  container: ExtCellContainer<WinCoherentAreas>,
  record: ReturnType<WinCoherentAreas['createNewCellRecord']>,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
): void {
  const toField = plain.getAt(toX, toY)
  const toFieldOccupiedBy = toField.getCellContainers()[0]
  const toFieldRecordOwner = toField.fieldRecord.owner

  if (toFieldRecordOwner !== container) {
    if (toFieldRecordOwner !== null) {
    }
    record.ownedFieldsCount++
  }
}
