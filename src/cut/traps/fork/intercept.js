
const ArrayLite = require("array-lite");
const TrapArguments = require("./trap-arguments");

const keys = Object.keys;

ArrayLite.each(
  ["consumers", "producers", "informers", "combiners"],
  (category) => ArrayLite.each(
      keys(TrapArguments[category]),
      (key) => exports[key] = function () {
        const array = [];
        for (var index=0; index<arguments.length; index++)
          array[index] = TrapArguments[category][key][index](arguments[index]);
        array[index] = ARAN.build.primitive(ARAN.parent.AranIndex);
        return ARAN.build.invoke(
          ARAN.build.read(ARAN.namespace),
          ARAN.build.primitive(key),
          array) }));
