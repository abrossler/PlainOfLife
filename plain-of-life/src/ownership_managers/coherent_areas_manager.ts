import { FloodFill } from '../util/flood_fill'
import { modulo } from '../util/modulo'
import { ExtCellContainer } from '../core/cell_container'
import { ExtPlain } from '../core/plain'
import { RuleExtensionFactory } from '../core/rule_extension_factory'

/**
 * The minimum cell record required by a coherent areas manager containing at least an ownedFieldsCount property
 */
interface MinCellRecord {
  ownedFieldsCount: number
}

/**
 * The minimum field record required by a coherent areas manager containing at least an owner property
 */
interface MinFieldRecord {
  owner: ExtCellContainer<MinRuleExtensionFactory> | null
}

/**
 * The minimum rule extension factory creating cell and field records containing at least the minimal required properties
 */
interface MinRuleExtensionFactory extends RuleExtensionFactory {
  createNewCellRecord(): MinCellRecord & Record<string, unknown>
  createNewFieldRecord(): MinFieldRecord & Record<string, unknown>
}

export class CoherentAreasManager {
  private plain: MinFieldRecord[][]
  private floodFill: FloodFill<MinFieldRecord>
  private fillWithNull: MinFieldRecord
  private width: number
  private height: number

  constructor(extPlain: ExtPlain<MinRuleExtensionFactory>) {
    this.plain = new Array<Array<MinFieldRecord>>()
    this.width = extPlain.width
    this.height = extPlain.height
    for (let y = 0; (y = this.height); y++) {
      const row: MinFieldRecord[] = new Array<MinFieldRecord>()
      for (let x = 0; (x = this.width); x++) {
        row.push(extPlain.getAt(x, y).fieldRecord)
      }
      this.plain.push(row)
    }

    this.floodFill = new FloodFill(
      this.plain,
      (t1, t2) => t1.owner === t2.owner,
      (plain, fillWith, x, y) => (plain[x][y].owner = fillWith.owner)
    )

    this.fillWithNull = { owner: null }
  }

  public updateAfterBirth(cellContainer: ExtCellContainer<MinRuleExtensionFactory>, x: number, y: number): void {
    this.place(cellContainer, x, y)
  }

  public updateBeforeMove(cellContainer: ExtCellContainer<MinRuleExtensionFactory>, dX: number, dY: number): void {
    if (dX === 0 && dY === 0) {
      return
    }

    const targetX = cellContainer.posX + dX
    const targetY = cellContainer.posY + dY
    if (!((dX === 0 && (dY === 1 || dY === -1)) || (dY === 0 && (dX === 1 || dX === -1)))) {
      cellContainer.cellRecord.ownedFieldsCount = 0
      this.floodFill.fill(this.fillWithNull, cellContainer.posX, cellContainer.posY)
    }
    this.place(cellContainer, targetX, targetY)
  }

  public updateBeforeDeath(cellContainer: ExtCellContainer<MinRuleExtensionFactory>): void {
    cellContainer.cellRecord.ownedFieldsCount = 0
    this.floodFill.fill(this.fillWithNull, cellContainer.posX, cellContainer.posY)
  }

  private place(cellContainer: ExtCellContainer<MinRuleExtensionFactory>, x: number, y: number) {
    const newFieldRecord = this.plain[x][y]
    const oldOwner = newFieldRecord.owner

    // Return if plain field already belongs to cell just placed that field
    if (oldOwner === cellContainer) {
      return
    }

    const cellRecord = cellContainer.cellRecord

    if (oldOwner === null) {
      newFieldRecord.owner = cellContainer
      cellRecord.ownedFieldsCount++
      return
    }

    const oldOwnerX = oldOwner.posX
    const oldOwnerY = oldOwner.posY

    // If the old owner sits on the position were the new owner is placed, the old owner looses all owned fields...
    if (x === oldOwnerX && y === oldOwnerY) {
      this.floodFill.fill(this.fillWithNull, oldOwnerX, oldOwnerY)
      oldOwner.cellRecord.ownedFieldsCount = 0
      newFieldRecord.owner = cellContainer
      cellRecord.ownedFieldsCount++
      return
    }

    newFieldRecord.owner = cellContainer
    cellRecord.ownedFieldsCount++

    const xMinus1 = modulo(x - 1, this.width)
    const xPlus1 = modulo(x + 1, this.width)
    const yMinus1 = modulo(y - 1, this.height)
    const yPlus1 = modulo(y + 1, this.height)

    let sameOwner: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 = 0b0000
    if (this.plain[x][yMinus1].owner === oldOwner) {
      sameOwner |= 0b1000
    }
    if (this.plain[xPlus1][y].owner === oldOwner) {
      sameOwner |= 0b0100
    }
    if (this.plain[x][yPlus1].owner === oldOwner) {
      sameOwner |= 0b0010
    }
    if (this.plain[xMinus1][y].owner === oldOwner) {
      sameOwner |= 0b0001
    }

    switch (sameOwner) {
      case 0b0000:
      case 0b1000:
      case 0b0100:
      case 0b0010:
      case 0b0001:
        return

      // Up right
      case 0b1100:
        if (this.plain[xPlus1][yMinus1].owner !== oldOwner) {
          const relPos = this.getRelPosOldOwner(x, y, oldOwnerX, oldOwnerY)
          this.checkAndNullNeighbors(
            oldOwner,
            [x, yMinus1, neighborDist[relPos][up]],
            [xPlus1, y, neighborDist[relPos][right]]
          )
        }
        return

      // Down right
      case 0b0110:
        if (this.plain[xPlus1][yPlus1].owner !== oldOwner) {
          const relPos = this.getRelPosOldOwner(x, y, oldOwnerX, oldOwnerY)
          this.checkAndNullNeighbors(
            oldOwner,
            [xPlus1, y, neighborDist[relPos][right]],
            [x, yPlus1, neighborDist[relPos][down]]
          )
        }
        return

      // Down left
      case 0b0011:
        if (this.plain[xMinus1][yPlus1].owner !== oldOwner) {
          const relPos = this.getRelPosOldOwner(x, y, oldOwnerX, oldOwnerY)
          this.checkAndNullNeighbors(
            oldOwner,
            [x, yPlus1, neighborDist[relPos][down]],
            [xMinus1, y, neighborDist[relPos][left]]
          )
        }
        return

      // Up left
      case 0b1001:
        if (this.plain[xMinus1][yMinus1].owner !== oldOwner) {
          const relPos = this.getRelPosOldOwner(x, y, oldOwnerX, oldOwnerY)
          this.checkAndNullNeighbors(
            oldOwner,
            [xMinus1, y, neighborDist[relPos][left]],
            [x, yMinus1, neighborDist[relPos][up]]
          )
        }
        return

      // Horizontal
      case 0b0101: {
        const relPos = this.getRelPosOldOwner(x, y, oldOwnerX, oldOwnerY)
        this.checkAndNullNeighbors(
          oldOwner,
          [xPlus1, y, neighborDist[relPos][right]],
          [xMinus1, y, neighborDist[relPos][left]]
        )
        return
      }
      // Vertical
      case 0b1010: {
        const relPos = this.getRelPosOldOwner(x, y, oldOwnerX, oldOwnerY)
        this.checkAndNullNeighbors(
          oldOwner,
          [x, yMinus1, neighborDist[relPos][up]],
          [x, yPlus1, neighborDist[relPos][down]]
        )
        return
      }

      case 0b1110:
        return //##############################ToDo Weiter
    }
  }

