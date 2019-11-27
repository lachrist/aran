
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Global = require("./global.js");
const Syntax = require("../syntax.js");

const global_Error = global.global_Error;
const global_Object_keys = Object.keys;
const global_Reflect_apply = Reflect.apply;
const global_RegExp_prototype_test = RegExp.prototype.test;

ArrayLite.forEach(ArrayLite.concat(Syntax.expression, , (constructor) => {
  exports[constructor] = function () {
    const 
  }
});

ArrayLite.forEach(global_Object_keys(Build), (constructorconstructor) => {
  if (global_Reflect_apply(global_String_prototype_toLowerCase, constructor, []) !== constructor) {
    exports[constructor] = function () {
      const expression = Build[constructor](...arguments);
      Global.SERIALS.set(expression, Global.NODES.length - 1);
      return expression;
    };
  } else if (global_Reflect_apply(global_String_prototype_toUpperCase, constructor, []) === constructor) {
    exports[constructor] = function () {
      const block = Build[constructor](...arguments);
      Global.SERIALS.set(block, Global.NODES.length - 1);
      return block;
    };
  } else {
    exports[constructor] = function () {
      const statements = Build[constructor](...arguments);
      ARAN.serials.set(statemens[0], Global.NODES.length - 1);
      return statment;
    };
  }
});

exports._BLOCK = exports.BLOCK;
exports._closure = exports.closure;
exports._eval = exports.eval;
exports._read = exports.read;
exports._write = exports.write;

ArrayLite.forEach(["BLOCK", "eval", "read", "write", "closure"], (string) => {
  exports[string] = () => {
    throw new global_Error("Only lib/normalize/scope.js may build: "+string);
  };
});
