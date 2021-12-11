import {setErrorValuePair} from "./error.mjs";

const {
  Reflect: {getPrototypeOf},
} = globalThis;

export const isMapping = (object) => getPrototypeOf(object) === null;

export const makeEmptyMapping = () => ({__proto__: null});

export const makeSingleMapping = (key, value) => ({
  __proto__: null,
  [key]: value,
});

export const combineMapping = (error, mapping1, mapping2) => {
  if (!isMapping(mapping1)) {
    return mapping1;
  }
  if (!isMapping(mapping2)) {
    return mapping2;
  }
  for (const key1 in mapping1) {
    for (const key2 in mapping2) {
      if ((key1 === key2) !== (mapping1[key1] === mapping2[key2])) {
        return setErrorValuePair(
          error,
          [key1, key2],
          [mapping1[key1], mapping2[key2]],
        );
      }
    }
  }
  return {__proto__: null, ...mapping1, ...mapping2};
};

const deleteMapping = (mapping1, key) => {
  const mapping2 = {__proto__: null, ...mapping1};
  delete mapping2[key];
  return mapping2;
};

export const bindMapping = (error, key1, value1, mapping) => {
  if (!isMapping(mapping)) {
    return mapping;
  }
  if (key1 in mapping) {
    if (mapping[key1] !== value1) {
      return setErrorValuePair(error, [key1, key1], [value1, mapping[key1]]);
    }
    return deleteMapping(mapping, key1);
  } else {
    for (const key2 in mapping) {
      if (mapping[key2] === value1) {
        return setErrorValuePair(error, [key1, key2], [value1, value1]);
      }
    }
    return mapping;
  }
};
