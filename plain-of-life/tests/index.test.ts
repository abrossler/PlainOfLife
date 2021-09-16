import {sayHello} from '../src'


test('sayHello says "Hello"', () => {
    expect(sayHello()).toBe('Hello');
  });