import { ExtCellContainer } from '../../app/pol/core/cell_container'
import {
  SeedCellAddListener,
  CellMoveListener,
  CellMakeChildListener,
  CellDivideListener,
  CellDeathListener
} from '../../app/pol/core/plain'
import { RuleExtensionFactory } from '../../app/pol/core/rule_extension_factory'

/* eslint-disable*/
export class MySeedCellAddListener<E extends RuleExtensionFactory> implements SeedCellAddListener<E> {
  onSeedCellAdd(cellContainer: ExtCellContainer<E>): void {}
}

export class MyCellMoveListener<E extends RuleExtensionFactory> implements CellMoveListener<E> {
  onCellMove(cellContainer: ExtCellContainer<E>, oldX: number, oldY: number, dX: number, dY: number): void {}
}

export class MyCellMakeChildListener<E extends RuleExtensionFactory> implements CellMakeChildListener<E> {
  onCellMakeChild(parent: ExtCellContainer<E>, child: ExtCellContainer<E>, dX: number, dY: number): void {}
}

export class MyCellDivideListener<E extends RuleExtensionFactory> implements CellDivideListener<E> {
  onCellDivide(
    parent: ExtCellContainer<E>,
    child1: ExtCellContainer<E>,
    dX1: number,
    dY1: number,
    child2: ExtCellContainer<E>,
    dX2: number,
    dY2: number
  ): void {}
}

export class MyCellDeathListener<E extends RuleExtensionFactory> implements CellDeathListener<E> {
  onCellDeath(cellContainer: ExtCellContainer<E>): void {}
}
/* eslint-enable*/
