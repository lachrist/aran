const {
  Object: { freeze },
} = globalThis;

/**
 * @template X
 * @param {X[]} array
 * @param {X} element
 * @return {number}
 */
export const lastIndexOf = (array, element) => {
  for (let index = array.length - 1; index >= 0; index -= 1) {
    if (array[index] === element) {
      return index;
    }
  }
  return -1;
};

/**
 * @template X
 * @type {readonly X[]}
 */
export const empty = freeze([]);

/**
 * @template X
 * @param {X[]} array
 * @return {X}
 */
export const getLast = (array) => array[array.length - 1];

// flipped reduceRight //
/**
 * @template X, Y
 * @param {X[]} array
 * @param {(element: X, result: Y) => Y} accumulate
 * @param {Y} result
 * @return {Y}
 */
export const reduceReverse = (array, accumulate, result) => {
  for (let index = array.length - 1; index >= 0; index -= 1) {
    result = accumulate(array[index], result);
  }
  return result;
};

/**
 * @template X
 * @param {X[]} array
 * @param {X} element
 * @return {void}
 */
export const push = (array, element) => {
  array[array.length] = element;
};

/**
 * @template X
 * @param {X[]} array1
 * @param {X[]} array2
 * @return {void}
 */
export const pushAll = (array1, array2) => {
  let { length: length1 } = array1;
  const { length: length2 } = array2;
  for (let index2 = 0; index2 < length2; index2 += 1) {
    array1[length1] = array2[index2];
    length1 += 1;
  }
};

/**
 * @template X
 * @param {X[]} array
 * @return {X}
 */
export const pop = (array) => {
  const last = array[array.length - 1];
  array.length -= 1;
  return last;
};

/**
 * @template X
 * @param {X[]} array
 * @return {X}
 */
export const shift = (array) => {
  const { length } = array;
  const element = array[0];
  for (let index = 0; index < length - 1; index += 1) {
    array[index] = array[index + 1];
  }
  array.length -= 1;
  return element;
};

/**
 * @template X
 * @param {X[]} array
 * @param {X} element
 * @return {void}
 */
export const unshift = (array, element) => {
  const { length } = array;
  for (let index = length; index > 0; index -= 1) {
    array[index] = array[index - 1];
  }
  array[0] = element;
};

/**
 * @template X
 * @param {X} element
 * @param {number} index
 * @param {X[]} array
 * @return {boolean}
 */
export const isDuplicate = (element, index, array) =>
  lastIndexOf(array, element) > index;

// export const isDuplicate = (element, index, array) => {
//   index += 1;
//   while (index < array.length) {
//     if (array[index] === element) {
//       return true;
//     }
//     index += 1;
//   }
//   return false;
// };
