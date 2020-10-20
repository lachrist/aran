"use strict";

const global_Error = global.Error;
const global_Object_assign = global.Object.assign;
const global_Reflect_ownKeys = global.Reflect.ownKeys;

const ArrayLite = require("array-lite");
const Builtin = require("../builtin.js");
const Tree = require("../tree.js");
const State = require("../state.js");
const Query = require("../query/index.js");
const Scope = require("../scope/index.js");
const Statement = require("./statement.js");
const Expression = require("./expression.js");
const Completion = require("../completion.js");
const Common = require("./common");
Common._resolve_circular_dependencies(Expression, Statement);

exports._default_context = {
  __proto__: null,
  local: false};

exports.VISIT = (scope, node, context) => State._visit(node, [scope, node, context], visitor);

const visitor = (scope, node, context, _hoisting1, _hoisting2) => (
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
          context.local ?
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
      (scope) => Scope.Box(
        scope,
        "ProgramFrame",
        false,
        Builtin.grab("global"),
        (box) => (
          scope = (
            context.local ?
            scope :
            Scope._extend_binding_super(
              Scope._extend_binding_eval(scope, box),
              null)),
          Tree.Bundle(
            ArrayLite.concat(
              (
                context.local ?
                [] :
                [
                  Tree.Lift(
                    Scope.initialize(
                      scope,
                      "this",
                      Builtin.grab("global")))]),
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
                    Builtin.define_property(
                      Scope.get(
                        scope,
                        Scope._get_binding_eval(scope)),
                      Tree.primitive(identifier),
                      {
                        __proto__: null,
                        value: Tree.primitive(void 0),
                        writable: true,
                        enumerable: true},
                      false,
                      Builtin._success_result)))),
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
                        Statement._default_context))) :
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
                              Scope._extend_binding_last(scope, box),
                              node,
                              {
                                __proto__: Statement._default_context,
                                completion: Completion._extend(
                                  Completion._make_full(),
                                  nodes,
                                  index)})),
                          [
                            Tree.Return(Scope.get(scope, box))])))])))))))));
