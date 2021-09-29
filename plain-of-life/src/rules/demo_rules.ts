import { Rules } from '../core/rules'
import { ExtPlain } from "../core/plain"
import { CellContainers, ExtCellContainer } from '../core/cell_container'

export class DemoRules extends Rules<DemoRules> {

  executeTurn(plain: ExtPlain<DemoRules>, cellContainers: CellContainers<DemoRules>): void {
    for (const container of cellContainers) {
      container.makeChild(1, 1)
      
      plain.getAt(0, 0).owner = container
    }
    
  }

  createNewCellRecord(): { energy: number } {
    return { energy: 0 }
  }

  createNewPlainField(): { temperature: number, owner: ExtCellContainer<DemoRules> | null } {
    return { temperature: 25, owner: null }
  }

  initNew( plain: ExtPlain<DemoRules>, cellContainers: CellContainers<DemoRules>): this {
    for( let container of cellContainers ){
      plain.getAt( container.posX, container.posY ).owner = container
    }

    return this
  }
}


export class DemoRules2 extends Rules<DemoRules> {

  executeTurn(plain: ExtPlain<DemoRules>, cellContainers: CellContainers<DemoRules>): void {
    for (const container of cellContainers) {
      container.makeChild(1, 1)
      
      plain.getAt(0, 0).owner = container
    }
    
  }

  createNewCellRecord(): { energy: number } {
    return { energy: 0 }
  }

  createNewPlainField(): { temperature: number, owner: ExtCellContainer<DemoRules> | null } {
    return { temperature: 25, owner: null }
  }

  initNew( plain: ExtPlain<DemoRules>, cellContainers: CellContainers<DemoRules>): this {
    for( let container of cellContainers ){
      plain.getAt( container.posX, container.posY ).owner = container
    }

    return this
  }
}


