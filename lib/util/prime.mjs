/* eslint-disable local/no-impure */

const {
  Reflect: { apply },
  Array: {
    prototype: { reduce },
  },
} = globalThis;

/** @type {bigint[]} */
const cache = [2n];

/** @type {(candidate: bigint, primes: bigint[]) => boolean} */
const isPrime = (candidate, primes) => {
  for (const prime of primes) {
    if (candidate % prime === 0n) {
      return false;
    }
  }
  return true;
};

/** @type {(primes: bigint[]) => bigint} */
export const nextPrime = (primes) => {
  let candidate = primes[primes.length - 1];
  while (!isPrime(candidate, primes)) {
    candidate += 1n;
  }
  return candidate;
};

/** @type {(index: number) => bigint} */
export const primeAt = (index) => {
  let { length } = cache;
  while (index >= length) {
    cache[length] = nextPrime(cache);
    length += 1;
  }
  return cache[index];
};

/** @type {(aggregate: bigint) => number} */
export const getFirstZeroPrimeIndex = (aggregate) => {
  let index = 0;
  while (aggregate % primeAt(index) === 0n) {
    index += 1;
  }
  return index;
};

/** @type {(aggregate: bigint) => bigint} */
export const getFirstZeroPrime = (aggregate) =>
  primeAt(getFirstZeroPrimeIndex(aggregate));

/** @type {(aggregate: bigint, exponent: bigint, index: number) => bigint} */
const accumulate = (aggregate, exponent, index) =>
  aggregate * primeAt(index) ** exponent;

const ACCUMULATE = [accumulate, 1n];

/** @type {(exponents: bigint[]) => bigint} */
export const encodePrime = (exponents) => apply(reduce, exponents, ACCUMULATE);

/** @type {(aggregate: bigint) => bigint[]} */
export const decodePrime = (aggregate) => {
  const exponents = [];
  let index = 0;
  let remainder = aggregate;
  while (remainder > 1n) {
    const prime = primeAt(index);
    let exponent = 0n;
    while (remainder % prime === 0n) {
      exponent += 1n;
      remainder /= prime;
    }
    exponents[index] = exponent;
    index += 1;
  }
  return exponents;
};
