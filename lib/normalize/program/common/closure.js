"use strict";

// type Name = scope.meta.Box
// type Frame = scope.meta.Box
// type Dropped = Boolean
// type Scope = scope.inner.scope
// type Node = estree.Node

// Only possible access to Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').get:
//
// const done = new Set();
// const target = Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').get;
// const loop = (x, path) => {
//   if (!done.has(x)) {
//     done.add(x);
//     if (Object.is(target, x)) {
//       console.log(path);
//     }
//     if (typeof x === Completion._function || (typeof x === "object" && x !== null)) {
//       loop(x, `${path}.@proto`);
//       for (let key of Reflect.ownKeys(x)) {
//         const descriptor = Reflect.getOwnPropertyDescriptor(x, key);
//         if (Reflect.getOwnPropertyDescriptor(descriptor, "value")) {
//           loop(descriptor.value, `${path}.${String(key)}`);
//         } else {
//           loop(descriptor.get, `${path}.${String(key)}@get`);
//           loop(descriptor.set, `${path}.${String(key)}@set`);
//         }
//       }
//     }
//   }
// }
// loop(global, "global");
// > global.Function.prototype.arguments@get

const global_Error = global.Error;
const global_String = global.String;
const global_Object_assign = global.Object.assign;
const global_Reflect_ownKeys = global.Reflect.ownKeys;

const ArrayLite = require("array-lite");
const Tree = require("../../tree.js");
const Scope = require("../../scope/index.js");
const Builtin = require("../../builtin.js");
const Query = require("../../query/index.js");
const Assign = require("./assign.js");
const Completion = require("../../completion.js");
let Expression = null;
let Statement = null;

exports._resolve_circular_dependencies = (expression_module, statement_module) => {
  Expression = expression_module;
  Statement = statement_module;
};

// https://tc39.github.io/ecma262/#sec-function-instances

// Two different scope frame:
// ==========================
// > function f (x = y) { var y; return x; }
// undefined
// > y
// Thrown:
// ReferenceError: y is not defined
// > f()
// Thrown:
// ReferenceError: y is not defined
//     at f (repl:1:17)

