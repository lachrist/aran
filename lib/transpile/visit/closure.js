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

const global_String = global.String;
const global_Object_assign = global.Object.assign;
const global_Reflect_ownKeys = global.Reflect.ownKeys;

const ArrayLite = require("array-lite");
const Throw = require("../../throw.js");
const Tree = require("../tree.js");
const State = require("../state.js");
const Scope = require("../scope/index.js");
const Builtin = require("../builtin.js");
const Query = require("../query");
const Visit = require("./index.js");

const is_identifier_node = (node) => node.type === "Identifier";

const is_arguments_variable = (variable) => variable.name === "arguments";

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

exports.closure = (scope, node, context, _hoisting1, _hoisting2, _has_callee, _has_new_target, _has_this, _has_arguments, _bindings, _expression) => (
  Throw.assert(
    (
      node.type === "ArrowFunctionExpression" ||
      node.type === "FunctionExpression" ||
      node.type === "FunctionDeclaration"),
    null,
    `Invalid closure node`),
  (
    context = global_Object_assign(
      {
        sort: node.type === "ArrowFunctionExpression" ? "arrow" : "function",
        prototype: null,
        self: null,
        super: null,
        accessor: null,
        name: null},
      context),
    context.sort = (
      context.sort === null ?
      (
        node.type === "ArrowFunctionExpression" ?
        "arrow" :
        "function") :
      context.sort),
    Throw.assert(
      (
        (context.sort === "arrow") ===
        (node.type === "ArrowFunctionExpression")),
      null,
      `context.sort and node.type missmatch`),
    Throw.assert(
      (
        context.sort === "arrow" ||
        !node.generator),
      Throw.MissingFeatureAranError,
      `Unfortunately, Aran does not yet support generator closures`,
      `generator-closure`),
    Throw.assert(
      !node.async,
      Throw.MissingFeatureAranError,
      `Unfortunately, Aran does not yet support asynchronous closures`,
      `asynchronous-closure`),
    scope = (
      (
        (
          context.sort === "arrow" &&
          node.expression) ||
        !Query._has_use_strict_directive(node.body.body)) ?
      scope :
      Scope._use_strict(scope)),
    _hoisting1 = ArrayLite.flatMap(
      node.params,
      Query._get_parameter_hoisting),
    _hoisting2 = (
      (
        context.sort === "arrow" &&
        node.expression) ?
      [] :
      Query._get_deep_hoisting(node.body)),
    _has_callee = (
      context.sort !== "arrow" &&
      node.id !== null &&
      !ArrayLite.some(
        _hoisting1,
        ({name}) => name === node.id.name)),
    _has_new_target = context.sort !== "arrow",
    _has_this = context.sort !== "arrow",
    _has_arguments = (
      context.sort !== "arrow" &&
      !ArrayLite.some(_hoisting1, is_arguments_variable)),
    _bindings = [],
    _expression = Tree[context.sort](
      Scope.CLOSURE_HEAD(
        scope,
        context,
        (
          !Scope._is_strict(scope) &&
          Query._has_direct_eval_call(node.params)),
        ArrayLite.concat(
          (
            _has_callee ?
            [
              {kind:"var", name:node.id.name, ghost:false, exports:[]}] :
            []),
          (
            _has_arguments ?
            [
              {kind:"var", name:"arguments", ghost:false, exports:[]}] :
            []),
          (
            _has_this ?
            [
              {kind:"param", name:"this", ghost:false, exports:[]}] :
            []),
          (
            _has_new_target ?
            [
              {kind:"param", name:"new.target", ghost:false, exports:[]}] :
            []),
          (
            (
              context.sort === "function" &&
              !Scope._is_strict(scope) &&
              node.params.length > 0 && // preference for alternate (does not matter here)
              ArrayLite.every(node.params, is_identifier_node)) ?
            ArrayLite.filter(
              _hoisting1,
              (variable1, index, variables) => (
                ArrayLite.findIndex(
                  variables,
                  (variable2) => variable1.name === variable2.name) ===
                index)) :
            _hoisting1)),
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
              _has_new_target ?
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
                      // Constructor can be simulated as function because we can check inside
                      // the body of the function whether it was called as a constructor:
                      //
                      // > const p = new Proxy(class {}, { apply:() => console.log("apply-triggered") });
                      // undefined
                      // > p();
                      // apply-triggered
                      //
                      // This is not the case for arrow:
                      //
                      // > const p = new Proxy(() => {}, { construct: () => console.log("construct-triggered") });
                      // undefined
                      // > new p();
                      // Uncaught TypeError: p is not a constructor
                      //
                      // And not for methods:
                      //
                      // > const p = new Proxy({foo () {}}.foo, { construct: () => console.log("construct-triggered") });
                      // undefined
                      // > new p();
                      // Uncaught TypeError: p is not a constructor
                      Tree.conditional(
                        Scope.parameter(scope, "new.target"),
                        Scope.parameter(scope, "new.target"),
                        Builtin.throw_type_error("Closure must be invoked as a constructor")) :
                      Scope.parameter(scope, "new.target"))))) :
                Tree.Bundle([])), // console.assert(context.sort === "function")
            (
              _has_this ?
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
                            Builtin.grab("aran.globalObjectRecord"),
                            null))))))) :
              Tree.Bundle([])),
            (
              _has_arguments ?
              Tree.Lift(
                Scope.initialize(
                  scope,
                  "var",
                  "arguments",
                  Builtin.assign(
                    Builtin.define_property(
                      Builtin.define_property(
                        Builtin.define_property(
                          Builtin.construct_object(
                            Builtin.grab("Object.prototype"),
                            []),
                          Tree.primitive("length"),
                          {
                            __proto__: null,
                            value: Builtin.get(
                              Scope.parameter(scope, "arguments"),
                              Tree.primitive("length"),
                              null),
                            writable: true,
                            enumerable: false,
                            configurable: true},
                          true,
                          Builtin._target_result),
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
                            configurable: true}),
                        true,
                        Builtin._target_result),
                      Builtin.grab("Symbol.iterator"),
                      {
                        __proto__: null,
                        value: Builtin.grab("Array.prototype.values"),
                        writable: true,
                        enumerable: false,
                        configurable: true},
                      true,
                      Builtin._target_result),
                    [
                      Scope.parameter(scope, "arguments")],
                    true,
                    Builtin._target_result))) :
              Tree.Bundle([])),
            (
              (
                context.sort === "function" &&
                !Scope._is_strict(scope) &&
                node.params.length > 0 && // preference for alternate (does not matter here)
                ArrayLite.every(node.params, is_identifier_node)) ?
              Tree.Bundle(
                ArrayLite.map(
                  node.params,
                  (pattern1, index1) => (
                    ArrayLite.some(
                      node.params,
                      (pattern2, index2) => (
                        index2 > index1 &&
                        pattern1.name === pattern2.name)) ?
                    Tree.Bundle([]) :
                    Tree.Lift(
                      Visit.pattern(
                        scope,
                        pattern1,
                        {
                          kind: "param",
                          expression: Builtin.get(
                            Scope.parameter(scope, "arguments"),
                            Tree.primitive(index1),
                            null)}))))) :
              Tree.Bundle(
                ArrayLite.map(
                  node.params,
                  (pattern, index) => Tree.Lift(
                    Visit.pattern(
                      scope,
                      pattern,
                      {
                        kind: "param",
                        expression: (
                          pattern.type === "RestElement" ?
                          Builtin.slice(
                            Scope.parameter(scope, "arguments"),
                            Tree.primitive(index),
                            null) :
                          Builtin.get(
                            Scope.parameter(scope, "arguments"),
                            Tree.primitive(index),
                            null))}))))),
            (
              (
                _has_arguments &&
                !Scope._is_strict(scope) &&
                node.params.length > 0 && // preference for alternate (does matter here)
                ArrayLite.every(node.params, is_identifier_node)) ?
              Tree.Lift(
                Scope.write(
                  scope,
                  "arguments",
                  Scope.box(
                    scope,
                    false,
                    "ClosureArgumentMappedMarker",
                    Builtin.construct_object(
                      Tree.primitive(null),
                      []),
                    (marker_box) => Builtin.construct_proxy(
                      Builtin.fill(
                        Scope.read(scope, "arguments"),
                        Scope.get(scope, marker_box),
                        Tree.primitive(0),
                        Builtin.get(
                          Scope.parameter(scope, "arguments"),
                          Tree.primitive("length"),
                          null),
                        true,
                        Builtin._target_result),
                      [
                        [
                          "defineProperty",
                          Tree.arrow(
                            Scope.CLOSURE_HEAD(
                              scope,
                              {
                                sort: "arrow",
                                super: null,
                                self: null,
                                newtarget: false},
                              false,
                              [],
                              (scope) => Scope.Box(
                                scope,
                                false,
                                "target",
                                Builtin.get(
                                  Scope.parameter(scope, "arguments"),
                                  Tree.primitive(0),
                                  null),
                                (target_box) => Scope.Box(
                                  scope,
                                  false,
                                  "key",
                                  Builtin.get(
                                    Scope.parameter(scope, "arguments"),
                                    Tree.primitive(1),
                                    null),
                                  (key_box) => Scope.Box(
                                    scope,
                                    false,
                                    "descriptor",
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
                            Scope.CLOSURE_HEAD(
                              scope,
                              {
                                sort: "arrow",
                                super: null,
                                self: null,
                                newtarget: false},
                              false,
                              [],
                              (scope) => Scope.Box(
                                scope,
                                false,
                                "target",
                                Builtin.get(
                                  Scope.parameter(scope, "arguments"),
                                  Tree.primitive(0),
                                  null),
                                (target_box) => Scope.Box(
                                  scope,
                                  false,
                                  "key",
                                  Builtin.get(
                                    Scope.parameter(scope, "arguments"),
                                    Tree.primitive(1),
                                    null),
                                  (key_box) => Scope.Box(
                                    scope,
                                    false,
                                    "descriptor",
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
                            Scope.CLOSURE_HEAD(
                              scope,
                              {
                                sort: "arrow",
                                super: null,
                                self: null,
                                newtarget: false},
                              false,
                              [],
                              (scope) => Scope.Box(
                                scope,
                                false,
                                "target",
                                Builtin.get(
                                  Scope.parameter(scope, "arguments"),
                                  Tree.primitive(0),
                                  null),
                                (target_box) => Scope.Box(
                                  scope,
                                  false,
                                  "key",
                                  Builtin.get(
                                    Scope.parameter(scope, "arguments"),
                                    Tree.primitive(1),
                                    null),
                                  (key_box) => Scope.Box(
                                    scope,
                                    false,
                                    "receiver",
                                    Builtin.get(
                                      Scope.parameter(scope, "arguments"),
                                      Tree.primitive(2),
                                      null),
                                    (receiver_box) => Scope.Box(
                                      scope,
                                      false,
                                      "value",
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
                                          Scope.get(scope, value_box)))))))))]])))) :
              Tree.Bundle([])),
            (
              (
                _has_arguments &&
                ArrayLite.some(_hoisting2, is_arguments_variable)) ?
              Scope.Box(
                scope,
                false,
                "ArgumentsClosureVariableInitialization",
                Scope.read(scope, "arguments"),
                (box) => (
                  _bindings[_bindings.length] = {identifier:"arguments", box},
                  Tree.Bundle([]))) :
              Tree.Bundle([])),
            ArrayLite.reduce(
              ArrayLite.filter(
                _hoisting1,
                (variable1, index, variables) => (
                  ArrayLite.some(
                    _hoisting2,
                    (variable2) => variable2.name === variable1.name) &&
                  (
                    ArrayLite.findIndex(
                      variables,
                      (variable2) => variable1.name === variable2.name) ===
                    index))),
              (statement, variable) => Scope.Box(
                scope,
                false,
                "ClosureVariableInitialization",
                Scope.read(scope, variable.name),
                (box) => (
                  _bindings[_bindings.length] = {identifier:variable.name, box},
                  statement)),
              Tree.Bundle([])),
            Tree.Lone(
              [],
              Visit.CLOSURE_BODY(scope, node.body, {bindings: _bindings})),
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
                      Builtin.throw_reference_error("Super constructor must be called before returning from closure"))) :
                  Tree.conditional( // console.assert(context.sort === "function")
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
              (
                context.sort === "arrow" ||
                node.id === null) ?
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
            value: Tree.primitive(null),
            writable: false,
            enumerable: false,
            configurable: false},
          true,
          Builtin._target_result),
        _expression = Builtin.define_property(
          _expression,
          Tree.primitive("caller"),
          {
            __proto__: null,
            value: Tree.primitive(null),
            writable: false,
            enumerable: false,
            configurable: false},
          true,
        Builtin._target_result)) :
      null),
    _expression = (
      (
        context.sort === "function" ||
        context.sort === "constructor") ?
      // (
      //   _protoype = {},
      //   Reflect.get(
      //     #Object.defineProperty(
      //       _prototype,
      //       "constructor",
      //       {
      //         value: #Object.defineProperty(
      //           function () {},
      //           "prototype",
      //           {
      //             value: _prototype,
      //             writable: false,
      //             enumerable: false,
      //             configurable: false}),
      //         writable: true,
      //         enumerable: false,
      //         configurable: true}),
      //     "constructor"));
      //
      (
        (
          (closure) => (
            context.prototype === null ?
            Scope.box(
              scope,
              false,
              "ClosurePrototype",
              Builtin.construct_object(
                Builtin.grab("Object.prototype"),
                []),
              closure) :
            closure(context.prototype)))
        (
          (box) => Builtin.get(
            Builtin.define_property(
              Scope.get(scope, box),
              Tree.primitive("constructor"),
              {
                __proto__: null,
                value: Builtin.define_property(
                  _expression,
                  Tree.primitive("prototype"),
                  {
                    __proto__: null,
                    value: Scope.get(scope, box),
                    writable: context.sort === "function",
                    enumerable: false,
                    configurable: false},
                  true,
                  Builtin._target_result),
                writable: true,
                enumerable: false,
                configurable: true},
              true,
              Builtin._target_result),
            Tree.primitive("constructor"),
            null))) :
      _expression),
    _expression));

