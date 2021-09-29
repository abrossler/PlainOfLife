export function checkString( toCheck: unknown, allowEmpty: boolean = true): string{
    if(typeof toCheck !== 'string' ){
        throw new SyntaxError('String expected but got ' + typeof toCheck)
    }

    if( !allowEmpty && toCheck===''){
        throw new SyntaxError('Expected a string that is not empty')
    }

    return toCheck
}

export function checkInt(toCheck: unknown, minValue?:number, maxValue?:number): number{
    const num = checkNumber(toCheck, minValue, maxValue)
    if(!Number.isInteger(num)){
        throw new SyntaxError('Expected an integer but got ' + toCheck)
    }
    return num
}

export function checkBigInt(toCheck: unknown, minValue?:bigint, maxValue?:bigint, allowString: boolean = false): bigint{
    if(allowString  &&  typeof toCheck === 'string' ){
        toCheck = BigInt( toCheck )
    }
    
    if(typeof toCheck !== 'bigint' ){
        throw new SyntaxError('Bigint expected but got ' + typeof toCheck)
    }

    if(typeof minValue !== 'undefined'  &&  toCheck<minValue){
        throw new SyntaxError('Expected a bigint greater than ' + minValue + ' but got ' + toCheck)
    }

    if(typeof maxValue !== 'undefined'  &&  toCheck>maxValue){
        throw new SyntaxError('Expected a bigint less than ' + maxValue + ' but got ' + toCheck)
    }
    return toCheck
}

export function checkNumber(toCheck: unknown, minValue?:number, maxValue?:number): number{
    if(typeof toCheck !== 'number' ){
        throw new SyntaxError('Number expected but got ' + typeof toCheck)
    }

    if(typeof minValue !== 'undefined'  &&  toCheck<minValue){
        throw new SyntaxError('Expected a number greater than ' + minValue + ' but got ' + toCheck)
    }

    if(typeof maxValue !== 'undefined'  &&  toCheck>maxValue){
        throw new SyntaxError('Expected a number less than ' + maxValue + ' but got ' + toCheck)
    }

    return toCheck
}

export function checkBoolean(toCheck: unknown): boolean{
    if(typeof toCheck !== 'boolean' ){
        throw new SyntaxError('Boolean expected but got ' + typeof toCheck)
    }
    return toCheck
}

export function checkObject<T>(toCheck: T): T{
    if(typeof toCheck !== 'object' ){
        throw new SyntaxError('Object expected but got ' + typeof toCheck)
    }

    // if(toCheck === null ) {
    //     throw new SyntaxError('Object expected but got null')
    // }

    return toCheck
}