import { lastIndexOf } from "array-lite";

const {
  Object: { freeze },
} = globalThis;

export const empty = freeze([]);

export const getLast = (array) => array[array.length - 1];

export const push = (array, element) => {
  array[array.length] = element;
};

export const pushAll = (array1, array2) => {
  let { length: length1 } = array1;
  const { length: length2 } = array2;
  for (let index2 = 0; index2 < length2; index2 += 1) {
    array1[length1] = array2[index2];
    length1 += 1;
  }
};

export const pop = (array) => {
  const last = array[array.length - 1];
  array.length -= 1;
  return last;
};

export const shift = (array) => {
  const { length } = array;
  const element = array[0];
  for (let index = 0; index < length - 1; index += 1) {
    array[index] = array[index + 1];
  }
  array.length -= 1;
  return element;
};

export const unshift = (array, element) => {
  const { length } = array;
  for (let index = length; index > 0; index -= 1) {
    array[index] = array[index - 1];
  }
  array[0] = element;
};

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