  private getRelPosOldOwner(x: number, y: number, oldOwnerX: number, oldOwnerY: number): 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 {
    // Relative position of the old neighbor
    //   \  7  |  0  /       0: Top right
    //     \   |   /         1: Right top
    //   6   \ | /   1       2: Right bottom
    //   ------X------       3: Bottom right
    //   5   / | \   2       4: Bottom left
    //     /   |   \         5: Left bottom
    //   /  4  |  3  \       6: Left top
    //                       7: Top left
    const dX = oldOwnerX - x
    const dY = oldOwnerY - y

    if (dX > 0) {
      if (dY <= 0) {
        if (dX <= -dY) {
          return 0
        } else {
          return 1
        }
      } else {
        if (dX > dY) {
          return 2
        } else {
          return 3
        }
      }
    } else {
      if (dY > 0) {
        if (dX > -dY) {
          return 4
        } else {
          return 5
        }
      } else {
        if (dX <= dY) {
          return 6
        } else {
          return 7
        }
      }
    }
  }

  private checkAndNullNeighbors(
    oldOwner: ExtCellContainer<MinRuleExtensionFactory>,
    ...neighborPosAndDist: [number, number, number][]
  ): void {
    //let [x,y] = pos[0]

    const oldOwnerX = oldOwner.posX
    const oldOwnerY = oldOwner.posY

    let closest: [number, number, number] | null = null

    for (let i = 0; i < neighborPosAndDist.length; i++) {
      if (i > 1 && this.plain[neighborPosAndDist[i][0]][neighborPosAndDist[i][1]].owner === null) {
        continue
      }

      if (closest === null) {
        closest = neighborPosAndDist[i]
        continue
      }

      let current = neighborPosAndDist[i]

      if (current[2] < closest[2]) {
        ;[closest, current] = [current, closest]
      }

      // Try to fill a disconnected part of the area with null
      this.floodFill.fill(this.fillWithNull, current[0], current[1])

      // Ups, by mistake we filled a part that is connected
      if (this.plain[oldOwnerX][oldOwnerY].owner === null) {
        // At least we now know for sure that every non-null neighbor must be disconnected and we have to fill it with null
        for (let i = 0; i < neighborPosAndDist.length; i++) {
          const [x, y] = neighborPosAndDist[i]
          if (this.plain[x][y].owner !== null) {
            this.floodFill.fill(this.fillWithNull, x, y)
          }
        }
        // ToDo Undo fill by mistake
        //######################################
        return
      }

      // OK, closest was connected to disconnected part and has to be re-filled in the next iteration
      if (this.plain[closest[0]][closest[1]].owner === null) {
        closest = null
      }
    }
  }
}

const up = 0
const right = 1
const down = 2
const left = 3
// Precalculated: Which neighbor of the field to be occupied is closest to the old owner, depending on the
// relative position of the old owner? Which is second, third and fourth?
// The first dimension of the array is the relative position of the old owner (0-7)
//   \  7  |  0  /       0: Top right
//     \   |   /         1: Right top
//   6   \ U /   1       2: Right bottom
//   ----L-X-R----       3: Bottom right
//   5   / D \   2       4: Bottom left
//     /   |   \         5: Left bottom
//   /  4  |  3  \       6: Left top
//                       7: Top left
// The second dimension is the neighbor: 0: Up, 1: Right, 2: Down, 3: Left
const neighborDist = [
  [1, 2, 4, 3], // If the old owner is placed top right, the neighbor up is the closest, right is second, down is fourth and left is third
  [2, 1, 3, 4], // If the old owner is placed right top, the neighbor up is the second closest, ...
  [3, 1, 2, 4],
  [4, 2, 1, 3],
  [4, 3, 1, 2],
  [3, 4, 2, 1],
  [2, 4, 3, 1],
  [1, 3, 4, 2]
]
