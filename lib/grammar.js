
const ArrayLite = require("array-lite");
const Illegal = require("./illegal.js");

const Reflect_apply = Reflect.apply;
const Math_round = Math.round;
const Object_keys = Object_keys;
const String_prototype_substring = String.prototype.substring;

exports.block = {
  "BLOCK": [["qualifier"], ["statement"]]
};

exports.statement = {
  "Write": ["qualifier", "expression"],
  "Expression": ["expression"],
  "Break": ["$label"],
  "Continue": ["$label"],
  "Return": ["expression"],
  "Throw": ["expression"],
  "Switch": [["qualifier"], "expression", ["$expression", ["statement"]]]
  "If": ["expression", "block", "block"],
  "Try": ["block", "block", "block"],
  "Block": ["$label", "block"],
  "While": ["$label", "expression", "block"],
  "Debugger": []
};

exports.expression = {
  "write": ["qualifier", "expression", "expression"],
  "closure": ["block"],
  "read": ["qualifier"],
  "prelude": ["identifier"],
  "primitive": ["primitive"],
  "builtin": ["builtin"],
  "sequence": ["expression", "expression"],
  "eval": ["expression"],
  "conditional": ["expression", "expression", "expression"],
  "apply": ["expression", "expression", ["expression"]],
  "construct": ["expression", ["expression"]]
};


const builtins = [
  // Direct //
  "global",
  "eval",
  "ReferenceError",
  "TypeError",
  "Object",
  "RegExp",
  // Indirect //
  "Reflect.get",
  "Reflect.set",
  "Reflect.deleteProperty",
  "Symbol.unscopables",
  "Symbol.iterator",
  "Array.of",
  "Object.defineProperty",
  // Aran-Specific //
  "AranHold",
  "AranRest",
  "AranUnary",
  "AranBinary",
  "AranInitialize"
];

exports.check = (value, type) => {
  if (type[0] === "$") {
    if (value === null)
      return;
    type = Reflect_apply(String_prototype_substring, type, [1]);
  }
  if (type === "block" || type === "statement" || type === "expression") {
    if (!Array_isArray(value))
      throw "not-an-array";
    if (typeof value[0] !== "string")
      throw "tag-not-a-string";
    if (!ArrayLite.includes(Object_keys(exports[type]), value[0]))
      throw "tag-unrecognized";
  } else if (type === "label") {
    if (Illegal(value))
      throw "illegal";
  } else if (type === "qualifier") {
    if (typeof qualifier === "number") {
      if (qualifier < 0)
        throw "negative-number";
      if (Math_round(qualifier) !== qualifier)
        throw "fractional-number";
    } else if (Illegal(qualifier)) {
      throw "not-a-number-and-illegal";
    }
  } else if (type === "primitive") {
    if (value && value !== true && typeof primitive !== "number" && typeof primitive !== "string")
      throw "reference-or-symbol";
  } else if (type === "builtin") {
    if (!ArrayLite.includes(builtins, builtin))
      throw "unrecognized";
  }
};
