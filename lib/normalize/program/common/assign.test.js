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

const obj = (code) => `(
  (
    (${code} === null) ?
    true :
    (${code} === void 0)) ?
  ${code} :
  #Object(${code}))`;

const Expression = {
  visit: (scope, expression, dropped, name) => {
    Assert.deepEqual(dropped, false);
    Assert.deepEqual(name, null);
    Assert.deepEqual(expression.type, "Literal");
    return Tree.primitive(expression.value);
  }
};

Assign._resolve_circular_dependencies(Expression);

State._run_session({nodes: [], serials: new Map(), scopes: {__proto__:null}}, [], () => {
  // Assign Identifier //
  Lang._match_block(
    Scope.EXTEND_STATIC(
      Scope._make_root(),
      {__proto__: null, x: true},
      (scope) => Tree.Bundle(
        [
          Tree.Lift(
            Scope.initialize(
              scope,
              "x",
              Lang.parse_expression(`123`))),
          Tree.Lift(
            Assign.assign(
              scope,
              parse(`x = null;`).body[0].expression.left,
              Lang.parse_expression(`456`),
              false))])),
    Lang.PARSE_BLOCK(`{
      let x;
      x = 123;
      x = 456;}`),
    Assert);
  // Initialize MemberExpression //
  Assert.throws(
    () => Scope.EXTEND_STATIC(
      Scope._make_root(),
      {__proto__:null},
      (scope) => Tree.Lift(
        Assign.assign(
          scope,
          parse(`(123).foo = null;`).body[0].expression.left,
          Lang.parse_expression(`123`),
          true))),
    new Error("Cannot initialize member expressions"));
  // Assign MemberExpression //
  [`.foo`, `["foo"]`].forEach((property) => {
    [true, false].forEach((strict) => {
      Lang._match_block(
        Scope.EXTEND_STATIC(
          (
            strict ?
            Scope._extend_use_strict(
              Scope._make_root()) :
            Scope._make_root()),
          {__proto__: null},
          (scope) => Tree.Lift(
            Assign.assign(
              scope,
              parse(`(123)${property} = null;`).body[0].expression.left,
              Lang.parse_expression(`123`),
              false))),
        Lang.PARSE_BLOCK(
          (
            strict ?
            `{
              (
                #Reflect.set(123, "foo", 123) ?
                true :
                throw new #TypeError("Cannot set object property"));}` :
            `{
              #Reflect.set(${obj(`123`)}, "foo", 123);}`)),
        Assert)})});
  // Initialize //
  const test = (hoisting, code1, code2, code3) => Lang._match_block(
    Scope.EXTEND_STATIC(
      Scope._make_root(),
      hoisting,
      (scope) => Tree.Lift(
        Assign.assign(
          scope,
          parse(`([${code1}] = null);`).body[0].expression.left.elements[0],
          Lang.parse_expression(code2),
          true))),
    Lang.PARSE_BLOCK(code3),
    Assert);
  // Initialize Identifier //
  test(
    {__proto__:null, x:true},
    `x`,
    `123`,
    `{
      let x;
      x = 123;}`);
  // Initialize Assignment //
  test(
    {__proto__:null, x:true},
    `x = 123`,
    `456`,
    `{
      let x;
      x = (
        (456 === void 0) ?
        123 :
        456);}`);
  // Initialize Object NonRest //
  test(
    {__proto__:null, x:true, y:true},
    `{foo:x, ["bar"]:y}`,
    `123`,
    `{
      let x, y;
      (
        (
          (123 === null) ?
          true :
          (123 === void 0)) ?
        throw new #TypeError("Cannot destructure 'undefined' or 'null'") :
        (
          (
            void 0,
            x = #Reflect.get(#Object(123), "foo")),
          y = #Reflect.get(#Object(123), "bar")));}`);
  // Initialize Object Rest //
  test(
    {__proto__:null, x:true, y:true, rest:true},
    `{foo:x, ["bar"]:y, ...rest}`,
    `123`,
    `{
      let x, y, rest, _rest;
      (
        (
          (123 === null) ?
          true :
          (123 === void 0)) ?
        throw new #TypeError("Cannot destructure 'undefined' or 'null'") :
        (
          x = #Reflect.get(#Object(123), "foo"),
          (
            y = #Reflect.get(#Object(123), "bar"),
            (
              _rest = #Object.assign({__proto__:#Object.prototype}, 123),
              (
                (
                  (
                    void 0,
                    #Reflect.deleteProperty(_rest, "foo")),
                  #Reflect.deleteProperty(_rest, "bar")),
                rest = _rest)))));}`);
  // Initialize Array //
  test(
    {__proto__:null, x:true, y:true, rest:true},
    `[x, y, ... rest]`,
    `123`,
    `{
      let x, y, rest, _iterator;
      (
        _iterator = (
          #Reflect.get(${obj(123)}, #Symbol.iterator)
          (@123)),
        (
          (
            (
              void 0,
              x = #Reflect.get(
                #Reflect.get(_iterator, "next")(@_iterator),
                "value")),
            y = #Reflect.get(
              #Reflect.get(_iterator, "next")(@_iterator),
              "value")),
          rest = #Array.from(
            {
              __proto__:null,
              [#Symbol.iterator]: () => {
                return _iterator;}})));}`);
});