//     Scope.get(scope, context.constructor),
//     Tree.primitive("prototype"),
//     {
//       __proto__: null,
//       value: Builtin.define_property(
//         Builtin.construct_object(
//           Builtin.grab("Object.prototype"),
//           []),
//         Tree.primitive("constructor"),
//         {
//           __proto__: null,
//           value: Scope.get(scope, constructor_box),
//           writable: true,
//           enumerable: false,
//           configurable: true},
//         true,
//         Builtin._target_result),
//       writable: true,
//       enumerable: false,
//       configurable: false},
//     true,
//     Builtin._target_result)
//   _expression = Scope.box(
//     scope,
//     false,
//     "ClosureConstructor",
//     _expression,
//     (constructor_box) => Builtin.define_property(
//       Scope.get(scope, constructor_box),
//       Tree.primitive("prototype"),
//       {
//         __proto__: null,
//         value: Builtin.define_property(
//           Builtin.construct_object(
//             Builtin.grab("Object.prototype"),
//             []),
//           Tree.primitive("constructor"),
//           {
//             __proto__: null,
//             value: Scope.get(scope, constructor_box),
//             writable: true,
//             enumerable: false,
//             configurable: true},
//           true,
//           Builtin._target_result),
//         writable: true,
//         enumerable: false,
//         configurable: false},
//       true,
//       Builtin._target_result)) :
//   null),
// _expression));