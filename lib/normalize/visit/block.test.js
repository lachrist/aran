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

const check = (result) => {
  if (typeof result === "string") {
    Assert.fail(result);
  }
}

State._run_session({nodes:[], serials:new Map(), evals:{__proto__:null}}, [], () => {
  check(
    Test._match_block(
      Block.PROGRAM(
        Acorn.parse(`123; debugger;`).body,
        Scope._make_root()),
      Test.PARSE(`{
        let _completion, $this;
        $this = void 0;
        _completion = void 0;
        _completion = 1234;
        debugger;
        return _completion; }`)));

  // console.dir(
  //   Block.REGULAR(Acorn.parse(`let x; let y;`).body, Scope._make_root(), Completion._make_program(null)),
  //   {depth:1/0});
});
