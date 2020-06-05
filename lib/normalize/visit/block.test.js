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

const match = (block1, block2) => {
  const result = Test._match_block(block1, block2);
  if (typeof result === "string") {
    console.dir(block1, {__proto__:null, depth:1/0});
    console.dir(block2, {__proto__:null, depth:1/0});
    Assert.fail(result);
  }
}

State._run_session({nodes:[], serials:new Map(), evals:{__proto__:null}}, [], () => {
  match(
    Block.PROGRAM(
      Acorn.parse(`123; debugger;`).body,
      Scope._make_root()),
    Test.PARSE(`{
      let _completion, $this;
      $this = void 0;
      _completion = void 0;
      _completion = 123;
      debugger;
      return _completion; }`));
  match(
    Block.PROGRAM(
      Acorn.parse(`123;`).body,
      Scope._make_root()),
    Test.PARSE(`{
      let $this;
      $this = void 0;
      return 123; }`));
  match(
    Block.PROGRAM(
      Acorn.parse(`let x = 123; var y = 456; 789;`).body,
      Scope._make_root()),
    Test.PARSE(`{
      let $this, $x, $y;
      $this = void 0;
      $y = void 0;
      $x = 123;
      $y = 456;
      return 789; }`));

  // console.dir(
  //   Block.REGULAR(Acorn.parse(`let x; let y;`).body, Scope._make_root(), Completion._make_program(null)),
  //   {depth:1/0});
});
