import { FloodFill, Point } from '../util/flood_fill'
import { modulo } from '../util/modulo'
import { ExtCellContainer } from '../core/cell_container'
import {
  CellDeathListener,
  CellDivideListener,
  CellMakeChildListener,
  CellMoveListener,
  ExtPlain,
  SeedCellAddListener
} from '../core/plain'
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

export class CoherentAreasManager
  implements
    SeedCellAddListener<MinRuleExtensionFactory>,
    CellMoveListener<MinRuleExtensionFactory>,
    CellMakeChildListener<MinRuleExtensionFactory>,
    CellDivideListener<MinRuleExtensionFactory>,
    CellDeathListener<MinRuleExtensionFactory>
{
  private plain: MinFieldRecord[][]
  private floodFill: FloodFill<MinFieldRecord>
  private fillWithNull: MinFieldRecord
  private width: number
  private height: number

  constructor(extPlain: ExtPlain<MinRuleExtensionFactory>) {
    extPlain.addSeedCellAddListener(this)
    extPlain.addCellMoveListener(this)
    extPlain.addCellMakeChildListener(this)
    extPlain.addCellDivideListener(this)
    extPlain.addCellDeathListener(this)

    this.plain = new Array<Array<MinFieldRecord>>()
    this.width = extPlain.width
    this.height = extPlain.height
    for (let y = 0; y < this.height; y++) {
      const row: MinFieldRecord[] = new Array<MinFieldRecord>()
      for (let x = 0; x < this.width; x++) {
        row.push(extPlain.getAt(x, y).fieldRecord)
      }
      this.plain.push(row)
    }

    this.floodFill = new FloodFill(
      this.plain,
      (t1, t2) => t1.owner === t2.owner,
      (plain, fillWith, x, y) => (plain[y][x].owner = fillWith.owner)
    )

    this.fillWithNull = { owner: null }
  }

  onSeedCellAdd(cellContainer: ExtCellContainer<MinRuleExtensionFactory>): void {
    this.place(cellContainer)
  }

  onCellMove(
    cellContainer: ExtCellContainer<MinRuleExtensionFactory>,
    oldX: number,
    oldY: number,
    dX: number,
    dY: number
  ): void {
    if (dX === 0 && dY === 0) {
      return
    }

    if (!((dX === 0 && (dY === 1 || dY === -1)) || (dY === 0 && (dX === 1 || dX === -1)))) {
      const x = cellContainer.posX
      const y = cellContainer.posY
      const xMinus1 = modulo(x - 1, this.width)
      const xPlus1 = modulo(x + 1, this.width)
      const yMinus1 = modulo(y - 1, this.height)
      const yPlus1 = modulo(y + 1, this.height)

      if (
        this.plain[yMinus1][x].owner !== cellContainer &&
        this.plain[y][xPlus1].owner !== cellContainer &&
        this.plain[yPlus1][x].owner !== cellContainer &&
        this.plain[y][xMinus1].owner !== cellContainer
      ) {
        cellContainer.cellRecord.ownedFieldsCount = 0
        this.floodFill.fill(this.fillWithNull, oldX, oldY)
      }
    }
    this.place(cellContainer)
  }

  onCellMakeChild(
    parent: ExtCellContainer<MinRuleExtensionFactory>,
    child: ExtCellContainer<MinRuleExtensionFactory>
    //dX: number,
    //dY: number
  ): void {
    this.place(child)
  }

  onCellDivide(
    parent: ExtCellContainer<MinRuleExtensionFactory>
    // child1: ExtCellContainer<MinRuleExtensionFactory>,
    // dX1: number,
    // dY1: number,
    // child2: ExtCellContainer<MinRuleExtensionFactory>,
    // dX2: number,
    // dY2: number
  ): void {
    // ToDo
    // Parent looses all
    parent.cellRecord.ownedFieldsCount = 0
    this.floodFill.fill(this.fillWithNull, parent.posX, parent.posY)
    // No children connected to parent area => Everything lost
    // Only one child connected => Connected Child gets all
    // Both children connected => Closer child gets field
  }

  onCellDeath(cellContainer: ExtCellContainer<MinRuleExtensionFactory>): void {
    cellContainer.cellRecord.ownedFieldsCount = 0
    this.floodFill.fill(this.fillWithNull, cellContainer.posX, cellContainer.posY)
  }

  private place(cellContainer: ExtCellContainer<MinRuleExtensionFactory>) {
    const x = cellContainer.posX
    const y = cellContainer.posY
    const newFieldRecord = this.plain[y][x]
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
    oldOwner.cellRecord.ownedFieldsCount--

    const xMinus1 = modulo(x - 1, this.width)
    const xPlus1 = modulo(x + 1, this.width)
    const yMinus1 = modulo(y - 1, this.height)
    const yPlus1 = modulo(y + 1, this.height)

    let sameOwner: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 = 0b0000
    if (this.plain[yMinus1][x].owner === oldOwner) {
      // Up
      sameOwner |= 0b1000
    }
    if (this.plain[y][xPlus1].owner === oldOwner) {
      // Right
      sameOwner |= 0b0100
    }
    if (this.plain[yPlus1][x].owner === oldOwner) {
      // Down
      sameOwner |= 0b0010
    }
    if (this.plain[y][xMinus1].owner === oldOwner) {
      // Left
      sameOwner |= 0b0001
    }

    switch (sameOwner) {
      // No neighbors or only one neighbor owned by the old owner
      case 0b0000:
      case 0b1000:
      case 0b0100:
      case 0b0010:
      case 0b0001:
        return

      // Two neighbors owned by the old owner
      // Up right
      case 0b1100:
        if (this.plain[yMinus1][xPlus1].owner !== oldOwner) {
          const relPos = this.getRelPosOldOwner(x, y, oldOwnerX, oldOwnerY)
          this.checkAndNullNeighbors(
            oldOwner,
            { x: x, y: yMinus1, dist: neighborDist[relPos][up] },
            { x: xPlus1, y: y, dist: neighborDist[relPos][right] }
          )
        }
        return

      // Down right
      case 0b0110:
        if (this.plain[yPlus1][xPlus1].owner !== oldOwner) {
          const relPos = this.getRelPosOldOwner(x, y, oldOwnerX, oldOwnerY)
          this.checkAndNullNeighbors(
            oldOwner,
            { x: xPlus1, y: y, dist: neighborDist[relPos][right] },
            { x: x, y: yPlus1, dist: neighborDist[relPos][down] }
          )
        }
        return

      // Down left
      case 0b0011:
        if (this.plain[yPlus1][xMinus1].owner !== oldOwner) {
          const relPos = this.getRelPosOldOwner(x, y, oldOwnerX, oldOwnerY)
          this.checkAndNullNeighbors(
            oldOwner,
            { x: x, y: yPlus1, dist: neighborDist[relPos][down] },
            { x: xMinus1, y: y, dist: neighborDist[relPos][left] }
          )
        }
        return

      // Up left
      case 0b1001:
        if (this.plain[yMinus1][xMinus1].owner !== oldOwner) {
          const relPos = this.getRelPosOldOwner(x, y, oldOwnerX, oldOwnerY)
          this.checkAndNullNeighbors(
            oldOwner,
            { x: xMinus1, y: y, dist: neighborDist[relPos][left] },
            { x: x, y: yMinus1, dist: neighborDist[relPos][up] }
          )
        }
        return

      // Horizontal row
      case 0b0101: {
        const relPos = this.getRelPosOldOwner(x, y, oldOwnerX, oldOwnerY)
        this.checkAndNullNeighbors(
          oldOwner,
          { x: xPlus1, y: y, dist: neighborDist[relPos][right] },
          { x: xMinus1, y: y, dist: neighborDist[relPos][left] }
        )
        return
      }
      // Vertical column
      case 0b1010: {
        const relPos = this.getRelPosOldOwner(x, y, oldOwnerX, oldOwnerY)
        this.checkAndNullNeighbors(
          oldOwner,
          { x: x, y: yMinus1, dist: neighborDist[relPos][up] },
          { x: x, y: yPlus1, dist: neighborDist[relPos][down] }
        )
        return
      }

      // Three neighbors owned by the old owner
      // Up neighbor is not owned by old owner
      case 0b0111: {
        const rightDownOwned = this.plain[yPlus1][xPlus1].owner === oldOwner
        const leftDownOwned = this.plain[yPlus1][xMinus1].owner === oldOwner
        if (rightDownOwned && leftDownOwned) {
          return
        }
        const relPos = this.getRelPosOldOwner(x, y, oldOwnerX, oldOwnerY)
        this.checkAndNull3Neighbors(
          oldOwner,
          { x: xPlus1, y: y, dist: neighborDist[relPos][right] },
          { x: x, y: yPlus1, dist: neighborDist[relPos][down] },
          { x: xMinus1, y: y, dist: neighborDist[relPos][left] },
          rightDownOwned,
          leftDownOwned
        )
        return
      }

      // Right neighbor is not owned by old owner
      case 0b1011: {
        const leftDownOwned = this.plain[yPlus1][xMinus1].owner === oldOwner
        const leftUpOwned = this.plain[yMinus1][xMinus1].owner === oldOwner
        if (leftDownOwned && leftUpOwned) {
          return
        }
        const relPos = this.getRelPosOldOwner(x, y, oldOwnerX, oldOwnerY)
        this.checkAndNull3Neighbors(
          oldOwner,
          { x: x, y: yPlus1, dist: neighborDist[relPos][down] },
          { x: xMinus1, y: y, dist: neighborDist[relPos][left] },
          { x: x, y: yMinus1, dist: neighborDist[relPos][up] },
          leftDownOwned,
          leftUpOwned
        )
        return
      }

      // Down neighbor is not owned by old owner
      case 0b1101: {
        const leftUpOwned = this.plain[yMinus1][xMinus1].owner === oldOwner
        const rightUpOwned = this.plain[yMinus1][xPlus1].owner === oldOwner
        if (leftUpOwned && rightUpOwned) {
          return
        }
        const relPos = this.getRelPosOldOwner(x, y, oldOwnerX, oldOwnerY)
        this.checkAndNull3Neighbors(
          oldOwner,
          { x: xMinus1, y: y, dist: neighborDist[relPos][left] },
          { x: x, y: yMinus1, dist: neighborDist[relPos][up] },
          { x: xPlus1, y: y, dist: neighborDist[relPos][right] },
          leftUpOwned,
          rightUpOwned
        )
        return
      }

      // Left neighbor is not owned by old owner
      case 0b1110: {
        const rightUpOwned = this.plain[yMinus1][xPlus1].owner === oldOwner
        const rightDownOwned = this.plain[yPlus1][xPlus1].owner === oldOwner
        if (rightUpOwned && rightDownOwned) {
          return
        }
        const relPos = this.getRelPosOldOwner(x, y, oldOwnerX, oldOwnerY)
        this.checkAndNull3Neighbors(
          oldOwner,
          { x: x, y: yMinus1, dist: neighborDist[relPos][up] },
          { x: xPlus1, y: y, dist: neighborDist[relPos][right] },
          { x: x, y: yPlus1, dist: neighborDist[relPos][down] },
          rightUpOwned,
          rightDownOwned
        )
        return
      }

      // All 4 neighbors are owned by the old owner
      case 0b1111: {
        return
      }
    }
  }

  private checkAndNull3Neighbors(
    oldOwner: ExtCellContainer<MinRuleExtensionFactory>,
    n1: Neighbor,
    n2: Neighbor,
    n3: Neighbor,
    c1SameOwner: boolean,
    c2SameOwner: boolean
  ) {
    if (c1SameOwner) {
      n1.dist = Math.min(n1.dist, n2.dist)
      this.checkAndNullNeighbors(oldOwner, n1, n3)
    } else if (c2SameOwner) {
      n3.dist = Math.min(n3.dist, n2.dist)
      this.checkAndNullNeighbors(oldOwner, n1, n3)
    } else {
      this.checkAndNullNeighbors(oldOwner, n1, n2, n3)
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

  private checkAndNullNeighbors(oldOwner: ExtCellContainer<MinRuleExtensionFactory>, ...toCheck: Neighbor[]): void {
    const oldOwnerX = oldOwner.posX
    const oldOwnerY = oldOwner.posY

    let closest: Neighbor | null = null

    for (let i = 0; i < toCheck.length; i++) {
      if (i > 1 && this.plain[toCheck[i].y][toCheck[i].x].owner === null) {
        continue
      }

      if (closest === null) {
        closest = toCheck[i]
        continue
      }

      let current = toCheck[i]

      if (current.dist < closest.dist) {
        ;[closest, current] = [current, closest]
      }

      // Try to fill a disconnected part of the area with null
      const filledPoints: Point[] = []
      const filled = this.floodFill.fill(this.fillWithNull, current.x, current.y, filledPoints)

      // Ups, by mistake we filled a part that is connected
      if (this.plain[oldOwnerY][oldOwnerX].owner === null) {
        oldOwner.cellRecord.ownedFieldsCount = filled

        // At least we now know for sure that every non-null neighbor must be disconnected and we have to fill it with null
        for (const current of toCheck) {
          if (this.plain[current.y][current.x].owner !== null) {
            this.floodFill.fill(this.fillWithNull, current.x, current.y)
          }
        }
        // Undo fill by mistake
        for (const point of filledPoints) {
          this.plain[point.y][point.x].owner = oldOwner
        }
        return
      } else {
        oldOwner.cellRecord.ownedFieldsCount -= filled
      }

      // OK, closest was connected to disconnected part and has to be re-filled in the next iteration
      if (this.plain[closest.y][closest.x].owner === null) {
        closest = null
      }
    }
  }
}

type Direction = 0 | 1 | 2 | 3
const up: Direction = 0
const right: Direction = 1
const down: Direction = 2
const left: Direction = 3

type Neighbor = { x: number; y: number; dist: number }

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
