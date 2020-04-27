"use strict";

const global_Error = global.Error;

let state = null;

exports.session = ({esnodes, serials, scopes}, esprogram, closure) => {
  if (state !== null) {
    throw new global_Error("Another script is already being normalized (two scripts cannot be normalized concurrently).");
  }
  const serial = esnodes.length;
  esnodes[serial] = esprogram;
  state = {
    __proto__: null,
    serial,
    esnodes,
    serials,
    scopes
  };
  const result = closure();
  state = null;
  return result;
};

exports.visit = (esnode, closure) => {
  const old_serial = state.serial;
  const new_serial = state.esnodes.length;
  state.esnodes[new_serial] = esnode;
  state.serial = new_serial;
  const result = closure();
  state.serial = old_serial;
  return result;
};

exports.associate_current_serial_to_node = (node) => {
  state.serials.set(node, state.serial);
  return node;
};

exports.associate_scope_to_current_serial = (scope) => {
  state.scopes[state.serial] = scope;
};
