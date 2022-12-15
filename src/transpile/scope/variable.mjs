import { join } from "array-lite";

import { shift, assert } from "../../util/index.mjs";

const {
  parseInt,
  isNaN,
  String: {
    prototype: {
      split: splitString,
      substring: subString,
      replace: replaceString,
    },
  },
  Reflect: { apply },
  Number: {
    prototype: { toString: stringifyNumber },
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

const SEPARATOR = "_";
const SEPARATOR_SINGLETON = [SEPARATOR];

const CONVERT = [/(\.|(_+))/gu, (match) => (match === "." ? "_" : `_${match}`)];

const REVERT = [
  /_+/gu,
  (match) => (match === "_" ? "." : apply(subString, match, ONE_SINGLETON)),
];

const LAYER_MAPPING = {
  __proto__: null,
  [BASE]: "base",
  [SPEC]: "spec",
  [META]: "meta",
};

const SHADOWING_MAPPING = {
  __proto__: null,
  [ORIGINAL]: false,
  [SHADOW]: true,
};

export const indexVariable = (name, index) =>
  `0${apply(stringifyNumber, index, ENCODING_SINGLETON)}${SEPARATOR}${name}`;

const unindexVariable = (variable) => {
  if (variable[0] === "0") {
    const segments = apply(splitString, variable, SEPARATOR_SINGLETON);
    const index = parseInt(shift(segments), ENCODING);
    assert(!isNaN(index), "invalid variable index");
    return { index, name: join(segments, SEPARATOR) };
  } else {
    return { index: null, name: variable };
  }
};

const generateLayer = (shadowing) => (layer, variable) =>
  `${layer}${shadowing}${apply(replaceString, variable, CONVERT)}`;

export const layerShadowVariable = generateLayer(SHADOW);

export const layerVariable = generateLayer(ORIGINAL);

export const unmangleVariable = (variable) => {
  assert(variable[0] in LAYER_MAPPING, "invalid variable layer");
  assert(variable[1] in SHADOWING_MAPPING, "invalid variable shadowing");
  const { index, name } = unindexVariable(
    apply(replaceString, apply(subString, variable, TWO_SINGLETON), REVERT),
  );
  return {
    layer: LAYER_MAPPING[variable[0]],
    shadow: SHADOWING_MAPPING[variable[1]],
    index,
    name,
  };
};
