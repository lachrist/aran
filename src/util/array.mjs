const {
  Object: {freeze},
} = globalThis;

export const empty = freeze([]);

export const getLast = (array) => array[array.length - 1];

export const push = (array, element) => {
  array[array.length] = element;
};

export const pushAll = (array1, array2) => {
  let {length: length1} = array1;
  const {length: length2} = array2;
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
