"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const Parse = require("../../parse.js");
const Lang = require("../../lang");
const Tree = require("../tree.js");
const State = require("../state.js");
const Scope = require("../scope/index.js");
const Visit = require("./index.js");

Visit._test_init([
  require("./other.js"),
  require("./pattern.js"),
  {
    expression: (scope, expression, context) => {
      Assert.deepEqual(context, null);
      if (expression.type === "Literal") {
        return Tree.primitive(expression.value);
      }
      if (expression.type === "CallExpression" && expression.callee.type === "Literal" && expression.arguments.length === 0) {
        return Tree.primitive(expression.callee.value);
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

State._run_session({nodes: [], serials: new Map(), scopes: {__proto__:null}}, () => {
  const test = (strict, variables, kind, code1, code2, code3) => Lang._match(
    Scope.MODULE(
      Scope._make_root(),
      variables,
      (scope) => Tree.Lift(
        Visit.pattern(
          (
            strict ?
            Scope._use_strict(scope) :
            scope),
          (
            typeof code1 === "string" ?
            Parse.script(`([${code1}] = null);`).body[0].expression.left.elements[0] :
            code1),
          {
            kind: kind,
            expression: Lang.parse_expression(code2)}))),
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
      {kind:"let", name:"x", ghost:false, exports:[]}],
    "let",
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
      {kind:"var", name:"x", ghost:false, exports:[]}],
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
      {kind:"var", name:"x", ghost:false, exports:[]}],
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
      {kind:"var", name:"x", ghost:false, exports:[]},
      {kind:"var", name:"y", ghost:false, exports:[]}],
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
      {kind:"var", name:"x", ghost:false, exports:[]},
      {kind:"var", name:"y", ghost:false, exports:[]},
      {kind:"var", name:"rest", ghost:false, exports:[]}],
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
              $$rest = (
                $_rest = #Object.assign({__proto__:#Object.prototype}, 123),
                (
                  (
                    (
                      void 0,
                      #Reflect.deleteProperty($_rest, "foo")),
                    #Reflect.deleteProperty($_rest, "bar")),
                  $_rest))))));}`);
  // ArrayPattern //
  test(
    true,
    [
      {kind:"var", name:"x", ghost:false, exports:[]},
      {kind:"var", name:"y", ghost:false, exports:[]},
      {kind:"var", name:"rest", ghost:false, exports:[]}],
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
                return $_iterator;}})));}`);
}, []);
