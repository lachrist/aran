
const ArrayLite = require("array-lite");
const Meta = require("../../../meta.js");
const TrapArguments = require("./trap-arguments");

const Object_keys = Object.keys;

ArrayLite.forEach(
  ["informers", "modifiers", "computers"],
  (category) => ArrayLite.forEach(
    Object_keys(TrapArguments[category]),
    (key) => exports[key] = function () {
      return Meta.trigger(
        key,
        ArrayLite.concat(
          ArrayLite.zipMap(arguments, TrapArguments[category][key]),
          [
            ARAN.build.primitive(ARAN.node.AranSerial)]));
    }));
