import {
  makeLeft,
  makeRight,
  isLeft,
  fromLeft,
  fromRight,
} from "../util/index.mjs";
import { setErrorValuePair } from "./error.mjs";

export const hasMappingError = isLeft;

export const getMappingError = fromLeft;

export const makeEmptyMapping = () => makeRight({ __proto__: null });

export const makeSingleMapping = (key, value) =>
  makeRight({
    __proto__: null,
    [key]: value,
  });

export const combineMapping = (either1, either2, error) => {
  if (isLeft(either1)) {
    return either1;
  } else if (isLeft(either2)) {
    return either2;
  } else {
    const object1 = fromRight(either1);
    const object2 = fromRight(either2);
    for (const key1 in object1) {
      for (const key2 in object2) {
        if ((key1 === key2) !== (object1[key1] === object2[key2])) {
          return makeLeft(
            setErrorValuePair(
              error,
              [key1, key2],
              [object1[key1], object2[key2]],
            ),
          );
        }
      }
    }
    return makeRight({ __proto__: null, ...object1, ...object2 });
  }
};

export const bindMapping = (either, key1, value1, error) => {
  if (isLeft(either)) {
    return either;
  } else {
    const object = fromRight(either);
    if (key1 in object) {
      if (object[key1] !== value1) {
        return makeLeft(
          setErrorValuePair(error, [key1, key1], [value1, object[key1]]),
        );
      } else {
        const copy_object = { __proto__: null, ...object };
        delete copy_object[key1];
        return makeRight(copy_object);
      }
    } else {
      for (const key2 in object) {
        if (object[key2] === value1) {
          return makeLeft(
            setErrorValuePair(error, [key1, key2], [value1, value1]),
          );
        }
      }
      return either;
    }
  }
};
