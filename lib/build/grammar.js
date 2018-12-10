
const ArrayLite = require("array-lite");

const Reflect_apply = Reflect.apply;
const Math_round = Math.round;
const Object_keys = Object.keys;
const String_prototype_substring = String.prototype.substring;

exports.statement = {
  "Write": ["identifier", "expression"],
  "Expression": ["expression"],
  "Break": ["label"],
  "Continue": ["label"],
  "Return": ["expression"],
  "Throw": ["expression"],
  "Debugger": [],
  "If": [
    "label",
    "expression",
    [
      ["identifier"],
      ["statement"]],
    [
      ["identifier"],
      ["statement"]]],
  "Try": [
    "label",
    [
      ["identifier"],
      ["statement"]],
    [
      ["identifier"],
      ["statement"]],
    [
      ["identifier"],
      ["statement"]]],
  "Block": [
    "label",
    [
      ["identifier"],
      ["statement"]]],
  "While": [
    "label",
    "expression",
    [
      ["identifier"],
      ["statement"]]],
  "Switch": [
    "label",
    [
      ["identifier"],
      ["null-expression-statement"]]]
};

exports.expression = {
  "closure": [
    [
      ["identifier"],
      ["statement"]]],
  "write": ["identifier", "expression", "expression"],
  "error": [],
  "arrival": ["arrival-index"],
  "read": ["identifier"],
  "prelude": ["identifier"],
  "primitive": ["primitive"],
  "builtin": ["builtin-name"],
  "sequence": ["expression", "expression"],
  "eval": ["expression"],
  "conditional": ["expression", "expression", "expression"],
  "apply": ["expression", "expression", ["expression"]],
  "construct": ["expression", ["expression"]],
  // Weave //
  "trap": ["trap-name", ["expression"], "serial"],
  // Optimization //
  "array": [["expression"]],
  "object": [["property-kind", "expression", "expression"]],
  "get": ["expression", "expression"],
  "set": ["expression", "expression", "expression"],
  "unary": ["unary-operator", "expression"],
  "binary": ["binary-operator", "expression", "expression"]
};
