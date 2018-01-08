const ArrayLite = require("array-lite");
const Build = require("../../../build");
const TrapArguments = require("./trap-arguments.js");

const empty = () => null;
const identity = (argument) => argument;

ArrayLite.each(
  Object.keys(TrapArguments.combiners),
  (key) => exports[key] = Build[key]);

ArrayLite.each(
  Object.keys(TrapArguments.informers),
  (key) => exports[key] = empty);

ArrayLite.each(
  Object.keys(TrapArguments.consumers),
  (key) => exports[key] = identity);

ArrayLite.each(
  Object.keys(TrapArguments.producers),
  (key) => exports[key] = TrapArguments.producers[key][0]);