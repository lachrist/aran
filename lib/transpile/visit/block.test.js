"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const Parse = require("../../parse.js");
const Tree = require("../../tree.js");
const Lang = require("../../lang");
const State = require("../state.js");
const Completion = require("../completion.js");
const Scope = require("../scope");
const Visit = require("./index.js");

Visit._test_init(
  [
    require("./other.js"),
    require("./pattern.js"),
    require("./closure.js"),
    require("./class.js"),
    require("./expression.js"),
    require("./hoisted-statement.js"),
    require("./statement.js"),
    require("./block.js")]);

State._run_session({nodes:[], serials:new Map(), scopes:{__proto__:null}}, () => {

  // PROGRAM >> Module //
  Lang._match_block(
    Visit.PROGRAM(
      Scope._make_test_root({strict:true}),
      Parse.module(`
        789;
        export function f () { 123; };
        import * as i from "source";`),
      {source:"module"}),
    Lang.PARSE_BLOCK(`{
      let $f, $i, _prototype;
      $f = void 0;
      $f = (
        _prototype = {__proto__:#Object.prototype},
        ${Lang._generate_expression(
          Visit.closure(
            Scope._make_test_root({strict:true}),
            Parse.script(`(function f () { 123; })`).body[0].expression,
            {prototype:Scope._test_box("_prototype")}))});
      $i = import "source";
      789;
      export f $f; }`),
    Assert);

  // PROGRAM >> Eval //
  Lang._match_block(
    Visit.PROGRAM(
      Scope._make_test_root({strict:true}),
      Parse.script(`
        123;
        foo: bar: function f () { 456; };
        789;`),
      {source:"eval"}),
    Lang.PARSE_BLOCK(`{
      let $f, _prototype;
      $f = void 0;
      $f = (
        _prototype = {__proto__:#Object.prototype},
        ${Lang._generate_expression(
          Visit.closure(
            Scope._make_test_root({strict:true}),
            Parse.script(`(function f () { 456; })`).body[0].expression,
            {prototype:Scope._test_box("_prototype")}))});
      123;
      return 789; }`),
    Assert);

  // PROGRAM >> Script //
  Lang._match_block(
    Visit.PROGRAM(
      Scope._make_test_root(),
      Parse.script(`
        "use strict";
        123;
        debugger;`),
      {source:"script"}),
    Lang.PARSE_BLOCK(`{
      let _completion;
      _completion = void 0;
      "use strict";
      _completion = 123;
      debugger;
      return _completion; }`),
    Assert);

  // BLOCK >> node.type === BlockStatement && Hoisting //
  Lang._match_block(
    Visit.PROGRAM(
      Scope._make_test_root({strict:true}),
      Parse.script(`{
        123;
        function f () { 456; } }`),
      {source:"eval"}),
    Lang.PARSE_BLOCK(`{
      let _completion, $f;
      _completion = void 0;
      $f = void 0;
      {
        let _prototype;
        $f = (
          _prototype = {__proto__:#Object.prototype},
          ${Lang._generate_expression(
            Visit.closure(
              Scope._make_test_root({strict:true}),
              Parse.script(`(function f () { 456; })`).body[0].expression,
              {prototype:Scope._test_box("_prototype")}))});
        _completion = 123; }
      return _completion; }`),
    Assert);

  // BLOCK >> node.type !== BlockStatement && context.with !== null //
  Lang._match_block(
    Visit.PROGRAM(
      Scope._make_test_root(),
      Parse.script(`with (123) 456;`),
      {source:"script"}),
    Lang.PARSE_BLOCK(`{
      let _completion, _frame;
      _completion = void 0;
      _completion = void 0;
      _frame = 123;
      _frame = (
        (
          (_frame === null) ?
          true :
          (_frame === void 0)) ?
        throw new #TypeError("Cannot convert undefined or null to object") :
        #Object(_frame));
      {
        _completion = 456; }
      return _completion; }`),
    Assert);

  // BLOCK >> reset === true //
  Lang._match_block(
    Visit.PROGRAM(
      Scope._make_test_root(),
      Parse.script(`try { 123; } catch { 456; }`),
      {source:"script"}),
    Lang.PARSE_BLOCK(`{
      let _completion;
      _completion = void 0;
      _completion = void 0;
      try {
        _completion = 123; }
      catch {
        _completion = void 0;
        _completion = 456; }
      finally {}
      return _completion; }`),
    Assert);

  // CLOSURE_BODY >> node.type !== "BlockStatement" //
  Lang._match_block(
    Visit.CLOSURE_BODY(
      Scope._make_test_root(),
      Parse.script(`123;`).body[0].expression,
      {bindings:[]}),
    Lang.PARSE_BLOCK(`{
      return 123; }`),
    Assert);

  // CLOSURE_BODY >> dynamic //
    Lang._match_block(
      Visit.CLOSURE_BODY(
        Scope._make_test_root(),
        Parse.script(`eval(123);`).body[0].expression,
        {bindings:[]}),
      Lang.PARSE_BLOCK(`{
        let _frame, _eval;
        _frame = {__proto__:null};
        return (
          _eval = (
            #Reflect.has(_frame, "eval") ?
            #Reflect.get(_frame, "eval") :
             throw new #ReferenceError("Cannot read from missing variable eval")),
          (
            (_eval === #eval) ?
            eval(123) :
            _eval(123))); }`),
      Assert);

  // CLOSURE_BODY >> bindings //
    Lang._match_block(
      Visit.CLOSURE_BODY(
        Scope._make_test_root(),
        Parse.script(`{ var x = 123, y = 456; function f () { 789 } }`).body[0],
        {
          bindings: [
            {
              identifier: "x",
              box: Scope._primitive_box("x-value")},
            {
              identifier: "y",
              box: Scope._primitive_box("y-value")}]}),
      Lang.PARSE_BLOCK(`{
        let $x, $y, $f, _prototype;
        $x = void 0;
        $y = void 0;
        $f = void 0;
        $x = "x-value";
        $y = "y-value";
        $f = (
          _prototype = {__proto__:#Object.prototype},
          ${Lang._generate_expression(
            Visit.closure(
              Scope._make_test_root(),
              Parse.script(`(function f () { 789; })`).body[0].expression,
              {prototype:Scope._test_box("_prototype")}))});
        $x = 123;
        $y = 456; }`),
      Assert);

  // SWITCH //
  Lang._match_block(
    Visit.PROGRAM(
      Scope._make_test_root({strict:true}),
      Parse.script(
        `
          switch (!1) {
            case 2:
              3;
              let x = 4;
              function f () { 5; }
            default:
              x;
              6; }`),
      {source:"eval"}),
    Lang.PARSE_BLOCK(
      `{
        let $f, _completion, _discriminant, _matched;
        _completion = void 0;
        $f = void 0;
        _completion = void 0;
        _discriminant = !1;
        _matched = false;
        $: {
          let $x, _x, _prototype;
          _x = false;
          $f = (
            _prototype = {__proto__:#Object.prototype},
            ${Lang._generate_expression(
              Visit.closure(
                Scope._make_test_root({strict:true}),
                Parse.script(`(function f () { 5; })`).body[0].expression,
                {prototype:Scope._test_box("_prototype")}))});
          if (
            (
              _matched ?
              true :
              (
                (_discriminant === 2) ?
                (
                  _matched = true,
                  true) :
                false)))
          {
            3;
            ($x = 4, _x = true); }
          else {}
          _matched = true;
          {
            (
              _x ?
              $x :
              throw new #ReferenceError("Cannot read from deadzone variable x"));
            _completion = 6; } }
        return _completion; }`),
    Assert);

});
