import { encode } from 'base64-arraybuffer'
import { Serialization } from './default_serialization'

class Tst {
  s = 'string'
  n = 1
  m(){}
}

let instanceNumber = 0
class ToIndex {
  instanceNumber: number
  constructor() {
    this.instanceNumber = instanceNumber++
  }
}

const instance0 = new ToIndex()
const instance1 = new ToIndex()
const instance2 = new ToIndex()
const instance3 = new ToIndex()

const now = new Date()
const int8Array = new Int8Array([1, 2, -128])
const uint8Array = new Uint8Array([1, 2, 255])
const uint8ClampedArray = new Uint8ClampedArray([1, 2, 255])
const int16Array = new Int16Array([1, 2, -32768])
const uint16Array = new Uint16Array([1, 2, 32767])
const int32Array = new Int32Array([1, 2, -2147483648])
const uint32Array = new Uint32Array([1, 2, 4294967295])
const float32Array = new Float32Array([1, 2, 3.3])
const float64Array = new Float64Array([1, 2, 3.3])
const bigInt64Array = new BigInt64Array([1n, 2n, -3n])
const bigUint64Array = new BigUint64Array([1n, 2n, 3n])

const tstObject = {
  simpleDeepObject: { a: 'A', b: { ba: 'BA', bb: 'BB' } },
  objectWithNullAndEmpty: {
    _null: null,
    empty: {},
    deep: { _null: null, empty: {} }
  },
  variousArrays: {
    numberA: [1, 2, 3],
    deep: { stringA: ['A', 'B', 'C'] },
    objectA: [{ v: 1 }, { v: 2 }],
    mixedA: [1, 'B', {}]
  },
  dates: { date: now, dateA: [now, now], deep: { date: now, dateA: [now, now] } },
  typedArrays: {
    int8Array,
    uint8Array,
    uint8ClampedArray,
    int16Array,
    uint16Array,
    int32Array,
    uint32Array,
    float32Array,
    float64Array,
    bigInt64Array,
    bigUint64Array
  },
  legalMixedArrays: { mixedA: [now, null, now], mixedAStartingWithNull: [null, now] },
  classInstance: { tst: new Tst(), tstA: [new Tst(), null, new Tst()] },
  toIndex: { i0: instance0, iA12: [instance1, instance2], i0b: instance0, deep: { i3: instance3 }, i3b: instance3 }
}

function getTstObject() {
  return tstObject
}

