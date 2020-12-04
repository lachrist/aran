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
  require("./hoisted-statement.js"),
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
      let $f, _prototype;
      $f = void 0;
      $f = (
        _prototype = {__proto__:#Object.prototype},
        ${Lang._generate_expression(
          Visit.closure(
            Scope._make_test_root({strict:true}),
            Parse.script(`(function f () { 123; });`).body[0].expression,
            {prototype:Scope._test_box("_prototype")}))}); }`);

});
