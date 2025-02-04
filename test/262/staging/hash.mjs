/* eslint-disable no-bitwise */

// https://en.wikipedia.org/wiki/Fowler–Noll–Vo_hash_function

const fnv_offset_basis_32 = 2166136261;
const fnv_prime_32 = 16777619;

/**
 * @type {(
 *   content: string,
 * ) => number}
 */
export const hashFowler32 = (content) => {
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

export const hashXor16 = (input) => ((input >>> 16) ^ input) & 0xffff;
