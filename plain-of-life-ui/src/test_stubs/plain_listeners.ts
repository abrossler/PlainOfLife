import { ExtPlainField } from 'src/app/pol/core/plain_field'
import { ExtCellContainer } from '../app/pol/core/cell_container'
import {
  SeedCellAddListener,
  CellMoveListener,
  CellMakeChildListener,
  CellDivideListener,
  CellDeathListener
} from '../app/pol/core/plain'
import { RuleExtensionFactory } from '../app/pol/core/rule_extension_factory'

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
