import { FloodFill } from '../../src/util/flood_fill'

describe('FloodFill', () => {
  it('fills simple shape correctly', () => {
    const plainToFill = [
      [0, 1, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 1, 0]
    ]
    const fF = new FloodFill(plainToFill)
    fF.fill(9, 2, 2)
    const filledPlain = [
      [0, 9, 0, 0, 0, 0, 0],
      [9, 9, 9, 9, 9, 9, 0],
      [0, 9, 9, 9, 9, 9, 0],
      [0, 9, 9, 9, 9, 9, 9],
      [0, 0, 0, 0, 0, 9, 0]
    ]
    for (let i = 0; i < plainToFill.length; i++) {
      expect(plainToFill[i]).toEqual(filledPlain[i])
    }
  })

  it('fills outline correctly', () => {
    const plainToFill = [
      [0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 1, 0, 0, 0, 1, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0]
    ]
    const fF = new FloodFill(plainToFill)
    fF.fill(9, 1, 1)
    const filledPlain = [
      [0, 0, 0, 0, 0, 0, 0],
      [0, 9, 9, 9, 9, 9, 0],
      [0, 9, 0, 0, 0, 9, 0],
      [0, 9, 9, 9, 9, 9, 0],
      [0, 0, 0, 0, 0, 0, 0]
    ]
    for (let i = 0; i < plainToFill.length; i++) {
      expect(plainToFill[i]).toEqual(filledPlain[i])
    }
  })

  it('fills spiral correctly', () => {
    const plainToFill = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
      [0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0],
      [0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0],
      [0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0],
      [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ]
    const fF = new FloodFill(plainToFill)
    fF.fill(9, 1, 1)
    const filledPlain = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 9, 0, 9, 9, 9, 9, 9, 9, 9, 9, 0],
      [0, 9, 0, 9, 0, 0, 0, 0, 0, 0, 9, 0],
      [0, 9, 0, 9, 0, 9, 9, 9, 9, 0, 9, 0],
      [0, 9, 0, 9, 0, 0, 0, 0, 9, 0, 9, 0],
      [0, 9, 0, 9, 9, 9, 9, 9, 9, 0, 9, 0],
      [0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 9, 0],
      [0, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ]
    for (let i = 0; i < plainToFill.length; i++) {
      expect(plainToFill[i]).toEqual(filledPlain[i])
    }
  })

  it('fills complex shape correctly', () => {
    const plainToFill = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0],
      [0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0],
      [0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0],
      [0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 0],
      [0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
      [0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0],
      [0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0],
      [0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0],
      [0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
      [0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 0],
      [0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0],
      [0, 0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0],
      [0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ]
    const fF = new FloodFill(plainToFill)
    fF.fill(9, 2, 2)
    const filledPlain = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 9, 9, 9, 9, 9, 9, 9, 9, 9, 0, 0, 9, 0],
      [0, 0, 9, 0, 0, 0, 0, 0, 0, 9, 0, 9, 9, 0],
      [0, 9, 9, 0, 0, 9, 0, 9, 0, 9, 0, 0, 9, 0],
      [0, 0, 9, 0, 0, 9, 9, 9, 9, 9, 0, 0, 9, 0],
      [0, 9, 9, 0, 0, 9, 0, 9, 9, 9, 9, 9, 9, 0],
      [0, 9, 9, 0, 0, 0, 1, 0, 0, 9, 0, 0, 0, 0],
      [0, 0, 9, 0, 1, 0, 0, 0, 0, 9, 0, 0, 0, 0],
      [0, 9, 9, 9, 0, 0, 0, 0, 9, 9, 0, 9, 0, 0],
      [0, 9, 9, 9, 0, 0, 0, 0, 0, 9, 9, 9, 0, 0],
      [0, 0, 9, 0, 9, 9, 0, 0, 0, 9, 9, 9, 0, 0],
      [0, 0, 9, 9, 9, 9, 0, 0, 0, 9, 0, 9, 0, 0],
      [0, 0, 9, 0, 9, 9, 0, 0, 0, 9, 0, 0, 1, 0],
      [0, 0, 9, 0, 0, 0, 9, 9, 0, 9, 0, 0, 0, 0],
      [0, 0, 9, 0, 0, 0, 9, 9, 0, 9, 0, 0, 9, 0],
      [0, 0, 9, 0, 9, 0, 0, 9, 0, 9, 9, 9, 9, 0],
      [0, 0, 9, 9, 9, 9, 9, 9, 0, 9, 0, 0, 9, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ]
    for (let i = 0; i < plainToFill.length; i++) {
      expect(plainToFill[i]).toEqual(filledPlain[i])
    }
  })

  //   it('handles torus topography correctly', () => {
  //     const plainToFill = [
  //         [0, 0, 1, 0, 1, 0, 1, 0, 1],
  //         [0, 1, 1, 0, 1, 0, 1, 0, 1],
  //         [0, 0, 0, 0, 1, 1, 1, 0, 1],
  //         [1, 0, 0, 0, 0, 0, 0, 1, 1],
  //         [1, 0, 0, 0, 0, 0, 0, 0, 0],
  //         [1, 0, 0, 0, 0, 0, 0, 1, 1],
  //         [0, 0, 0, 0, 0, 0, 1, 1, 0],
  //         [0, 0, 1, 1, 1, 0, 1, 1, 0]
  //     ]
  //     let fF = new FloodFill(plainToFill)
  //     fF.fill(9, 1, 1)
  //     const filledPlain = [
  //         [0, 0, 9, 0, 9, 0, 9, 0, 9],
  //         [0, 9, 9, 0, 9, 0, 9, 0, 9],
  //         [0, 0, 0, 0, 9, 9, 9, 0, 9],
  //         [9, 0, 0, 0, 0, 0, 0, 9, 9],
  //         [9, 0, 0, 0, 0, 0, 0, 0, 0],
  //         [9, 0, 0, 0, 0, 0, 0, 9, 9],
  //         [0, 0, 0, 0, 0, 0, 9, 9, 0],
  //         [0, 0, 9, 9, 9, 0, 9, 9, 0]
  //     ]
  //     for (let i = 0; i < plainToFill.length; i++) {
  //       expect(plainToFill[i]).toEqual(filledPlain[i])
  //     }
  //   })
})
