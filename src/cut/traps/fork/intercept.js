
const ArrayLite = require("array-lite");
const TrapArguments = require("./trap-arguments");

const Object_keys = Object.keys;

ArrayLite.forEach(
  ["informers", "modifiers", "combiners"],
  (category) => ArrayLite.forEach(
    Object_keys(TrapArguments[category]),
    (key) => exports[key] = function () {
      const array = [];
      for (var index=0; index<arguments.length; index++)
        array[index] = TrapArguments[category][key][index](arguments[index]);
      array[index] = ARAN.build.primitive(ARAN.parent.AranSerial);
      return ARAN.build.invoke(
        ARAN.build.read(ARAN.namespace),
        ARAN.build.primitive(key),
        array);
    }));
