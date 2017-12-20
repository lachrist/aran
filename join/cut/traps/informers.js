
// enter :: String -> (expression | null)
// leave :: String -> (expression | null)
// strict :: (expression | null)
// label :: String -> (expression | null)
// continue :: String -> (expression | null)
// break :: String -> (expression | null)
// drop :: (expression | null)
// copy :: (expression | null)
// swap :: Number -> Number -> (expression | null)

const ArrayLite = require("array-lite");
const Build = require("../../build");
const CallTrap = require("./call-trap.js");

const noop = () => null;

ArrayLite.each(
  [
    "Enter",
    "Leave",
    "Program",
    "Closure",
    "Label",
    "Continue",
    "Break",
    "Copy",
    "Drop"],
  (key) => exports[key] = {
    forward: noop,
    cut: (...array) => CallTrap(key, array.map(Build.primitive))});
