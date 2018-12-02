
const ArrayLite = require("array-lite");
const Build = require("../build");

const Object_keys = Object.keys;
const Reflect_apply = Reflect.apply;
const Object_defineProperty = Object.defineProperty;
const String_prototype_toLowerCase = String.prototype.toLowerCase;

const define = (array) => Object_defineProperty(array, "__node__", {value:ARAN.node});

ArrayLite.forEach(
  ArrayLite.filter(
    Object_keys(Build),
    (key) => Reflect_apply(String_prototype_toLowerCase, key, []) !== key),
  (key) => exports[key] = function () {
    return ArrayLite.map(
      Reflect_apply(Build[key], null, arguments),
      define);
  });

ArrayLite.forEach(
  ArrayLite.filter(
    Object_keys(Build),
    (key) => Reflect_apply(String_prototype_toLowerCase, key, []) === key),
  (key) => exports[key] = function () {
    return define(Reflect_apply(Build[key], null, arguments));
  });

delete exports.trap;
delete exports.array;
delete exports.object;
delete exports.get;
delete exports.set;
delete exports.unary;
delete exports.binary;
