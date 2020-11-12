"use strict";


require("vm").runInThisContext(`require("vm").runInThisContext('let x'); x;`)

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
      (scope) => (
        context.mode === "local-eval" ?
        Scope.DeclareInitialize(
          scope,
          _hoisting1))
        (
          (
            (scope) => Scope.DeclareInitialize(scope, _hoisting1))



      global_Object_assign(
        (
          context.mode === "local-eval" ?
          {
            __proto__:null} :
          {
            __proto__: null,
            this: false}),
        (
          (
            (
              context.mode === "global-eval" ||
              context.mode === "local-eval") &&
            Scope._is_strict(scope)) ?
          _hoisting1 :
          {__proto__:null}),
        _hoisting2),
      (scope) => Tree.Bundle(
        ArrayLite.concat(
          // Check let/const/class duplicate declarations
          (
            context.mode === "script" ?
            ArrayLite.map(
              global_Reflect_ownKeys(_hoisting2),
              (identifier) => Tree.Lift(
                Tree.conditional(
                  Tree.conditional(
                    Builtin.has(
                      Builtin.grab("#globalLexicalFrame"),
                      Tree.primitive(identifier)),
                    Tree.primitive(true),
                    Builtin.has(
                      Builtin.grab("#globalVariableNames"),
                      Tree.primitive(identifier))),
                  Builtin.throw_syntax_error("Identifier '" + identifier + "' has already been declared"),
                  Tree.primitive(void 0)))) :
            []),
          // Checks var/functions duplicate declarations
          ArrayLite.flatMap(
            global_Reflect_ownKeys(_hoisting1),
            (identifier) => (
              Scope._is_lexically_available(scope, identifier) ?
              (
                Scope._is_global_eval_frame(scope) ?
                [
                  Tree.conditional(
                    Builtin.has(
                      Builtin.grab("#globalDeclarativeRecord"),
                      Tree.primitive(identifier)),
                    Builtin.throw_syntax_error("Identifier '" + identifier + "' has already been declared"),
                    Tree.primitive(void 0))] :
                []) :
              [
                Builtin.throw_syntax_error("Identifier '" + identifier + "' has already been declared")])),
          // Update #globalLexicalFrame
          ArrayLite.map(

          (
            context.mode === "script" ?
            ArrayLite.concat(
              ArrayLite.map(
                global_Reflect_ownKeys(_hoisting1),
                (identifier) => Tree.Lift(
                  Tree.conditional(
                    Builtin.has(
                      Builtin.grab("#globalLexicalFrame"),
                      Tree.primitive(identifier)),
                    Builtin.throw_syntax_error("Identifier '" + identifier + "' has already been declared"),
                    Tree.primitive(void 0))))
              ArrayLite.map(
                global_Reflect_ownKeys(_hoisting2),
                (identifier) => Tree.Lift(
                  Tree.conditional(
                    Tree.conditional(
                      Builtin.has(
                        Builtin.grab("#globalLexicalFrame"),
                        Tree.primitive(identifier)),
                      Tree.primitive(true),
                      Builtin.has(
                        Builtin.grab("#globalVariableNames"),
                        Tree.primitive(identifier))),
                    Builtin.throw_syntax_error("Identifier '" + identifier + "' has already been declared"),
                    Tree.primitive(void 0))))) :
              ArrayLite.map(


                    Builtin.set(
                      Builtin.grab("#globalVariableNames"),
                      Tree.primitive(identifier),
                      Tree.primitive(null),
                      null,
                      false,
                      Builtin._success_result)))))


          (
            context.mode === "local-eval" ?
            [] :
            [
              Tree.Lift(
                Scope.initialize(
                  scope,
                  "this",
                  Builtin.grab("#globalObject")))]),
          ArrayLite.map(
            global_Reflect_ownKeys(_hoisting1),
            (
              (
                (
                  context.mode === "global-eval" ||
                  context.mode === "local-eval") &&
                Scope._is_strict(scope)) ?
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
                        Tree.Return(Scope.get(scope, box))])))])))))));
