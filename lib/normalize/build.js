
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Global = require("./global.js");
const Syntax = require("../syntax.js");

const global_Error = global.global_Error;
const global_Reflect_ownKeys = global.Object.keys;
const global_Reflect_apply = global.Reflect.apply;
const global_Map_prototype_set = global.Map.prototype.set;

ArrayLite.forEach(["block", "statement", "expression"], (type) => {
  ArrayLite.forEach(global_Reflect_ownKeys(Syntax[type]), (constructor) => {
    if (Syntax[type][constructor].length === 0) {
      exports[constructor] = function () {
        const value = Build[constructor]();
        Reflect_apply(Global.SERIALS, global_Map_prototype_set, [type === "statement" ? value[0] : value, Global.SERIAL]);
        return value;
      };
    } else if (Syntax[type][constructor].length === 1) {
      exports[constructor] = function (value1) {
        const value = Build[constructor](value1);
        Reflect_apply(Global.SERIALS, global_Map_prototype_set, [type === "statement" ? value[0] : value, Global.SERIAL]);
        return value;
      };
    } else if (Syntax[type][constructor].length === 2) {
      exports[constructor] = function (value1, value2) {
        const value = Build[constructor](value1, value2);
        Reflect_apply(Global.SERIALS, global_Map_prototype_set, [type === "statement" ? value[0] : value, Global.SERIAL]);
        return value;
      };
    } else if (Syntax[type][constructor].length === 3) {
      exports[constructor] = function (value1, value2, value3) {
        const value = Build[constructor](value1, value2, value3);
        Reflect_apply(Global.SERIALS, global_Map_prototype_set, [type === "statement" ? value[0] : value, Global.SERIAL]);
        return value;
      };
    } else {
      throw new global_Error("Unexpected constructor arity");
    }
  });
});

exports._BLOCK = exports.BLOCK;
exports._eval = exports.eval;
exports._read = exports.read;
exports._write = exports.write;

ArrayLite.forEach(["BLOCK", "eval", "read", "write"], (string) => {
  exports[string] = () => {
    throw new global_Error("Only lib/normalize/scope.js may build: "+string);
  };
});
