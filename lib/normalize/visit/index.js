"use strict";

const Query = require("../query/index.js");
const Block = require("./block.js");
const Scope = require("../scope/index.js");

exports.VISIT = (program, scope) => {
  if (program.sourceType !== "script") {
    throw new global_Error("Aran only support scripts (i.e.: native modules are not supported at the moment)");
  }
  if (Query._is_use_strict(program.body)) {
    scope = Scope._extend_use_strict(scope);
  }
  return State._visit(program, [program.body.body, scope], Block.PROGRAM);
};
