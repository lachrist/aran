/* eslint-disable no-bitwise */

const {
  Math: { abs },
} = globalThis;

/**
 * @type {(input: string) => number}
 */
export const hash32 = (input) => {
  let hash = 0;
  const { length } = input;
  for (let index = 0; index < length; index += 1) {
    // hash = (32 * hash + input.charCodeAt(index)) % (2**32)
    hash = ((hash << 5) + input.charCodeAt(index)) | 0;
  }
  return abs(hash);
};
