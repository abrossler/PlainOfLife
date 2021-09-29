import { FamilyTree } from './family_tree'
import { Rules } from './rules'
import { ExtensionProvider } from "./extension_provider"
import { SerializablePlainOfLife } from '../core/serializable_plain_of_life'
import { getRuleName, getRuleConstructor } from '../rules/rules_names'
import { Cell } from './cell'
import { checkBigInt, checkInt, checkNumber, checkObject, checkString } from '../util/type_checks'
import { CellContainer, CellContainers, ExtCellContainer } from './cell_container'
import { ExtPlain, Plain } from './plain'

const maxPlainSize = 10000000 

export class PlainOfLife<E extends ExtensionProvider> {
  private _currentTurn = 0n
  private familyTree!: FamilyTree<E>
  private rules!: Rules<E>
  private plain!: Plain<E>
  private firstCellContainer!: CellContainer<E>
  
  private constructor() {}

  static createNew<E extends ExtensionProvider>(
    width: number,
    height: number,
    Rules: new () => Rules<E>,
    Cell: new () => Cell,
  ): PlainOfLife<E> {
    const newPOL = new PlainOfLife<E>()

    newPOL.rules = new Rules()
    newPOL.familyTree = new FamilyTree().initNew()

    PlainOfLife.checkSize( width, height )
    const posX = width / 2
    const posY = height / 2

    newPOL.plain = new Plain<E>(newPOL.rules, width, height)
    newPOL.firstCellContainer = new CellContainer<E>(newPOL.rules)
    newPOL.firstCellContainer.initSeedCellContainer(newPOL.plain, new Cell().initNew(), posX, posY)
    newPOL.plain.getAtInt(posX, posY).addCellContainer(newPOL.firstCellContainer)

    newPOL.rules.initNew( newPOL.getPlain(), newPOL.getCellContainers() as CellContainers<E> /* must not be null as we just added a container */ )

    return newPOL
  }

  static createFromSerializable<E extends ExtensionProvider>( serializable: SerializablePlainOfLife ): PlainOfLife<E> {
    const newPOL = new PlainOfLife<E>()

    newPOL._currentTurn = checkBigInt( serializable.currentTurn, 0n )
    let ruleConstructor = getRuleConstructor( checkString(serializable.rulesName) )
    if (typeof ruleConstructor === 'undefined') {
      throw new Error(
        'Unable to get constructor from rules name ' + serializable.rulesName + '. Invalid name or forgot to register the constructor for this name?',
      )
    }
    newPOL.rules = new ruleConstructor().initFromSerializable(checkObject(serializable.rules))
    newPOL.familyTree = new FamilyTree().initFromSerializable(checkObject(serializable.familyTree))

    const width = checkInt(serializable.plainWidth)
    const height = checkInt(serializable.plainHeight)
    PlainOfLife.checkSize( width, height )

    newPOL.plain = new Plain<E>(newPOL.rules, width, height)

    let i=0
    if(serializable.plainFields.length != width*height){
      throw new Error('Incorrect number of plain fields - number must be width * height of plain.')
    }

    for( let y=0; y<height; y++){
      for( let x=0; x<width; x++){
        newPOL.rules.initPlainFieldFromSerializable( newPOL.plain.getAtInt(x,y), serializable.plainFields[i++] )
      }
    }

    if(serializable.cellContainers.length < 1){
      throw new Error('There must be at least one container in cell containers')
    }

    let predecessor: CellContainer<E> | undefined
    for( let serializableContainer of serializable.cellContainers){
      const container = new CellContainer<E>(newPOL.rules)
      if( typeof predecessor === 'undefined' ){
        predecessor = newPOL.firstCellContainer = container
      }
      container.initFromSerializable( serializableContainer, newPOL.plain, predecessor,newPOL.firstCellContainer  )
      newPOL.rules.initCellRecordFromSerializable( container.cellRecord, serializableContainer.cellRecord )
      predecessor = container
    }

    return newPOL
  }

