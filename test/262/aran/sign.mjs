/* eslint-disable no-bitwise */

const FNV_OFFSET = 0x811c9dc5;

const FNV_PRIME = 0x01000193;

// fnv1a algorithm

/**
 * @type {(
 *   data: string,
 * ) => number}
 */
export const sign = (data) => {
  let hash = FNV_OFFSET;
  const { length } = data;
  for (let index = 0; index < length; index++) {
    hash ^= data.charCodeAt(index);
    hash = (hash * FNV_PRIME) >>> 0;
  }
  return hash >>> 0;
};
