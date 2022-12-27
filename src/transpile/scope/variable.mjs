import { includes, join } from "array-lite";

import { shift, assert, partialx_ } from "../../util/index.mjs";

const {
  Error,
  parseInt,
  isNaN,
  String: {
    prototype: { split: splitString, substring: subString },
  },
  Reflect: { apply },
  Number: {
    prototype: { toString: stringifyNumber },
  },
} = globalThis;

const META = "0";
const BASE = "1";
const SPEC = "2";

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

const specials = ["this", "new.target", "import.meta"];

const convertSpecial = (variable) => {
  if (variable === "new.target") {
    return "new_target";
  } else if (variable === "import.meta") {
    return "import_meta";
  } else {
    return variable;
  }
};

const revertSpecial = (variable) => {
  if (variable === "new_target") {
    return "new.target";
  } else if (variable === "import_meta") {
    return "import.meta";
  } else {
    return variable;
  }
};

export const getVariableLayer = (variable) => {
  if (includes(specials, variable)) {
    return "spec";
  } else if (variable[0] === META) {
    return "meta";
  } else {
    return "base";
  }
};

const mangleVariable = (prefix, variable) => {
  if (includes(specials, variable)) {
    return `${prefix}${SPEC}${convertSpecial(variable)}`;
  } else if (variable[0] === META) {
    return `${prefix}${variable}`;
  } else {
    return `${prefix}${BASE}${variable}`;
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
  if (variable[1] === META) {
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
  } else if (variable[1] === BASE) {
    return {
      layer: "base",
      deadzone,
      name: body,
      index: null,
    };
  } else if (variable[1] === SPEC) {
    return {
      layer: "base",
      deadzone,
      name: revertSpecial(body),
      index: null,
    };
  } else {
    throw new Error("invalid second character of mangled variable");
  }
};