  private static checkSize( width: number, height: number){
    if(width < 2){
      throw new Error('The minimum width for a plain of life is 2 but got ' + width)
    }

    if(height < 2){
      throw new Error('The minimum height for a plain of life is 2 but got ' + height)
    }

    if(!Number.isInteger(width)  ||  !Number.isInteger(height)){
      throw new Error('Width and height for a plain of life must be integer numbers')
    }

    if( width * height > maxPlainSize ){
      throw new Error('Plain is too big - width * height must be <= ' + maxPlainSize )
    }
  }

  toSerializable(): SerializablePlainOfLife {
    const serializable: SerializablePlainOfLife = {} as SerializablePlainOfLife
    serializable['currentTurn'] = this.currentTurn.toString()
    const rulesName = getRuleName(Object.getPrototypeOf(this.rules).constructor)
    if (typeof rulesName === 'undefined') {
      throw new Error('Unable to get rules name from constructor. Forgot to register name for rules implementation?')
    }
    serializable['rulesName'] = rulesName
    serializable['rules'] = this.rules.toSerializable()
    serializable['familyTree'] = this.familyTree.toSerializable()

    const width = this.plain.width
    const height = this.plain.height
    
    serializable['plainWidth'] = width
    serializable['plainHeight'] = height

    serializable['plainFields'] = []
    for( let y=0; y<height; y++){
      for( let x=0; x<width; x++){
        serializable.plainFields.push(this.rules.plainFieldToSerializable( this.plain.getAtInt(x,y) ) )
      }
    }
    
    const containers = this.getCellContainers()
    if( containers ){
      serializable['cellContainers'] = []
      for( let container of containers ) {
        const serializableContainer = container.toSerializable()
        serializableContainer.cellRecord = this.rules.cellRecordToSerializable( container.cellRecord )
        serializable.cellContainers.push(serializableContainer)
      }
    }

    // container.initFromSerializable( serializableContainer, newPOL.plain, predecessor,newPOL.firstCellContainer  )
    // newPOL.rules.initCellRecordFromSerializable( container.cellRecord, serializableContainer.cellRecord )


    return serializable
  }

  executeTurn(): boolean {
    const cellContainers = this.getCellContainers()
    if (cellContainers === null) {
      return false // All cells are dead, game over
    }

    this.rules.executeTurn(this.getPlain(), cellContainers)
    this.familyTree.update(cellContainers)
    this._currentTurn++
    return true
  }

  get currentTurn(): bigint {
    return this._currentTurn
  }

  /**
   * Get the containers of all living cells on the plain for iterating
   */
   getCellContainers(): CellContainers<E> | null {
    // Remove leading dead cells
    while (this.firstCellContainer.isDead) {
      this.firstCellContainer = this.firstCellContainer.next

      // Only one last dead cell remaining => game over
      if (this.firstCellContainer.isDead && this.firstCellContainer === this.firstCellContainer.next) {
        return null
      }
    }
    return new CellContainers(this.firstCellContainer)
  }

    /**
   * Get the plain to access the individual plain fields by x and y coordinates
   */
     getPlain(): ExtPlain<E> {
      return this.plain
    }

  /**
   * Slow, only not performance critical usage
   */
   private getCellContainer( index: number ): ExtCellContainer<E> | null {
    let containers = this.getCellContainers()
    if( containers === null ) {
      return null
    }
    
    let i=0
    for(let container of containers ){
      if(i++ === index){
        return container
      }
    }
    return null
  }

  /**
   * Slow, only not performance critical usage
   */
  private getCellContainerIndex( toFind: ExtCellContainer<E> ): number | null {
    let containers = this.getCellContainers()
    if( containers === null ) {
      return null
    }

    let i=0
    for(let container of containers ){
      if(container === toFind){
        return i
      }
      i++
    }
    return null

  }

}
function checkInteger(plainWidth: number) {
  throw new Error('Function not implemented.')
}

