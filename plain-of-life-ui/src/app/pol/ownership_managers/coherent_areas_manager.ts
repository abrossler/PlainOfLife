import { FloodFill, Point } from '../util/flood_fill'
import { modulo } from '../util/modulo'
import {
  CellDeathListener,
  CellDivideListener,
  CellMakeChildListener,
  CellMoveListener,
  ExtPlain,
  SeedCellAddListener
} from '../core/plain'
import { RuleExtensionFactory } from '../core/rule_extension_factory'
import { East, North, South, West } from '../util/direction'

/**
 * Plain field as needed by a coherent areas manager
 */
interface PlainField {
  posX: number
  posY: number
  getNeighbor(direction: Direction): PlainField
  fieldRecord: MinFieldRecord
}

/**
 * The minimum cell record required by a coherent areas manager containing at least an ownedFieldsCount property
 */
interface MinCellRecord {
  ownedFieldsCount: number
}

/**
 * Cell container as needed by a coherent areas manager
 */
interface CellContainer {
  plainField: PlainField
  cellRecord: MinCellRecord
}

/**
 * The minimum field record required by a coherent areas manager containing at least an owner property
 */
interface MinFieldRecord {
  owner: CellContainer | null
}

/**
 * The minimum rule extension factory creating cell and field records containing at least the minimal required properties
 */
interface MinRuleExtensionFactory extends RuleExtensionFactory {
  createNewCellRecord(): MinCellRecord & Record<string, unknown>
  createNewFieldRecord(): MinFieldRecord & Record<string, unknown>
}

/**
 * A manager of coherent plain fields owned by a cell in a plain of life game.
 * Using this manager a cell owns all coherent fields it once visited. If parts of this coherent area are cut off by another
 * moving cell, the cell looses the ownership of these cut-off parts.
 *
 * Rules that want to use this kind of field ownership can just create a CoherentAreasManager for their plain. The manager
 * registers to all relevant plain events such as onCellMove and updates the owner property of all plain fields and
 * the ownedFieldsCount property of all cell containers when the cells are moving, reproducing, ... To use this manager, the
 * rules must support the owner and ownedFieldsCount properties with their field and cell records.
 */
