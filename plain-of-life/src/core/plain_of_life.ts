import { FamilyTree } from './family_tree'
import { ExtensionProvider, Rules } from './rules'
import { SerializablePlainOfLife } from '../core/serializable_plain_of_life'
import { getRuleName, getRuleConstructor } from '../rules/rules_names'
import { Cell } from './cell'
import { checkBigInt, checkObject, checkString } from '../util/type_checks'

export class PlainOfLife<E extends ExtensionProvider> {
  private _currentTurn = 0n
  private familyTree!: FamilyTree<E>
  private rules!: Rules<E>

  private constructor() {}

  static createNew<E extends ExtensionProvider>(
    width: number,
    height: number,
    Rules: new () => Rules<E>,
    Cell: new () => Cell,
  ): PlainOfLife<E> {
    const newPOL = new PlainOfLife<E>()

    newPOL.rules = new Rules().initNew(width, height, Cell)
    newPOL.familyTree = new FamilyTree().initNew()
    return newPOL
  }

  static createFromSerializable<E extends ExtensionProvider>( serializable: SerializablePlainOfLife<E> ): PlainOfLife<E> {
    const newPOL = new PlainOfLife<E>()

    newPOL._currentTurn = checkBigInt( serializable.currentTurn, 0n )
    let ruleConstructor = getRuleConstructor( checkString(serializable.rulesName) )
    if (typeof ruleConstructor === 'undefined') {
      throw new Error(
        'Unable to get constructor from rules name ' + serializable.rulesName + '. Invalid name or forgot to register constructor for rules implementation?',
      )
    }
    newPOL.rules = new ruleConstructor().initFromSerializable(checkObject(serializable.rules))
    newPOL.familyTree = new FamilyTree().initFromSerializable(checkObject(serializable.familyTree))

    return newPOL
  }

  toSerializable(): SerializablePlainOfLife<E> {
    const serializable: SerializablePlainOfLife<E> = {} as SerializablePlainOfLife<E>
    serializable['currentTurn'] = this.currentTurn.toString()
    const rulesName = getRuleName(Object.getPrototypeOf(this.rules).constructor)
    if (typeof rulesName === 'undefined') {
      throw new Error('Unable to get rules name from constructor. Forgot to register name for rules implementation?')
    }
    serializable['rulesName'] = rulesName
    serializable['rules'] = this.rules.toSerializable()
    serializable['familyTree'] = this.familyTree.toSerializable()
    return serializable
  }

  executeTurn(): boolean {
    const cellRecords = this.rules.getCellRecords()
    if (cellRecords === null) {
      return false // All cells are dead, game over
    }

    this.rules.executeTurn(this.rules.getPlain(), cellRecords)
    this.familyTree.update(cellRecords)
    this._currentTurn++
    return true
  }

  get currentTurn(): bigint {
    return this._currentTurn
  }
}
