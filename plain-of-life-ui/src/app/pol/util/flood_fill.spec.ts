import { FloodFill, Point } from './flood_fill'

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

  it('fills 0 fields correctly', () => {
    const plainToFill = [
      [1, 1, 1],
      [0, 1, 0],
      [1, 1, 1]
    ]
    const fF = new FloodFill(plainToFill)
    const filled = fF.fill(1, 1, 1)
    const filledPlain = [
      [1, 1, 1],
      [0, 1, 0],
      [1, 1, 1]
    ]
    expect(filled).toEqual(0)
    for (let i = 0; i < plainToFill.length; i++) {
      expect(plainToFill[i]).toEqual(filledPlain[i])
    }
  })

  it('fills 1 field correctly', () => {
    const plainToFill = [
      [1, 0, 1],
      [0, 1, 0],
      [1, 0, 1]
    ]
    const fF = new FloodFill(plainToFill)
    const filled = fF.fill(9, 1, 1)
    const filledPlain = [
      [1, 0, 1],
      [0, 9, 0],
      [1, 0, 1]
    ]
    expect(filled).toEqual(1)
    for (let i = 0; i < plainToFill.length; i++) {
      expect(plainToFill[i]).toEqual(filledPlain[i])
    }
  })

  it('supports custom isEqual comparator correctly', () => {
    const plainToFill = [
      [4, 4, 4, 4, 4, 4, 4],
      [4, 1, 2, 1, 2, 3, 4],
      [4, 1, 2, 1, 2, 3, 4],
      [4, 1, 2, 1, 2, 3, 4],
      [4, 4, 4, 4, 4, 4, 4]
    ]
    const fF = new FloodFill(plainToFill, (n1, n2) => n1 <= n2)
    fF.fill(9, 2, 2)
    const filledPlain = [
      [4, 4, 4, 4, 4, 4, 4],
      [4, 9, 9, 9, 9, 3, 4],
      [4, 9, 9, 9, 9, 3, 4],
      [4, 9, 9, 9, 9, 3, 4],
      [4, 4, 4, 4, 4, 4, 4]
    ]
    for (let i = 0; i < plainToFill.length; i++) {
      expect(plainToFill[i]).toEqual(filledPlain[i])
    }
  })

  it('supports custom replace and other elements than numbers correctly', () => {
    const plainToFill = [
      ['AA', 'AA', 'AA', 'AA', 'AA', 'AA'],
      ['AA', 'BA', 'BA', 'BA', 'BA', 'AA'],
      ['AA', 'BA', 'BB', 'BB', 'BA', 'AA'],
      ['AA', 'BA', 'BA', 'BA', 'BA', 'AA'],
      ['AA', 'AA', 'AA', 'AA', 'AA', 'AA']
    ]
    const fF = new FloodFill(
      plainToFill,
      (n1, n2) => n1.charAt(0) === n2.charAt(0),
      (plainToFill, replaceWith, x, y) => (plainToFill[y][x] = replaceWith + plainToFill[y][x].substring(1))
    )
    fF.fill('C', 1, 1)
    const filledPlain = [
      ['AA', 'AA', 'AA', 'AA', 'AA', 'AA'],
      ['AA', 'CA', 'CA', 'CA', 'CA', 'AA'],
      ['AA', 'CA', 'CB', 'CB', 'CA', 'AA'],
      ['AA', 'CA', 'CA', 'CA', 'CA', 'AA'],
      ['AA', 'AA', 'AA', 'AA', 'AA', 'AA']
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

  it('fills spiral correctly and returns filled points correctly', () => {
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
    const filledPoints: Point[] = []
    fF.fill(8, 1, 1, filledPoints) // Fill with 8
    for (const p of filledPoints) {
      plainToFill[p.y][p.x] = 9 // Replace all filled points with 9
    }
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

  it('fills complex shape correctly and counts filled points correctly', () => {
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
    const filled = fF.fill(9, 2, 2)
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
    expect(filled).toEqual(93) // 93 times 9 in the filled plain...
    for (let i = 0; i < plainToFill.length; i++) {
      expect(plainToFill[i]).toEqual(filledPlain[i])
    }
  })

  it('handles torus topography on x-axis correctly', () => {
    const plainToFill = [
      [1, 0, 0, 1, 1],
      [1, 0, 0, 0, 0],
      [1, 0, 1, 1, 1],
      [1, 0, 0, 0, 0],
      [1, 0, 1, 1, 1],
      [0, 0, 0, 0, 0]
    ]
    const fF = new FloodFill(plainToFill)
    fF.fill(9, 2, 2)
    const filledPlain = [
      [9, 0, 0, 9, 9],
      [9, 0, 0, 0, 0],
      [9, 0, 9, 9, 9],
      [9, 0, 0, 0, 0],
      [9, 0, 9, 9, 9],
      [0, 0, 0, 0, 0]
    ]
    for (let i = 0; i < plainToFill.length; i++) {
      expect(plainToFill[i]).toEqual(filledPlain[i])
    }
  })

  it('handles torus topography on y-axis correctly', () => {
    const plainToFill = [
      [1, 0, 1, 0, 1, 1, 1, 1],
      [1, 0, 1, 0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0, 1, 1],
      [0, 0, 0, 1, 1, 0, 1, 1],
      [0, 0, 0, 0, 0, 0, 1, 1],
      [1, 1, 1, 1, 1, 0, 1, 1]
    ]
    const fF = new FloodFill(plainToFill)
    fF.fill(9, 2, 2)
    const filledPlain = [
      [9, 0, 9, 0, 9, 9, 9, 9],
      [9, 0, 9, 0, 0, 0, 0, 0],
      [0, 0, 9, 0, 0, 0, 9, 9],
      [0, 0, 0, 1, 1, 0, 9, 9],
      [0, 0, 0, 0, 0, 0, 9, 9],
      [9, 9, 9, 9, 9, 0, 9, 9]
    ]
    for (let i = 0; i < plainToFill.length; i++) {
      expect(plainToFill[i]).toEqual(filledPlain[i])
    }
  })

  it('handles complex torus topography correctly', () => {
    const plainToFill = [
      [0, 0, 1, 0, 1, 0, 1, 0, 1],
      [0, 1, 1, 0, 1, 0, 1, 0, 1],
      [0, 0, 0, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 1, 0, 0, 0, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 1, 0, 1, 1],
      [0, 1, 0, 0, 0, 0, 1, 1, 0],
      [0, 0, 1, 1, 1, 0, 1, 1, 0]
    ]
    const fF = new FloodFill(plainToFill)
    fF.fill(9, 1, 1)
    const filledPlain = [
      [0, 0, 9, 0, 9, 0, 9, 0, 9],
      [0, 9, 9, 0, 9, 0, 9, 0, 9],
      [0, 0, 0, 0, 9, 9, 9, 0, 9],
      [9, 0, 0, 1, 0, 0, 0, 9, 9],
      [9, 0, 0, 0, 0, 0, 0, 0, 0],
      [9, 0, 0, 0, 0, 1, 0, 9, 9],
      [0, 1, 0, 0, 0, 0, 9, 9, 0],
      [0, 0, 9, 9, 9, 0, 9, 9, 0]
    ]
    for (let i = 0; i < plainToFill.length; i++) {
      expect(plainToFill[i]).toEqual(filledPlain[i])
    }
  })
})
