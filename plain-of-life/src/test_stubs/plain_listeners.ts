import { type ExtPlainField } from '../pol/core/plain_field'
import { type ExtCellContainer } from '../pol/core/cell_container'
import { type SeedCellAddListener, type CellMoveListener, type CellMakeChildListener, type CellDivideListener, type CellDeathListener } from '../pol/core/plain'
import { type RuleExtensionFactory } from '../pol/core/rule_extension_factory'

/* eslint-disable*/
export class MySeedCellAddListener<E extends RuleExtensionFactory> implements SeedCellAddListener<E> {
  onSeedCellAdd(cellContainer: ExtCellContainer<E>): void {}
}

export class MyCellMoveListener<E extends RuleExtensionFactory> implements CellMoveListener<E> {
  onCellMove(cellContainer: ExtCellContainer<E>, from: ExtPlainField<E>): void {}
}

export class MyCellMakeChildListener<E extends RuleExtensionFactory> implements CellMakeChildListener<E> {
  onCellMakeChild(parent: ExtCellContainer<E>, child: ExtCellContainer<E>): void {}
}

export class MyCellDivideListener<E extends RuleExtensionFactory> implements CellDivideListener<E> {
  onCellDivide(parent: ExtCellContainer<E>, child1: ExtCellContainer<E>, child2: ExtCellContainer<E>): void {}
}

export class MyCellDeathListener<E extends RuleExtensionFactory> implements CellDeathListener<E> {
  onCellDeath(cellContainer: ExtCellContainer<E>): void {}
}
/* eslint-enable*/
