import { defaultToSerializable } from '../core/serializable_plain_of_life'
import { CellContainers } from './cell_container'
import { ExtPlain } from './plain'
import { ExtensionProvider } from './extension_provider'

/**
 * Implement your own Plain of Life rule set by deriving your rules class.
 */
export abstract class Rules<E extends ExtensionProvider> implements ExtensionProvider {

  initNew(plain: ExtPlain<E>, cellContainers: CellContainers<E>): this {
    return this
  }

  initFromSerializable(serializable: Record<string, unknown>): this {
    Object.assign( this, serializable )
    return this
  }

  toSerializable(): Record<string, unknown> {
    return defaultToSerializable( this )
  }

  // /**
  //  * Get the plain to access the individual plain fields by x and y coordinates
  //  */
  // getPlain(): ExtPlain<E> {
  //   return this.plain
  // }

  // /**
  //  * Get the containers of all living cells on the plain for iterating
  //  */
  // getCellContainers(): CellContainers<E> | null {
  //   // Remove leading dead cells
  //   while (this.firstCellContainer.isDead) {
  //     this.firstCellContainer = this.firstCellContainer.next

  //     // Only one last dead cell remaining => game over
  //     if (this.firstCellContainer.isDead && this.firstCellContainer === this.firstCellContainer.next) {
  //       return null
  //     }
  //   }
  //   return new CellContainers(this.firstCellContainer)
  // }

  /**
   * The main method to implement your own Plain of Life rule set.
   * @param plain to access all plain fields by x and y coordinates
   * @param cellContainers to iterate over the containers of all alive cells on the pain
   */
  abstract executeTurn(plain: ExtPlain<E>, cellContainers: CellContainers<E>): void

  /**
   * Provide an object with any property you want to add to all cell containers. The properties are e.g. accessible when
   * iterating over {@link CellContainers}.
   *
   * Typical examples might be cellEnergy: number, cellAge: number or any other attribute required by your rules for each cell.
   */
  abstract createNewCellRecord(): Record<string, unknown>

  initCellRecordFromSerializable( toInit: ReturnType<E['createNewCellRecord']>, serializable: Record<string, unknown> ): void {
    // for(let property in this.createNewCellRecord() ){
    //   (toInit as Record<string, unknown>)[property] = initFrom[property]
    // }
    Object.assign( toInit, serializable )
  }

  // plainFieldToSerializable( plainField: ReturnType<E['createNewPlainField']> ): Record<string, unknown> {
  //   return defaultToSerializable( plainField ) 
 


  cellRecordToSerializable( cellRecord: ReturnType<E['createNewCellRecord']> ): Record<string, unknown> {
    return defaultToSerializable( cellRecord )
    // const serializable = {} as SerializablePlainOfLife['rules']['cellContainers'][number]  
    // for(let property in this.createNewCellRecord() ){
    //   (serializable as Record<string, unknown>)[property] = cellRecord[property]
    // }

    // return serializable
  }

  /**
   * Provide an object with any property you want to add to all plain fields. The properties are e.g. accessible
   * by the plan fields returned via {@link Plain.getAt}.
   *
   * Typical examples might be fieldTemperature: number, fieldFood: Food or any other attribute required by your rules
   * at plain field level
   */
  abstract createNewPlainField(): Record<string, unknown>

  initPlainFieldFromSerializable( toInit: ReturnType<E['createNewPlainField']>, serializable: Record<string, unknown> ): void {
    Object.assign( toInit, serializable )
    // for(let property in this.getPlainFieldExtension() ){

    //   if( initFrom.cellContainerProperties.find(_ => _ === property ) ){
    //     const containerIndex = initFrom[property]
    //     if( typeof containerIndex !== 'number' ){
    //       throw new Error( 'Cell container properties must contain a number (the index of the referenced container)' )
    //     }
    //     let container = this.getCellContainer(containerIndex)
    //     if(container === null){
    //       throw new Error('Cell container with index ' + containerIndex + " doesn't exist" )
    //     }
    //     (toInit as Container<string, unknown>)[property] = container
    //   } else {
    //     (toInit as Container<string, unknown>)[property] = initFrom[property]
    //   }
    // }
  }

  plainFieldToSerializable( plainField: ReturnType<E['createNewPlainField']> ): Record<string, unknown> {
    return defaultToSerializable( plainField ) 
    // const serializable = {} as SerializablePlainOfLife<E>['rules']['plainFields'][number]
    // for(let property in this.createNewPlainField() ){
    //   serializable['cellContainerProperties'] = []
    //   if( extension[property] && Object.getPrototypeOf(extension[property]).constructor ===  CellContainer  ){
    //     serializable.cellContainerProperties.push( property )
    //     let index = this.getCellContainerIndex(extension[property] as ExtCellContainer<E>);
    //     if( index !== null ){
    //       (serializable as Record<string, unknown>)[property] = index
    //     } else {
    //       throw new Error('PlainField.' + property + 'references a cell container not existing in plain of life any more. Forgot to remove reference to container of dead cell from plain field?')
    //     }
    //   } else {
    //     (serializable as Record<string, unknown>)[property] = extension[property]
    //   }
    // }
    // return serializable
  }

  // /**
  //  * Slow, only not performance critical usage
  //  */
  // private getCellContainer( index: number ): ExtCellContainer<E> | null {
  //   let containers = this.getCellContainers()
  //   if( containers === null ) {
  //     return null
  //   }
    
  //   let i=0
  //   for(let container of containers ){
  //     if(i++ === index){
  //       return container
  //     }
  //   }
  //   return null
  // }

  // /**
  //  * Slow, only not performance critical usage
  //  */
  // private getCellContainerIndex( toFind: ExtCellContainer<E> ): number | null {
  //   let containers = this.getCellContainers()
  //   if( containers === null ) {
  //     return null
  //   }

  //   let i=0
  //   for(let container of containers ){
  //     if(container === toFind){
  //       return i
  //     }
  //     i++
  //   }
  //   return null

  // }
}



