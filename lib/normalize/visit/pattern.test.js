"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Acorn = require("acorn");
const Test = require("../../test/index.js");
const State = require("../state.js");
const Scope = require("../scope/index.js");
const Tree = require("../tree.js");
const Pattern = require("./pattern.js");

State._run_session({nodes: [], serials: new Map(), evals: {__proto__:null}}, [], () => {
  debugger;
  Test._match_block(Scope.EXTEND_STATIC(Scope._make_root(), {__proto__:null, x:true}, (scope) => {
    const assignment = Acorn.parse(`x = 123;`).body[0].expression;
    return Tree.Lift(
      Pattern.initialize(
        assignment.left,
        assignment.right,
        scope));
  }), Test.PARSE(`{
    let x, $this;
    $this = #global;
    x = 12334;
  }`));
});