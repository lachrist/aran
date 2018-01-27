const ArrayLite = require("array-lite");
const TrapArguments = require("./trap-arguments.js");

const empty = () => null;
function last () { return arguments[arguments.length-1] }

ArrayLite.each(
  Object.keys(TrapArguments.combiners),
  (key) => exports[key] = (
    TrapArguments.combiners[key].length === 1 ?
    (argument0) => ARAN.build[key](argument0) :
    (
      TrapArguments.combiners[key].length === 2 ?
      (argument0, argument1) => ARAN.build[key](argument0, argument1) :
      (argument0, argument1, argument2) => ARAN.build[key](argument0, argument1, argument2))));

ArrayLite.each(
  Object.keys(TrapArguments.informers),
  (key) => exports[key] = empty);

ArrayLite.each(
  ArrayLite.concat(
    Object.keys(TrapArguments.producers),
    Object.keys(TrapArguments.consumers))
  (key) => exports[key] = last);
