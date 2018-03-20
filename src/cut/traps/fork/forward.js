const ArrayLite = require("array-lite");
const TrapArguments = require("./trap-arguments.js");
const Object_keys = Object.keys;

const empty = () => null;
function last () { return arguments[arguments.length-1] }
const combine = (key, length) => {
  if (length === 1)
    return (argument0) => ARAN.build[key](argument0);
  if (length === 2)
    return (argument0, argument1) => ARAN.build[key](argument0, argument1);
  if (length === 3)
    return (argument0, argument1, argument2) => ARAN.build[key](argument0, argument1, argument2);
  throw new Error("Invalid trap arguments length: "+length);
};

ArrayLite.forEach(
  Object_keys(TrapArguments.combiners),
  (key) => exports[key] = combine(key, TrapArguments.combiners[key].length));

ArrayLite.forEach(
  Object_keys(TrapArguments.informers),
  (key) => exports[key] = empty);

ArrayLite.forEach(
  Object_keys(TrapArguments.modifiers),
  (key) => exports[key] = last);
