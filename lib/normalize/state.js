"use strict";

const global_Error = global.Error;

let state = null;

exports.session = ({nodes, serials, scopes}, program, closure) => {
  if (state !== null) {
    throw new global_Error("Another script is already being normalized (two scripts cannot be normalized concurrently).");
  }
  const serial = nodes.length;
  nodes[serial] = program;
  state = {
    serial,
    nodes,
    serials,
    scopes
  };
  const result = closure();
  state = null;
  return result;
};

exports.visit = (node, closure) => {
  const serial = state.serial;
  state.serial = state.nodes.length;
  state.nodes[state.nodes.length] = node;
  const result = closure();
  state.serial = serial;
  return result;
};

exports.tag = (aran_node) => {
  state.serials.set(aran_node, state.serial);
  return aran_node;
};

exports.register_eval = (json) => {
  state.scopes[state.serial] = json;
};
