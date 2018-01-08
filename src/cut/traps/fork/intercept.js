
const ArrayLite = require("array-lite");
const Build = require("../../../build.js");
const TrapArguments = require("./trap-arguments");

const keys = Object.keys;

ArrayLite.each(
  ["consumers", "producers", "informers", "combiners"],
  (category) => ArrayLite.each(
      keys(TrapArguments[category]),
      (key) => exports[key] = function () {
        const array = ArrayLite.zipmap(arguments, TrapArguments[category][key]);
        array[array.length] = Build.primitive(ARAN.index);
        return Build.invoke(
          Build.read(ARAN.namespace),
          Build.primitive(key),
          array) }));
