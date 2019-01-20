
const ArrayLite = require("array-lite");
const Build = require("../build");

const Error = global.Error;
const Object_keys = Object.keys;
const Reflect_apply = Reflect.apply;
const Object_defineProperty = Object.defineProperty;
const RegExp_prototype_test = RegExp.prototype.test;

const sourcemap = (array) => {
  array[array.length] = ARAN.serial;
  return array;
};

ArrayLite.forEach(Object_keys(Build), (key) => {
  if (Reflect_apply(RegExp_prototype_test, /^[A-Z][a-z]+$/, [key])) {
    exports[key] = function () {
      return ArrayLite.map(Reflect_apply(Build[key], null, arguments), sourcemap);
    };
  } else {
    exports[key] = function () {
      return sourcemap(Reflect_apply(Build[key], null, arguments));
    };
  }
});

exports._read = exports.read;
exports._write = exports.write;
exports._Write = exports.Write;
exports._BLOCK = exports.BLOCK;

exports.trap = () => {
  throw new Error("lib/dismantle should never build trap expressions");
};

ArrayLite.forEach(["BLOCK", "read", "write", "Write"], (string) => {
  exports[string] = () => {
    throw new Error("Only lib/dismantle/scope/identifier.js may build: "+string);
  };
});
