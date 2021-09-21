import { FamilyTree } from './family_tree'
import { ExtensionProvider, Rules } from './rules'
import { SerializablePlainOfLife } from '../core/serializable_plain_of_life'
//import { runInThisContext } from 'vm'
import { getRuleName, getRuleConstructor } from '../rules/rules_names'
import { Cell } from './cell'

export class PlainOfLife<E extends ExtensionProvider> {
  private _currentTurn = 0n
  private familyTree = new FamilyTree()
  private rules!: Rules<E>

//   constructor(rules: Rules<E>)
//   constructor(serializablePOL: SerializablePlainOfLife<E> )
//   constructor(rules?: Rules<E>, serializablePOL? :SerializablePlainOfLife<E>){
//       if( (typeof rules === 'undefined' && typeof serializablePOL === 'undefined' ) || 
//           (typeof rules !== 'undefined' && typeof serializablePOL !== 'undefined' )) {
//               throw new Error('Not supported combination of arguments')
//           }
//       if(typeof rules !== 'undefined') {
//           this.rules = rules
//       }
//       if(typeof serializablePOL !== 'undefined'){
//         this._currentTurn = BigInt(serializablePOL.currentTurn)
//         let constructor = getRuleConstructor(serializablePOL.rulesName)
//         if(typeof constructor === 'undefined'){
//             throw new Error('Unable to get constructor from rules name. Forgot to register constructor for rules implementation?')
//         }
//         this.rules = new constructor(serializablePOL.rules)
//       }

//   }

private constructor() {}

static createNew<E extends ExtensionProvider> ( width: number, height: number, Rules: new () => Rules<E>, Cell: new () => Cell): PlainOfLife<E> {
    const newPOL = new PlainOfLife<E>()

    newPOL.rules = new Rules()
    newPOL.rules.init(width, height, Cell)
    return newPOL
}

static createFromSerializable<E extends ExtensionProvider> ( serializablePOL: SerializablePlainOfLife<E> ): PlainOfLife<E> {
    const newPOL = new PlainOfLife<E>()

    newPOL._currentTurn = BigInt(serializablePOL.currentTurn)
    let ruleConstructor = getRuleConstructor(serializablePOL.rulesName)
    if(typeof ruleConstructor === 'undefined'){
      throw new Error('Unable to get constructor from rules name. Forgot to register constructor for rules implementation?')
    }
    newPOL.rules = new ruleConstructor()
    newPOL.rules.initFromSerializable( serializablePOL.rules )
    
    return newPOL
}

// PlainIfLife.createNew( 2, 2, DemoRules, DemoCell )

  executeTurn(): boolean {
    const cellRecords = this.rules.getCellRecords()
    if (cellRecords === null) {
      return false // All cells are dead, game over
    }

    this.rules.executeTurn(this.rules.getPlain(), cellRecords)
    this.familyTree.update(this.rules.getCellRecords())
    this._currentTurn++
    return true
  }

  get currentTurn(): bigint {
    return this._currentTurn
  }

  toSerializable(): SerializablePlainOfLife<E> {
    const serializable: SerializablePlainOfLife<E> = {} as SerializablePlainOfLife<E>
    serializable['currentTurn'] = this.currentTurn.toString()
    const rulesName = getRuleName( Object.getPrototypeOf(this.rules).constructor )
    if(typeof rulesName === 'undefined' ){
        throw new Error('Unable to get rules name from constructor. Forgot to register name for rules implementation?')
    }
    serializable['rulesName'] = rulesName
    this.rules.toSerializable( serializable.rules = {} as SerializablePlainOfLife<E>['rules'])

    return serializable
  }
}
