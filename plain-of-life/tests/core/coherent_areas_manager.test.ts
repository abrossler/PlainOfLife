import { CoherentAreasManager } from '../../src/ownership_managers/coherent_areas_manager'
import { Plain } from '../../src/core/plain'
import { ExtCellContainer } from '../../src/core/cell_container'
import { PlainOfLife } from '../../src/core/plain_of_life'
import { TestRules } from '../stubs/test_rules'
import { TestCell } from '../stubs/test_cell'

describe('CoherentAreasManager', () => {
  describe('test', () => {
    it('compares plains correctly', () => { // Test the test - make sure that there is no difference found for identical plains
      const plainBefore = [
        [' ', 'A', 'a'],
        ['B', 'CD', 'Fa'],
        ['GHg', ' I', 'a '],
        ['', 'J', '   ']
      ]
      const expectedPlainAfter = [
        [' ', 'A', 'a'],
        ['B', 'CD', 'Fa'],
        ['GHg', ' I', 'a '],
        ['', 'J', '   ']
      ]
      const plain = prepare(plainBefore)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
    })
  })

  describe('onCellMove', () => {
    it('performs simple move in all directions correctly', () => {
      const plainBefore = [
        [' ', ' ', ' '],
        [' ', 'A ', ' '],
        [' ', ' ', ' ']
      ]
      const expectedPlainAfter = [
        [' ', 'A', ' '],
        [' ', 'a', ' '],
        [' ', ' ', ' ']
      ]
      const plain = prepare(plainBefore)
      plain.getAt(1,1).getCellContainers()[0].move(0,-1)
      expect(compare(plain, expectedPlainAfter)).toEqual('')
    })
  })

})

function prepare(plainToPrepare: string[][]): Plain<TestRules> {
  const width = plainToPrepare[0].length
  const height = plainToPrepare.length
  const plainOfLife = PlainOfLife.createNew(width, height, TestRules, TestCell)
  /* eslint-disable @typescript-eslint/no-explicit-any*/
  const plain: Plain<TestRules> = (plainOfLife as any).plain
  const seedCellContainer: ExtCellContainer<TestRules> = (plainOfLife as any).firstCellContainer.first
  /* eslint-enable @typescript-eslint/no-explicit-any*/
  seedCellContainer.move(-seedCellContainer.posX, -seedCellContainer.posY)

  const stringContainerMap = new Map<string, ExtCellContainer<TestRules>>()

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const s = plainToPrepare[y][x].trim()

      if (s!=='' && !/^[a-zA-Z]+$/.test(s)) {
        throw new Error('Only letters (a-z or A-Z) and white spaces are allowed')
      }

      const newContainers = s.replace(/[^A-Z]/g, '') // All uppercase letters

      for (let c of newContainers) {
        if (!stringContainerMap.has(c)) {
            let container = seedCellContainer.makeChild(x, y)
            container.cellRecord.name = c
          stringContainerMap.set(c, container)
        } else {
          throw new Error(
            'Container "' + c + '" is not unique on the plain (= each upper case letter must exist only once)'
          )
        }
      }
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
        const s = plainToPrepare[y][x].trim()

      let owner = s.replace(/[^a-z]/g, '') // All lowercase letters
      if (owner.length > 1) {
        throw new Error('Only one owner (=lower case letter) per field supported.')
      }
      if (owner.length == 0) {
        const records = s.replace(/[^A-Z]/g, '') // All uppercase letters
        if (records.length > 0) {
          owner = records.substring(records.length - 1)
        }
      } else if (!s.endsWith(owner)){
        throw new Error('Owners must be defined at the end (=lower case letter must be at the end)')
      }
    
      owner = owner.toUpperCase()
      if (owner) {
        const container = stringContainerMap.get(owner)
        if (container) {
          plain.getAt(x, y).fieldRecord.owner = container
          container.cellRecord.ownedFieldsCount++
         } else {
          throw new Error(
            'Container for owner "' +
              owner +
              '" missing (=for each different lower case letter there must be exactly one corresponding upper case letter)'
          )
        }
      }
    }
  }

  seedCellContainer.die()
  new CoherentAreasManager(plain)
  return plain
}

function compare(plain: Plain<TestRules>, expectedPlainAfter: string[][]): string {
  let differences = ''
  const width = plain.width
  const height = plain.height

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const f = plain.getAt(x, y)
      const expected = expectedPlainAfter[y][x].trim()

      let found = ''
      for( let container of f.getCellContainers()){
          found += container.cellRecord.name
      }
      const owner = f.fieldRecord.owner
      if(owner && owner.cellRecord.name !== found.substring(found.length-1)){
        found += owner.cellRecord.name.toLowerCase()
      }

      if(found !== expected){
        differences += 'At x=' + x + ', y=' + y + ' expected "' + expected +'" but found "' + found + '"\n'
      }
    }
  }
  return differences
}
