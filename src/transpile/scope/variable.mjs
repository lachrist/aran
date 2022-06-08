import {join} from "array-lite";

import {shift, assert} from "../../util/index.mjs";

const {
  Error,
  parseInt,
  isNaN,
  String: {
    prototype: {split: splitString, substring: subString},
  },
  Reflect: {apply},
  Number: {
    prototype: {toString: stringifyNumber},
  },
} = globalThis;

export const BASE = "B";
export const META = "M";

const SHADOW = "S";
const ORIGINAL = "O";

const ENCODING = 36;
const ENCODING_SINGLETON = [ENCODING];

const TWO_SINGLETON = [2];
const THREE_SINGLETON = [3];

const SEPARATOR = "_";
const SEPARATOR_SINGLETON = [SEPARATOR];

const mapping = [
  ["new.target", "0newtarget"],
  ["import.meta", "0importmeta"],
];

const transform = (string, index1, index2) => {
  for (let index = 0; index < mapping.length; index += 1) {
    if (mapping[index][index1] === string) {
      return mapping[index][index2];
    }
  }
  return string;
};

export const makeVariableBody = (name) =>
  `${SEPARATOR}${transform(name, 0, 1)}`;

export const makeIndexedVariableBody = (name, index) =>
  `${apply(stringifyNumber, index, ENCODING_SINGLETON)}_${name}`;

export const makeShadowVariable = (layer, body) => `${layer}${SHADOW}${body}`;

export const makeVariable = (layer, body) => `${layer}${ORIGINAL}${body}`;

export const unmangleVariable = (variable) => {
  if (variable[0] === BASE) {
    assert(
      variable[1] === ORIGINAL || variable[1] === SHADOW,
      "invalid variable shadowing",
    );
    assert(variable[2] === SEPARATOR, "unexpected indexed base variable");
    return {
      layer: "base",
      shadow: variable[1] === SHADOW,
      name: transform(apply(subString, variable, THREE_SINGLETON), 1, 0),
    };
  } else if (variable[0] === META) {
    assert(variable[1] === ORIGINAL, "expected an original meta variable");
    const segments = apply(
      splitString,
      apply(subString, variable, TWO_SINGLETON),
      SEPARATOR_SINGLETON,
    );
    const head = parseInt(shift(segments), ENCODING);
    assert(!isNaN(head), "invalid meta variable index");
    return {
      layer: "meta",
      index: head,
      description: transform(join(segments, SEPARATOR), 1, 0),
    };
  } else {
    throw new Error("invalid variable layer");
  }
};
