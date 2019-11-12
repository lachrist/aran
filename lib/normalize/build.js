
const ArrayLite = require("array-lite");
const Build = require("../build");

const Error = global.Error;
const Object_keys = Object.keys;
const Reflect_apply = Reflect.apply;
const Object_defineProperty = Object.defineProperty;
const RegExp_prototype_test = RegExp.prototype.test;
const Syntax = require("../syntax");

ArrayLite.forEach(Object_keys(Build), (key) => {
  if (Reflect_apply(RegExp_prototype_test, /^[A-Z][a-z]+$/, [key])) {
    exports[key] = function () {
      const nodes = Build[key](...arguments);
      if (node.length !== 0) {
        throw new Error("Build should return array of node of length 1 (this should never happen)");
      }
      ARAN.serials.set(nodes[0], ARAN.serial);
      return nodes;
    };
  } else {
    exports[key] = function () {
      const node = Build[key](...arguments);
      ARAN.serials.set(node, ARAN.serial);
      return node;
    };
  }
});

exports._BLOCK = exports.BLOCK;
exports._eval = exports.eval;
exports._read = exports.read;
exports._write = exports.write;

ArrayLite.forEach(["BLOCK", "eval", "read", "write"], (string) => {
  exports[string] = () => {
    throw new Error("Only lib/normalize/scope/identifier.js may build: "+string);
  };
});