exports.closure = (scope, node, context, _hoisting, _expression) => (
  node = global_Object_assign(
    {
      __proto__: null,
      body: null,
      params: null,
      id: null,
      expression: false,
      generator: false,
      async: false},
    node),
  context = (
    context.tag === null ?
    {
      __proto__: context,
      tag: node.type === "ArrowFunctionExpression" ? "arrow" : "function"} :
    context),
  scope = (
    (
      !node.expression &&
      Query._is_use_strict_statement_array(node.body.body)) ?
    Scope._extend_use_strict(scope) :
    scope),
  _hoisting = Query._get_parameter_array_hoisting(node.params),
  (
    node.generator ?
    (
      (
        () => { throw new global_Error("Unfortunately, Aran does not yet support generator closures.") })
      ()) :
    (
      node.async ?
      (
        (
          () => { throw new global_Error("Unfortunately, Aran does not yet support asynchronous closures.") })
        ()) :
      (
        _expression = Tree[context.tag](
          Scope.EXTEND_STATIC(
            Scope._extend_binding_last(
              Scope._extend_binding_tag(
                Scope._extend_binding_self(
                  Scope._extend_binding_super(
                    Scope._extend_closure(scope),
                    context.super),
                  context.self),
                context.tag),
              null),
            global_Object_assign(
              (
                context.tag === "arrow" ?
                {__proto__: null} :
                {
                  __proto__: null,
                  "this": true,
                  "new.target": true,
                  "arguments": true}),
              (
                node.id === null ?
                {__proto__:null} :
                {
                  __proto__: null,
                  [node.id.name]: true}),
              _hoisting),
            (scope) => Tree.Bundle(
              [
                (
                  (
                    node.id !== null &&
                    !(node.id.name in _hoisting)) ?
                  Tree.Lift(
                    Scope.initialize(
                      scope,
                      node.id.name,
                      Scope.parameter(scope, "callee"))) :
                  Tree.Bundle([])),
                (
                  context.tag === "arrow" ?
                  Tree.Bundle([]) :
                  Tree.Lift(
                    Scope.initialize(
                      scope,
                      "new.target",
                      (
                        context.tag === "method" ?
                        Tree.primitive(void 0) :
                        (
                          context.tag === "constructor" ?
                          Tree.conditional(
                            Scope.parameter(scope, "new.target"),
                            Scope.parameter(scope, "new.target"),
                            Builtin.throw_type_error("Class constructor cannot be invoked without 'new'")) :
                          Scope.parameter(scope, "new.target")))))), // console.assert(context.tag === "function")
                (
                  context.tag === "arrow" ?
                  Tree.Bundle([]) :
                  Tree.Lift(
                    Scope.initialize(
                      scope,
                      "this",
                      (
                        (
                          context.tag === "constructor" &&
                          context.super !== null) ?
                        Tree.primitive(null) :
                        (
                          (
                            (closure1, closure2) => (
                              context.tag === "constructor" ?
                              closure1() :
                              (
                                context.tag === "method" ?
                                closure2() :
                                Tree.conditional( // console.assert(context.tag === "function")
                                  Scope.parameter(scope, "new.target"),
                                  closure1(),
                                  closure2()))))
                          (
                            // N.B.: {__proto__:#Reflect.get(NEW_TARGET.prototype)} <=> #Refect.construct(Object, ARGUMENTS, NEW_TARGET)
                            () => Builtin.construct_object(
                              Builtin.get(
                                Scope.parameter(scope, "new.target"),
                                Tree.primitive("prototype"),
                                null),
                              []),
                            // () => Builtin.construct(
                            //   (
                            //     context.super === null ?
                            //     Builtin.grab("Object") :
                            //     Scope.get(scope, context.super)),
                            //   Scope.parameter(scope, "arguments"),
                            //   Scope.parameter(scope, "new.target")),
                            () => (
                              Scope._is_strict(scope) ?
                              Scope.parameter(scope, "this") :
                              Builtin.fork_nullish(
                                () => Scope.parameter(scope, "this"),
                                Builtin.grab("global"),
                                null)))))))),
                // We initialize parameters first to avoid TDZ on proxified arguments.
                (
                  ArrayLite.every(node.params, (pattern) => pattern.type === "Identifier") ?
                  Tree.Bundle(
                    ArrayLite.map(
                      ArrayLite.map(
                        node.params,
                        (pattern) => pattern.name),
                      (identifier, index, identifiers) => Tree.Lift(
                        (
                          ArrayLite.indexOf(identifiers, identifier) === index ?
                          Scope.initialize(
                            scope,
                            identifier,
                            Builtin.get(
                              Scope.parameter(scope, "arguments"),
                              Tree.primitive(index),
                              null)) :
                          Scope.write(
                            scope,
                            identifier,
                            Builtin.get(
                              Scope.parameter(scope, "arguments"),
                              Tree.primitive(index),
                              null)))))) :
                  Tree.Bundle(
                    ArrayLite.map(
                      node.params,
                      (pattern, index) => Tree.Lift(
                        (
                          pattern.type === "RestElement" ?
                          Assign.assign(
                            scope,
                            pattern.argument,
                            Builtin.slice(
                              Scope.parameter(scope, "arguments"),
                              Tree.primitive(index),
                              null),
                            true) :
                          Assign.assign(
                            scope,
                            pattern,
                            Builtin.get(
                              Scope.parameter(scope, "arguments"),
                              Tree.primitive(index),
                              null),
                            true)))))),
                (
                  (
                    context.tag === "arrow" ||
                    ("arguments" in _hoisting)) ?
                  Tree.Bundle([]) :
                  Tree.Lift(
                    Scope.initialize(
                      scope,
                      "arguments",
                      (
                        (
                          (closure) => (
                            (
                              Scope._is_strict(scope) ||
                              !ArrayLite.every(node.params, Query._is_identifier_pattern)) ?
                            closure() :
                            Scope.box(
                              scope,
                              "ClosureMarker",
                              false,
                              Builtin.construct_object(
                                Tree.primitive(null),
                                []),
                              (marker_box) => Builtin.construct_proxy(
                                Builtin.fill(
                                  closure(),
                                  Scope.get(scope, marker_box),
                                  true,
                                  Builtin._target_result),
                                [
                                  [
                                    "defineProperty",
                                    Tree.arrow(
                                      Scope.EXTEND_STATIC(
                                        Scope._extend_closure(scope),
                                        {__proto__:null},
                                        (scope) => Scope.Box(
                                          scope,
                                          "target",
                                          false,
                                          Builtin.get(
                                            Scope.parameter(scope, "arguments"),
                                            Tree.primitive(0),
                                            null),
                                          (target_box) => Scope.Box(
                                            scope,
                                            "key",
                                            false,
                                            Builtin.get(
                                              Scope.parameter(scope, "arguments"),
                                              Tree.primitive(1),
                                              null),
                                            (key_box) => Scope.Box(
                                              scope,
                                              "descriptor",
                                              false,
                                              Builtin.get(
                                                Scope.parameter(scope, "arguments"),
                                                Tree.primitive(2),
                                                null),
                                              (descriptor_box) => Tree.Return(
                                                Tree.conditional(
                                                  Tree.conditional(
                                                    Tree.binary(
                                                      "===",
                                                      Builtin.get(
                                                        Builtin.get_own_property_descriptor(
                                                          Scope.get(scope, target_box),
                                                          Scope.get(scope, key_box)),
                                                        Tree.primitive("value"),
                                                        null),
                                                      Scope.get(scope, marker_box)),
                                                    Tree.conditional(
                                                      Builtin.get_own_property_descriptor(
                                                        Scope.get(scope, descriptor_box),
                                                        Tree.primitive("value")),
                                                      Tree.conditional(
                                                        Builtin.get(
                                                          Scope.get(scope, descriptor_box),
                                                          Tree.primitive("writable"),
                                                          null),
                                                        Builtin.get(
                                                          Scope.get(scope, descriptor_box),
                                                          Tree.primitive("configurable"),
                                                          null),
                                                        Tree.primitive(false)),
                                                      Tree.primitive(false)),
                                                    Tree.primitive(false)),
                                                  Tree.sequence(
                                                    ArrayLite.reduce(
                                                      node.params,
                                                      (expression, pattern, index) => Tree.conditional(
                                                        Tree.binary(
                                                          "===",
                                                          Scope.get(scope, key_box),
                                                          Tree.primitive(
                                                            global_String(index))),
                                                        Scope.write(
                                                          scope,
                                                          pattern.name,
                                                          Builtin.get(
                                                            Scope.get(scope, descriptor_box),
                                                            Tree.primitive("value"),
                                                            null)),
                                                        expression),
                                                      Tree.throw(
                                                        Tree.primitive("This should never happen, please contact the dev"))),
                                                    Tree.primitive(true)),
                                                  Tree.apply(
                                                    Builtin.grab("Reflect.defineProperty"),
                                                    Tree.primitive(void 0),
                                                    [
                                                      Scope.get(scope, target_box),
                                                      Scope.get(scope, key_box),
                                                      Scope.get(scope, descriptor_box)]))))))))],
                                [
                                  "getOwnPropertyDescriptor",
                                  Tree.arrow(
                                    Scope.EXTEND_STATIC(
                                      Scope._extend_closure(scope),
                                      {__proto__:null},
                                      (scope) => Scope.Box(
                                        scope,
                                        "target",
                                        false,
                                        Builtin.get(
                                          Scope.parameter(scope, "arguments"),
                                          Tree.primitive(0),
                                          null),
                                        (target_box) => Scope.Box(
                                          scope,
                                          "key",
                                          false,
                                          Builtin.get(
                                            Scope.parameter(scope, "arguments"),
                                            Tree.primitive(1),
                                            null),
                                          (key_box) => Scope.Box(
                                            scope,
                                            "descriptor",
                                            false,
                                            Builtin.get_own_property_descriptor(
                                              Scope.get(scope, target_box),
                                              Scope.get(scope, key_box)),
                                            (descriptor_box) => Tree.Bundle(
                                              [
                                                Tree.Lift(
                                                  Tree.conditional(
                                                    Tree.conditional(
                                                      Builtin.get_own_property_descriptor(
                                                        Scope.get(scope, descriptor_box),
                                                        Tree.primitive("value")),
                                                      Tree.binary(
                                                        "===",
                                                        Builtin.get(
                                                          Scope.get(scope, descriptor_box),
                                                          Tree.primitive("value"),
                                                          null),
                                                        Scope.get(scope, marker_box)),
                                                      Tree.primitive(false)),
                                                    Builtin.set(
                                                      Scope.get(scope, descriptor_box),
                                                      Tree.primitive("value"),
                                                      ArrayLite.reduce(
                                                        node.params,
                                                        (expression, pattern, index) => Tree.conditional(
                                                          Tree.binary(
                                                            "===",
                                                            Scope.get(scope, key_box),
                                                            Tree.primitive(
                                                              global_String(index))),
                                                          Scope.read(scope, pattern.name),
                                                          expression),
                                                        Tree.throw(
                                                          Tree.primitive("This should never happen, please contact the dev"))),
                                                      null,
                                                      false,
                                                      Builtin._success_result),
                                                    Tree.primitive(void 0))),
                                                Tree.Return(
                                                  Scope.get(scope, descriptor_box))]))))))],
                                [
                                  "get",
                                  Tree.arrow(
                                    Scope.EXTEND_STATIC(
                                      Scope._extend_closure(scope),
                                      {__proto__:null},
                                      (scope) => Scope.Box(
                                        scope,
                                        "target",
                                        false,
                                        Builtin.get(
                                          Scope.parameter(scope, "arguments"),
                                          Tree.primitive(0),
                                          null),
                                        (target_box) => Scope.Box(
                                          scope,
                                          "key",
                                          false,
                                          Builtin.get(
                                            Scope.parameter(scope, "arguments"),
                                            Tree.primitive(1),
                                            null),
                                          (key_box) => Scope.Box(
                                            scope,
                                            "receiver",
                                            false,
                                            Builtin.get(
                                              Scope.parameter(scope, "arguments"),
                                              Tree.primitive(2),
                                              null),
                                            (receiver_box) => Scope.Box(
                                              scope,
                                              "value",
                                              false,
                                              Builtin.get(
                                                Scope.get(scope, target_box),
                                                Scope.get(scope, key_box),
                                                Scope.get(scope, receiver_box)),
                                              (value_box) => Tree.Return(
                                                Tree.conditional(
                                                  Tree.binary(
                                                    "===",
                                                    Scope.get(scope, value_box),
                                                    Scope.get(scope, marker_box)),
                                                  ArrayLite.reduce(
                                                    node.params,
                                                    (expression, pattern, index) => Tree.conditional(
                                                      Tree.binary(
                                                        "===",
                                                        Scope.get(scope, key_box),
                                                        Tree.primitive(
                                                          global_String(index))),
                                                      Scope.read(scope, pattern.name),
                                                      expression),
                                                    Tree.throw(
                                                      Tree.primitive("This should never happen, please contact the dev"))),
                                                  Scope.get(scope, value_box)))))))))]]))))
                        (
                          () => Builtin.assign(
                            Builtin.construct_object(
                              Builtin.grab("Object.prototype"),
                              [
                                [
                                  Tree.primitive("length"),
                                  {
                                    __proto__: null,
                                    value: Builtin.get(
                                      Scope.parameter(scope, "arguments"),
                                      Tree.primitive("length"),
                                      null),
                                    writable: true,
                                    enumerable: false,
                                    configurable: true}],
                                [
                                  Tree.primitive("callee"),
                                  (
                                    Scope._is_strict(scope) ?
                                    {
                                      __proto__: null,
                                      get: Builtin.grab("Function.prototype.arguments.__get__"),
                                      set: Builtin.grab("Function.prototype.arguments.__set__"),
                                      enumerable: false,
                                      configurable: false} :
                                    {
                                      __proto__: null,
                                      value: Scope.parameter(scope, "callee"),
                                      writable: true,
                                      enumerable: false,
                                      configurable: true})],
                                [
                                  Builtin.grab("Symbol.iterator"),
                                  {
                                    __proto__: null,
                                    value: Builtin.grab("Array.prototype.values"),
                                    writable: true,
                                    enumerable: false,
                                    configurable: true}]]),
                            [
                              Scope.parameter(scope, "arguments")],
                            true,
                            Builtin._target_result)))))),
                (
                  node.expression ?
                  Tree.Return( // console.assert(tag === "arrow")
                    Expression.visit(
                      scope,
                      node.body,
                      false)) :
                  (
                    (
                      (closure) => (
                        (
                          !Scope._is_strict(scope) &&
                          Query._has_direct_eval_call(node.body.body)) ?
                        Scope.Box(
                          scope,
                          "ClosureEvalFrame",
                          false,
                          Builtin.construct_object(
                            Tree.primitive(null),
                            []),
                          (frame_box) => closure(
                            Scope._extend_binding_eval(
                              Scope._extend_dynamic(scope, frame_box, null),
                              frame_box))) :
                        closure(scope)))
                    (
                      (scope, _hoisting) => Tree.Lone(
                        [],
                        (
                          _hoisting = Query._get_deep_hoisting(node.body.body),
                          Scope.EXTEND_STATIC(
                            scope,
                            global_Object_assign(
                              {__proto__:null},
                              Query._get_shallow_hoisting(node.body.body),
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
                                    ArrayLite.filter(node.body.body, Query._is_function_declaration_statement),
                                    ArrayLite.filter(node.body.body, Query._is_not_function_declaration_statement)),
                                  (statement) => Statement.Visit(scope, statement, Statement._default_context)))))))))),
                Tree.Return(
                  (
                    (
                      context.tag === "arrow" ||
                      context.tag === "method") ?
                    Tree.primitive(void 0) :
                    (
                      context.tag === "constructor" ?
                      (
                        context.super === null ?
                        Scope.read(scope, "this") :
                        Tree.conditional(
                          Scope.read(scope, "this"),
                          Scope.read(scope, "this"),
                          Builtin.throw_reference_error("Must call super constructor in derived class before accessing 'this' or returning from derived constructor"))) :
                      Tree.conditional( // console.assert(context.tag === "function")
                        Scope.read(scope, "new.target"),
                        Scope.read(scope, "this"),
                        Tree.primitive(void 0)))))]))),
        _expression = Builtin.define_property(
          _expression,
          Tree.primitive("length"),
          {
            __proto__: null,
            value: Tree.primitive(
              (
                (
                  node.params.length > 0 &&
                  node.params[node.params.length - 1].type === "RestElement") ?
                node.params.length - 1 :
                node.params.length)),
            writable: false,
            enumerable: false,
            configurable: true},
          true,
          Builtin._target_result),
        _expression = Builtin.define_property(
          _expression,
          Tree.primitive("name"),
          {
            __proto__: null,
            value: (
              (
                (expression) => (
                  context.accessor === null ?
                  expression :
                  Tree.binary(
                    "+",
                    Tree.primitive(context.accessor + " "),
                    expression)))
              (
                (
                  node.id === null ?
                  (
                    context.name === null ?
                    Tree.primitive("") :
                    Scope.get(scope, context.name)) :
                  Tree.primitive(node.id.name)))),
            writable: false,
            enumerable: false,
            configurable: true},
          true,
          Builtin._target_result),
        (
          (
            context.tag === "function" &&
            !Scope._is_strict(scope)) ?
          (
            _expression = Builtin.define_property(
              _expression,
              Tree.primitive("arguments"),
              {
                __proto__: null,
                value: Tree.primitive(null)},
              true,
              Builtin._target_result),
            _expression = Builtin.define_property(
              _expression,
              Tree.primitive("caller"),
              {
                __proto__: null,
                value: Tree.primitive(null)},
              true,
            Builtin._target_result)) :
          null),
        (
          context.tag === "function" ?
          _expression = Scope.box(
            scope,
            "ClosureConstructor",
            false,
            _expression,
            (constructor_box) => Builtin.define_property(
              Scope.get(scope, constructor_box),
              Tree.primitive("prototype"),
              {
                __proto__: null,
                value: Builtin.construct_object(
                  Builtin.grab("Object.prototype"),
                  [
                    [
                      Tree.primitive("constructor"),
                      {
                        __proto__: null,
                        value: Scope.get(scope, constructor_box),
                        writable: true,
                        configurable: true}]]),
                writable: true},
              true,
              Builtin._target_result)) :
          null),
        _expression))));
