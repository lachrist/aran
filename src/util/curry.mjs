import { concat } from "array-lite";

const {
  undefined,
  Reflect: { apply },
} = globalThis;

export const makeCurry = (f, ...xs) => ({ f, xs });

export const extendCurry = ({ f, xs: xs1 }, ...xs2) => ({
  f,
  xs: concat(xs1, xs2),
});

export const callCurry = ({ f, xs: xs1 }, ...xs2) =>
  apply(f, undefined, concat(xs1, xs2));

export const forEachCurry = (array, curry) => {
  const { length } = array;
  for (let index = 0; index < length; index += 1) {
    callCurry(curry, array[index], index, array);
  }
};

export const findCurry = (array, curry) => {
  const { length } = array;
  for (let index = 0; index < length; index += 1) {
    if (callCurry(curry, array[index], index, array)) {
      return array[index];
    }
  }
  return null;
};

export const mapCurry = (array1, curry) => {
  const { length } = array1;
  const array2 = [];
  for (let index = 0; index < length; index += 1) {
    array2[index] = callCurry(curry, array1[index], index, array1);
  }
  return array2;
};

export const filterOutCurry = (array1, curry) => {
  const { length: length1 } = array1;
  let length2 = 0;
  const array2 = [];
  for (let index = 0; index < length1; index += 1) {
    if (!callCurry(curry, array1[index], index, array1)) {
      array2[length2] = array1[index];
      length2 += 1;
    }
  }
  return array2;
};