describe('Serialization', () => {
  describe('toSerializable', () => {
    {
      const object = getTstObject().simpleDeepObject
      const serializable = new Serialization().toSerializable(object)
      it('creates copy of object to serialize', () => {
        expect(serializable).toEqual(object)
      })
      it('creates really a deep copy', () => {
        expect(serializable).not.toBe(object)
        expect(serializable.b).not.toBe(object.b)
      })
    }
    {
      const object = getTstObject().objectWithNullAndEmpty
      const serializable = new Serialization().toSerializable(object)
      it('handles null, and empty objects correctly', () => {
        expect(serializable._null).toBe(null)
        expect(serializable.empty).toEqual({})
        expect(serializable.empty).not.toBe(object.empty) // Really deep copy of empty object
        expect(serializable.deep).toEqual({ _null: null, empty: {} })
      })
    }
    {
      const object = getTstObject().variousArrays
      const serializable = new Serialization().toSerializable(object)
      it('handles arrays correctly', () => {
        expect(serializable).toEqual(object)
        expect(serializable.numberA).not.toBe(object.numberA) // Really a deep copy of arrays
        expect((serializable.objectA as Array<unknown>)[0]).not.toBe(object.objectA[0])
      })
    }

    {
      const object = getTstObject().dates
      const now = object.date
      const serializable = new Serialization().toSerializable(object)
      it('performs the standard mapping for dates correctly', () => {
        expect(serializable.date__Date__).toEqual(now.toISOString())
        expect((serializable.dateA__Date__ as Array<string>)[0]).toEqual(now.toISOString())
        expect((serializable.deep as { date__Date__: string; dateA__Date__: string[] }).date__Date__).toEqual(
          now.toISOString()
        )
        expect((serializable.deep as { date__Date__: string; dateA__Date__: string[] }).dateA__Date__[1]).toEqual(
          now.toISOString()
        )
      })
    }

    {
      const object = getTstObject().typedArrays
      const serializable = new Serialization().toSerializable(object)
      it('performs the standard mappings for typed arrays correctly', () => {
        expect(serializable.int8Array__Int8Array__).toEqual(encode(object.int8Array))
        expect(serializable.uint8Array__Uint8Array__).toEqual(encode(object.uint8Array))
        expect(serializable.uint8ClampedArray__Uint8ClampedArray__).toEqual(encode(object.uint8ClampedArray))
        expect(serializable.int16Array__Int16Array__).toEqual(encode(object.int16Array.buffer))
        expect(serializable.uint16Array__Uint16Array__).toEqual(encode(object.uint16Array.buffer))
        expect(serializable.int32Array__Int32Array__).toEqual(encode(object.int32Array.buffer))
        expect(serializable.uint32Array__Uint32Array__).toEqual(encode(object.uint32Array.buffer))
        expect(serializable.float32Array__Float32Array__).toEqual(encode(object.float32Array.buffer))
        expect(serializable.float64Array__Float64Array__).toEqual(encode(object.float64Array.buffer))
        expect(serializable.bigInt64Array__BigInt64Array__).toEqual(encode(object.bigInt64Array.buffer))
        expect(serializable.bigUint64Array__BigUint64Array__).toEqual(encode(object.bigUint64Array.buffer))
      })
    }

    {
      const object = getTstObject().legalMixedArrays
      const now = object.mixedA[0] as Date
      const serializable = new Serialization().toSerializable(object)
      it('supports mappings for arrays with mixed undefined elements and elements to be mapped', () => {
        expect((serializable.mixedA__Date__ as Array<unknown>)[0]).toEqual(now.toISOString())
        expect((serializable.mixedA__Date__ as Array<unknown>)[1]).toBe(null)
        expect((serializable.mixedA__Date__ as Array<unknown>)[2]).toEqual(now.toISOString())
        expect((serializable.mixedA__Date__ as Array<unknown>)[3]).toBe(undefined)
        expect((serializable.mixedAStartingWithNull__Date__ as Array<unknown>)[0]).toBe(null)
        expect((serializable.mixedAStartingWithNull__Date__ as Array<unknown>)[1]).toBe(now.toISOString())
      })
    }

    {
      const now = new Date()
      const object1 = { badA: [now, 1] }
      const object2 = { badA: ['A', now] }
      const object3 = { badA: [{}, now] }
      const object4 = { badA: [new Tst(), now] }
      const object5 = { badA: [now, new Tst()] }
      const object6 = { badA: [new Tst(), new Uint16Array([1, 2, 3])] }
      it('throws an error for arrays with mixed objects that (partially) require a mapping', () => {
        expect(() => new Serialization().toSerializable(object1)).toThrowError()
        expect(() => new Serialization().toSerializable(object2)).toThrowError()
        expect(() => new Serialization().toSerializable(object3)).toThrowError()
        expect(() => new Serialization().toSerializable(object4)).toThrowError()
        expect(() => new Serialization().toSerializable(object5)).toThrowError()
        expect(() => new Serialization().toSerializable(object6)).toThrowError()
      })
      {
        const object = getTstObject().classInstance
        const serializable = new Serialization().addClassMapping(Tst, '__Tst__').toSerializable(object)
        it('supports class mappings', () => {
          expect((serializable.tst__Tst__ as { s: string }).s).toBe('string')
          expect((serializable.tstA__Tst__ as { s: string }[]).length).toBe(3)
          expect((serializable.tstA__Tst__ as { s: string }[])[0].s).toBe('string')
          expect(serializable.tst__Tst__).not.toBe(object) // Makes a deep copy
        })
      }
      {
        const object = getTstObject().toIndex
        const objectList = [object.i0, object.iA12[0]]
        const serializable = new Serialization().addIndexer(ToIndex, '__ToIndex__', objectList).toSerializable(object)
        it('supports indexer', () => {
          expect(objectList.length).toBe(4)
          expect(objectList[0]).toBe(object.i0)
          expect(objectList[1]).toBe(object.iA12[0])
          expect(objectList[2]).toBe(object.iA12[1])
          expect(objectList[3]).toBe(object.i3b)
          expect(serializable.i0__ToIndex__).toBe(0)
          expect(serializable.iA12__ToIndex__).toEqual([1, 2])
          expect(serializable.i0b__ToIndex__).toBe(0)
          expect((serializable.deep as { i3__ToIndex__: number }).i3__ToIndex__).toBe(3)
          expect(serializable.i3b__ToIndex__).toBe(3)
        })
      }
    }
  })
  describe('fromSerializable', () => {
    {
      const object = getTstObject().simpleDeepObject
      const fromSerializable = new Serialization().fromSerializable(object)
      it('creates copy of object to serialize', () => {
        expect(fromSerializable).toEqual(object)
      })
      it('creates really a deep copy', () => {
        expect(fromSerializable).not.toBe(object)
        expect(fromSerializable.b).not.toBe(object.b)
      })
    }
    {
      const object = getTstObject()
      const objectList: ToIndex[] = []
      const s = new Serialization().addClassMapping(Tst, '__Tst__').addIndexer(ToIndex, '__ToIndex__', objectList)
      const revertedObject = s.fromSerializable(JSON.parse(JSON.stringify(s.toSerializable(object))))
      it('reverts toSerializable for all test cases', () => {
        expect(revertedObject).toEqual(object)
      })
    }
    {
      const tst  = new Tst()
      const object = {f: ()=>1, tst}
      const s = new Serialization() // Without class mapping for Tst
      const revertedWithoutStringify = s.fromSerializable(s.toSerializable(object))
      const revertedWithStringify = s.fromSerializable(JSON.parse(JSON.stringify(s.toSerializable(object))))
      it('keeps functions but looses class methods and constructor without JSON.stringify in between', () => {
        expect((revertedWithoutStringify as {f:Function}).f()).toBe(1)
        expect((revertedWithoutStringify.tst as {constructor: unknown}).constructor).not.toEqual(tst.constructor)
        expect((revertedWithoutStringify.tst as {m: unknown}).m).toBeUndefined()
      })

      it('looses any functions with JSON.stringify in between', () => {
        expect(revertedWithStringify.f).toBeUndefined()
        expect((revertedWithStringify.tst as {constructor: unknown}).constructor).not.toEqual(tst.constructor)
        expect((revertedWithStringify.tst as {m: unknown}).m).toBeUndefined()
      })
    }
  })
})
