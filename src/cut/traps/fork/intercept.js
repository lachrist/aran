
const ArrayLite = require("array-lite");
const Build = require("../../../build");
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
        array[index] = Build.primitive(ARAN.index);
        return Build.invoke(
          Build.read(ARAN.namespace),
          Build.primitive(key),
          array) }));
