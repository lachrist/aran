/* eslint-disable no-bitwise */

const {
  Error,
  JSON,
  Array,
  Array: { from: toArray },
} = globalThis;

// https://en.wikipedia.org/wiki/Fowler–Noll–Vo_hash_function

const fnv_offset_basis_32 = 2166136261;
const fnv_prime_32 = 16777619;

/**
 * @type {(
 *   content: string,
 * ) => number}
 */
const hashFowler32 = (content) => {
  let hash = fnv_offset_basis_32;
  for (let i = 0; i < content.length; i++) {
    hash ^= content.charCodeAt(i);
    hash *= fnv_prime_32;
    hash >>>= 0; // Ensure 32-bit unsigned
  }
  return hash;
};

/**
 * @type {(
 *   input: number,
 * ) => number}
 */

const hashXor16 = (input) => ((input >>> 16) ^ input) & 0xffff;

/**
 * @type {(
 *   input: string,
 * ) => number}
 */
const hash = (input) => hashXor16(hashFowler32(input));

/**
 * @type {(
 *   content: string,
 * ) => [
 *   number[],
 *   number[],
 * ]}
 */
export const parseBranching = (content) => {
  const data = JSON.parse(content);
  if (!Array.isArray(data)) {
    throw new Error("not an array", { cause: data });
  }
  if (data.length % 2 !== 0) {
    throw new Error("odd length", { cause: data });
  }
  const sizes = [];
  const hashes = [];
  for (let index = 0; index < data.length; index += 2) {
    sizes.push(data[index]);
    hashes.push(data[index + 1]);
  }
  return [sizes, hashes];
};

/**
 * @type {(
 *   branching: [number, string][],
 * ) => string}
 */
export const printBranching = (branching) =>
  JSON.stringify(
    toArray(
      {
        // @ts-ignore
        __proto__: null,
        length: 2 * branching.length,
      },
      (_, index) =>
        index % 2 === 0
          ? branching[index / 2][0]
          : hash(branching[(index - 1) / 2][1]),
    ),
  );
