"use strict";

const global_Object_assign = global.Object.assign;

const ArrayLite = require("array-lite");

exports.Empty = () => ({__proto__:null});

exports.Single = (key, value) => ({
  __proto__: null,
  [key]: value});

exports.combine = (path, mapping1, mapping2) => {
  if (typeof mapping1 === "string") {
    return mapping1;
  }
  if (typeof mapping2 === "string") {
    return mapping2;
  }
  const mapping = global_Object_assign({__proto__:null}, mapping1, mapping2);
  for (let key in mapping) {
    if (key in mapping1 && key in mapping2) {
      if (mapping1[key] !== mapping2[key]) {
        return `Combination mismatch at ${path} between ${mapping1[key]} and ${mapping2[key]} for ${key}`;
      }
    }
  }
  return mapping;
};

exports.bind = (path, keys1, keys2, mapping) => {
  if (typeof mapping === "string") {
    return mapping;
  }
  if (keys1.length !== keys2.length) {
    return `Binding length mismatch at ${path}`;
  }
  mapping = global_Object_assign({__proto__:null}, mapping);
  for (let key in mapping) {
    const bounded = ArrayLite.has(keys1, key);
    if (bounded !== ArrayLite.has(keys2, mapping[key])) {
      return `Binding mismatch at ${path} between ${key} and ${mapping[key]}`;
    }
    if (bounded) {
      delete mapping[key];
    }
  }
  return mapping;
};
