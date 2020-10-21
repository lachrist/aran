"use strict";

const Program = require("./program");
const State = require("./state.js");
const Scope = require("./scope/index.js");

module.exports = (node, context, state) => State._run_session(
  state,
  [
    (
      context.mode === "local-eval" ?
      state.scopes[context.serial] :
      Scope._make_global()),
    node,
    context],
  Program.VISIT);
