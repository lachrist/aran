"use strict";

const global_Object_assign = global.Object.assign;
const global_Reflect_ownKeys = global.Reflect.ownKeys;

const ArrayLite = require("array-lite");

const Query = require("../query/index.js");
const Statement = require("./statement.js");
const Expression = require("./expression.js");
const Completion = require("../completion.js");
const Scope = require("../scope/index.js");
const Tree = require("../tree.js");

exports.REGULAR = (scope, statements, completion) => Scope.EXTEND_STATIC(
  scope,
  Query._get_shallow_hoisting(statements),
  (scope) => Tree.Bundle(
    ArrayLite.map(
      ArrayLite.concat(
        ArrayLite.filter(statements, Query._is_function_declaration),
        ArrayLite.filter(statements, Query._is_not_function_declaration)),
      (statement, index, statements) => Statement.Visit(
        scope,
        statement,
        Completion._extend(completion, statements, index),
        []))));

const get_consequent = (switch_case) => switch_case.consequent;

const get_consequent_function_declaration = (switch_case) => ArrayLite.filter(switch_case.consequent, Query._is_function_declaration);

// type DiscriminantBox = Box
// type MatchedBox = Box
exports.SWITCH = (scope, switch_cases, completion, discriminant_box, matched_box) => Scope.EXTEND_STATIC(
  scope,
  Query._get_shallow_hoisting(
    ArrayLite.flatMap(switch_cases, get_consequent)),
  (scope) => Tree.Bundle(
    ArrayLite.concat(
      ArrayLite.map(
        ArrayLite.flatMap(switch_cases, get_consequent_function_declaration),
        (statement, index, statements) => Statement.Visit(
          scope,
          statement,
          Completion.child(completion, index, statements),
          [])),
      ArrayLite.map(
        switch_cases,
        (switch_case) => (
          switch_case.test === null ?
          // Lone Block for consistency reasons
          Tree.Lone(
            [],
            Scope.EXTEND_STATIC(
              scope,
              {__proto__:null},
              (scope) => Tree.Bundle(
                ArrayLite.concat(
                  [
                    Tree.Lift(
                      Scope.set(
                        scope,
                        matched_box,
                        Tree.primitive(true)))],
                  ArrayLite.map(
                    ArrayLite.filter(switch_case.consequent, Query._is_not_function_declaration),
                    (statement, index, statements) => Statement.Visit(
                      scope,
                      statement,
                      Completion._extend(completion, statements, index),
                      [])))))) :
          Tree.If(
            [],
            Tree.conditional(
              Scope.get(scope, matched_box),
              Tree.primitive(true),
              Tree.conditional(
                Tree.binary(
                  "===",
                  Scope.get(scope, discriminant_box),
                  Expression.visit(scope, switch_case.test, false, null)),
                Tree.sequence(
                  Scope.set(
                    scope,
                    matched_box,
                    Tree.primitive(true)),
                  Tree.primitive(true)),
                Tree.primitive(false))),
            Scope.EXTEND_STATIC(
              scope,
              {__proto__:null},
              (scope) => Tree.Bundle(
                ArrayLite.map(
                  ArrayLite.filter(switch_case.consequent, Query._is_not_function_declaration),
                  (statement, index, statements) => Statement.Visit(
                    scope,
                    statement,
                    Completion._extend(completion, statements, index),
                    [])))),
            Scope.EXTEND_STATIC(
              scope,
              {__proto__:null},
              (scope) => Tree.Bundle([]))))))));

exports.CLOSURE = (scope, statements, completion, _hoisting) => (
  _hoisting = Query._get_deep_hoisting(statements),
  Scope.EXTEND_STATIC(
    scope,
    global_Object_assign(
      {__proto__:null},
      Query._get_shallow_hoisting(statements),
      _hoisting),
    (scope) => Tree.Bundle(
      ArrayLite.concat(
        ArrayLite.map(
          global_Reflect_ownKeys(_hoisting),
          (identifier) => Tree.Lift(
            Scope.initialize(
              scope,
              identifier,
              Tree.primitive(void 0)))),
        ArrayLite.map(
          ArrayLite.concat(
            ArrayLite.filter(statements, Query._is_function_declaration),
            ArrayLite.filter(statements, Query._is_not_function_declaration)),
          (statement, index, statements) => Statement.Visit(
            scope,
            statement,
            Completion._extend(completion, statements, index),
            []))))));

exports.PROGRAM = (scope, statements, _hoisting1, _hoisting2, _completion) => (
  _hoisting1 = Query._get_deep_hoisting(statements),
  _hoisting2 = Query._get_shallow_hoisting(statements),
  Scope.EXTEND_STATIC(
    scope,
    global_Object_assign(
      (
        Scope._is_eval(scope) ?
        {
          __proto__:null} :
        {
          __proto__: null,
          this: false}),
      (
        Scope._is_strict(scope) ?
        _hoisting1 :
        {
          __proto__: null}),
      _hoisting2),
    (scope) => Tree.Bundle(
      ArrayLite.concat(
        (
          Scope._is_eval(scope) ?
          [] :
          [
            Tree.Lift(
              Scope.initialize(
                scope,
                "this",
                Tree.builtin("global")))]),
        ArrayLite.map(
          global_Reflect_ownKeys(_hoisting1),
          (
            Scope._is_strict(scope) ?
            (identifier) => Tree.Lift(
              Scope.initialize(
                scope,
                identifier,
                Tree.primitive(void 0))) :
            (identifier) => Tree.Lift(
              Tree.apply(
                Tree.builtin("Reflect.defineProperty"),
                Tree.primitive(void 0),
                [
                  Tree.builtin("global"),
                  Tree.primitive(identifier),
                  Tree.object(
                    Tree.primitive(null),
                    [
                      [
                        Tree.primitive("value"),
                        Tree.primitive(void 0)],
                      [
                        Tree.primitive("writable"),
                        Tree.primitive(true)],
                      [
                        Tree.primitive("enumerable"),
                        Tree.primitive(true)]])])))),
        (
          statements.length === 0 ?
          [
            Tree.Return(
              Tree.primitive(void 0))] :
          (
            statements[statements.length - 1].type === "ExpressionStatement" ?
            (
              _completion = Completion._make_program(null),
              ArrayLite.map(
                statements,
                (statement, index, statements) => (
                  index === statements.length - 1 ?
                  Tree.Return(
                    Expression.visit(scope, statement.expression, false, null)) :
                  Statement.Visit(scope, statement, _completion, [])))) :
            [
              Scope.Box(
                scope,
                "completion",
                true,
                Tree.primitive(void 0),
                (box) => (
                  _completion = Completion._make_program(box),
                  Tree.Bundle(
                    ArrayLite.concat(
                      ArrayLite.map(
                        ArrayLite.concat(
                          ArrayLite.filter(statements, Query._is_function_declaration),
                          ArrayLite.filter(statements, Query._is_not_function_declaration)),
                        (statement, index, statements) => Statement.Visit(
                          scope,
                          statement,
                          Completion._extend(_completion, statements, index),
                          [])),
                      [
                        Tree.Return(Scope.get(scope, box))]))))]))))));
