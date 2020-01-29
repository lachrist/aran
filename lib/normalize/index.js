
const Visit = require("./visit");
const Global = require("./global.js");
const Scope = require("./scope.js");

const global_Error = global.Error;

module.exports = (node, options) => {
  if (Global.LOCKED) {
    throw new global_Error("Another script is already being normalized (two scripts cannot be normalized currently).");
  }
  try {
    Global.LOCKED = true;
    Global.SERIAL = null;
    Global.NODES = options.nodes;
    Global.EVALS = options.evals;
    Global.SERIALS = options.serials;
    return Visit.PROGRAM(node, Scope.$Create(options.serial));
  } finally {
    Global.LOCKED = false;
    Global.SERIAL = null;
    Global.NODES = null;
    Global.EVALS = null;
    Global.SERIALS = null;
  }
};
