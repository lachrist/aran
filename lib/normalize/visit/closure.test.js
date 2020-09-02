"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

require("../tree.js")._toggle_debug_mode();
const Acorn = require("acorn");
const Closure = require("./closure.js");
const Lang = require("../../lang/index.js");
const State = require("../state.js");
const Scope = require("../scope/index.js");
const Completion = require("../completion.js");
const Tree = require("../tree.js");

const Block = {
  CLOSURE: (scope, statements, completion) => Scope.EXTEND_STATIC(
    scope,
    {
      __proto__: null},
    (scope) => Tree.Bundle(
      statements.map(
        (statement) => Statement.Visit(scope, statement))))};

const Statement = {
  Visit: (scope, statement) => {
    if (statement.type === "ExpressionStatement") {
      return Tree.Lift(Expression.visit(scope, statement.expression));
    }
    Assert.fail("Unexpected statement type");
  }
};

const Expression = {
  visit: (scope, expression) => {
    if (expression.type === "Literal") {
      return Tree.primitive(expression.value);
    }
    if (expression.type === "Identifier") {
      return Scope.read(scope, expression.name);
    }
    if (expression.type === "SequenceExpression") {
      Assert.deepEqual(expression.expressions.length, 2);
      return Tree.sequence(
        Expression.visit(scope, expression.expressions[0]),
        Expression.visit(scope, expression.expressions[1]));
    }
    if (expression.type === "CallExpression") {
      Assert.deepEqual(expression.callee.type, "Identifier");
      Assert.deepEqual(expression.callee.name, "eval");
      Assert.deepEqual(expression.arguments.length, 1);
      return Scope.eval(scope, Expression.visit(scope, expression.arguments[0]));
    }
    Assert.fail("Unexpected expression type");
  }
};

Closure._resolve_circular_dependencies(Expression, Block);

State._run_session({nodes:[], serials:new Map(), evals:{__proto__:null}}, [], () => {
  // Arrow
  {
    const test = (name, code1, code2, _scope) => (
      _scope = Scope._make_root(),
      Lang._match_expression(
        Scope.box(
          _scope,
          "foobar",
          false,
          Tree.primitive(name),
          (box) => Closure.arrow(
            _scope,
            Acorn.parse(code1).body[0].expression,
            false,
            box)),
        Lang.parse_expression(code2),
        Assert));
    // Async
    Assert.throws(
      () => Closure.arrow(
        Scope._make_root(),
        Acorn.parse(`async () => {}`).body[0].expression,
        false,
        null),
      new Error("Unfortunately, Aran does not yet support asynchronous arrows."));
    // Regular //
    test(
      "foo",
      `(x1, x2) => { 123; };`,
      `
        #Object.defineProperty(
          #Object.defineProperty(
            () => {
              let x1, x2;
              x1 = #Reflect.get(ARGUMENTS, 0);
              x2 = #Reflect.get(ARGUMENTS, 1);
              { 123; }
              return void 0; },
            "length",
            {
              __proto__: null,
              value: 2,
              configurable: true}),
          "name",
          {
            __proto__: null,
            value: "foo",
            configurable: true})`);
    // RestElement + ExpressionBody //
    test(
      "foo",
      `(x1, x2, ...xs) => 123;`,
      `
        #Object.defineProperty(
          #Object.defineProperty(
            () => {
              let x1, x2, xs;
              x1 = #Reflect.get(ARGUMENTS, 0);
              x2 = #Reflect.get(ARGUMENTS, 1);
              xs = #Array.prototype.slice(@ARGUMENTS, 2);
              return 123;},
            "length",
            {
              __proto__: null,
              value: 2,
              configurable: true}),
          "name",
          {
            __proto__: null,
            value: "foo",
            configurable: true})`);
    // Eval //
    test(
      "foo",
      `() => (eval("var x = 123;"), x)`,
      `
        #Object.defineProperty(
          #Object.defineProperty(
            () => {
              let _frame;
              _frame = {__proto__:null};
              return (
                eval(§_frame, "var x = 123;"),
                (
                  #Reflect.has(_frame, "x") ?
                  #Reflect.get(_frame, "x") :
                  (
                    #Reflect.has(#global, "x") ?
                    #Reflect.get(#global, "x") :
                    throw new #ReferenceError("x is not defined"))));},
            "length",
            {
              __proto__: null,
              value: 0,
              configurable: true}),
          "name",
          {
            __proto__: null,
            value: "foo",
            configurable: true})`);
  }
});
