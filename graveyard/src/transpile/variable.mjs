import { map, join } from "array-lite";

import { hasOwn, shift, assert, partialx_ } from "../util/index.mjs";

const {
  Error,
  parseInt,
  isNaN,
  Object: { fromEntries },
  String: {
    prototype: { split: splitString, substring: subString },
  },
  Reflect: { apply },
  Number: {
    prototype: { toString: stringifyNumber },
  },
} = globalThis;

export const META = "meta";
export const BASE = "base";
export const SPEC = "spec";

const META_CHAR = "0";
const BASE_CHAR = "1";
const SPEC_CHAR = "2";

const DEADZONE = "X";
const ORIGINAL = "O";

const ENCODING = 36;
const ENCODING_SINGLETON = [ENCODING];

const TWO_SINGLETON = [2];

const SEPARATOR = "_";
const SEPARATOR_SINGLETON = [SEPARATOR];

const DEADZONE_MAPPING = {
  __proto__: null,
  [DEADZONE]: true,
  [ORIGINAL]: false,
};

export const makeMetaVariable = (name, index) =>
  `0${apply(stringifyNumber, index, ENCODING_SINGLETON)}${SEPARATOR}${name}`;

const specials = [
  ["this", "this"],
  ["import", "import"],
  ["new.target", "new_target"],
  ["import.meta", "import_meta"],
  ["super.get", "super_get"],
  ["super.set", "super_set"],
  ["super.call", "super_call"],
];

const flip = ({ 0: x, 1: y }) => [y, x];

const convert_special_mapping = fromEntries(specials);

const revert_special_mapping = fromEntries(map(specials, flip));

export const getVariableLayer = (variable) => {
  if (hasOwn(convert_special_mapping, variable)) {
    return SPEC;
  } else if (variable[0] === META_CHAR) {
    return META;
  } else {
    return BASE;
  }
};

const mangleVariable = (prefix, variable) => {
  if (hasOwn(convert_special_mapping, variable)) {
    return `${prefix}${SPEC_CHAR}${convert_special_mapping[variable]}`;
  } else if (variable[0] === META_CHAR) {
    return `${prefix}${variable}`;
  } else {
    return `${prefix}${BASE_CHAR}${variable}`;
  }
};

export const mangleDeadzoneVariable = partialx_(mangleVariable, DEADZONE);

export const mangleOriginalVariable = partialx_(mangleVariable, ORIGINAL);

export const unmangleVariable = (variable) => {
  assert(
    variable[0] in DEADZONE_MAPPING,
    "invalid first character in mangled variable",
  );
  const deadzone = DEADZONE_MAPPING[variable[0]];
  const body = apply(subString, variable, TWO_SINGLETON);
  if (variable[1] === META_CHAR) {
    const segments = apply(splitString, body, SEPARATOR_SINGLETON);
    const segment = shift(segments);
    const index = parseInt(segment, ENCODING);
    assert(!isNaN(index), "could not parse mangled variable index");
    return {
      layer: "meta",
      deadzone,
      name: join(segments, SEPARATOR),
      index,
    };
  } else if (variable[1] === BASE_CHAR) {
    return {
      layer: "base",
      deadzone,
      name: body,
      index: null,
    };
  } else if (variable[1] === SPEC_CHAR) {
    assert(
      hasOwn(revert_special_mapping, body),
      "invalid special variable body",
    );
    return {
      layer: "base",
      deadzone,
      name: revert_special_mapping[body],
      index: null,
    };
  } else {
    throw new Error("invalid second character of mangled variable");
  }
};
