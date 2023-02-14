export const cons = (x, y) => ({ car: x, cdr: y });

export const consFlip = (y, x) => ({ car: x, cdr: y });

export const car = ({ car: x }) => x;

export const cdr = ({ cdr: y }) => y;

export const convertArrayList = (array) => {
  let list = null;
  for (let index = array.length - 1; index >= 0; index -= 1) {
    list = { car: array[index], cdr: list };
  }
  return list;
};

export const convertListArray = (list) => {
  let length = 0;
  const array = [];
  while (list !== null) {
    array[length] = list.car;
    length += 1;
    list = list.cdr;
  }
  return array;
};
