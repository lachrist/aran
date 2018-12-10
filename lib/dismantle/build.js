
const ArrayLite = require("array-lite");
const Build = require("../build");

const Object_keys = Object.keys;
const Reflect_apply = Reflect.apply;
const Object_defineProperty = Object.defineProperty;
const String_prototype_toLowerCase = String.prototype.toLowerCase;

const sourcemap = (array) => Object_defineProperty(array, "__node__", {value:ARAN.node});

ArrayLite.forEach(Object_keys(Build), (key) => {
  if (RegExp_prototype_test, /[A-Z](a-z)+/, [key]) {
    exports[key] = function () {
      return ArrayLite.map(Reflect_apply(Build[key], null, arguments), sourcemap);
    };
  } else {
    exports[key] = function () {
      return sourcemap(Reflect_apply(Build[key], null, arguments));
    };
  }
});

delete exports.trap;
delete exports.array;
delete exports.object;
delete exports.get;
delete exports.set;
delete exports.unary;
delete exports.binary;
