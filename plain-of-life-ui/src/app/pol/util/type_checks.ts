/**
 * Check that an unknown property is a string. Throw a syntax error otherwise.
 * @param toCheck an unknown property to check
 * @param allowEmpty allow an empty string
 * @returns a string
 */
export function checkString(toCheck: unknown, allowEmpty = true): string {
  if (typeof toCheck !== 'string') {
    throw new SyntaxError('String expected but got ' + typeof toCheck)
  }

  if (!allowEmpty && toCheck === '') {
    throw new SyntaxError('Expected a string that is not empty')
  }

  return toCheck
}

/**
 * Check that an unknown property is an integer and optionally that the integer is between a min and a max value.
 * Throw a syntax error if constraints are not met.
 * @param toCheck an unknown property to check
 * @param minValue
 * @param maxValue
 * @returns a number that is an integer
 */
export function checkInt(toCheck: unknown, minValue?: number, maxValue?: number): number {
  const num = checkNumber(toCheck, minValue, maxValue)
  if (!Number.isInteger(num)) {
    throw new SyntaxError('Expected an integer but got ' + toCheck)
  }
  return num
}

/**
 * Check that an unknown property is a bigint and optionally that the bigint is between a min and a max value.
 * Throw a syntax error if constraints are not met.
 * @param toCheck an unknown property to check
 * @param minValue
 * @param maxValue
 * @param allowString also allow a string as input and convert the string to a bigint
 * @returns a bigint
 */
export function checkBigInt(toCheck: unknown, minValue?: bigint, maxValue?: bigint, allowString = false): bigint {
  if (allowString && typeof toCheck === 'string') {
    toCheck = BigInt(toCheck)
  }

  if (typeof toCheck !== 'bigint') {
    throw new SyntaxError('Bigint expected but got ' + typeof toCheck)
  }

  if (typeof minValue !== 'undefined' && toCheck < minValue) {
    throw new SyntaxError('Expected a bigint greater than ' + minValue + ' but got ' + toCheck)
  }

  if (typeof maxValue !== 'undefined' && toCheck > maxValue) {
    throw new SyntaxError('Expected a bigint less than ' + maxValue + ' but got ' + toCheck)
  }
  return toCheck
}

/**
 * Check that an unknown property is a number and optionally that the number is between a min and a max value.
 * Throw a syntax error if constraints are not met.
 * @param toCheck an unknown property to check
 * @param minValue
 * @param maxValue
 * @returns a number
 */
export function checkNumber(toCheck: unknown, minValue?: number, maxValue?: number): number {
  if (typeof toCheck !== 'number') {
    throw new SyntaxError('Number expected but got ' + typeof toCheck)
  }

  if (typeof minValue !== 'undefined' && toCheck < minValue) {
    throw new SyntaxError('Expected a number greater than ' + minValue + ' but got ' + toCheck)
  }

  if (typeof maxValue !== 'undefined' && toCheck > maxValue) {
    throw new SyntaxError('Expected a number less than ' + maxValue + ' but got ' + toCheck)
  }

  return toCheck
}

/**
 * Check that an unknown property is a boolean. Throw a syntax error otherwise.
 * @param toCheck an unknown property to check
 * @returns a boolean
 */
export function checkBoolean(toCheck: unknown): boolean {
  if (typeof toCheck !== 'boolean') {
    throw new SyntaxError('Boolean expected but got ' + typeof toCheck)
  }
  return toCheck
}

/**
 * Check that an unknown property is an object. Throw a syntax error otherwise.
 * @param toCheck an unknown property to check
 * @returns an object
 */
export function checkObject<T>(toCheck: T): T {
  if (typeof toCheck !== 'object') {
    throw new SyntaxError('Object expected but got ' + typeof toCheck)
  }

  return toCheck
}
