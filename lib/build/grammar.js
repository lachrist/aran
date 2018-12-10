
const ArrayLite = require("array-lite");

const Reflect_apply = Reflect.apply;
const Math_round = Math.round;
const Object_keys = Object.keys;
const String_prototype_substring = String.prototype.substring;

exports.BLOCK = [["identifier"], ["statement"]];

exports.SWITCH_BLOCK = [["identifier"], ["switch-statement"]];

exports.statement = {
  "Expression": ["expression"],
  "Break": ["label"],
  "Continue": ["label"],
  "Return": ["expression"],
  "Throw": ["expression"],
  "Debugger": [],
  "If": ["label", "expression", "block", "block"],
  "Try": ["label", "block", "block", "block"],
  "Block": ["label", "block"],
  "While": ["label", "expression", "block"]
  "Switch": ["label", "block"],
  "Case": ["expression"],
  "Default": [],
};

exports.expression = {
  "closure": ["block"]],
  "write": ["identifier", "expression", "expression"],
  "input": ["identifier"],
  "read": ["identifier"],
  "primitive": ["primitive"],
  "builtin": ["builtin-name"],
  "sequence": ["expression", "expression"],
  "eval": ["expression"],
  "conditional": ["expression", "expression", "expression"],
  "apply": ["expression", "expression", ["expression"]],
  "construct": ["expression", ["expression"]],
  "trap": ["trap-name", ["expression"], "serial"],
};
