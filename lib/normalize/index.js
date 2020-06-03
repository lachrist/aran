
const Visit = require("./visit");
const State = require("./state.js");
const Scope = require("./scope");

const global_Error = global.Error;

module.exports = (program, nullable_frame_array) => State._run_session(state, [program, scope], Visit.VISIT);
