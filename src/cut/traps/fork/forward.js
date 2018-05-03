const ArrayLite = require("array-lite");
const Meta = require("../../../meta.js");
const TrapArguments = require("./trap-arguments.js");
const Object_keys = Object.keys;

const empty = () => null;
function last () { return arguments[arguments.length-1] }
const combine = (key) => {
  switch (TrapArguments.combiners[key].length) {
    case 1: return (x1) => ARAN.build[key](x1);
    case 2: return (x1, x2) => ARAN.build[key](x1, x2);
    case 3: return (x1, x2, x3) => ARAN.build[key](x1, x2, x3);
    case 4: return (x1, x2, x3, x4) => ARAN.build[key](x1, x2, x3, x4);
    case 5: return (x1, x2, x3, x4, x5) => ARAN.build[key](x1, x2, x3, x4, x5);
  }
};

ArrayLite.forEach(
  Object_keys(TrapArguments.combiners),
  (key) => exports[key] = combine(key));

ArrayLite.forEach(
  Object_keys(TrapArguments.informers),
  (key) => exports[key] = empty);

ArrayLite.forEach(
  Object_keys(TrapArguments.modifiers),
  (key) => exports[key] = last);
