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
const Mop = require("../../mop.js");
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

exports.closure = (scope, node, completion, name_nullable_box, super_nullable_box, _hoisting) => (
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
  scope = (
    (
      !node.expression &&
      Query._is_use_strict(node.body.body)) ?
    Scope._extend_use_strict(scope) :
    scope),
  _hoisting = Query._get_parameter_array_hoisting(node.params),
  (
    (
      completion !== Completion._arrow &&
      completion !== Completion._method &&
      completion !== Completion._function &&
      completion !== Completion._constructor &&
      completion !== Completion._derived_constructor) ?
    (
      (
        () => { throw new global_Error("Expected a closure completion") })
      ()) :
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
          (
            (
              node.id === null ||
              node.id.name in _hoisting) &&
            (
              completion === Completion._arrow ||
              Scope._is_strict(scope))) ?
          common(scope, node, completion, name_nullable_box, super_nullable_box, null, _hoisting) :
          Scope.box(
            scope,
            "ClosureCallee",
            true,
            Tree.primitive(void 0),
            (callee_box) => Tree.sequence(
              Scope.set(
                scope,
                callee_box,
                common(scope, node, completion, name_nullable_box, super_nullable_box, callee_box, _hoisting)),
              Scope.get(scope, callee_box))))))));

const common = (scope, node, completion, name_nullable_box, super_nullable_box, callee_nullable_box, hoisting, _expression) => (
  _expression = Tree[
    (
      (
        completion === Completion._constructor ||
        completion === Completion._derived_constructor) ?
      "constructor" :
      (
        completion === Completion._method ?
        "method" :
        (
          completion === Completion._arrow ?
          "arrow" :
          "function")))]( // console.assert(completion === Completion._function)
    Scope.EXTEND_STATIC(
      scope,
      global_Object_assign(
        (
          completion === Completion._arrow ?
          {__proto__: null} :
          {
            __proto__: null,
            "this": true,
            "new.target": true,
            "arguments": true}),
        (
          (
            completion === Completion._method ||
            completion === Completion._constructor ||
            completion === Completion._derived_constructor) ?
          {
            __proto__: null,
            "super": true} :
          {__proto__: null}),
        (
          node.id === null ?
          {__proto__:null} :
          {
            __proto__: null,
            [node.id.name]: true}),
        hoisting),
      (scope) => Tree.Bundle(
        [
          (
            (
              node.id !== null &&
              !(node.id.name in hoisting)) ?
            Tree.Lift( // console.assert(callee_nullable_box !== null)
              Scope.initialize(
                scope,
                node.id.name,
                Scope.get(scope, callee_nullable_box))) :
            Tree.Bundle([])),
          (
            (
              completion === Completion._method ||
              completion === Completion._constructor ||
              completion === Completion._derived_constructor) ?
            Tree.Lift(
              Scope.initialize(
                scope,
                "super",
                (
                  super_nullable_box === null ?
                  Tree.builtin("Object") :
                  Scope.get(scope, super_nullable_box)))) :
            Tree.Bundle([])),
          (
            completion === Completion._arrow ?
            Tree.Bundle([]) :
            Tree.Lift(
              Scope.initialize(
                scope,
                "new.target",
                (
                  completion === Completion._method ?
                  Tree.primitive(void 0) :
                  (
                    (
                      completion === Completion._constructor ||
                      completion === Completion._derived_constructor) ?
                    Tree.conditional(
                      Scope.parameter(scope, "new.target"),
                      Scope.parameter(scope, "new.target"),
                      Tree.throw(
                        Tree.construct(
                          Tree.builtin("TypeError"),
                          [
                            Tree.primitive("Class constructor cannot be invoked without 'new'")]))) :
                    Scope.parameter(scope, "new.target")))))), // console.assert(completion === Completion._function)
          (
            completion === Completion._arrow ?
            Tree.Bundle([]) :
            Tree.Lift(
              Scope.initialize(
                scope,
                "this",
                (
                  completion === Completion._derived_constructor ?
                  Tree.primitive(null) :
                  (
                    (
                      (closure1, closure2) => (
                        completion === Completion._constructor ?
                        closure1() :
                        (
                          completion === Completion._method ?
                          closure2() :
                          Tree.conditional( // console.assert(completion === Completion._function)
                            Scope.parameter(scope, "new.target"),
                            closure1(),
                            closure2()))))
                    (
                      // N.B.: {__proto__:#Reflect.get(NEW_TARGET.prototype)} <=> #Refect.construct(Object, ARGUMENTS, NEW_TARGET)
                      // Tree.object(
                      //   Tree.apply(
                      //     Tree.builtin("Reflect.get"),
                      //     Tree.primitive(void 0),
                      //     [
                      //       Scope.parameter(scope, "new.target"),
                      //       Tree.primitive("prototype")]),
                      //   []),
                      () => Mop.construct(
                        (
                          super_nullable_box === null ?
                          Tree.builtin("Object") :
                          Scope.get(scope, super_nullable_box)),
                        Scope.parameter(scope, "arguments"),
                        Scope.parameter(scope, "new.target")),
                      () => (
                        Scope._is_strict(scope) ?
                        Scope.parameter(scope, "this") :
                        Tree.conditional(
                          Tree.binary(
                            "===",
                            Scope.parameter(scope, "this"),
                            Tree.primitive(null)),
                          Tree.builtin("global"),
                          Tree.conditional(
                            Tree.binary(
                              "===",
                              Scope.parameter(scope, "this"),
                              Tree.primitive(void 0)),
                            Tree.builtin("global"),
                            Tree.apply(
                              Tree.builtin("Object"),
                              Tree.primitive(void 0),
                              [
                                Scope.parameter(scope, "this")])))))))))),
          // We initialize parameters first to avoid TDZ on proxified arguments.
          Tree.Bundle(
            ArrayLite.map(
              node.params,
              (pattern, index) => Tree.Lift(
                (
                  pattern.type === "RestElement" ?
                  Assign.assign(
                    scope,
                    pattern.argument,
                    Tree.apply(
                      Tree.builtin("Array.prototype.slice"),
                      Scope.parameter(scope, "arguments"),
                      [
                        Tree.primitive(index)]),
                    true) :
                  Assign.assign(
                    scope,
                    pattern,
                    Mop.get(
                      Scope.parameter(scope, "arguments"),
                      Tree.primitive(index),
                      null),
                    true))))),
          (
            (
              completion === Completion._arrow ||
              ("arguments" in hoisting)) ?
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
                        !ArrayLite.every(node.params, Query._is_identifier)) ?
                      closure() :
                      Scope.box(
                        scope,
                        "ClosureMarker",
                        false,
                        Tree.object(
                          Tree.primitive(null),
                          []),
                        (marker_box) => Tree.construct(
                          Tree.builtin("Proxy"),
                          [
                            Tree.apply(
                              Tree.builtin("Array.prototype.fill"),
                              closure(),
                              [
                                Scope.get(scope, marker_box)]),
                            Tree.object(
                              Tree.primitive(null),
                              [
                                [
                                  Tree.primitive("defineProperty"),
                                  Tree.arrow(
                                    Scope.EXTEND_STATIC(
                                      Scope._extend_closure(scope),
                                      {__proto__:null},
                                      (scope) => Scope.Box(
                                        scope,
                                        "target",
                                        false,
                                        Mop.get(
                                          Scope.parameter(scope, "arguments"),
                                          Tree.primitive(0),
                                          null),
                                        (target_box) => Scope.Box(
                                          scope,
                                          "key",
                                          false,
                                          Mop.get(
                                            Scope.parameter(scope, "arguments"),
                                            Tree.primitive(1),
                                            null),
                                          (key_box) => Scope.Box(
                                            scope,
                                            "descriptor",
                                            false,
                                            Mop.get(
                                              Scope.parameter(scope, "arguments"),
                                              Tree.primitive(2),
                                              null),
                                            (descriptor_box) => Tree.Return(
                                              Tree.conditional(
                                                Tree.conditional(
                                                  Tree.binary(
                                                    "===",
                                                    Mop.get(
                                                      Mop.getOwnPropertyDescriptor(
                                                        Scope.get(scope, target_box),
                                                        Scope.get(scope, key_box)),
                                                      Tree.primitive("value"),
                                                      null),
                                                    Scope.get(scope, marker_box)),
                                                  Tree.conditional(
                                                    Mop.getOwnPropertyDescriptor(
                                                      Scope.get(scope, descriptor_box),
                                                      Tree.primitive("value")),
                                                    Tree.conditional(
                                                      Mop.get(
                                                        Scope.get(scope, descriptor_box),
                                                        Tree.primitive("writable"),
                                                        null),
                                                      Mop.get(
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
                                                        Mop.get(
                                                          Scope.get(scope, descriptor_box),
                                                          Tree.primitive("value"),
                                                          null)),
                                                      expression),
                                                    Tree.throw(
                                                      Tree.primitive("This should never happen, please contact the dev"))),
                                                  Tree.primitive(true)),
                                                Tree.apply(
                                                  Tree.builtin("Reflect.defineProperty"),
                                                  Tree.primitive(void 0),
                                                  [
                                                    Scope.get(scope, target_box),
                                                    Scope.get(scope, key_box),
                                                    Scope.get(scope, descriptor_box)]))))))))],
                              [
                                Tree.primitive("getOwnPropertyDescriptor"),
                                Tree.arrow(
                                  Scope.EXTEND_STATIC(
                                    Scope._extend_closure(scope),
                                    {__proto__:null},
                                    (scope) => Scope.Box(
                                      scope,
                                      "target",
                                      false,
                                      Mop.get(
                                        Scope.parameter(scope, "arguments"),
                                        Tree.primitive(0),
                                        null),
                                      (target_box) => Scope.Box(
                                        scope,
                                        "key",
                                        false,
                                        Mop.get(
                                          Scope.parameter(scope, "arguments"),
                                          Tree.primitive(1),
                                          null),
                                        (key_box) => Scope.Box(
                                          scope,
                                          "descriptor",
                                          false,
                                          Mop.getOwnPropertyDescriptor(
                                            Scope.get(scope, target_box),
                                            Scope.get(scope, key_box)),
                                          (descriptor_box) => Tree.Bundle(
                                            [
                                              Tree.Lift(
                                                Tree.conditional(
                                                  Tree.conditional(
                                                    Mop.getOwnPropertyDescriptor(
                                                      Scope.get(scope, descriptor_box),
                                                      Tree.primitive("value")),
                                                    Tree.binary(
                                                      "===",
                                                      Mop.get(
                                                        Scope.get(scope, descriptor_box),
                                                        Tree.primitive("value"),
                                                        null),
                                                      Scope.get(scope, marker_box)),
                                                    Tree.primitive(false)),
                                                  Mop.set(
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
                                                    false),
                                                  Tree.primitive(void 0))),
                                              Tree.Return(
                                                Scope.get(scope, descriptor_box))]))))))],
                              [
                                Tree.primitive("get"),
                                Tree.arrow(
                                  Scope.EXTEND_STATIC(
                                    Scope._extend_closure(scope),
                                    {__proto__:null},
                                    (scope) => Scope.Box(
                                      scope,
                                      "target",
                                      false,
                                      Mop.get(
                                        Scope.parameter(scope, "arguments"),
                                        Tree.primitive(0),
                                        null),
                                      (target_box) => Scope.Box(
                                        scope,
                                        "key",
                                        false,
                                        Mop.get(
                                          Scope.parameter(scope, "arguments"),
                                          Tree.primitive(1),
                                          null),
                                        (key_box) => Scope.Box(
                                          scope,
                                          "receiver",
                                          false,
                                          Mop.get(
                                            Scope.parameter(scope, "arguments"),
                                            Tree.primitive(2),
                                            null),
                                          (receiver_box) => Scope.Box(
                                            scope,
                                            "value",
                                            false,
                                            Mop.get(
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
                                                Scope.get(scope, value_box)))))))))]])]))))
                  (
                    () => Tree.apply(
                      Tree.builtin("Object.assign"),
                      Tree.primitive(void 0),
                      [
                        Mop.create(
                          Tree.builtin("Object.prototype"),
                          [
                            [
                              Tree.primitive("length"),
                              {
                                __proto__: null,
                                value: Mop.get(
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
                                  get: Tree.builtin("Function.prototype.arguments.__get__"),
                                  set: Tree.builtin("Function.prototype.arguments.__set__"),
                                  enumerable: false,
                                  configurable: false} :
                                {
                                  __proto__: null,
                                  value: Scope.get(scope, callee_nullable_box),
                                  writable: true,
                                  enumerable: false,
                                  configurable: true})],
                            [
                              Tree.builtin("Symbol.iterator"),
                              {
                                __proto__: null,
                                value: Tree.builtin("Array.prototype.values"),
                                writable: true,
                                enumerable: false,
                                configurable: true}]]),
                        Scope.parameter(scope, "arguments")])))))),
          (
            node.expression ?
            Tree.Return(
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
                    "frame",
                    true,
                    Tree.object(
                      Tree.primitive(null),
                      []),
                    (frame_box) => closure(
                      Scope._extend_dynamic(scope, frame_box, null))) :
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
                              ArrayLite.filter(node.body.body, Query._is_function_declaration),
                              ArrayLite.filter(node.body.body, Query._is_not_function_declaration)),
                            (statement) => Statement.Visit(scope, statement, completion, [])))))))))),
          Tree.Return(
            (
              (
                completion === Completion._arrow ||
                completion === Completion._method) ?
              Tree.primitive(void 0) :
              (
                completion === Completion._constructor ?
                Scope.read(scope, "this") :
                (
                  completion === Completion._derived_constructor ?
                  Tree.conditional(
                    Scope.read(scope, "this"),
                    Scope.read(scope, "this"),
                    Tree.throw(
                      Tree.construct(
                        Tree.builtin("ReferenceError"),
                        [
                          Tree.primitive("Must call super constructor in derived class before accessing 'this' or returning from derived constructor")]))) :
                  Tree.conditional( // console.assert(completion === Completion._function)
                    Scope.read(scope, "new.target"),
                    Scope.read(scope, "this"),
                    Tree.primitive(void 0))))))]))),
  _expression = Tree.apply(
    Tree.builtin("Object.defineProperty"),
    Tree.primitive(void 0),
    [
      _expression,
      Tree.primitive("length"),
      Tree.object(
        Tree.primitive(null),
        [
          [
            Tree.primitive("value"),
            Tree.primitive(
              (
                (
                  node.params.length > 0 &&
                  node.params[node.params.length - 1].type === "RestElement") ?
                node.params.length - 1 :
                node.params.length))],
          [
            Tree.primitive("configurable"),
            Tree.primitive(true)]])]),
  _expression = Tree.apply(
    Tree.builtin("Object.defineProperty"),
    Tree.primitive(void 0),
    [
      _expression,
      Tree.primitive("name"),
      Tree.object(
        Tree.primitive(null),
        [
          [
            Tree.primitive("value"),
            (
              node.id === null ?
              (
                name_nullable_box === null ?
                Tree.primitive("") :
                Scope.get(scope, name_nullable_box)) :
              Tree.primitive(node.id.name))],
          [
            Tree.primitive("configurable"),
            Tree.primitive(true)]])]),
  (
    (
      completion === Completion._function &&
      !Scope._is_strict(scope)) ?
    (
      _expression = Tree.apply(
        Tree.builtin("Object.defineProperty"),
        Tree.primitive(void 0),
        [
          _expression,
          Tree.primitive("arguments"),
          Tree.object(
            Tree.primitive(null),
            [
              [
                Tree.primitive("value"),
                Tree.primitive(null)]])]),
      _expression = Tree.apply(
        Tree.builtin("Object.defineProperty"),
        Tree.primitive(void 0),
        [
          _expression,
          Tree.primitive("caller"),
          Tree.object(
            Tree.primitive(null),
            [
              [
                Tree.primitive("value"),
                Tree.primitive(null)]])])) :
    null),
  (
    completion === Completion._function ?
    _expression = Scope.box(
      scope,
      "ClosureConstructor",
      false,
      _expression,
      (constructor_box) => Tree.apply(
        Tree.builtin("Object.defineProperty"),
        Tree.primitive(void 0),
        [
          Scope.get(scope, constructor_box),
          Tree.primitive("prototype"),
          Tree.object(
            Tree.primitive(null),
            [
              [
                Tree.primitive("value"),
                Tree.apply(
                  Tree.builtin("Object.defineProperty"),
                  Tree.primitive(void 0),
                  [
                    Tree.object(
                      Tree.builtin("Object.prototype"),
                      []),
                    Tree.primitive("constructor"),
                    Tree.object(
                      Tree.primitive(null),
                      [
                        [
                          Tree.primitive("value"),
                          Scope.get(scope, constructor_box)],
                        [
                          Tree.primitive("writable"),
                          Tree.primitive(true)],
                        [
                          Tree.primitive("configurable"),
                          Tree.primitive(true)]])])],
              [
                Tree.primitive("writable"),
                Tree.primitive(true)]])])) :
    null),
  _expression);
