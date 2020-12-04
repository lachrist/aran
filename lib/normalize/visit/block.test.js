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

const make_normalized_function_expression = (constructor, name, body) => `(
  ${constructor} = #Object.defineProperty(
    #Object.defineProperty(
      function () {
        let $${name}, $0newtarget, $this, $arguments;
        $${name} = void 0;
        $arguments = void 0;
        $${name} = callee;
        $0newtarget = new.target;
        $this = (
          new.target  ?
          {__proto__: #Reflect.get(new.target, "prototype")} :
          this);
        $arguments = #Object.assign(
          #Object.defineProperty(
            #Object.defineProperty(
              #Object.defineProperty(
                {__proto__:#Object.prototype},
                "length",
                {
                  __proto__: null,
                  value: #Reflect.get(arguments, "length"),
                  writable: true,
                  enumerable: false,
                  configurable: true}),
              "callee",
              {
                __proto__: null,
                get: #Function.prototype.arguments.__get__,
                set: #Function.prototype.arguments.__set__,
                enumerable: false,
                configurable: false}),
            #Symbol.iterator,
            {
              __proto__: null,
              value: #Array.prototype.values,
              writable: true,
              enumerable: false,
              configurable: true}),
          arguments);
        ${body}
        return ($0newtarget ? $this : void 0); },
      "length",
      {
        __proto__: null,
        value: 0,
        writable: false,
        enumerable: false,
        configurable: true}),
    "name",
    {
      __proto__: null,
      value: "${name}",
      writable: false,
      enumerable: false,
      configurable: true}),
  #Object.defineProperty(
    ${constructor},
    "prototype",
    {
      __proto__: null,
      value: #Object.defineProperty(
        {__proto__:#Object.prototype},
        "constructor",
        {
          __proto__: null,
          value: ${constructor},
          writable: true,
          enumerable: false,
          configurable: true}),
      writable: true,
      enumerable: false,
      configurable: false}))`;

State._run_session({nodes:[], serials:new Map(), scopes:{__proto__:null}}, () => {

  // PROGRAM >> Module //
  Lang._match_block(
    Visit.PROGRAM(
      Scope._make_root(),
      Parse.module(`
        789;
        export function f () { 123; };
        import * as i from "source";`),
      {source:"module"}),
    Lang.PARSE_BLOCK(`{
      let $f, $i, _constructor;
      $f = void 0;
      $f = ${make_normalized_function_expression("_constructor", "f", `{ 123; }`)};
      import * as $i from "source";
      789;
      export f $f; }`),
    Assert);
  // PROGRAM >> Eval //
  Lang._match_block(
    Visit.PROGRAM(
      Scope._use_strict(
        Scope._make_root()),
      Parse.script(`
        123;
        foo: bar: function f () { 456; };
        789;`),
      {source:"eval"}),
    Lang.PARSE_BLOCK(`{
      let $f, _constructor;
      $f = void 0;
      $f = ${make_normalized_function_expression("_constructor", "f", `{ 456; }`)};
      123;
      return 789; }`),
    Assert);
  // PROGRAM >> Script //
  Lang._match_block(
    Visit.PROGRAM(
      Scope._make_root(),
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

  Lang._match_block(
    Visit.PROGRAM(
      Scope._use_strict(
        Scope._make_root()),
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
          let $x, _x, _constructor;
          _x = false;
          $f = ${make_normalized_function_expression("_constructor", "f", `{ 5; }`)};
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
