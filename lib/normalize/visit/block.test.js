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

State._run_session({nodes:[], serials:new Map(), evals:{__proto__:null}}, [], () => {
  // Regular //
  {
    const test = (scope, code1, code2) => Lang._match_block(
      Block.REGULAR(
        scope,
        Acorn.parse(code1).body,
        Completion._make_program(null)),
      Lang.PARSE_BLOCK(code2),
      Assert);
    test(
      Scope._make_root(),
      `
        let x = 123;
        456;
        let y = 789;`,
      `{
        let $x, $y;
        $x = 123;
        456;
        $y = 789;}`);}
  // Program //
  {
    const test = (scope, code1, code2) => Lang._match_block(
      Block.PROGRAM(
        scope,
        Acorn.parse(code1).body),
      Lang.PARSE_BLOCK(code2),
      Assert);
    test(
      Scope._make_root(),
      ``,
      `{
        let $this;
        $this = #global;
        return void 0;}`);
    test(
      Scope._make_root(),
      `123;`,
      `{
        let $this;
        $this = #global;
        return 123; }`);
    test(
      Scope._make_root(),
      `
        123;
        debugger;`,
      `{
        let _completion, $this;
        $this = #global;
        _completion = void 0;
        _completion = 123;
        debugger;
        return _completion; }`);
    test(
      Scope._make_eval([]),
      `123;`,
      `{
        return 123;}`);
    test(
      Scope._make_root(),
      `
        let x = 123;
        var y = 456;
        789;`,
      `{
        let $this, $x;
        $this = #global;
        #Reflect.defineProperty(
          #global,
          "y",
          {
            __proto__: null,
            value: void 0,
            writable: true,
            enumerable: true});
        $x = 123;
        #Reflect.set(#global, "y", 456);
        return 789;}`);
    test(
      Scope._extend_use_strict(
        Scope._make_root()),
      `
        let x = 123;
        var y = 456;
        789;`,
      `{
        let $this, $x, $y;
        $this = #global;
        $y = void 0;
        $x = 123;
        $y = 456;
        return 789;}`);}
    // test(
    //   Scope._extend_use_strict(
    //     Scope._make_root()),
    //   `
    //     123;
    //     function f () {}
    //     456;`,
    //   `{
    //     let $this, $f;
    //     $this = #global;
    //     $f = void 0;
    //     123;
    //     f = function () {
    //       return void 0;};
    //     $y = 456;
    //     return 789;}`);}

});
