const ArrayLite = require("array-lite");
const Meta = require("../../../meta.js");
const TrapArguments = require("./trap-arguments.js");
const Object_keys = Object.keys;
const Error = global.Error;

ArrayLite.forEach(
  Object_keys(TrapArguments.computers),
  (key) => {
    switch (TrapArguments.computers[key].length) {
      case 1: return exports[key] = (x1) => ARAN.build[key](x1);
      case 2: return exports[key] = (x1, x2) => ARAN.build[key](x1, x2);
      case 3: return exports[key] = (x1, x2, x3) => ARAN.build[key](x1, x2, x3);
    }
    throw new Error("Invalid trap arity for "+key);
  });

const empty = () => ARAN.build.primitive(null);
ArrayLite.forEach(
  Object_keys(TrapArguments.informers),
  (key) => exports[key] = empty);

function last () { return arguments[arguments.length-1] }
ArrayLite.forEach(
  Object_keys(TrapArguments.modifiers),
  (key) => exports[key] = last);
