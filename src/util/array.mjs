const {
  Object: {freeze},
} = globalThis;

export const empty = freeze([]);

export const getLast = (array) => array[array.length - 1];

export const push = (array, element) => {
  array[array.length] = element;
};

export const pop = (array) => {
  const last = array[array.length - 1];
  array.length -= 1;
  return last;
};
