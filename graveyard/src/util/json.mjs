import { filter } from "array-lite";

const {
  Array: {
    isArray,
    prototype: { sort },
  },
  Reflect: { ownKeys, apply },
  JSON: { stringify: stringifyJson },
  RegExp,
  RegExp: {
    prototype: { test: testRegExp },
  },
} = globalThis;

const EMPTY = [];

const isString = (any) => typeof any === "string";

export const matchJSON = (json, pattern) => {
  if (typeof pattern === "function") {
    return pattern(json);
  } else if (pattern instanceof RegExp) {
    return apply(testRegExp, pattern, [stringifyJson(json)]);
  } else if (isArray(pattern) && isArray(json)) {
    if (json.length !== pattern.length) {
      return false;
    } else {
      const { length } = json;
      for (let index = 0; index < length; index += 1) {
        if (!matchJSON(json[index], pattern[index])) {
          return false;
        }
      }
      return true;
    }
  } else if (
    typeof pattern === "object" &&
    pattern !== null &&
    typeof json === "object" &&
    json !== null
  ) {
    const keys1 = filter(ownKeys(json), isString);
    const keys2 = filter(ownKeys(pattern), isString);
    if (keys1.length !== keys2.length) {
      return false;
    } else {
      apply(sort, keys1, EMPTY);
      apply(sort, keys2, EMPTY);
      const { length } = keys1;
      for (let index = 0; index < length; index += 1) {
        if (keys1[index] !== keys2[index]) {
          return false;
        } else {
          const key = keys1[index];
          if (!matchJSON(json[key], pattern[key])) {
            return false;
          }
        }
      }
      return true;
    }
  } else {
    return json === pattern;
  }
};
