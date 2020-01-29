
const Visit = require("./visit");
const Global = require("./global.js");
const Scope = require("./scope.js");

const global_Error = global.Error;
const global_Reflect_apply = global.Reflect.apply;
const global_WeakMap_prototype_has = global.WeakMap.prototype.has;
const global_Array_isArray = global.Array_isArray;
const global_Math_round = global.Math.round;

module.exports = (node, {serial, serials, evals, nodes}) => {
  if (Global.LOCKED) {
    throw new global_Error("Another script is already being normalized (two scripts cannot be normalized currently).");
  }
  try {
    global_Reflect_apply(global_WeakMap_prototype_has, serials, [null]);
  } catch (error) {
    throw new global_Error("serials should be a WeakMap (associating nodes to serial numbers)");
  }
  if (typeof evals !== "object" || evals === null) {
    throw new global_Error("evals should be an object (associating serial numbers to the scope of direct eval nodes)");
  }
  if (!global_Array_isArray(nodes)) {
    throw new global_Error("nodes should be an array (associating serial numbers to nodes)");
  }
  if (typeof serial === "number") {
    if (serial !== serial) {
      throw new global_Error("serial is NaN");
    }
    if (global_Math_round(serial) !== serial) {
      throw new global_Error("serial should be an integer");
    }
    if (serial < 0) {
      throw new global_Error("serial should be a positive integer");
    }
    if (serial >= this.node.length) {
      throw new global_Error("serial is too large for the current node database.");
    }
    if (!(serial in evals)) {
      throw new global_Error("serial does not refer to a node representing a direct eval call");
    }
  } else if (serial !== null && serial !== void 0) {
    throw new global_Error("serial should either be null/undefined (global code), or a serial number (direct eval code)");
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
