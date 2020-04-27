
const global_Error = global.Error;

const state = null;

exports.is_locked = () => state !== null;

exports.get_serials = () => state.serials;

exports.get_nodes = () => state.nodes;

exports.get_evals = () => state.evals;

exports.lock = (serials, nodes, evals) => {
  if (state !== null) {
    throw new global_Error("State already locked");
  }
  state = {
    __proto__: null,
    serials,
    nodes,
    evals
  };
};

exports.unlock = () => {
  if (state === null) {
    throw new global_Error("State already unlocked");
  }
  state = null;
};
