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
  // Switch //
  Lang._match_block(
    Scope.EXTEND_STATIC(
      Scope._make_root(),
      {__proto__:null},
      (scope) => Scope.Box(
        scope,
        "completion",
        true,
        Tree.primitive(123),
        (completion_box) =>  Scope.Box(
          scope,
          "discriminant",
          false,
          Tree.unary(
            "!",
            Tree.primitive(456)),
          (discriminant_box) => Scope.Box(
            scope,
            "matched",
            true,
            Tree.primitive(789),
            (matched_box) => Tree.Lone(
              [],
              Block.SWITCH(
                scope,
                Acorn.parse(`
                  switch (DISCARDED) {
                    case "foo":
                      let x = "x-value";
                      "bar";
                    default:
                      x;
                      let y = "y-value";
                      "qux";}`).body[0].cases,
                  Completion._make_program(completion_box),
                  discriminant_box,
                  matched_box)))))),
    Lang.PARSE_BLOCK(
      `{
        let _completion, _discriminant, _matched;
        _completion = 123;
        _discriminant = ! 456;
        _matched = 789;
        {
          let _x, $x, _y, $y;
          _x = false;
          _y = false;
          if
            (
              (
                _matched ?
                true :
                (
                  (_discriminant === "foo") ?
                  (
                    _matched = true,
                    true) :
                  false)))
            /* then */ {
              (
                $x = "x-value",
                _x = true);
              _completion = "bar";}
            else {}
          {
            _matched = true;
            (
              _x ?
              $x :
              throw new #ReferenceError("Cannot access 'x' before initialization"));
            (
              $y = "y-value",
              _y = true);
            _completion = "qux";}}}`),
    Assert);

});
