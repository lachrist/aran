"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

require("../tree.js")._toggle_debug_mode();
const Acorn = require("acorn");
const Block = require("./block.js");
const Lang = require("../../lang/index.js");
const State = require("../state.js");
const Scope = require("../scope/index.js");
const Completion = require("../completion.js");
const Tree = require("../tree.js");

State._run_session({nodes:[], serials:new Map(), evals:{__proto__:null}}, [], () => {
  Assert.throws(
    () => Block.REGULAR(
      Scope._make_root(),
      Acorn.parse(`async () => {};`).body,
      Completion._make_program(null)),
    new Error("Unfortunately, Aran does not yet support asynchronous arrows."));
  // Arrow: Name + UseStrict //
  Lang._match_block(
    Block.REGULAR(
      Scope._make_root(),
      Acorn.parse(`let f = (x1, x2) => {
        "use strict";
        let y2 = 123;
        return 456;
        var y1 = 789; };`).body,
      Completion._make_program(null)),
    Lang.PARSE_BLOCK(`{
      let f;
      f = #Object.defineProperty(
        #Object.defineProperty(
          () => {
            let x1, x2;
            x1 = #Reflect.get(ARGUMENTS, 0);
            x2 = #Reflect.get(ARGUMENTS, 1);
            {
              let y1, y2;
              y1 = void 0;
              "use strict";
              y2 = 123;
              return 456;
              y1 = 789; }
            return void 0; },
          "length",
          {
            __proto__: null,
            value: 2,
            configurable: true}),
        "name",
        {
          __proto__: null,
          value: "f",
          configurable: true});}`),
    Assert);
  // Arrow: RestElement + ExpressionBody //
  Lang._match_block(
    Block.REGULAR(
      Scope._make_root(),
      Acorn.parse(`(x1, x2, ...xs) => 123;`).body,
      Completion._make_program(null)),
    Lang.PARSE_BLOCK(`{
      #Object.defineProperty(
        #Object.defineProperty(
          () => {
            let x1, x2, xs;
            x1 = #Reflect.get(ARGUMENTS, 0);
            x2 = #Reflect.get(ARGUMENTS, 1);
            xs = #Array.prototype.slice(@ARGUMENTS, 2);
            return 123;},
          "length",
          {
            __proto__: null,
            value: 2,
            configurable: true}),
        "name",
        {
          __proto__: null,
          value: "",
          configurable: true});}`),
    Assert);
  // Arrow: Eval //
  Lang._match_block(
    Block.REGULAR(
      Scope._make_root(),
      Acorn.parse(`() => (eval("var x = 123;"), x)`).body,
      Completion._make_program(null)),
    Lang.PARSE_BLOCK(`{
      #Object.defineProperty(
        #Object.defineProperty(
          () => {
            let _frame;
            _frame = {__proto__:null};
            return (
              eval(§_frame, "var x = 123;"),
              (
                #Reflect.has(_frame, "x") ?
                #Reflect.get(_frame, "x") :
                (
                  #Reflect.has(#global, "x") ?
                  #Reflect.get(_frame, "x") :
                  throw new #ReferenceError("x is not defined"))));},
          "length",
          {
            __proto__: null,
            value: 2,
            configurable: true}),
        "name",
        {
          __proto__: null,
          value: "",
          configurable: true});}`),
    Assert);
});