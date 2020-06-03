"use strict";

const Visit = require("./visit/index.js");
const State = require("./state.js");
const Scope = require("./scope/index.js");

module.exports = (program, nullable_frame_array) => State._run_session(state, [
  program,
  nullable_frame_array === null ? Scope._make_root() : Scope._make_eval(nullable_frame_array)
], Visit.VISIT);
