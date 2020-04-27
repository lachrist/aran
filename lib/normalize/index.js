
const Visit = require("./visit");
const State = require("./state.js");
const Scope = require("./scope");

const global_Error = global.Error;

module.exports = ($program, {serial, serials, evals, nodes}) => {
  if (State.is_locked()) {
    throw new global_Error("Another script is already being normalized (two scripts cannot be normalized currently).");
  }
  try {
    State.lock(nodes, serials, evals);
    return Visit.PROGRAM(node, Scope.$Create(serial === void 0 ? null : serial));
  } finally {
    State.unlock();
  }
};
