"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js").toggleDebugMode();

const ParseExternal = require("../../parse-external.js");
const Lang = require("../../lang");
const Tree = require("../tree.js");
const State = require("../state.js");
const Scope = require("../scope/index.js");
const Visit = require("./index.js");

Visit.initializeTest([
  require("./other.js"),
  require("./pattern.js"),
  {
    visitExpression: (scope, expression, context) => {
      Assert.deepEqual(context, null);
      if (expression.type === "Literal") {
        return Tree.PrimitiveExpression(expression.value);
      }
      if (expression.type === "CallExpression" && expression.callee.type === "Literal" && expression.arguments.length === 0) {
        return Tree.ApplyExpression(Tree.PrimitiveExpression(expression.callee.value), Tree.PrimitiveExpression(void 0), []);
      }
      throw new global.Error("Unexpected expression");
    }
  }
]);

const obj = (code) => `(
  (
    (${code} === null) ?
    true :
    (${code} === void 0)) ?
  ${code} :
  #Object(${code}))`;

State.runSession({nodes: [], serials: new Map(), scopes: {__proto__:null}}, () => {
  const test = (strict, variables, context, code1, code2) => Lang.match(
    Scope.makeModuleBlock(
      Scope.RootScope(),
      variables,
      (scope) => (
        (
          (node) => Tree.ListStatement(
            [
              (
                context.surrounding === "statement" ?
                node :
                Tree.ExpressionStatement(node)),
              Tree.CompletionStatement(
                Tree.PrimitiveExpression(void 0))]))
        (
          Visit.visitPattern(
            (
              strict ?
              Scope.StrictBindingScope(scope) :
              scope),
            (
              typeof code1 === "string" ?
              ParseExternal(`([${code1}] = null);`).body[0].expression.left.elements[0] :
              code1),
            (
              (
                typeof context.expression === "string" ?
                context.expression = Lang.parseExpression(context.expression) :
                null),
              context))))),
    Lang.parseBlock(code2),
    Assert);
  // CallExpression //
  test(
    true,
    [],
    {
      kind: null,
      surrounding: "statement",
      expression: `456`},
    {
      type: "CallExpression",
      callee: {
        type: "Literal",
        value: 123},
      arguments: []},
    `
      {
        456;
        123();
        throw new #ReferenceError("Cannot assign to call expression");
        completion void 0; }`);
  // Identifier >> Initialize //
  test(
    true,
    [
      {kind:"let", name:"x", ghost:false, exports:[]}],
    {
      kind: "let",
      surrounding: "statement",
      expression: `123`},
    `x`,
    `
      {
        let $x;
        $x = 123;
        completion void 0; }`);
  // Identifier >> Assign (Statement) //
  test(
    true,
    [
      {kind:"var", name:"x", ghost:false, exports:[]}],
    {
      kind: null,
      surrounding: "statement",
      expression: `123`},
    `x`,
    `
      {
        let $x;
        $x = void 0;
        $x = 123;
        completion void 0; }`);
  // Identifier >> Assign (Expression) //
  test(
    true,
    [
      {kind:"var", name:"x", ghost:false, exports:[]}],
    {
      kind: null,
      surrounding: "expression",
      expression: `123`},
    `x`,
    `
      {
        let $x;
        $x = void 0;
        $x = 123;
        completion void 0; }`);
  // MemberExpression >> Normal //
  test(
    false,
    [],
    {
      kind: null,
      surrounding: "statement",
      expression: `456`},
    `(123).foo`,
    `
      {
        #Reflect.set(${obj(`123`)}, "foo", 456);
        completion void 0; }`);
  test(
    false,
    [],
    {
      kind: null,
      surrounding: "statement",
      expression: `456`},
    `(123)["foo"]`,
    `
      {
        #Reflect.set(${obj(`123`)}, "foo", 456);
        completion void 0; }`);
  // MemberExpression >> Strict //
  test(
    true,
    [],
    {
      kind: null,
      surrounding: "statement",
      expression: `456`},
    `(123).foo`,
    `
      {
        (
          #Reflect.set(123, "foo", 456) ?
          true :
          throw new #TypeError("Cannot set object property"));
        completion void 0; }`);
  test(
    true,
    [],
    {
      kind: null,
      surrounding: "statement",
      expression: `456`},
    `(123)["foo"]`,
    `
      {
        (
          #Reflect.set(123, "foo", 456) ?
          true :
          throw new #TypeError("Cannot set object property"));
        completion void 0; }`);
  // AssignmentPattern //
  test(
    true,
    [
      {kind:"var", name:"x", ghost:false, exports:[]}],
    {
      kind: null,
      surrounding: "statement",
      expression: `456`},
    `x = 123`,
    `{
      let $x;
      $x = void 0;
      $x = (
        (456 === void 0) ?
        123 :
        456);
      completion void 0; }`);
  // ObjectPattern >> without RestElement //
  test(
    true,
    [
      {kind:"var", name:"x", ghost:false, exports:[]},
      {kind:"var", name:"y", ghost:false, exports:[]}],
    {
      kind: null,
      surrounding: "statement",
      expression: `123`},
    `{foo:x, bar:y}`,
    `{
      let $x, $y, _right;
      $x = void 0;
      $y = void 0;
      _right = (
        (
          (123 === null) ?
          true :
          (123 === void 0)) ?
        throw new #TypeError("Cannot destructure 'undefined' or 'null'") :
        #Object(123));
      $x = #Reflect.get(_right, "foo");
      $y = #Reflect.get(_right, "bar");
      completion void 0; }`);
  // ObjectPattern >> with RestElement //
  test(
    true,
    [
      {kind:"var", name:"x", ghost:false, exports:[]},
      {kind:"var", name:"y", ghost:false, exports:[]},
      {kind:"var", name:"rest", ghost:false, exports:[]}],
    {
      kind: null,
      surrounding: "statement",
      expression: `123`},
    `{foo:x, ["bar"]:y, ...rest}`,
    `{
      let $x, $y, $rest, _right, _rest;
      $x = void 0;
      $y = void 0;
      $rest = void 0;
      _right = (
        (
          (123 === null) ?
          true :
          (123 === void 0)) ?
        throw new #TypeError("Cannot destructure 'undefined' or 'null'") :
        #Object(123));
      $x = #Reflect.get(_right, "foo");
      $y = #Reflect.get(_right, "bar");
      $rest = (
        _rest = #Object.assign({__proto__:#Object.prototype}, _right),
        (
          #Reflect.deleteProperty(_rest, "foo"),
          (
            #Reflect.deleteProperty(_rest, "bar"),
            _rest)));
      completion void 0; }`);
  // ArrayPattern >> with rest >> statement //
  test(
    true,
    [
      {kind:"var", name:"x", ghost:false, exports:[]},
      {kind:"var", name:"y", ghost:false, exports:[]},
      {kind:"var", name:"rest", ghost:false, exports:[]}],
    {
      kind: null,
      surrounding: "statement",
      expression: `123`},
    `[x, y,, ... rest]`,
    `{
      let $x, $y, $rest, _iterator;
      $x = void 0;
      $y = void 0;
      $rest = void 0;
      _iterator = (
        #Reflect.get(${obj(123)}, #Symbol.iterator)
        (@123));
      $x = #Reflect.get(
        #Reflect.get(_iterator, "next")(@_iterator),
        "value");
      $y = #Reflect.get(
        #Reflect.get(_iterator, "next")(@_iterator),
        "value");
      #Reflect.get(_iterator, "next")(@_iterator);
      $rest = #Array.from(
        {
          __proto__:null,
          [#Symbol.iterator]: arrow () {
            completion _iterator;}});
      completion void 0; }`);
  // ArrayPattern >> with rest >> expression //
  test(
    true,
    [
      {kind:"var", name:"x", ghost:false, exports:[]},
      {kind:"var", name:"y", ghost:false, exports:[]},
      {kind:"var", name:"rest", ghost:false, exports:[]}],
    {
      kind: null,
      surrounding: "expression",
      expression: `123`},
    `[x,, y]`,
    `{
      let $x, $y, $rest, _iterator;
      $x = void 0;
      $y = void 0;
      $rest = void 0;
      (
        _iterator = (
          #Reflect.get(${obj(123)}, #Symbol.iterator)
          (@123)),
        (
          $x = #Reflect.get(
            #Reflect.get(_iterator, "next")(@_iterator),
            "value"),
          (
            #Reflect.get(_iterator, "next")(@_iterator),
            (
              $y = #Reflect.get(
                #Reflect.get(_iterator, "next")(@_iterator),
                "value"),
              void 0))));
      completion void 0; }`);
}, []);
