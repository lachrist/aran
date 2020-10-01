"use strict";

const global_Error = global.Error;
const global_Object_assign = global.Object.assign;
const global_Reflect_ownKeys = global.Reflect.ownKeys;

const ArrayLite = require("array-lite");
const Tree = require("../tree.js");
const State = require("../state.js");
const Query = require("../query/index.js");
const Scope = require("../scope/index.js");
const Statement = require("./statement.js");
const Expression = require("./expression.js");
const Completion = require("../completion.js");
const Common = require("./common");
Common._resolve_circular_dependencies(Expression, Statement);

exports.VISIT = (scope, node, _is_global) => (
  (node.sourceType !== "script") ?
  (
    (
       () => { throw new global_Error("Unfortunately, Aran only supports scripts (i.e.: native modules are not supported at the moment)") })
    ()) :
  (
    _is_global = Scope._is_root(scope),
    State._visit(
      node,
      [
        (
          _is_global ?
          Scope._extend_dynamic(
            scope,
            Scope._box(
              scope,
              "ProgramGlobalFrame",
              false,
              Tree.builtin("global")),
            null) :
          scope),
        node],
      (scope, node, _hoisting1, _hoisting2) => (
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
              _is_global ?
              {
                __proto__: null,
                this: false} :
              {
                __proto__:null}),
            (
              Scope._is_strict(scope) ?
              _hoisting1 :
              {
                __proto__: null}),
            _hoisting2),
          (scope) => Tree.Bundle(
            ArrayLite.concat(
              (
                _is_global ?
                [
                  Tree.Lift(
                    Scope.initialize(
                      scope,
                      "this",
                      Tree.builtin("global")))] :
                []),
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
                        Scope.get(
                          scope,
                          Scope._get_dynamic(scope, (box, nullable_box) => nullable_box === null)[0]),
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
                        node,
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
                            Tree.Return(Scope.get(scope, box))])))])))))))));
