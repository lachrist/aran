"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js").toggleDebugMode();

const ArrayLite = require("array-lite");
const ParseExternal = require("../../parse-external.js");
const Tree = require("../../tree.js");
const Lang = require("../../lang/index.js");
const State = require("../state.js");
const Query = require("../query");
const Scope = require("../scope/index.js");
const Visit = require("./index.js");

Visit.initializeTest([
  require("./other.js"),
  require("./pattern.js"),
  require("./closure.js"),
  require("./class.js"),
  require("./expression.js"),
  require("./link-statement.js"),
  require("./hoisted-statement.js"),
  {
    visitClosureBody: (scope, node, context) => Scope.makeBodyClosureBlock(scope, false, [], (scope) => {
      Assert.deepEqual(context, {bindings:[]});
      if (node.type === "BlockStatement") {
        return Tree.ListStatement(ArrayLite.concat(ArrayLite.map(node.body, (node) => {
          Assert.deepEqual(node.type, "ExpressionStatement");
          return Tree.ExpressionStatement(Visit.visitExpression(scope, node.expression, null));
        }), [Tree.CompletionStatement(Tree.PrimitiveExpression(void 0))]));
      }
      return Tree.CompletionStatement(Tree.ExpressionStatement(Visit.visitExpression(scope, node, null)));
    })
  }
]);

State.runSession({nodes: [], serials: new Map(), evals: {__proto__:null}}, () => {

  const test = (node, block) => Lang.match(
    Scope.makeModuleBlock(
      Scope.StrictBindingScope(
        Scope.RootScope()),
      ArrayLite.concat(
        ArrayLite.flatMap(node.body, Query.getDeepHoisting),
        ArrayLite.flatMap(node.body, Query.getShallowHoisting)),
      (scope) => Tree.ListStatement(
        ArrayLite.concat(
          ArrayLite.map(
            node.body,
            (node) => Visit.visitHoistedStatement(scope, node, null)),
          [
            Tree.CompletionStatement(
              Tree.PrimitiveExpression(void 0))]))),
    block,
    Assert);

  test(
    ParseExternal(`k: l: function f () { 123; };`),
    Lang.parseBlock(`{
      let $f, _prototype;
      $f = void 0;
      $f = (
        _prototype = {__proto__:#Object.prototype},
        ${Lang.generate(
          Visit.visitClosure(
            Scope.RootScope({strict:true}),
            ParseExternal(`(function f () { 123; });`).body[0].expression,
            {prototype:Scope.TestBox("_prototype")}))});
      completion void 0; }`));

  test(
    ParseExternal(`export default function f () { 123; };`, {source:"module"}),
    Lang.parseBlock(`{
      let $f, _prototype;
      (
        $f = void 0,
        export default $f);
      (
        $f = (
          _prototype = {__proto__:#Object.prototype},
          ${Lang.generate(
            Visit.visitClosure(
              Scope.RootScope({strict:true}),
              ParseExternal(`(function f () { 123; });`).body[0].expression,
              {prototype:Scope.TestBox("_prototype")}))}),
        export default $f);
      completion void 0; }`));

  test(
    ParseExternal(`export default function () { 123; };`, {source:"module"}),
    Lang.parseBlock(`{ completion void 0; }`));

  test(
    ParseExternal(`export default 123;`, {source:"module"}),
    Lang.parseBlock(`{ completion void 0; }`));

  test(
    ParseExternal(`export function f () { 123; };`, {source:"module"}),
    Lang.parseBlock(`{
      let $f, _prototype;
      (
        $f = void 0,
        export f $f);
      (
        $f = (
          _prototype = {__proto__:#Object.prototype},
          ${Lang.generate(
            Visit.visitClosure(
              Scope.RootScope({strict:true}),
              ParseExternal(`(function f () { 123; });`).body[0].expression,
              {prototype:Scope.TestBox("_prototype")}))}),
        export f $f);
      completion void 0; }`));

  test(
    ParseExternal(`export {exported as local} from "source";`, {source:"module"}),
    Lang.parseBlock(`{ completion void 0; }`));

});
