"use strict";

export const makeEmptyMapping = () => ({__proto__: null});

export const makeSingleMapping = (key, value) => ({
  __proto__: null,
  [key]: value,
});

export const combineMapping = (path, mapping1, mapping2) => {
  if (typeof mapping1 === "string") {
    return mapping1;
  }
  if (typeof mapping2 === "string") {
    return mapping2;
  }
  for (let key1 in mapping1) {
    for (let key2 in mapping2) {
      if ((key1 === key2) !== (mapping1[key1] === mapping2[key2])) {
        return `Combination mismatch at ${path} between [${key1}, ${mapping1[key1]}] and [${key2}, ${mapping2[key2]}]`;
      }
    }
  }
  return {__proto__: null, ... mapping1, ...mapping2};
};

const deleteMapping = (mapping1, key) => {
  const mapping2 = {__proto__: null, ... mapping1};
  delete mapping2[key];
  return mapping1;
};

exports.bindMapping = (path, key1, value1, mapping) => {
  if (typeof mapping === "string") {
    return mapping;
  }
  if (key1 in mapping) {
    if (mapping[key1] !== value1) {
      return `Binding mismatch at ${path} between [${key1}, ${value1}] and [${key1}, ${mapping[key1]}]`;
    }
    return deleteMapping(mapping, key1);
  } else {
    for (let key2 in mapping) {
      if (mapping[key2] === value1) {
        return `Binding mismatch at ${path} between [${key1}, ${value1}] and [${key2}, ${value1}]`;
      }
    }
    return mapping;
  }
};

// exports.bind = (path, keys1, keys2, mapping) => {
//   if (typeof mapping === "string") {
//     return mapping;
//   }
//   if (keys1.length !== keys2.length) {
//     return `Binding length mismatch at ${path}`;
//   }
//   mapping = global_Object_assign({__proto__:null}, mapping);
//   for (let key in mapping) {
//     const bounded = ArrayLite.has(keys1, key);
//     if (bounded !== ArrayLite.has(keys2, mapping[key])) {
//       return `Binding mismatch at ${path} between ${key} and ${mapping[key]}`;
//     }
//     if (bounded) {
//       delete mapping[key];
//     }
//   }
//   return mapping;
// };
