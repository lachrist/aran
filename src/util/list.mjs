export const NIL = null;

export const cons = (x, y) => [x, y];

export const car = ({0: x}) => x;

export const cdr = ({1: y}) => y;

export const convertArrayList = (array) => {
  let list = NIL;
  for (let index = array.length - 1; index >= 0; index -= 1) {
    list = cons(array[index], list);
  }
  return list;
};

export const convertListArray = (list) => {
  let length = 0;
  const array = [];
  while (list !== NIL) {
    array[length] = car(list);
    length += 1;
    list = cdr(list);
  }
  return array;
};
