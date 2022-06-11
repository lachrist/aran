import {join} from "array-lite";

import {shift, assert} from "../../util/index.mjs";

const {
  Error,
  parseInt,
  isNaN,
  String: {
    prototype: {
      split: splitString,
      substring: subString,
      replace: replaceString,
    },
  },
  Reflect: {apply},
  Number: {
    prototype: {toString: stringifyNumber},
  },
} = globalThis;

export const BASE = "B";
export const SPEC = "S";
export const META = "M";

const SHADOW = "S";
const ORIGINAL = "O";

const ENCODING = 36;
const ENCODING_SINGLETON = [ENCODING];

const ONE_SINGLETON = [1];
const TWO_SINGLETON = [2];
const THREE_SINGLETON = [3];

const SEPARATOR = "_";
const SEPARATOR_SINGLETON = [SEPARATOR];

const CONVERT = [/(\.|_+)/gu, (match) => (match === "." ? "_" : `_${match}`)];

const REVERT = [
  /(\.|_+)/gu,
  (match) => (match === "_" ? "." : apply(subString, match, ONE_SINGLETON)),
];

export const makeVariableBody = (name) =>
  `${SEPARATOR}${apply(replaceString, name, CONVERT)}`;

export const makeIndexedVariableBody = (name, index) =>
  `${apply(stringifyNumber, index, ENCODING_SINGLETON)}_${name}`;

export const makeShadowVariable = (layer, body) => `${layer}${SHADOW}${body}`;

export const makeVariable = (layer, body) => `${layer}${ORIGINAL}${body}`;

export const unmangleVariable = (variable) => {
  if (variable[0] === BASE || variable[0] === SPEC) {
    assert(
      variable[1] === ORIGINAL || variable[1] === SHADOW,
      "invalid base/spec variable shadowing",
    );
    assert(variable[2] === SEPARATOR, "unexpected indexed base/spec variable");
    return {
      layer: "base",
      shadow: variable[1] === SHADOW,
      name: apply(
        replaceString,
        apply(subString, variable, THREE_SINGLETON),
        REVERT,
      ),
      identifier: variable,
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
      description: apply(replaceString, join(segments, SEPARATOR), REVERT),
      identifier: variable,
    };
  } else {
    throw new Error("invalid variable layer");
  }
};
