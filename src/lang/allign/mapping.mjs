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
  for (const key1 in mapping1) {
    for (const key2 in mapping2) {
      if ((key1 === key2) !== (mapping1[key1] === mapping2[key2])) {
        return `Combination mismatch at ${path} between [${key1}, ${mapping1[key1]}] and [${key2}, ${mapping2[key2]}]`;
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

export const bindMapping = (path, key1, value1, mapping) => {
  if (typeof mapping === "string") {
    return mapping;
  }
  if (key1 in mapping) {
    if (mapping[key1] !== value1) {
      return `Binding mismatch at ${path} between [${key1}, ${value1}] and [${key1}, ${mapping[key1]}]`;
    }
    return deleteMapping(mapping, key1);
  } else {
    for (const key2 in mapping) {
      if (mapping[key2] === value1) {
        return `Binding mismatch at ${path} between [${key1}, ${value1}] and [${key2}, ${value1}]`;
      }
    }
    return mapping;
  }
};
