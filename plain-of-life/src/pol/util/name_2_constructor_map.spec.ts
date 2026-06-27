import { Name2ConstructorMap } from './name_2_constructor_map'

class A {
  a = 'a'
}
class AA extends A {
  aa = 'aa'
}
class AB extends A {
  ab = 'ab'
}
class AC extends A {
  ac = 'ac'
}
class AD extends A {
  ad = 'ad'
}

describe('Name to Constructor Map', () => {
  let map: Name2ConstructorMap<new () => A>

  describe('creation', () => {
    it('throws errors if name or constructor are not unique', () => {
      expect(
        () =>
          new Name2ConstructorMap<new () => A>([
            ['AA', AA],
            ['A', AB],
            ['A', A] // Name 'A' not unique
          ])
      ).toThrowError(Error)

      expect(
        () =>
          new Name2ConstructorMap<new () => A>([
            ['AA', AA],
            ['AB', AB],
            ['AB2', AB] // Constructor AB not unique
          ])
      ).toThrowError(Error)
    })
  })

  describe('access', () => {
    beforeAll(() => {
      map = new Name2ConstructorMap<new () => A>([
        ['A', A],
        ['AA', AA],
        ['AB', AB],
        ['AC', AC]
      ])
    })

    it('returns all names correctly', () => {
      expect(map.getNames()).toEqual(['A', 'AA', 'AB', 'AC'])
    })

    it('returns a constructor for a name', () => {
      expect(map.getConstructor('AB')).toBe(AB)
      expect(map.getConstructor('AX')).toBeUndefined
    })

    it('returns a name for a constructor', () => {
      expect(map.getName(AB)).toEqual('AB')
      expect(map.getName(AD)).toBeUndefined
    })
  })
})
