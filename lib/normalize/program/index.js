"use strict";

const global_Error = global.Error;
const global_Object_assign = global.Object.assign;
const global_Reflect_ownKeys = global.Reflect.ownKeys;

const ArrayLite = require("array-lite");
const Tree = require("../tree.js");
const Query = require("../query/index.js");
const Scope = require("../scope/index.js");
const Statement = require("./statement.js");
const Expression = require("./expression.js");
const Completion = require("../completion.js");
const Common = require("./common");
Common._resolve_circular_dependencies(Expression, Statement);

exports.VISIT = (scope, node, _hoisting1, _hoisting2) => (
  (node.sourceType !== "script") ?
  (
    (
       () => { throw new global_Error("Unfortunately, Aran only supports scripts (i.e.: native modules are not supported at the moment)") })
    ()) :
  (
    _hoisting1 = Query._get_deep_hoisting(node.body),
    _hoisting2 = Query._get_shallow_hoisting(node.body),
    scope = (
      Query._is_use_strict_statement_array(node.body) ?
      Scope._extend_use_strict(scope) :
      scope),
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
                    (
                      Scope._is_eval(scope) ?
                      Scope._get_eval(scope) :
                      Tree.builtin("global")),
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
            node.body.length === 0 ?
            [
              Tree.Return(
                Tree.primitive(void 0))] :
            (
              node.body[node.body.length - 1].type === "ExpressionStatement" ?
              ArrayLite.map(
                node.body,
                (node, index, nodes) => (
                  index === nodes.length - 1 ?
                  Tree.Return( // console.assert(node.type === ExpressionStatement)
                    Expression.visit(scope, node.expression, Expression._default_context)) :
                  Statement.Visit(
                    scope,
                    statement,
                    Completion._make_program(null),
                    []))) :
              [
                Scope.Box(
                  scope,
                  "completion",
                  true,
                  Tree.primitive(void 0),
                  (box) => Tree.Bundle(
                    ArrayLite.concat(
                      ArrayLite.map(
                        ArrayLite.concat(
                          ArrayLite.filter(node.body, Query._is_function_declaration_statement),
                          ArrayLite.filter(node.body, Query._is_not_function_declaration_statement)),
                        (node, index, nodes) => Statement.Visit(
                          scope,
                          node,
                          Completion._extend(
                            Completion._make_program(box),
                            nodes,
                            index),
                          [])),
                      [
                        Tree.Return(Scope.get(scope, box))])))])))))));
