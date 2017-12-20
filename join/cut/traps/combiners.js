
// array :: [expression] -> expression
// object :: [[String, expression, expression]] -> expression
// get :: expression -> expression -> expression
// set :: expression -> expression -> expression -> expression
// delete :: expression -> expression -> expression
// enumerate :: expression -> expression
// apply :: expression -> expression -> [expression] -> expression
// construct :: expression -> [expression] -> expression
// unary :: String -> expression -> expression
// binary :: String -> expression -> expression -> expression

const ArrayLite = require("array-lite");
const Build = require("../../build");
const CallTrap = require("./call-trap.js");

const transformerss = {
  object: [
    (properties) => Build.array(ArrayLite.map(properties, Build.array))],
  array: [
    Build.array],
  invoke: [
    null,
    null,
    Build.array],
  apply: [
    null,
    Build.array],
  construct1: [
    null,
    Build.array],
  unary: [
    Build.primitive],
  binary: [
    Build.primitive]};

Rayar.each(
  [
    "object",
    "array",
    "get",
    "set",
    "delete",
    "enumerate",
    "invoke",
    "apply",
    "construct",
    "unary",
    "binary"],
  (key) => exports[key] = {
    forward: Build[key],
    cut: function () {
      return CallTrap(key, ArrayLite.zipmap(arguments, transformerss[key]||[]));
    }});
