"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Acorn = require("acorn");
const Block = require("./block.js");
const Test = require("../../test/index.js");
const State = require("../state.js");
const Scope = require("../scope/index.js");
const Completion = require("../completion.js");

const Lang = require("../lang.js");
Lang._toggle_debug_mode();

State._run_session({nodes:[], serials:new Map(), evals:{__proto__:null}}, [], () => {
  console.dir(Block.PROGRAM(
    Acorn.parse(`123; debugger;`).body,
    Scope._make_root()), {depth:1/0});

  // console.dir(
  //   Block.REGULAR(Acorn.parse(`let x; let y;`).body, Scope._make_root(), Completion._make_program(null)),
  //   {depth:1/0});
});
