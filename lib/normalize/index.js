
const Visit = require("./visit");
const Scope = require("./scope.js");
const Global = require("./global.js");

const global_Error = global.Error;

module.exports = (node, serial, options) => {
  if (Global.LOCKED) {
    throw new global_Error("Aran cannot normalize two scripts concurrently, please wait for Aran to normalize the first script.");
  }
  try {
    Global.LOCKED = true;
    Global.SERIAL = null;
    Global.NODES = options.nodes;
    Global.EVALS = options.evals;
    Global.SERIALS = options.serials;
    return Visit.NODE(node, typeof serial === "number" ? Scope.$Parse(options.evals[serial]) : null, {
      __proto__: null,
      tag: "program"
    });
  } finally {
    Global.LOCKED = false;
    Global.SERIAL = null;
    Global.NODES = null;
    Global.EVALS = null;
    Global.SERIALS = null;
  }
};
