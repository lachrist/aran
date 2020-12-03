"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const ArrayLite = require("array-lite");
const Parse = require("../../parse.js");
const Tree = require("../../tree.js");
const Lang = require("../../lang/index.js");
const State = require("../state.js");
const Query = require("../query");
const Scope = require("../scope/index.js");
const Visit = require("./index.js");

Visit._test_init([
  require("./other.js"),
  require("./pattern.js"),
  require("./closure.js"),
  require("./class.js"),
  require("./expression.js"),
  require("./hoisted-statement"),
  {
    CLOSURE_BODY: (scope, node, context) => Scope.CLOSURE_BODY(scope, false, [], (scope) => {
      Assert.deepEqual(context, {bindings:[]});
      if (node.type === "BlockStatement") {
        return Tree.Bundle(ArrayLite.map(node.body, (node) => {
          Assert.deepEqual(node.type, "ExpressionStatement");
          return Tree.Lift(Visit.expression(scope, node.expression, null));
        }));
      }
      return Tree.Return(Tree.Lift(Visit.expression(scope, node, null)));
    })
  }
]);

State._run_session({nodes: [], serials: new Map(), scopes: {__proto__:null}}, () => {

  const test = (code1, code2, _node) => (
    _node = Parse.module(code1),
    Lang._match_block(
      Scope.MODULE(
        Scope._use_strict(
          Scope._make_root()),
        false,
        ArrayLite.concat(
          Query._get_closure_hoisting(_node.body),
          Query._get_block_hoisting(_node.body)),
        (scope) => Tree.Bundle(
          ArrayLite.map(
            _node.body,
            (node) => Visit.HoistedStatement(scope, node, null)))),
      Lang.PARSE_BLOCK(code2),
      Assert));

  test(
    `import "source"`,
    `{
      let _m;
      import * as _m from "source"; }`);

  test(
    `import * as m from "source"`,
    `{
      let $m;
      import * as $m from "source"; }`);

  test(
    `import def, * as m from "source";`,
    `{
      let $def, $m;
      import * as $m from "source";
      $def = #Reflect.get($m, "default"); }`);

  test(
    `import def, {foo as bar, qux as taz} from "source";`,
    `{
      let _m, $def, $bar, $taz;
      import * as _m from "source";
      $def = #Reflect.get(_m, "default");
      $bar = #Reflect.get(_m, "foo");
      $taz = #Reflect.get(_m, "qux"); }`);

  test(
    `
      import * as m from "source"`,
    `{
      let $m;
      import * as $m from "source"; }`);

  test(
    `function f () { 123; }`,
    `{
      let $f, _constructor;
      $f = void 0;
      $f = (
        _constructor = #Object.defineProperty(
          #Object.defineProperty(
            function () {
              let $f, $0newtarget, $this, $arguments;
              $f = void 0;
              $arguments = void 0;
              $f = callee;
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
              {
                123; }
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
            value: "f",
            writable: false,
            enumerable: false,
            configurable: true}),
        #Object.defineProperty(
          _constructor,
          "prototype",
          {
            __proto__: null,
            value: #Object.defineProperty(
              {__proto__:#Object.prototype},
              "constructor",
              {
                __proto__: null,
                value: _constructor,
                writable: true,
                enumerable: false,
                configurable: true}),
            writable: true,
            enumerable: false,
            configurable: false}));}`);

});
