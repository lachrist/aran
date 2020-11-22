"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../../tree.js")._toggle_debug_mode();

const Acorn = require("acorn");
const Tree = require("../../tree.js");
const Lang = require("../../../lang");
const State = require("../../state.js");
const Scope = require("../../scope/index.js");
const Assign = require("./assign.js");

const parse = (code) => Acorn.parse(
  code,
  {
    __proto__: null,
    ecmaVersion: 2020});

const ROOT_SCOPE = null;

const obj = (code) => `(
  (
    (${code} === null) ?
    true :
    (${code} === void 0)) ?
  ${code} :
  #Object(${code}))`;

const Expression = {
  _default_context: "foobar",
  visit: (scope, expression, context) => {
    Assert.deepEqual(context, "foobar");
    if (expression.type === "Literal") {
      return Tree.primitive(expression.value);
    }
    if (expression.type === "CallExpression" && expression.callee.type === "Literal" && expression.arguments.length === 0) {
      return Tree.primitive(expression.callee.value);
    }
    throw new global.Error("Unexpected expression");
  }
};

Assign._resolve_circular_dependencies(Expression);

State._run_session({nodes: [], serials: new Map(), scopes: {__proto__:null}}, [], () => {
  const test = (strict, variables, kind, code1, code2, code3) => Lang._match_block(
    Scope.MODULE(
      false,
      variables,
      (scope) => Tree.Lift(
        Assign.assign(
          (
            strict ?
            Scope._use_strict(scope) :
            scope),
          kind,
          (
            typeof code1 === "string" ?
            parse(`([${code1}] = null);`).body[0].expression.left.elements[0] :
            code1),
          Lang.parse_expression(code2)))),
    Lang.PARSE_BLOCK(code3),
    Assert);
  // CallExpression //
  test(
    true,
    [],
    null,
    {
      type: "CallExpression",
      callee: {
        type: "Literal",
        value: 123},
      arguments: []},
    `456`,
    `
      {
        (
          123,
          (
            throw new #ReferenceError("Cannot assign to call expression"),
            456)); }`);
  // Identifier >> Initialize //
  test(
    true,
    [
      {kind:"let", name:"x"}],
    `let`,
    `x`,
    `123`,
    `
      {
        let $$x;
        $$x = 123;}`);
  // Identifier >> Assign //
  test(
    true,
    [
      {kind:"var", name:"x"}],
    null,
    `x`,
    `123`,
    `
      {
        let $$x;
        $$x = void 0;
        $$x = 123;}`);
  // MemberExpression >> Normal //
  test(
    false,
    [],
    null,
    `(123).foo`,
    `456`,
    `
      {
        #Reflect.set(${obj(`123`)}, "foo", 456); }`);
  test(
    false,
    [],
    null,
    `(123)["foo"]`,
    `456`,
    `
      {
        #Reflect.set(${obj(`123`)}, "foo", 456); }`);
  // MemberExpression >> Strict //
  test(
    true,
    [],
    null,
    `(123).foo`,
    `456`,
    `
      {
        (
          #Reflect.set(123, "foo", 456) ?
          true :
          throw new #TypeError("Cannot set object property")); }`);
  test(
    true,
    [],
    null,
    `(123)["foo"]`,
    `456`,
    `
      {
        (
          #Reflect.set(123, "foo", 456) ?
          true :
          throw new #TypeError("Cannot set object property")); }`);
  // AssignmentPattern //
  test(
    true,
    [
      {kind:"var", name:"x"}],
    null,
    `x = 123`,
    `456`,
    `{
      let $$x;
      $$x = void 0;
      $$x = (
        (456 === void 0) ?
        123 :
        456);}`);
  // ObjectPattern >> without RestElement //
  test(
    true,
    [
      {kind:"var", name:"x"},
      {kind:"var", name:"y"}],
    null,
    `{foo:x, ["bar"]:y}`,
    `123`,
    `{
      let $$x, $$y;
      $$x = void 0;
      $$y = void 0;
      (
        (
          (123 === null) ?
          true :
          (123 === void 0)) ?
        throw new #TypeError("Cannot destructure 'undefined' or 'null'") :
        (
          (
            void 0,
            $$x = #Reflect.get(#Object(123), "foo")),
          $$y = #Reflect.get(#Object(123), "bar")));}`);
  // ObjectPattern >> with RestElement //
  test(
    true,
    [
      {kind:"var", name:"x"},
      {kind:"var", name:"y"},
      {kind:"var", name:"rest"}],
    null,
    `{foo:x, ["bar"]:y, ...rest}`,
    `123`,
    `{
      let $$x, $$y, $$rest, $_rest;
      $$x = void 0;
      $$y = void 0;
      $$rest = void 0;
      (
        (
          (123 === null) ?
          true :
          (123 === void 0)) ?
        throw new #TypeError("Cannot destructure 'undefined' or 'null'") :
        (
          $$x = #Reflect.get(#Object(123), "foo"),
          (
            $$y = #Reflect.get(#Object(123), "bar"),
            (
              $_rest = #Object.assign({__proto__:#Object.prototype}, 123),
              (
                (
                  (
                    void 0,
                    #Reflect.deleteProperty($_rest, "foo")),
                  #Reflect.deleteProperty($_rest, "bar")),
                $$rest = $_rest)))));}`);
  // ArrayPattern //
  test(
    true,
    [
      {kind:"var", name:"x"},
      {kind:"var", name:"y"},
      {kind:"var", name:"rest"}],
    null,
    `[x, y, ... rest]`,
    `123`,
    `{
      let $$x, $$y, $$rest, $_iterator;
      $$x = void 0;
      $$y = void 0;
      $$rest = void 0;
      (
        $_iterator = (
          #Reflect.get(${obj(123)}, #Symbol.iterator)
          (@123)),
        (
          (
            (
              void 0,
              $$x = #Reflect.get(
                #Reflect.get($_iterator, "next")(@$_iterator),
                "value")),
            $$y = #Reflect.get(
              #Reflect.get($_iterator, "next")(@$_iterator),
              "value")),
          $$rest = #Array.from(
            {
              __proto__:null,
              [#Symbol.iterator]: () => {
                {
                  return $_iterator;}}})));}`);
});
