"use strict";

const ArrayLite = require("array-lite");

const global_Reflect_apply = global.Reflect.apply;
const global_Function = global.Function;
const global_String_prototype_trim = global.String.prototype.trim;

exports["block"] = {
  __proto__: null,
  "BLOCK": [["identifier"], ["statement"]]
};

exports["statement"] = {
  __proto__: null,
  // BlockLess //
  "Expression": ["expression"],
  "Return": ["expression"],
  "Break": ["label"],
  "Continue": ["label"],
  "Debugger": [],
  // BlockFull //
  "Lone": [["label"], "lone-block"],
  "If": [["label"], "expression", "then-block", "else-block"],
  "While": [["label"], "expression", "while-block"],
  "Try": [["label"], "try-block", "catch-block", "finally-block"]
};

exports["expression"] = {
  __proto__: null,
  // Producers //
  "primitive": ["primitive"],
  "builtin": ["builtin-name"],
  "arrow": ["arrow-block"],
  "function": ["function-block"],
  "read": ["identifier"],
  // Consumers //
  "write": ["identifier", "expression"],
  "sequence": ["expression", "expression"],
  "conditional": ["expression", "expression", "expression"],
  "throw": ["expression"],
  "eval": [["identifier"], "expression"],
  // Combiners //
  "apply": ["expression", "expression", ["expression"]],
  "construct": ["expression", ["expression"]],
  "unary": ["unary-operator", "expression"],
  "binary": ["binary-operator", "expression", "expression"],
  "object": ["expression", [["expression", "expression"]]]
};

exports["builtin-name"] = [
  "global",
  "eval",
  "RegExp",
  "ReferenceError",
  "TypeError",
  "Reflect.get",
  "Reflect.set",
  "Reflect.has",
  "Reflect.construct",
  "Reflect.apply",
  "Reflect.deleteProperty",
  "Reflect.setPrototypeOf",
  "Reflect.getPrototypeOf",
  "Reflect.defineProperty",
  "Reflect.getOwnPropertyDescriptor",
  "Symbol.unscopables",
  "Symbol.iterator",
  "Object",
  "Object.freeze",
  "Object.keys",
  "Object.create",
  "Object.prototype",
  "Array.of",
  "Array.prototype.concat",
  "Array.prototype.values",
  "Array.prototype.includes",
  "Array.prototype.push",
  "Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').get",
  "Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').set"
];

exports["unary-operator"] = [
  "-",
  "+",
  "!",
  "~",
  "typeof",
  "void",
  "delete"
];

exports["binary-operator"] = [
  "==",
  "!=",
  "===",
  "!==",
  "<",
  "<=",
  ">",
  ">=",
  "<<",
  ">>",
  ">>>",
  "+",
  "-",
  "*",
  "/",
  "%",
  "|",
  "^",
  "&",
  "in",
  "instanceof"
];

exports["primitive"] = (primitive) => {
  if (primitive === null || primitive === void 0) {
    return true;
  }
  if (typeof primitive === "boolean") {
    return true;
  }
  if (typeof primitive === "number") {
    return true;
  }
  if (typeof primitive === "bigint") {
    return true;
  }
  if (typeof primitive === "string") {
    return true;
  }
  return false;
};

const check_name = (blacklist) => (name) => {
  if (typeof name !== "string") {
    return false;
  }
  if (ArrayLite.includes(blacklist, name)) {
    return false;
  }
  // Credit: https://github.com/shinnn/is-var-name //
  if (global_Reflect_apply(global_String_prototype_trim, name, []) !== name) {
    return false;
  }
  try {
    new global_Function(name, "var "+name);
  } catch (error) {
    return false;
  }
  return true;
}; 

exports["identifier"] = check_name(["arguments", "eval", "evalcheck", "root"]);

exports["label"] = check_name([]);

exports["parameters"] = {
  __proto__: null,
  "program": ["self"],
  "eval": [],
  "function": ["newtarget", "self", "args"],
  "arrow": ["args"],
  "lone": [],
  "then": [],
  "else": [],
  "while": [],
  "try": [],
  "catch": ["error"],
  "finally": []
};
