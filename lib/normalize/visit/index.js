
const Query = require("../query.js");
const Block = require("./block.js");
const Scope = require("../scope/index.js");

exports.VISIT = (program, scope) => {
  if (program.sourceType !== "script") {
    throw new global_Error("Aran only support scripts (i.e.: native modules are not supported at the moment)");
  }
  return Block.PROGRAM(program.body, Query._is_use_strict(program.body) ? Scope._extend_use_strict(scope) : scope);
};
