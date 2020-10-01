"use strict";

const global_Reflect_getOwnPropertyDescriptor = global.Reflect.getOwnPropertyDescriptor;
const global_Error = global.Error;

const Program = require("./program");
const State = require("./state.js");
const Scope = require("./scope/index.js");

module.exports = (nullable_serial, node, state) => State._run_session(
  state,
  [
    (
      nullable_serial === null ?
      Scope._make_root() :
      (
        global_Reflect_getOwnPropertyDescriptor(state.scopes, nullable_serial) ?
        state.scopes[nullable_serial] :
        (
          (
            () => { throw new global_Error("The provided serial number does not correspond to a previously registered scope...") })
          ()))),
    node],
  Program.VISIT);