export class CoherentAreasManager // Listens to all relevant cell events that have an impact on the field ownership
  implements
    SeedCellAddListener<MinRuleExtensionFactory>,
    CellMoveListener<MinRuleExtensionFactory>,
    CellMakeChildListener<MinRuleExtensionFactory>,
    CellDivideListener<MinRuleExtensionFactory>,
    CellDeathListener<MinRuleExtensionFactory>
{
  private plain: MinFieldRecord[][] // Dedicated array on field record level (and not PlainField level) representing the plain => faster access mainly with flood fill
  private floodFill: FloodFill<MinFieldRecord>
  private fillWithNull: MinFieldRecord = { owner: null } // Dummy field record to flood fill the owner with null
  private width: number // Width of plain
  private halfWidth: number
  private height: number // Height of plain
  private halfHeight: number

  // Some onCellDivide specific stuff...
  private dummyOwner1: CellContainer = {
    cellRecord: { ownedFieldsCount: -1 },
    plainField: { posX: -1, posY: -1, getNeighbor: () => this.dummyOwner1.plainField, fieldRecord: { owner: null } }
  }
  private dummyOwner2: CellContainer = {
    cellRecord: { ownedFieldsCount: -1 },
    plainField: { posX: -1, posY: -1, getNeighbor: () => this.dummyOwner2.plainField, fieldRecord: { owner: null } }
  }
  private childOneInheritsNext = true

  /**
   * Create a coherent ares manager for a plain. For consistency make sure that the manager is created before the first
   * relevant cell events such as addSeedCell occurred.
   *
   * Don't serialize a coherent areas manager. Just create a new manager after de-serialization.
   */
  constructor(extPlain: ExtPlain<MinRuleExtensionFactory>) {
    // Register for all cell events that have an impact on the field ownership
    extPlain.addSeedCellAddListener(this)
    extPlain.addCellMoveListener(this)
    extPlain.addCellMakeChildListener(this)
    extPlain.addCellDivideListener(this)
    extPlain.addCellDeathListener(this)

    // Init plain of field records
    this.plain = new Array<Array<MinFieldRecord>>()
    this.width = extPlain.width
    this.halfWidth = this.width >> 1
    this.height = extPlain.height
    this.halfHeight = this.height >> 1
    for (let y = 0; y < this.height; y++) {
      const row: MinFieldRecord[] = new Array<MinFieldRecord>()
      for (let x = 0; x < this.width; x++) {
        row.push(extPlain.getAt(x, y).fieldRecord)
      }
      this.plain.push(row)
    }

    // Create flood fill object
    this.floodFill = new FloodFill(
      this.plain,
      (t1, t2) => t1.owner === t2.owner, // Equality of fields means that owners are equal
      (plain, fillWith, x, y) => (plain[y][x].owner = fillWith.owner) // Fill means to change owner of field
    )
  }

  /**
   * If a new seed cell was added, it is made the owner of the field where it was placed on.
   *
   * If there is already an old owner of that field, the old owner looses the ownership (also cutting off disconnected parts )
   */
  onSeedCellAdd(cellContainer: CellContainer): void {
    this.place(cellContainer)
  }

  /**
   * If a cell was moved, it's made the new owner of the field where it's moving to. But if the new position is not connected to
   * the already owned area, this area is completely lost.
   *
   * If there is already an old owner of the target field, the old owner looses the ownership and disconnected parts are cut off.
   */
  onCellMove(cellContainer: CellContainer, from: PlainField): void {
    const to = cellContainer.plainField
    const dX = to.posX - from.posX
    const dY = to.posY - from.posY

    // Not needed as already checked in Cell Container moveTo
    // if (dX === 0 && dY === 0) {
    //   return
    // }

    // If moving more than 1 field in any direction...
    if (!((dX === 0 && (dY === 1 || dY === -1)) || (dY === 0 && (dX === 1 || dX === -1)))) {
      // If target field is disconnected (has no neighbor that is owned by moved cell)...
      if (
        to.getNeighbor(North).fieldRecord.owner !== cellContainer &&
        to.getNeighbor(East).fieldRecord.owner !== cellContainer &&
        to.getNeighbor(South).fieldRecord.owner !== cellContainer &&
        to.getNeighbor(West).fieldRecord.owner !== cellContainer
      ) {
        // The moved cell loses the disconnected originally owned area
        cellContainer.cellRecord.ownedFieldsCount = 0
        this.floodFill.fill(this.fillWithNull, from.posX, from.posY)
      }
    }
    this.place(cellContainer)
  }

  /**
   * If a cell made a child, the child is made the new owner of the field were it is placed. If there is already an old owner
   * of the child's field, the old owner looses the ownership.
   *
   * The child doesn't inherit any ownership of fields from the parent.
   */
  onCellMakeChild(child: CellContainer): void {
    this.place(child)
  }

  /**
   * If a cell divided, the two children are made the new owners of the field they are placed on. Old owners loose the
   * ownership.
   *
   * Each child inherits the ownership of the fields owned by the (died) parent were it's closer to than the other child. In
   * case of the same distance, fields are assigned alternately to the one and the other child. But only fields connected to
   * the child's coherent owned field area are inherited. All disconnected fields are assigned to no owner at all.
   */
  onCellDivide(parent: CellContainer, child1: CellContainer, child2: CellContainer): void {
    const c1x = child1.plainField.posX
    const c1y = child1.plainField.posY
    const c2x = child2.plainField.posX
    const c2y = child2.plainField.posY

    // Remember and release all fields owned by the parent
    parent.cellRecord.ownedFieldsCount = 0
    const parentOwned: Point[] = []
    this.floodFill.fill(this.fillWithNull, parent.plainField.posX, parent.plainField.posY, parentOwned)

    // Inherit parent owned fields only if the two children are not placed on the same field
    if (c1x !== c2x || c1y !== c2y) {
      // Figure out for each parent owned field which child is closer and mark the field with a dummy owner corresponding to the closer child
      for (const toCheck of parentOwned) {
        const dc1 = this.getComparableDist(c1x, c1y, toCheck.x, toCheck.y)
        const dc2 = this.getComparableDist(c2x, c2y, toCheck.x, toCheck.y)

        let closest: CellContainer | null
        if (dc1 < dc2) {
          closest = this.dummyOwner1
        } else if (dc2 < dc1) {
          closest = this.dummyOwner2
        } else {
          // In case of same distance, take one time the one, one time the other child as owner
          if (this.childOneInheritsNext) {
            closest = this.dummyOwner1
          } else {
            closest = this.dummyOwner2
          }
          this.childOneInheritsNext = !this.childOneInheritsNext
        }
        this.plain[toCheck.y][toCheck.x].owner = closest
      }

      // Flood fill all coherent fields marked with dummy owner 1 starting from child 1 position with child 1 as owner.
      // Note that disconnected parts are not filled
      const oldOwnerChild1 = this.plain[c1y][c1x].owner
      this.plain[c1y][c1x].owner = this.dummyOwner1
      child1.cellRecord.ownedFieldsCount = this.floodFill.fill({ owner: child1 }, c1x, c1y) - 1 // -1 => Field where child is placed is added later by place()

      // Same for child 2
      const oldOwnerChild2 = this.plain[c2y][c2x].owner
      this.plain[c2y][c2x].owner = this.dummyOwner2
      child2.cellRecord.ownedFieldsCount = this.floodFill.fill({ owner: child2 }, c2x, c2y) - 1 // -1 => Field where child is placed is added later by place()

      // Remove the owner from all former parent owned fields that are still marked with a dummy owner (this are the disconnected parts not reached by flood fill)
      for (const toCheck of parentOwned) {
        const currentOwner = this.plain[toCheck.y][toCheck.x].owner
        if (currentOwner === this.dummyOwner1 || currentOwner === this.dummyOwner2) {
          this.plain[toCheck.y][toCheck.x].owner = null
        }
      }

      // Before placing the children on their fields, the old owner has to be restored to disconnect cut-off parts correctly
      this.plain[c1y][c1x].owner = oldOwnerChild1
      this.plain[c2y][c2x].owner = oldOwnerChild2
    }
    // Finally placing the children
    this.place(child1)
    this.place(child2)
  }

  /**
   * If a cell died, all fields owned by this cell are released.
   */
  onCellDeath(cellContainer: CellContainer): void {
    cellContainer.cellRecord.ownedFieldsCount = 0
    this.floodFill.fill(this.fillWithNull, cellContainer.plainField.posX, cellContainer.plainField.posY)
  }

  /**
   * Handle the ownership after a cell container was placed on a plain field:
   *
   * Make the new container the owner of the plain field and remove the old owner. If with the removal of the old owner parts
   * of the coherent area owned by the old owner get disconnected, also remove the ownership for these disconnected parts.
   *
   * This part is highly optimized to avoid costly unnecessary flood fills. If a part is really disconnected from the coherent
   * area owned by a cell, it must be filled with owner = null. But there are several strategies to avoid unnecessary additional
   * fills just to figure out what's disconnected.
   */
  private place(cellContainer: CellContainer): void {
    const newFieldRecord = cellContainer.plainField.fieldRecord
    const oldOwner = newFieldRecord.owner

    // Return if the plain field already belongs to cell just placed on that field
    if (oldOwner === cellContainer) {
      return
    }

    const cellRecord = cellContainer.cellRecord

    // If there is no old owner just make the cell the new owner
    if (oldOwner === null) {
      newFieldRecord.owner = cellContainer
      cellRecord.ownedFieldsCount++
      return
    }

    // If the old owner sits on the position were the new owner is placed, the old owner looses all owned fields...
    if (cellContainer.plainField === oldOwner.plainField) {
      this.floodFill.fill(this.fillWithNull, oldOwner.plainField.posX, oldOwner.plainField.posY)
      oldOwner.cellRecord.ownedFieldsCount = 0
      newFieldRecord.owner = cellContainer
      cellRecord.ownedFieldsCount++
      return
    }

    // Make the current cell the new owner
    newFieldRecord.owner = cellContainer
    cellRecord.ownedFieldsCount++
    oldOwner.cellRecord.ownedFieldsCount--

    const x = cellContainer.plainField.posX
    const y = cellContainer.plainField.posY
    const oldOwnerX = oldOwner.plainField.posX
    const oldOwnerY = oldOwner.plainField.posY
    const xMinus1 = modulo(x - 1, this.width)
    const xPlus1 = modulo(x + 1, this.width)
    const yMinus1 = modulo(y - 1, this.height)
    const yPlus1 = modulo(y + 1, this.height)

    // Figure out which neighbors have the old owner as owner, too
    let sameOwner: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 = 0b0000
    if (this.plain[yMinus1][x].owner === oldOwner) {
      sameOwner |= 0b1000 // Up
    }
    if (this.plain[y][xPlus1].owner === oldOwner) {
      sameOwner |= 0b0100 // Right
    }
    if (this.plain[yPlus1][x].owner === oldOwner) {
      sameOwner |= 0b0010 // Down
    }
    if (this.plain[y][xMinus1].owner === oldOwner) {
      sameOwner |= 0b0001 // Left
    }

    // Handle all 16 combinations of neighbors having the old owner as owner
    switch (sameOwner) {
      // If no neighbors or only one neighbor is owned by the old owner, nothing can be cut off - we are done
      case 0b0000:
      case 0b1000:
      case 0b0100:
      case 0b0010:
      case 0b0001:
        return

      // If two neighbors are owned by the old owner there are two groups of cases. First 4 elbow cases:
      //
      //            X = the plain field where new cell is placed and that currently belongs to old owner
      //    N C     N = the two neighbors owned by the old owner
      //  * X N     C = the corner between the two Ns
      //    *       * = further neighbors of X with an other owner than the old owner
      //
      // All 4 elbow cases have a bridge in the corner C of the elbow if C is also owned by the old owner. In this case the
      // coherent area of the old owner can't be split in two parts - we are done. Otherwise a detailed check is required:
      // The two Ns still might be connected by another longer path (and thus there is still one coherent area) or - if not
      // connected - we have to figure out if N1 or N2 is still connected to the old owner.
      //
      // 1.) Up right elbow
      case 0b1100:
        if (this.plain[yMinus1][xPlus1].owner !== oldOwner) {
          // If there is no direct bridge...
          const relPos = getRelPosOldOwner(x, y, oldOwnerX, oldOwnerY)
          this.checkAndNullNeighbors(
            // ...check in detail if one of the two Ns is disconnected from the old owner
            oldOwner,
            { x: x, y: yMinus1, dist: neighborDist[relPos][up] },
            { x: xPlus1, y: y, dist: neighborDist[relPos][right] }
          )
        }
        return

      // 2.) Down right elbow
      case 0b0110:
        if (this.plain[yPlus1][xPlus1].owner !== oldOwner) {
          const relPos = getRelPosOldOwner(x, y, oldOwnerX, oldOwnerY)
          this.checkAndNullNeighbors(
            oldOwner,
            { x: xPlus1, y: y, dist: neighborDist[relPos][right] },
            { x: x, y: yPlus1, dist: neighborDist[relPos][down] }
          )
        }
        return

      // 3.) Down left elbow
      case 0b0011:
        if (this.plain[yPlus1][xMinus1].owner !== oldOwner) {
          const relPos = getRelPosOldOwner(x, y, oldOwnerX, oldOwnerY)
          this.checkAndNullNeighbors(
            oldOwner,
            { x: x, y: yPlus1, dist: neighborDist[relPos][down] },
            { x: xMinus1, y: y, dist: neighborDist[relPos][left] }
          )
        }
        return

      // 4.) Up left elbow
      case 0b1001:
        if (this.plain[yMinus1][xMinus1].owner !== oldOwner) {
          const relPos = getRelPosOldOwner(x, y, oldOwnerX, oldOwnerY)
          this.checkAndNullNeighbors(
            oldOwner,
            { x: xMinus1, y: y, dist: neighborDist[relPos][left] },
            { x: x, y: yMinus1, dist: neighborDist[relPos][up] }
          )
        }
        return

      // Second 2 line cases:
      //
      //    *       X = the plain field where new cell is placed and that currently belongs to old owner
      //  N X N     N = the two neighbors owned by the old owner
      //    *       * = further neighbors of X with an other owner than the old owner
      //
      // In both line cases there are no corner fields that might act as bride and directly connect N1 and N2. So a detailed
      // check is always required for both Ns.
      //
      // 1.) Horizontal line
      case 0b0101: {
        const relPos = getRelPosOldOwner(x, y, oldOwnerX, oldOwnerY)
        this.checkAndNullNeighbors(
          oldOwner,
          { x: xPlus1, y: y, dist: neighborDist[relPos][right] },
          { x: xMinus1, y: y, dist: neighborDist[relPos][left] }
        )
        return
      }
      // 2.) Vertical line
      case 0b1010: {
        const relPos = getRelPosOldOwner(x, y, oldOwnerX, oldOwnerY)
        this.checkAndNullNeighbors(
          oldOwner,
          { x: x, y: yMinus1, dist: neighborDist[relPos][up] },
          { x: x, y: yPlus1, dist: neighborDist[relPos][down] }
        )
        return
      }

      // If three neighbors are owned by the old owner, there are 4 cases:
      //
      //            X = the plain field where new cell is placed and that currently belongs to old owner
      //    *       N = the three neighbors owned by the old owner
      //  N X N     C = the two corners between the three Ns
      //  C N C     * = the remaining neighbor of X with an other owner than the old owner
      //
      // In all 4 cases there are three neighbors that might be connected by two bridges in the two corners. If there are two bridges
      // the coherent area of the old owner can't be split in two parts - we are done. Otherwise a detailed check is required.
      //
      // 1.) Only neighbor above is not owned by old owner
      case 0b0111: {
        const rightDownOwned = this.plain[yPlus1][xPlus1].owner === oldOwner
        const leftDownOwned = this.plain[yPlus1][xMinus1].owner === oldOwner
        if (rightDownOwned && leftDownOwned) {
          return // If there are two bridges, nothing can be disconnected and we are done
        }
        // All other cases have to be checked in detail...
        const relPos = getRelPosOldOwner(x, y, oldOwnerX, oldOwnerY)
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

      // 2.) Only the right neighbor is not owned by old owner
      case 0b1011: {
        const leftDownOwned = this.plain[yPlus1][xMinus1].owner === oldOwner
        const leftUpOwned = this.plain[yMinus1][xMinus1].owner === oldOwner
        if (leftDownOwned && leftUpOwned) {
          return
        }
        const relPos = getRelPosOldOwner(x, y, oldOwnerX, oldOwnerY)
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

      // 3.) Only the neighbor below is not owned by old owner
      case 0b1101: {
        const leftUpOwned = this.plain[yMinus1][xMinus1].owner === oldOwner
        const rightUpOwned = this.plain[yMinus1][xPlus1].owner === oldOwner
        if (leftUpOwned && rightUpOwned) {
          return
        }
        const relPos = getRelPosOldOwner(x, y, oldOwnerX, oldOwnerY)
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

      // 4.) Only the left neighbor is not owned by old owner
      case 0b1110: {
        const rightUpOwned = this.plain[yMinus1][xPlus1].owner === oldOwner
        const rightDownOwned = this.plain[yPlus1][xPlus1].owner === oldOwner
        if (rightUpOwned && rightDownOwned) {
          return
        }
        const relPos = getRelPosOldOwner(x, y, oldOwnerX, oldOwnerY)
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

      // If all 4 neighbors are owned by the old owner
      //
      //  C4 N1 C1     X = the plain field where new cell is placed and that currently belongs to old owner
      //  N4 X  N2     N = the four neighbors owned by the old owner
      //  C3 N3 C2     C = the four corners between the four Ns
      //
      // If there is a bridge at C1, N1 and N2 are connected and it's sufficient to check only N2 in detail.
      // If there is a bridge at C2, a detailed check of N2 is not needed and it's sufficient to check N3. And so on...
      // If overall there are at least 3 bridges in the 4 corners, all Ns are connected and we are done without a detailed
      // check.
      case 0b1111: {
        const relPos = getRelPosOldOwner(x, y, oldOwnerX, oldOwnerY)
        const toCheck: Neighbor[] = [] // Neighbors that have to be checked in detail

        // If checking multiple connected neighbors together, check with the minimum distance
        // of all connected neighbors to the old owner for best guessing which group of
        // disconnected neighbors is disconnected from the old owner (assume that the group
        // with the bigger distance is disconnected)
        let minDist = neighborDist[relPos][up]

        // Right up corner not owned => no bridge there => detailed check needed if neighbor on top is disconnected
        if (this.plain[yMinus1][xPlus1].owner !== oldOwner) {
          toCheck.push({ x: x, y: yMinus1, dist: minDist })
          minDist = maxNeighborDist
        }

        minDist = Math.min(minDist, neighborDist[relPos][right])
        // Right down corner not owned => no bridge there => detailed check needed if neighbor to right is disconnected
        if (this.plain[yPlus1][xPlus1].owner !== oldOwner) {
          toCheck.push({ x: xPlus1, y: y, dist: minDist })
          minDist = maxNeighborDist
        }

        // And so on - see above...
        minDist = Math.min(minDist, neighborDist[relPos][down])
        if (this.plain[yPlus1][xMinus1].owner !== oldOwner) {
          toCheck.push({ x: x, y: yPlus1, dist: minDist })
          minDist = maxNeighborDist
        }

        // And so on - see above...
        minDist = Math.min(minDist, neighborDist[relPos][left])
        if (this.plain[yMinus1][xMinus1].owner !== oldOwner) {
          toCheck.push({ x: xMinus1, y: y, dist: minDist })
        } else if (toCheck.length) {
          toCheck[0].dist = Math.min(toCheck[0].dist, minDist)
        }

        // We have to perform the detailed check only if there are less than 3 bridges
        if (toCheck.length > 1) {
          this.checkAndNullNeighbors(oldOwner, ...toCheck)
        }
        return
      }
    }
  }

  /**
   * Prepare the detailed check for all 4 cases with three neighbors owned by the old owner.
   *    *
   * n3 X  n1
   * c2 n2 c1
   */
  private checkAndNull3Neighbors(
    oldOwner: CellContainer,
    n1: Neighbor,
    n2: Neighbor,
    n3: Neighbor,
    c1SameOwner: boolean,
    c2SameOwner: boolean
  ) {
    if (c1SameOwner) {
      // If c1 is a bridge and connects n1 and n2, n1 and n2 can be checked together
      // We shall do the joint check of n1 and n2 assuming the minimum distance of n1 and n1 to the old owner for best
      // guessing which neighbors are connected and which are disconnected (performance optimization in the detailed check)
      n1.dist = Math.min(n1.dist, n2.dist)
      this.checkAndNullNeighbors(oldOwner, n1, n3)
    } else if (c2SameOwner) {
      // Same as above - just with the bridge in different corner...
      n3.dist = Math.min(n3.dist, n2.dist)
      this.checkAndNullNeighbors(oldOwner, n1, n3)
    } else {
      // No bridges => all three neighbors n1 to n3 have to be checked in detail
      this.checkAndNullNeighbors(oldOwner, n1, n2, n3)
    }
  }

  /**
   * Perform a detailed check if neighbors owned by the old owner got disconnected from the old owner and thus are not part
   * of the old owners coherent area any more. If so, flood fill the disconnected neighbor with owner = null to remove the
   * whole cut-off area from the old owner's owned area.
   */
  private checkAndNullNeighbors(oldOwner: CellContainer, ...toCheck: Neighbor[]): void {
    const oldOwnerX = oldOwner.plainField.posX
    const oldOwnerY = oldOwner.plainField.posY

    // At least one neighbor remains connected to the old owner. Let's guess that this is the neighbor that is currently the
    // closest to the old owner. Thus don't test the closest in detail. If all other neighbors are disconnected, this one must
    // be connected without further check.
    let closest: Neighbor | null = null

    // Check all neighbors to check
    for (let i = 0; i < toCheck.length; i++) {
      if (closest === null) {
        closest = toCheck[i]
        continue
      }

      let current = toCheck[i]

      // If the current neighbor is closer than the closest, swap current and closest
      if (current.dist < closest.dist) {
        ;[closest, current] = [current, closest]
      }

      // Try to flood fill a disconnected part of the old owner's owned area with owner = null staring at the current neighbor
      const filledPoints: Point[] = []
      const filled = this.floodFill.fill(this.fillWithNull, current.x, current.y, filledPoints)

      // Ups, by mistake we filled a part that is connected to the old owner
      if (this.plain[oldOwnerY][oldOwnerX].owner === null) {
        oldOwner.cellRecord.ownedFieldsCount = filled // So we get the number of fields owned by the old owner for free

        // At least we now know for sure that every non-null neighbor must be disconnected and we have to fill it with owner = null
        for (const current of toCheck) {
          if (this.plain[current.y][current.x].owner !== null) {
            this.floodFill.fill(this.fillWithNull, current.x, current.y)
          }
        }
        // Undo the fill by mistake
        for (const point of filledPoints) {
          this.plain[point.y][point.x].owner = oldOwner
        }
        return
      }
      // Good, we filled a really disconnected part and can reduce the number of fields owned by the old owner accordingly
      else {
        oldOwner.cellRecord.ownedFieldsCount -= filled
      }

      // OK, closest was connected to the just filled disconnected part and with the next iteration we need a new closest
      if (this.plain[closest.y][closest.x].owner === null) {
        closest = null
      }
    }
  }

  /**
   * Get a comparable distance between two points considering the torus topography of the plain.
   *
   * Comparable means that if d1<d2, distance1 is shorter than distance2. Returns dx*dx + dy*dy instead of the real distance
   * SQRT(dx*dx + dy*dy) for better performance.
   */
  getComparableDist(x1: number, y1: number, x2: number, y2: number): number {
    let dx = Math.abs(x2 - x1)
    if (dx > this.halfWidth) {
      dx = this.width - dx
    }

    let dy = Math.abs(y2 - y1)
    if (dy > this.halfHeight) {
      dy = this.height - dy
    }

    return dx * dx + dy * dy
  }
}

/**
 * Get the relative position of the old owner to the cell to be placed.
 *
 * Only to be used for performance optimization (access to neighborDist)! Does not consider the torus topography of the
 * plain (for simplicity and better performance) and thus is not reliable in all cases.
 */
function getRelPosOldOwner(
  toPlaceX: number,
  toPLaceY: number,
  oldOwnerX: number,
  oldOwnerY: number
): 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 {
  // Relative position of the old neighbor
  //   \  7  |  0  /       0: Top right
  //     \   |   /         1: Right top
  //   6   \ | /   1       2: Right bottom
  //   ------X------       3: Bottom right
  //   5   / | \   2       4: Bottom left
  //     /   |   \         5: Left bottom
  //   /  4  |  3  \       6: Left top
  //                       7: Top left
  const dX = oldOwnerX - toPlaceX
  const dY = oldOwnerY - toPLaceY

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

type Direction = 0 | 1 | 2 | 3
const up: Direction = 0
const right: Direction = 1
const down: Direction = 2
const left: Direction = 3

type Neighbor = { x: number; y: number; dist: number }

/**
 * Precalculated distance of neighbors to the old owner : Which neighbor of the field to be occupied is closest to the old owner,
 * depending on the relative position of the old owner? Which is second, third and fourth?
 *
 * The first dimension of the array is the relative position of the old owner (0-7)
 * The second dimension is the neighbor: 0: Up, 1: Right, 2: Down, 3: Left
 */

//   \  7  |  0  /       0: Top right
//     \   |   /         1: Right top
//   6   \ U /   1       2: Right bottom
//   ----L-X-R----       3: Bottom right
//   5   / D \   2       4: Bottom left
//     /   |   \         5: Left bottom
//   /  4  |  3  \       6: Left top
//                       7: Top left
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

/**
 * The maximum value in neighborDist
 */
const maxNeighborDist = 4
