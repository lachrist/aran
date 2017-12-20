
// test :: expression -> expression
// with :: expression -> expression
// throw :: expression -> expression
// return :: expression -> expression
// eval :: expression -> expression
// write :: String -> expression -> expression
// declare :: String -> expression -> expression

const ArrayLite = require("array-lite");
const Build = require("../../build");
const CallTrap = require("./call-trap.js");

var producers = [
  "read",
  "discard",
  "builtin",
  "this",
  "arguments",
  "primitive",
  "regexp",
  "closure"];

var consumers = [
  "test",
  "with",
  "throw",
  "return",
  "eval",
  "write",
  "declare"];

ArrayLite.each(
  ArrayLite.concat(producers, consumers)),
  (key) => module.exports[key] = {
    forward: ArrayLite.last,
    cut: (value, ...rest) => CallTrap(key, [value].concat(rest.map(Build.primitive)));
