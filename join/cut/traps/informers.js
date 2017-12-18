
// enter :: String -> (expression | null)
// leave :: String -> (expression | null)
// strict :: (expression | null)
// label :: String -> (expression | null)
// continue :: String -> (expression | null)
// break :: String -> (expression | null)
// drop :: (expression | null)
// copy :: (expression | null)
// swap :: Number -> Number -> (expression | null)

const Invoke = require("./_invoke.js");
const Build = require("../../build");
const TrapKeys = require("../../../trap-keys.js");

const noop = () => null;

TrapKeys.informers.forEach((key) => module.exports[key] = {
  forward: noop,
  cut: (...array) => Invoke(key, array.map(Build.primitive))});
