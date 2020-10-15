"use strict";

const Program = require("./program");
const State = require("./state.js");
const Scope = require("./scope/index.js");

module.exports = (nullable_scope, node, state) => State._run_session(
  state,
  [
    (
      nullable_scope === null ?
      Scope._make_root() :
      nullable_scope),
    node],
  Program.VISIT);
