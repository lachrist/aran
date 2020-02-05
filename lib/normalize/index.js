
const Visit = require("./visit");
const Global = require("./global.js");
const Scope = require("./scope.js");

const global_Error = global.Error;
const global_Reflect_apply = global.Reflect.apply;
const global_WeakMap_prototype_has = global.WeakMap.prototype.has;
const global_Array_isArray = global.Array_isArray;
const global_Math_round = global.Math.round;

module.exports = ($program, {serial, serials, evals, nodes}) => {
  if (Global.LOCKED) {
    throw new global_Error("Another script is already being normalized (two scripts cannot be normalized currently).");
  }
  try {
    Global.LOCKED = true;
    Global.SERIAL = null;
    Global.NODES = nodes;
    Global.EVALS = evals;
    Global.SERIALS = serials;
    return Visit.PROGRAM(node, Scope.$Create(serial === void 0 ? null : serial));
  } finally {
    Global.LOCKED = false;
    Global.SERIAL = null;
    Global.NODES = null;
    Global.EVALS = null;
    Global.SERIALS = null;
  }
};
