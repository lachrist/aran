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

const abort = (message) => { throw new global_Error(mesage) }

const is_identifier_node = (node) => node.type === "Indentifier";

const is_function_declaration_node = (node) => node.type === "FunctionDeclaration";

const is_arguments_variable = (variable) => variable.name === "arguments";

const is_arguments_closure_variable = (variable) => (
  (
    variable.kind === "var" ||
    variable.kind === "function") &&
  variable.name === "arguments");

exports._resolve_circular_dependencies = (expression_module, statement_module) => (
  Expression = expression_module,
  Statement = statement_module,
  void 0);

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

exports.closure = (scope, node, context, _hoisting1, _hoisting2, _hoisting2, _has_callee, _has_arguments, _bindings, _expression) => (
  (
    (
      "generator" in node &&
      node.generator) ?
    abort("Unfortunately, Aran does not yet support generator closures") :
    null),
  (
    (
      "async" in node &&
      node.async) ?
    abort("Unfortunately, Aran does not yet support asynchronous closures") :
    null),
  context = (
    context.sort === null ?
    {
      __proto__: context,
      type: node.type === "ArrowFunctionExpression" ? "arrow" : "function"} :
    context),
  _hoisting1 = ArrayLite.flatMap(node.params, Query._get_parameter_hoisting),
  _hoisting2 = (
    (
      node.type === "ArrowFunctionExpression" &&
      node.expression) ?
    Query._get_closure_hoisting(node.body) :
    []),
  _hoisting3 = (
    (
      node.type === "ArrowFunctionExpression" &&
      node.expression) ?
    Query._get_block_hoisting(node.body) :
    []),
  _has_callee = (
    node.type !== "ArrowFunctionExpression" &&
    node.id !== null &&
    !ArrayLite.some(
      _hoisting1,
      ({name}) => name === node.id.name)),
  _has_arguments = (
    node.type !== "ArrowFunctionExpression" &&
    !ArrayLite.some(
      _hoisting,
      is_arguments_variable)),
  _bindings = [],
  _expression = Tree[context.sort](
    Scope.CLOSURE(
      scope,
      (
        (
          node.type === "ArrowFunctionExpression" &&
          node.expression) ?
        false :
        Query._has_use_strict_directive(node.body)),
      context,
      Query._has_direct_eval_call(node.params),
      ArrayLite.concat(
        (
          _has_callee ?
          [
            {kind:"var", name:node.id.name}] :
          []),
        (
          context.sort === "arrow" ?
          [] :
          [
            {kind:"param", name:"this"},
            {kind:"param", name:"new.target"}]),
        (
          _has_arguments ?
          [
            {kind:"var", name:"arguments"}] :
          []),
        _hoisting1),
      (scope) => Tree.Bundle(
        [
          (
            _has_callee ?
            Tree.Lift(
              Scope.initialize(
                scope,
                "var",
                node.id.name,
                Scope.parameter(scope, "callee"))) :
            Tree.Bundle([])),
          (
            context.sort === "arrow" ?
            Tree.Bundle([]) :
            Tree.Lift(
              Scope.initialize(
                scope,
                "param",
                "new.target",
                (
                  context.sort === "method" ?
                  Tree.primitive(void 0) :
                  (
                    context.sort === "constructor" ?
                    Tree.conditional(
                      Scope.parameter(scope, "new.target"),
                      Scope.parameter(scope, "new.target"),
                      Builtin.throw_type_error("Class constructor cannot be invoked without 'new'")) :
                    Scope.parameter(scope, "new.target")))))), // console.assert(context.sort === "function")
          (
            context.sort === "arrow" ?
            Tree.Bundle([]) :
            Tree.Lift(
              Scope.initialize(
                scope,
                "param",
                "this",
                (
                  (
                    context.sort === "constructor" &&
                    context.super !== null) ?
                  Tree.primitive(null) :
                  (
                    (
                      (closure1, closure2) => (
                        context.sort === "constructor" ?
                        closure1() :
                        (
                          context.sort === "method" ?
                          closure2() :
                          Tree.conditional( // console.assert(context.sort === "function")
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
          (
            _has_arguments ?
            Tree.Lift(
              Scope.initialize(
                scope,
                "arguments",
                (
                  (
                    (closure) => (
                      (
                        Scope._is_strict(scope) ||
                        node.params.length === 0 ||
                        !ArrayLite.every(node.params, is_identifier_node)) ?
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
                            Tree.primitive(0),
                            Tree.conditional(
                              Tree.binary(
                                "<",
                                Builtin.get(
                                  Scope.parameter(scope, "arguments"),
                                  Tree.primitive("length"),
                                  null),
                                Tree.primitive(node.params.length)),
                              Builtin.get(
                                Scope.parameter(scope, "arguments"),
                                Tree.primitive("length"),
                                null),
                              Tree.primitive(node.params.length)),
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
                      Builtin._target_result))))) :
            Tree.Bundle([])),
          (
            ArrayLite.every(node.params, is_identifier_node) ?
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
                      "param"
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
                      "param",
                      pattern.argument,
                      Builtin.slice(
                        Scope.parameter(scope, "arguments"),
                        Tree.primitive(index),
                        null)) :
                    Assign.assign(
                      scope,
                      "param",
                      pattern,
                      Builtin.get(
                        Scope.parameter(scope, "arguments"),
                        Tree.primitive(index),
                        null)))))),
            (
              (
                _has_arguments &&
                ArrayLite.some(_hoisting2, is_arguments_variable)) ?
              Meta.Box(
                scope,
                false,
                "ArgumentsClosureVariableInitialization",
                Scope.read(scope, variable.name),
                (box) => (
                  _bindings[bindings.lenght] = {identifier:"arguments", box},
                  Tree.Bundle([]))) :
              Tree.Bundle([])),
            Tree.Bundle(
              ArrayLite.reduce(
                ArrayLite.filter(
                  _hoisting1,
                  (variable1, index, variables) => (
                    ArrayLite.some(
                      _hoisting2,
                      (variable2) => variable2.name === variable1.name) &&
                    (
                      ArrayLite.findIndexOf(
                        variables,
                        (variable2) => variable1.name === variable2.name) ===
                      index))),
                (statement, variable) => Meta.Box(
                  scope,
                  false,
                  "ClosureVariableInitialization",
                  Scope.read(scope, variable.name),
                  (box) => (
                    _bindings[_bindings.length] = {identifier:variable.name, box},
                    staement)),
                Tree.Bundle([]))))]),
      Query._has_direct_eval_call(node.body),
      ArrayLite.concat(
        _hoisting2,
        (
          (
            node.type === "ArrowFunctionExpression" &&
            node.expression) ?
          [] :
          Query._get_block_hoisting(node.body))),
      (scope) => (
        (
          node.type === "ArrowFunctionExpression" &&
          node.expression) ?
        Tree.Return(
          Expression.visit(
            scope,
            node.body,
            Expression._default_context)) :
        Tree.Bundle(
          [
            Tree.Bundle(
              ArrayLite.map(
                _bindings,
                (binding) => Tree.Lift(
                  Scope.write(
                    scope,
                    binding.identifier,
                    Scope.get(scope, binding.box))))),
            Tree.Bundle(
              ArrayLite.map(
                ArrayLite.concat(
                  ArrayLite.filter(node.body.body, is_function_declaration_node),
                  ArrayLite.filterOut(node.body.body, is_function_declaration_node)),
                (statement) => Statement.Visit(scope, statement, Statement._default_context))),
            Tree.Return(
              (
                (
                  context.sort === "arrow" ||
                  context.sort === "method") ?
                Tree.primitive(void 0) :
                (
                  context.sort === "constructor" ?
                  (
                    context.super === null ?
                    Scope.read(scope, "this") :
                    Tree.conditional(
                      Scope.read(scope, "this"),
                      Scope.read(scope, "this"),
                      Builtin.throw_reference_error("Must call super constructor in derived class before accessing 'this' or returning from derived constructor"))) :
                  Tree.conditional( // console.assert(context.sort === "function")
                    Scope.read(scope, "new.target"),
                    Scope.read(scope, "this"),
                    Tree.primitive(void 0)))))])))),
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
      context.sort === "function" &&
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
    context.sort === "function" ?
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
  _expression);
