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
//     if (typeof x === "function" || (typeof x === "object" && x !== null)) {
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

const ArrayLite = require("array-lite");
const Tree = require("../tree.js");
const Scope = require("../scope/index.js");
const Object = require("../object.js");
const Query = require("../query/index.js");
const Pattern = require("./pattern.js");
const Completion = require("../completion.js");
let Expression = null;
let Block = null;

exports._resolve_circular_dependencies = (object1, object2) => {
  Expression = object1;
  Block = object2;
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

exports.class = (scope, node, name) => { throw new global_Error("Unfortunately, Aran does not yet support classes.") };

exports.arrow = (scope, node, name) => (
  node.async ?
  (
    (
      () => { throw new global_Error("Unfortunately, Aran does not yet support asynchronous arrows.") })
      ()) :
  Tree.apply(
    Tree.builtin("Object.defineProperty"),
    Tree.primitive(void 0),
    [
      Tree.apply(
        Tree.builtin("Object.defineProperty"),
        Tree.primitive(void 0),
        [
          Tree.arrow(
            Scope.EXTEND_STATIC(
              Scope._extend_closure(
                (
                  (
                    !node.expression &&
                    Query._is_use_strict(node.body.body)) ?
                  Scope._extend_use_strict(scope) :
                  scope)),
              Query._get_parameter_array_hoisting(node.params),
              (scope) => Tree.Bundle(
                ArrayLite.concat(
                  ArrayLite.map(
                    node.params,
                    (pattern, index) => Tree.Lift(
                      (
                        pattern.type === "RestElement" ?
                        Pattern.assign(
                          scope,
                          pattern.argument,
                          Tree.apply(
                            Tree.builtin("Array.prototype.slice"),
                            Scope.parameter(scope, "arguments"),
                            [
                              Tree.primitive(index)]),
                          true) :
                        Pattern.assign(
                          scope,
                          pattern,
                          Tree.apply(
                            Tree.builtin("Reflect.get"),
                            Tree.primitive(void 0),
                            [
                              Scope.parameter(scope, "arguments"),
                              Tree.primitive(index)]),
                          true)))),
                  [
                    (
                      (
                        (closure) => (
                          (
                            !Scope._is_strict(scope) &&
                            Query._has_direct_eval_call(
                              (
                                node.expression ?
                                [
                                  {
                                    type: "ReturnStatement",
                                    argument: node.body}] :
                                node.body.body))) ?
                          Scope.Box(
                            scope,
                            "EvalFrame",
                            true,
                            Tree.object(
                              Tree.primitive(null),
                              []),
                            (frame_box) => closure(
                              Scope._extend_dynamic(scope, frame_box, null))) :
                          closure(scope)))
                      (
                        (scope) => (
                          node.expression ?
                          Tree.Return(
                            Expression.visit(scope, node.body, false, null)) :
                          Tree.Bundle(
                            [
                              Tree.Lone(
                                [],
                                Block.CLOSURE(
                                  scope,
                                  node.body.body,
                                  Completion._make_arrow())),
                              Tree.Return(
                                Tree.primitive(void 0))]))))])))),
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
      Tree.primitive("name"),
      Tree.object(
        Tree.primitive(null),
        [
          [
            Tree.primitive("value"),
            (
              name === null ?
              Tree.primitive("") :
              Scope.get(scope, name))],
          [
            Tree.primitive("configurable"),
            Tree.primitive(true)]])]));

exports.function = (scope, node, name, _hoisting) => (
  node.generator ?
  (
    (
      () => { throw new global_Error("Unfortunately, Aran does not yet support generator functions.") })
      ()) :
  (
    node.async ?
    (
      (
        () => { throw new global_Error("Unfortunately, Aran does not yet support asynchronous functions.") })
        ()) :
    (
      _hoisting = Query._get_implicit_hoisting(node),
      Scope.box(
        scope,
        "function",
        true,
        Tree.primitive(null),
        (box, _expression) => Tree.sequence(
          Scope.set(
            scope,
            box,
            (
              _expression = Tree.apply(
                Tree.builtin("Object.defineProperty"),
                Tree.primitive(void 0),
                [
                  Tree.apply(
                    Tree.builtin("Object.defineProperty"),
                    Tree.primitive(void 0),
                    [
                      Tree.function(
                        Scope.EXTEND_STATIC(
                          Scope._extend_closure(
                            (
                              Query._is_use_strict(node.body.body) ?
                              Scope._extend_use_strict(scope) :
                              scope)),
                          global_Object_assign(
                            {__proto__:null},
                            _hoisting,
                            Query._get_parameter_array_hoisting(node.params)),
                          (scope) => Tree.Bundle(
                            [
                              (
                                (
                                  node.id !== null &&
                                  node.id.name in _hoisting) ?
                                Tree.Lift(
                                  Scope.initialize(
                                    scope,
                                    node.id.name,
                                    Scope.get(scope, box))) :
                                Tree.Bundle([])),
                              (
                                ("new.target" in _hoisting) ?
                                Tree.Lift(
                                  Scope.initialize(
                                    scope,
                                    "new.target",
                                    Scope.parameter(scope, "new.target"))) :
                                Tree.Bundle([])),
                              (
                                ("this" in _hoisting) ?
                                Tree.Lift(
                                  Scope.initialize(
                                    scope,
                                    "this",
                                    Tree.conditional(
                                      Scope.parameter(scope, "new.target"),
                                      Tree.object(
                                        Tree.apply(
                                          Tree.builtin("Reflect.get"),
                                          Tree.primitive(void 0),
                                          [
                                            Scope.parameter(scope, "new.target"),
                                            Tree.primitive("prototype")]),
                                        []),
                                      (
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
                                                Scope.parameter(scope, "this")]))))))) :
                                Tree.Bundle([])),
                              // First we initialize the arguments to prevent a dynamic temporal
                              // deadzone from appearing inside the potential proxy's traps
                              Tree.Bundle(
                                ArrayLite.map(
                                  node.params,
                                  (pattern, index) => Tree.Lift(
                                    (
                                      pattern.type === "RestElement" ?
                                      Pattern.assign(
                                        scope,
                                        pattern.argument,
                                        Tree.apply(
                                          Tree.builtin("Array.prototype.slice"),
                                          Scope.parameter(scope, "arguments"),
                                          [
                                            Tree.primitive(index)]),
                                        true) :
                                      Pattern.assign(
                                        scope,
                                        pattern,
                                        Tree.apply(
                                          Tree.builtin("Reflect.get"),
                                          Tree.primitive(void 0),
                                          [
                                            Scope.parameter(scope, "arguments"),
                                            Tree.primitive(index)]),
                                        true))))),
                              (
                                ("arguments" in _hoisting) ?
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
                                          closure(
                                            Tree.apply(
                                              Tree.builtin("Object.assign"),
                                              Tree.primitive(void 0),
                                              [
                                                Tree.object(
                                                  Tree.builtin("Object.prototype"),
                                                  []),
                                                Scope.parameter(scope, "arguments")])) :
                                          Scope.box(
                                            scope,
                                            "marker",
                                            false,
                                            Tree.object(
                                              Tree.primitive(null),
                                              []),
                                            (marker_box) => Tree.construct(
                                              Tree.builtin("Proxy"),
                                              [
                                                Tree.apply(
                                                  Tree.builtin("Array.prototype.fill"),
                                                  closure(
                                                    Tree.apply(
                                                      Tree.builtin("Object.assign"),
                                                      Tree.primitive(void 0),
                                                      [
                                                        Tree.object(
                                                          Tree.builtin("Object.prototype"),
                                                          []),
                                                        Scope.parameter(scope, "arguments")])),
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
                                                            Tree.apply(
                                                              Tree.builtin("Reflect.get"),
                                                              Tree.primitive(void 0),
                                                              [
                                                                Scope.parameter(scope, "arguments"),
                                                                Tree.primitive(0)]),
                                                            (target_box) => Scope.Box(
                                                              scope,
                                                              "key",
                                                              false,
                                                              Tree.apply(
                                                                Tree.builtin("Reflect.get"),
                                                                Tree.primitive(void 0),
                                                                [
                                                                  Scope.parameter(scope, "arguments"),
                                                                  Tree.primitive(1)]),
                                                              (key_box) => Scope.Box(
                                                                scope,
                                                                "descriptor",
                                                                false,
                                                                Tree.apply(
                                                                  Tree.builtin("Reflect.get"),
                                                                  Tree.primitive(void 0),
                                                                  [
                                                                    Scope.parameter(scope, "arguments"),
                                                                    Tree.primitive(2)]),
                                                                (descriptor_box) => Tree.Return(
                                                                  Tree.conditional(
                                                                    Tree.conditional(
                                                                      Tree.binary(
                                                                        "===",
                                                                        Tree.apply(
                                                                          Tree.builtin("Reflect.get"),
                                                                          Tree.primitive(void 0),
                                                                          [
                                                                            Tree.apply(
                                                                              Tree.builtin("Reflect.getOwnPropertyDescriptor"),
                                                                              Tree.primitive(void 0),
                                                                              [
                                                                                Scope.get(scope, target_box),
                                                                                Scope.get(scope, key_box)]),
                                                                            Tree.primitive("value")]),
                                                                        Scope.get(scope, marker_box)),
                                                                      Tree.conditional(
                                                                        Tree.apply(
                                                                          Tree.builtin("Reflect.getOwnPropertyDescriptor"),
                                                                          Tree.primitive(void 0),
                                                                          [
                                                                            Scope.get(scope, descriptor_box),
                                                                            Tree.primitive("value")]),
                                                                        Tree.conditional(
                                                                          Tree.apply(
                                                                            Tree.builtin("Reflect.get"),
                                                                            Tree.primitive(void 0),
                                                                            [
                                                                              Scope.get(scope, descriptor_box),
                                                                              Tree.primitive("writable")]),
                                                                          Tree.apply(
                                                                            Tree.builtin("Reflect.get"),
                                                                            Tree.primitive(void 0),
                                                                            [
                                                                              Scope.get(scope, descriptor_box),
                                                                              Tree.primitive("configurable")]),
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
                                                                            Tree.apply(
                                                                              Tree.builtin("Reflect.get"),
                                                                              Tree.primitive(void 0),
                                                                              [
                                                                                Scope.get(scope, descriptor_box),
                                                                                Tree.primitive("value")])),
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
                                                          Tree.apply(
                                                            Tree.builtin("Reflect.get"),
                                                            Tree.primitive(void 0),
                                                            [
                                                              Scope.parameter(scope, "arguments"),
                                                              Tree.primitive(0)]),
                                                          (target_box) => Scope.Box(
                                                            scope,
                                                            "key",
                                                            false,
                                                            Tree.apply(
                                                              Tree.builtin("Reflect.get"),
                                                              Tree.primitive(void 0),
                                                              [
                                                                Scope.parameter(scope, "arguments"),
                                                                Tree.primitive(1)]),
                                                            (key_box) => Scope.Box(
                                                              scope,
                                                              "descriptor",
                                                              false,
                                                              Tree.apply(
                                                                Tree.builtin("Reflect.getOwnPropertyDescriptor"),
                                                                Tree.primitive(void 0),
                                                                [
                                                                  Scope.get(scope, target_box),
                                                                  Scope.get(scope, key_box)]),
                                                              (descriptor_box) => Tree.Bundle(
                                                                [
                                                                  Tree.Lift(
                                                                    Tree.conditional(
                                                                      Tree.conditional(
                                                                        Tree.apply(
                                                                          Tree.builtin("Reflect.getOwnPropertyDescriptor"),
                                                                          Tree.primitive(void 0),
                                                                          [
                                                                            Scope.get(scope, descriptor_box),
                                                                            Tree.primitive("value")]),
                                                                        Tree.binary(
                                                                          "===",
                                                                          Tree.apply(
                                                                            Tree.builtin("Reflect.get"),
                                                                            Tree.primitive(void 0),
                                                                            [
                                                                              Scope.get(scope, descriptor_box),
                                                                              Tree.primitive("value")]),
                                                                          Scope.get(scope, marker_box)),
                                                                        Tree.primitive(false)),
                                                                      Tree.apply(
                                                                        Tree.builtin("Reflect.set"),
                                                                        Tree.primitive(void 0),
                                                                        [
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
                                                                              Tree.primitive("This should never happen, please contact the dev")))]),
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
                                                          Tree.apply(
                                                            Tree.builtin("Reflect.get"),
                                                            Tree.primitive(void 0),
                                                            [
                                                              Scope.parameter(scope, "arguments"),
                                                              Tree.primitive(0)]),
                                                          (target_box) => Scope.Box(
                                                            scope,
                                                            "key",
                                                            false,
                                                            Tree.apply(
                                                              Tree.builtin("Reflect.get"),
                                                              Tree.primitive(void 0),
                                                              [
                                                                Scope.parameter(scope, "arguments"),
                                                                Tree.primitive(1)]),
                                                            (key_box) => Scope.Box(
                                                              scope,
                                                              "receiver",
                                                              false,
                                                              Tree.apply(
                                                                Tree.builtin("Reflect.get"),
                                                                Tree.primitive(void 0),
                                                                [
                                                                  Scope.parameter(scope, "arguments"),
                                                                  Tree.primitive(2)]),
                                                              (receiver_box) => Scope.Box(
                                                                scope,
                                                                "value",
                                                                false,
                                                                Tree.apply(
                                                                  Tree.builtin("Reflect.get"),
                                                                  Tree.primitive(void 0),
                                                                  [
                                                                    Scope.get(scope, target_box),
                                                                    Scope.get(scope, key_box),
                                                                    Scope.get(scope, receiver_box)]),
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
                                        (expression) => Tree.apply(
                                          Tree.builtin("Object.defineProperty"),
                                          Tree.primitive(void 0),
                                          [
                                            Tree.apply(
                                              Tree.builtin("Object.defineProperty"),
                                              Tree.primitive(void 0),
                                              [
                                                Tree.apply(
                                                  Tree.builtin("Object.defineProperty"),
                                                  Tree.primitive(void 0),
                                                  [
                                                    expression,
                                                    Tree.primitive("length"),
                                                    Tree.object(
                                                      Tree.primitive(null),
                                                      [
                                                        [
                                                          Tree.primitive("value"),
                                                          Object.get(
                                                            Scope.parameter(scope, "arguments"),
                                                            Tree.primitive("length"))],
                                                        [
                                                          Tree.primitive("writable"),
                                                          Tree.primitive(true)],
                                                        [
                                                          Tree.primitive("configurable"),
                                                          Tree.primitive(true)]])]),
                                                Tree.primitive("callee"),
                                                Tree.object(
                                                  Tree.primitive(null),
                                                  (
                                                    Scope._is_strict(scope) ?
                                                    [
                                                      [
                                                        Tree.primitive("get"),
                                                        Tree.builtin("Function.prototype.arguments.__get__")],
                                                      [
                                                        Tree.primitive("set"),
                                                        Tree.builtin("Function.prototype.arguments.__set__")]] :
                                                    [
                                                      [
                                                        Tree.primitive("value"),
                                                        Scope.get(scope, box)],
                                                      [
                                                        Tree.primitive("writable"),
                                                        Tree.primitive(true)],
                                                      [
                                                        Tree.primitive("configurable"),
                                                        Tree.primitive(true)]]))]),
                                            Tree.builtin("Symbol.iterator"),
                                            Tree.object(
                                              Tree.primitive(null),
                                              [
                                                [
                                                  Tree.primitive("value"),
                                                  Tree.builtin("Array.prototype.values")],
                                                [
                                                  Tree.primitive("writable"),
                                                  Tree.primitive(true)],
                                                [
                                                  Tree.primitive("configurable"),
                                                  Tree.primitive(true)]])]))))) :
                                Tree.Bundle([])),
                              (
                                (
                                  (closure) => (
                                    (
                                      !Scope._is_strict(scope) &&
                                      Query._has_direct_eval_call(node.body.body)) ?
                                    Scope.Box(
                                      scope,
                                      "EvalFrame",
                                      true,
                                      Tree.object(
                                        Tree.primitive(null),
                                        []),
                                      (frame_box) => closure(
                                        Scope._extend_dynamic(scope, frame_box, null))) :
                                    closure(scope)))
                                (
                                  (scope) => Tree.Lone(
                                    [],
                                    Block.CLOSURE(
                                      scope,
                                      node.body.body,
                                      Completion._make_function())))),
                              Tree.Return(
                                Tree.conditional(
                                  Scope.parameter(scope, "new.target"),
                                  (
                                    "this" in _hoisting ?
                                    Scope.read(scope, "this") :
                                    Tree.object(
                                      Tree.apply(
                                        Tree.builtin("Reflect.get"),
                                        Tree.primitive(void 0),
                                        [
                                          Scope.parameter(scope, "new.target"),
                                          Tree.primitive("prototype")]),
                                      [])),
                                  Tree.primitive(void 0)))]))),
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
                  Tree.primitive("name"),
                  Tree.object(
                    Tree.primitive(null),
                    [
                      [
                        Tree.primitive("value"),
                        (
                          node.id === null ?
                          (
                            name === null ?
                            Tree.primitive("") :
                            Scope.get(scope, name)) :
                          Tree.primitive(node.id.name))],
                      [
                        Tree.primitive("configurable"),
                        Tree.primitive(true)]])]),
              (
                (
                  Scope._is_strict(scope) ||
                  Query._is_use_strict(node.body.body)) ?
                _expression :
                Tree.apply(
                  Tree.builtin("Object.defineProperty"),
                  Tree.primitive(void 0),
                  [
                    Tree.apply(
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
                    Tree.primitive("caller"),
                    Tree.object(
                      Tree.primitive(null),
                      [
                        [
                          Tree.primitive("value"),
                          Tree.primitive(null)]])])))),
          Tree.sequence(
            Tree.apply(
              Tree.builtin("Reflect.set"),
              Tree.primitive(void 0),
              [
                Scope.get(scope, box),
                Tree.primitive("prototype"),
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
                           Scope.get(scope, box)],
                        [
                          Tree.primitive("writable"),
                          Tree.primitive(true)],
                        [
                          Tree.primitive("configurable"),
                          Tree.primitive(true)]])])]),
              Scope.get(scope, box)))))));
