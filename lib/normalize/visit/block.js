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

exports.REGULAR = (statements, scope, completion) => Scope.EXTEND_STATIC(
  scope,
  Query._get_shallow_hoisting(statements),
  (scope) => Tree.Bundle(
    ArrayLite.map(
      ArrayLite.concat(
        ArrayLite.filter(statements, Query._is_function_declaration),
        ArrayLite.filter(statements, Query._is_not_function_declaration)),
      (statement, index, statements) => Statement.Visit(
        statement,
        scope,
        Completion._extend(completion, statements, index),
        []))));

const get_consequent = (switch_case) => switch_case.consequent;

const get_consequent_function_declaration = (switch_case) => ArrayLite.filter(switch_case.consequent, Query._is_function_declaration);

// type DiscriminantBox = Box
// type MatchedBox = Box
exports.SWITCH = (switch_cases, scope, completion, discriminant_box, matched_box) => Scope.EXTEND_STATIC(
  scope,
  Query._get_shallow_hoisting(
    ArrayLite.flatMap(switch_cases, get_consequent)),
  (scope) => Tree.Bundle(
    ArrayLite.concat(
      ArrayLite.map(
        ArrayLite.flatMap(switch_cases, get_consequent_function_declaration),
        (statement, index, statements) => Statement.Visit(
          statement,
          scope,
          Completion.child(completion, index, statements),
          [])),
      ArrayLite.map(
        switch_cases,
        (switch_case) => (
          node.test === null ?
          // Lone Block for consistency reasons
          Tree.Lone(
            [],
            Scope.EXTEND_STATIC(
              scope,
              {__proto__:null},
              (scope) => Tree.Bundle(
                ArrayLite.concat(
                  Tree.Lift(
                    Scope.set(
                      scope,
                      matched_box,
                      Tree.primitive(true))),
                  ArrayLite.flatMap(
                    ArrayLite.filter(switch_case.consequent, Query._is_not_function_declaration),
                    (statement, index, statements) => Statement.Visit(
                      statement,
                      scope,
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
                  Scope.get(scope, discrimiant_box),
                  Visit.node(node.test, scope, false, null)),
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
              (scope) => ArrayLite.flatMap(
                ArrayLite.filter(switch_case.consequent, Query._is_not_function_declaration),
                (statement, index, statements) => Statement.Visit(
                  statement,
                  scope,
                  Completion._extend(completion, statements, index),
                  [])))))))));

exports.CLOSURE = (statements, scope, completion, _hoisting) => (
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
          global_Reflect_ownKeys(_hoistng),
          (identifier) => Tree.Lift(
            Scope.initialize(scope, identifier, void 0))),
        ArrayLite.map(
          ArrayLite.concat(
            ArrayLite.filter(statements, Query._is_function_declaration),
            ArrayLite.filter(statements, Query._is_not_function_declaration)),
          (statement, index, statements) => Statement.Visit(
            statement,
            scope,
            Completion._extend(completion, statements, index),
            []))))));

exports.PROGRAM = (statements, scope, _hoisting1, _hoisting2, _completion) => (
  _hoisting1 = Query._get_deep_hoisting(statements),
  _hoisting2 = Query._get_shallow_hoisting(statements),
  Scope.EXTEND_STATIC(
    Scope._make_root(),
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
                Tree.primitive(void 0)))]),
        ArrayLite.map(
          global_Reflect_ownKeys(_hoisting1),
          (
            Scope._is_strict(scope) ?
            (identifier) => Tree.Lift(
              Scope.initialize(scope, identifier, void 0)) :
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
                        Tree.primitive("writable"),
                        Tree.primitive(true)],
                      [
                        Tree.primitive("enumerable"),
                        Tree.primitive(true)],
                      [
                        Tree.primitive("value"),
                        Tree.primitive(void 0)]])])))),
        (
          statements.length === 0 ?
          [
            Tree.Return(
              Build.primitive(void 0))] :
          (
            statements[statements.length - 1].type === "ExpressionStatement" ?
            (
              _completion = Completion._make_program(null),
              ArrayLite.map(
                statements,
                (statement, index, statements) => (
                  index === statements.length - 1 ?
                  Tree.Return(
                    Expression.visit(statement.expression, scope, false, null)) :
                  Statement.Visit(statement, scope, _completion, [])))) :
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
                          statement,
                          scope,
                          Completion._extend(_completion, statements, index),
                          [])),
                      [
                        Tree.Return(Scope.get(scope, box))]))))]))))));
