"use strict";

const Program = require("./program");
const State = require("./state.js");
const Scope = require("./scope/index.js");

module.exports = (nullable_scope, node, state) => State._run_session(
  state,
  [
    (
      nullable_scope === null ?
      Scope._make_global() :
      nullable_scope),
    node,
    (
      nullable_scope === null ?
      Program._default_context :
      {
        __proto__: Program._default_context,
        local: true})],
  Program.VISIT);
