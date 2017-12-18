
// test :: expression -> expression
// with :: expression -> expression
// throw :: expression -> expression
// return :: expression -> expression
// eval :: expression -> expression
// write :: String -> expression -> expression
// declare :: String -> expression -> expression

const Invoke = require("./_invoke.js");
const Build = require("../../build");
const TrapKeys = require("../../../trap-keys.js");

var identity = (value) => value;

TrapKeys.producers.concat(TrapKeys.consumers).forEach((key) => module.exports[key] = {
  forward: identity,
  cut: (value, ...rest) => Invoke(key, [value].concat(rest.map(Build.primitive))});
