"use strict";

const global_Error = global.Error;

// type State = Maybe (Serial, Nodes, Serials, Evals)
// type Nodes = [Node]
// type Serials = WeakMap AranNode Serial
// type Evals = Map Serial [Frame]

let state = null;

// type Callback = () => Result
// type Result = *
exports.session = ({nodes, serials, evals}, program, callback) => {
  if (state !== null) {
    throw new global_Error("Another script is already being normalized (two scripts cannot be normalized concurrently).");
  }
  const serial = nodes.length;
  nodes[serial] = program;
  state = {
    serial,
    nodes,
    serials,
    evals
  };
  const result = callback();
  state = null;
  return result;
};

// type Callback = () => Result
// type Result = *
exports.visit = (node, callback) => {
  const serial = state.serial;
  state.serial = state.nodes.length;
  state.nodes[state.nodes.length] = node;
  const result = callback();
  state.serial = serial;
  return result;
};

exports.tag = (aran_node) => {
  state.serials.set(aran_node, state.serial);
  return aran_node;
};

exports.register_eval = (frame_array) => {
  state.evals[state.serial] = frame_array;
};
