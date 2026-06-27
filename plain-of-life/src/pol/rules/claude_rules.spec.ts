import { PlainOfLife } from '../core/plain_of_life'
import { ClimateAndChemistry } from './claude_rules'
import { RawAssembler } from '../cells/raw_assembler'

describe('ClimateAndChemistry', () => {
  it('sustains a population for at least 500 turns', () => {
    const pol = PlainOfLife.createNew(250, 150, ClimateAndChemistry, RawAssembler, 100, 100)

    let extinctionTurn = -1
    for (let i = 0; i < 500; i++) {
      pol.executeTurn()
      if (pol.cellCount === 0) {
        extinctionTurn = Number(pol.currentTurn)
        break
      }
    }

    if (extinctionTurn !== -1) {
      console.log(`Extinction at turn ${extinctionTurn}`)
    } else {
      console.log(`Turn ${pol.currentTurn}: ${pol.cellCount} cells — survived`)
    }

    expect(extinctionTurn).toBe(-1)
  }, 60000)

  it('logs population trajectory for diagnosis', () => {
    const pol = PlainOfLife.createNew(250, 150, ClimateAndChemistry, RawAssembler, 100, 100)

    const log: string[] = []
    for (let i = 0; i < 300; i++) {
      pol.executeTurn()
      if (Number(pol.currentTurn) % 20 === 0 || pol.cellCount === 0) {
        log.push(`Turn ${pol.currentTurn}: ${pol.cellCount} cells`)
      }
      if (pol.cellCount === 0) break
    }

    console.log(log.join('\n'))
    // This test always passes — it's just for diagnosis
    expect(log.length).toBeGreaterThan(0)
  }, 60000)
})
