// import { CoherentAreasManager } from '../../src/ownership_managers/coherent_areas_manager'
// import { TestRuleExtensionFactory } from '../stubs/test_rule_extension_factory'
// import { Plain } from '../../src/core/plain'
// import { RuleExtensionFactory } from '../../src/core/rule_extension_factory'
// import { CellContainer, ExtCellContainer } from '../../src/core/cell_container'
// import { PlainField } from '../../src/core/plain_field'

// describe('CoherentAreasManager', () => {
//   describe('place', () => {
//     it('fills simple shape correctly', () => {
//       const plainBefore = [
//         [' ', ' ', ' ', ' ', ' ', ' ', ' '],
//         [' ', ' ', ' ', ' ', ' ', ' ', ' '],
//         [' ', ' ', ' ', ' ', ' ', ' ', ' '],
//         [' ', ' ', ' ', ' ', ' ', ' ', ' '],
//         [' ', ' ', ' ', ' ', ' ', ' ', ' ']
//       ]
//       //   const fF = new FloodFill(plainToFill)
//       //   fF.fill(9, 2, 2)
//       const plainAfter = [
//         [' ', ' ', ' ', ' ', ' ', ' ', ' '],
//         [' ', ' ', ' ', ' ', ' ', ' ', ' '],
//         [' ', ' ', ' ', ' ', ' ', ' ', ' '],
//         [' ', ' ', ' ', ' ', ' ', ' ', ' '],
//         [' ', ' ', ' ', ' ', ' ', ' ', ' ']
//       ]
//       for (let i = 0; i < plainBefore.length; i++) {
//         expect(plainBefore[i]).toEqual(plainAfter[i])
//       }
//     })
//   })
// })

// function prepare(plainToPrepare: string[][]) {
//   const ruleExtensionFactory: MinRuleExtensionFactory = new MinRuleExtensionFactory()
//   const width = plainToPrepare[0].length
//   const height = plainToPrepare[0].length
//   const plain: Plain<MinRuleExtensionFactory> = new Plain(ruleExtensionFactory, width, height)
//   const array: PlainField<MinRuleExtensionFactory>[][] = (plain as any).array
//   const cellContainers: CellContainer<MinRuleExtensionFactory>[] = Array.from({ length: 25 }, () => {
//     return new CellContainer<MinRuleExtensionFactory>(ruleExtensionFactory, plain)
//   })

//   const ownerIndices = plainToPrepare.map((row) =>
//     row.map((cell) => {
//       const charCode = cell.charCodeAt(0)

//       let isLowerCase = charCode >= 65 && charCode <= 90
//       let isUpperCase = charCode >= 97 && charCode <= 122

//       if (cell.length != 1 || (cell != ' ' && !isLowerCase && !isUpperCase)) {
//         throw new Error('Only value " " or values between A...Z and a...z supported')
//       }

//       let ownerIndex: number | undefined = undefined
//       let isOwnerPosition = false

//       if (isLowerCase) {
//         ownerIndex = charCode - 65
//       } else if (isUpperCase) {
//         ownerIndex = charCode - 97
//         isOwnerPosition = true
//       }
//       return { ownerIndex, isOwnerPosition }
//     })
//   )

//   for (let y = 0; y < height; y++) {
//     for (let x = 0; x < width; x++) {
//       const ownerIndex = ownerIndices[y][x].ownerIndex
//       if (ownerIndex !== undefined) {
//         array[y][x].fieldRecord.owner = cellContainers[ownerIndex]
//         cellContainers[ownerIndex].cellRecord.ownedFieldsCount++
//       }
//       if (ownerIndices[y][x].isOwnerPosition) {
//         ;(cellContainers[ownerIndex] as { posX: number }).posX = x
//         ;(cellContainers[ownerIndex] as { posY: number }).posY = y
//       }
//       array[y][x].addCellContainer(cellContainers[ownerIndex])
//     }
//   }
//   const coherentAreasManager = new CoherentAreasManager(plain)
// }

// class MinRuleExtensionFactory implements RuleExtensionFactory {
//   createNewCellRecord(): { ownedFieldsCount: number } {
//     return { ownedFieldsCount: 0 }
//   }

//   createNewFieldRecord(): { owner: ExtCellContainer<MinRuleExtensionFactory> | null } {
//     return { owner: null }
//   }
// }
