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
const Intrinsic = require("../intrinsic.js");
const Query = require("../query");
const Visit = require("./index.js");

const get_name = (node) => node.name;

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

exports.visitClosure = (scope, node, context, _hoisting1, _hoisting2, _has_callee, _has_new_target, _has_this, _has_arguments, _bindings, _expression, _has_super) => (
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
        sort: null,
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
    scope = (
      (
        (
          context.sort === "arrow" &&
          node.expression) ||
        !Query.hasUseStrictDirective(node.body.body)) ?
      scope :
      Scope.StrictBindingScope(scope)),
    _hoisting1 = ArrayLite.flatMap(
      node.params,
      Query.getParameterHoisting),
    _hoisting2 = (
      (
        context.sort === "arrow" &&
        node.expression) ?
      [] :
      ArrayLite.flatMap(node.body.body, Query.getDeepHoisting)),
    _has_callee = (
      context.sort !== "arrow" &&
      node.id !== null &&
      node.id.name !== "arguments" &&
      !ArrayLite.some(
        _hoisting1,
        ({name}) => name === node.id.name)),
    _has_super = context.sort !== "arrow" && context.sort !== "function",
    _has_new_target = context.sort !== "arrow",
    _has_this = context.sort !== "arrow",
    _has_arguments = (
      context.sort !== "arrow" &&
      !ArrayLite.some(_hoisting1, is_arguments_variable)),
    _bindings = [],
    _expression = Tree.ClosureExpression(
      context.sort === "derived-constructor" ? "constructor" : context.sort,
      node.async,
      context.sort !== "arrow" && node.generator,
      Scope.makeHeadClosureBlock(
        scope,
        context.sort,
        (
          !Scope.isStrict(scope) &&
          ArrayLite.some(node.params, Query.hasDirectEvalCall)),
        ArrayLite.concat(
          (
            _has_callee ?
            [
              {kind:"var", name:node.id.name, ghost:false, exports:[]}] :
            []),
          (
            _has_arguments ?
            // arguments is a parameter because:
            // test262/test/language/eval-code/direct/func-decl-no-pre-existing-arguments-bindings-are-present-declare-arguments.js
            // N.B.: v8 does not conform
            [
              {kind:"param", name:"arguments", ghost:false, exports:[]}] :
            []),
          (
            _has_super ?
            [
              {kind:"param", name:"super", ghost:false, exports:[]}] :
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
              !Scope.isStrict(scope) &&
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
        (scope) => Tree.ListStatement(
          [
            (
              _has_super ?
              Scope.makeInitializeStatement(
                scope,
                "param",
                "super",
                Scope.makeOpenExpression(scope, context.super)) :
              Tree.ListStatement([])),
            (
              _has_new_target ?
              Scope.makeInitializeStatement(
                scope,
                "param",
                "new.target",
                (
                  context.sort === "method" ?
                  Tree.PrimitiveExpression(void 0) :
                  (
                    (
                      context.sort === "constructor" ||
                      context.sort === "derived-constructor") ?
                    // Constructor can be simulated as function because we can check inside
                    // the body of the function whether it was called as a constructor:
                    //
                    // > const p = new Proxy(class {}, { ApplyExpression:() => console.log("apply-triggered") });
                    // undefined
                    // > p();
                    // apply-triggered
                    //
                    // This is not the case for arrow:
                    //
                    // > const p = new Proxy(() => {}, { ConstructExpression: () => console.log("construct-triggered") });
                    // undefined
                    // > new p();
                    // Uncaught TypeError: p is not a constructor
                    //
                    // And not for methods:
                    //
                    // > const p = new Proxy({foo () {}}.foo, { ConstructExpression: () => console.log("construct-triggered") });
                    // undefined
                    // > new p();
                    // Uncaught TypeError: p is not a constructor
                    Tree.ConditionalExpression(
                      Scope.makeInputExpression(scope, "new.target"),
                      Scope.makeInputExpression(scope, "new.target"),
                      Intrinsic.makeThrowTypeErrorExpression("Closure must be invoked as a constructor")) :
                    Scope.makeInputExpression(scope, "new.target")))) :
                Tree.ListStatement([])), // console.assert(context.sort === "function")
            (
              _has_this ?
              Scope.makeInitializeStatement(
                scope,
                "param",
                "this",
                (
                  context.sort === "derived-constructor" ?
                  Tree.PrimitiveExpression(null) :
                  (
                    (
                      (closure1, closure2) => (
                        context.sort === "constructor" ?
                        closure1() :
                        (
                          context.sort === "method" ?
                          closure2() :
                          Tree.ConditionalExpression( // console.assert(context.sort === "function")
                            Scope.makeInputExpression(scope, "new.target"),
                            closure1(),
                            closure2()))))
                    (
                      // N.B.: {__proto__:#Reflect.get(NEW_TARGET.prototype)} <=> #Refect.construct(Object, ARGUMENTS, NEW_TARGET)
                      () => Intrinsic.makeObjectExpression(
                        Intrinsic.makeGetExpression(
                          Scope.makeInputExpression(scope, "new.target"),
                          Tree.PrimitiveExpression("prototype"),
                          null),
                        []),
                      // () => Intrinsic.makeConstructExpression(
                      //   (
                      //     context.super === null ?
                      //     Intrinsic.makeGrabExpression("Object") :
                      //     Scope.makeOpenExpression(scope, context.super)),
                      //   Scope.makeInputExpression(scope, "arguments"),
                      //   Scope.makeInputExpression(scope, "new.target")),
                      () => (
                        Scope.isStrict(scope) ?
                        Scope.makeInputExpression(scope, "this") :
                        Intrinsic.makeNullishExpression(
                          () => Scope.makeInputExpression(scope, "this"),
                          Intrinsic.makeGrabExpression("aran.globalObjectRecord"),
                          null)))))) :
              Tree.ListStatement([])),
            (
              _has_callee ?
              Scope.makeInitializeStatement(
                scope,
                "var",
                node.id.name,
                Scope.makeInputExpression(scope, "callee")) :
              Tree.ListStatement([])),
            (
              _has_arguments ?
              Scope.makeInitializeStatement(
                scope,
                "param",
                "arguments",
                Intrinsic.makeDefinePropertyExpression(
                  Intrinsic.makeDefinePropertyExpression(
                    Intrinsic.makeDefinePropertyExpression(
                      Intrinsic.makeSetPrototypeOfExpression(
                        // First assign *then* set prototype
                        // Object.defineProperty(Object.prototype, "0", {
                        //   __proto__: null,
                        //   get: () => {}
                        // });
                        // ((function () { debugger; }) ("foo"));
                        Intrinsic.makeAssignExpression(
                          Intrinsic.makeObjectExpression(
                            Tree.PrimitiveExpression(null),
                            []),
                          [
                            Scope.makeInputExpression(scope, "arguments")],
                          true,
                          Intrinsic.TARGET_RESULT),
                        Intrinsic.makeGrabExpression("Object.prototype"),
                        true,
                        Intrinsic.TARGET_RESULT),
                      Tree.PrimitiveExpression("length"),
                      {
                        __proto__: null,
                        value: Intrinsic.makeGetExpression(
                          Scope.makeInputExpression(scope, "arguments"),
                          Tree.PrimitiveExpression("length"),
                          null),
                        writable: true,
                        enumerable: false,
                        configurable: true},
                      true,
                      Intrinsic.TARGET_RESULT),
                    Tree.PrimitiveExpression("callee"),
                    (
                      (
                        Scope.isStrict(scope) ||
                        (
                          node.params.length > 0 &&
                          !ArrayLite.every(node.params, is_identifier_node))) ?
                      {
                        __proto__: null,
                        get: Intrinsic.makeGrabExpression("Function.prototype.arguments@get"),
                        set: Intrinsic.makeGrabExpression("Function.prototype.arguments@set"),
                        enumerable: false,
                        configurable: false} :
                      {
                        __proto__: null,
                        value: Scope.makeInputExpression(scope, "callee"),
                        writable: true,
                        enumerable: false,
                        configurable: true}),
                    true,
                    Intrinsic.TARGET_RESULT),
                  Intrinsic.makeGrabExpression("Symbol.iterator"),
                  {
                    __proto__: null,
                    value: Intrinsic.makeGrabExpression("Array.prototype.values"),
                    writable: true,
                    enumerable: false,
                    configurable: true},
                  true,
                  Intrinsic.TARGET_RESULT)) :
              Tree.ListStatement([])),
            (
              (
                context.sort === "function" &&
                !Scope.isStrict(scope) &&
                node.params.length > 0 && // preference for alternate (does not matter here)
                ArrayLite.every(node.params, is_identifier_node)) ?
              Tree.ListStatement(
                ArrayLite.map(
                  node.params,
                  (pattern1, index1) => (
                    ArrayLite.some(
                      node.params,
                      (pattern2, index2) => (
                        index2 > index1 &&
                        pattern1.name === pattern2.name)) ?
                    Tree.ListStatement([]) :
                    Visit.visitPattern(
                      scope,
                      pattern1,
                      {
                        kind: "param",
                        dropped: null,
                        expression: Intrinsic.makeGetExpression(
                          Scope.makeInputExpression(scope, "arguments"),
                          Tree.PrimitiveExpression(index1),
                          null)})))) :
              Tree.ListStatement(
                ArrayLite.map(
                  node.params,
                  (pattern, index) => Visit.visitPattern(
                    scope,
                    pattern,
                    {
                      kind: "param",
                      dropped: null,
                      expression: (
                        pattern.type === "RestElement" ?
                        Intrinsic.makeSliceExpression(
                          Scope.makeInputExpression(scope, "arguments"),
                          Tree.PrimitiveExpression(index),
                          null) :
                        Intrinsic.makeGetExpression(
                          Scope.makeInputExpression(scope, "arguments"),
                          Tree.PrimitiveExpression(index),
                          null))})))),
            (
              (
                _has_arguments &&
                !Scope.isStrict(scope) &&
                node.params.length > 0 && // preference for alternate (does matter here)
                ArrayLite.every(node.params, is_identifier_node)) ?
              Scope.makeBoxStatement(
                scope,
                false,
                "ClosureArgumentMappedMarker",
                Intrinsic.makeObjectExpression(
                  Tree.PrimitiveExpression(null),
                  []),
                (marker_box) => Tree.ListStatement(
                    [
                      Scope.makeBoxStatement(
                        scope,
                        false,
                        "ArgumentsLength",
                        Intrinsic.makeGetExpression(
                          Scope.makeReadExpression(scope, "arguments"),
                          Tree.PrimitiveExpression("length"),
                          null),
                        (length_box) => Tree.ListStatement(
                          ArrayLite.map(
                            ArrayLite.map(node.params, get_name),
                            (identifier, index, identifiers) => (
                              ArrayLite.lastIndexOf(identifiers, identifier) === index ?
                              Tree.ExpressionStatement(
                                Tree.ConditionalExpression(
                                  Tree.BinaryExpression(
                                    "<",
                                    Tree.PrimitiveExpression(index),
                                    Scope.makeOpenExpression(scope, length_box)),
                                  Intrinsic.makeSetExpression(
                                    Scope.makeReadExpression(scope, "arguments"),
                                    Tree.PrimitiveExpression(index),
                                    Scope.makeOpenExpression(scope, marker_box),
                                    null,
                                    false,
                                    Intrinsic.SUCCESS_RESULT),
                                  Tree.PrimitiveExpression(void 0))) :
                              Tree.ListStatement([]))))),
                      Tree.ExpressionStatement(
                        Scope.makeWriteExpression(
                          scope,
                          "arguments",
                          Intrinsic.makeProxyExpression(
                            Scope.makeReadExpression(scope, "arguments"),
                            [
                              [
                                "defineProperty",
                                Tree.ClosureExpression(
                                  "arrow",
                                  false,
                                  false,
                                  Scope.makeHeadClosureBlock(
                                    scope,
                                    {
                                      sort: "arrow",
                                      super: null,
                                      self: null,
                                      newtarget: false},
                                    false,
                                    [],
                                    (scope) => Scope.makeBoxStatement(
                                      scope,
                                      false,
                                      "target",
                                      Intrinsic.makeGetExpression(
                                        Scope.makeInputExpression(scope, "arguments"),
                                        Tree.PrimitiveExpression(0),
                                        null),
                                      (target_box) => Scope.makeBoxStatement(
                                        scope,
                                        false,
                                        "key",
                                        Intrinsic.makeGetExpression(
                                          Scope.makeInputExpression(scope, "arguments"),
                                          Tree.PrimitiveExpression(1),
                                          null),
                                        (key_box) => Scope.makeBoxStatement(
                                          scope,
                                          false,
                                          "NewDescriptor",
                                          Intrinsic.makeGetExpression(
                                            Scope.makeInputExpression(scope, "arguments"),
                                            Tree.PrimitiveExpression(2),
                                            null),
                                          (new_descriptor_box) => Scope.makeBoxStatement(
                                            scope,
                                            false,
                                            "OldDescriptor",
                                            Intrinsic.makeGetOwnPropertyDescriptorExpression(
                                              Scope.makeOpenExpression(scope, target_box),
                                              Scope.makeOpenExpression(scope, key_box)),
                                            (old_descriptor_box) => Tree.CompletionStatement(
                                              Tree.ApplyExpression(
                                                Intrinsic.makeGrabExpression("Reflect.defineProperty"),
                                                Tree.PrimitiveExpression(void 0),
                                                [
                                                  Scope.makeOpenExpression(scope, target_box),
                                                  Scope.makeOpenExpression(scope, key_box),
                                                  Tree.ConditionalExpression(
                                                    Tree.BinaryExpression(
                                                      "===",
                                                      Scope.makeOpenExpression(scope, old_descriptor_box),
                                                      Tree.PrimitiveExpression(void 0)),
                                                    Scope.makeOpenExpression(scope, new_descriptor_box),
                                                    Tree.ConditionalExpression(
                                                      Tree.UnaryExpression(
                                                        "!",
                                                        Intrinsic.makeGetOwnPropertyDescriptorExpression(
                                                          Scope.makeOpenExpression(scope, old_descriptor_box),
                                                          Tree.PrimitiveExpression("value"))),
                                                      Scope.makeOpenExpression(scope, new_descriptor_box),
                                                      Tree.ConditionalExpression(
                                                        Tree.BinaryExpression(
                                                          "!==",
                                                          Intrinsic.makeGetExpression(
                                                            Scope.makeOpenExpression(scope, old_descriptor_box),
                                                            Tree.PrimitiveExpression("value"),
                                                            null),
                                                          Scope.makeOpenExpression(scope, marker_box)),
                                                        Scope.makeOpenExpression(scope, new_descriptor_box),
                                                        Tree.ConditionalExpression(
                                                          Intrinsic.makeGetOwnPropertyDescriptorExpression(
                                                            Scope.makeOpenExpression(scope, new_descriptor_box),
                                                            Tree.PrimitiveExpression("get")),
                                                          Scope.makeOpenExpression(scope, new_descriptor_box),
                                                          Tree.ConditionalExpression(
                                                            Intrinsic.makeGetOwnPropertyDescriptorExpression(
                                                              Scope.makeOpenExpression(scope, new_descriptor_box),
                                                              Tree.PrimitiveExpression("set")),
                                                            Scope.makeOpenExpression(scope, new_descriptor_box),
                                                          Tree.ConditionalExpression(
                                                            Intrinsic.makeGetOwnPropertyDescriptorExpression(
                                                              Scope.makeOpenExpression(scope, new_descriptor_box),
                                                              Tree.PrimitiveExpression("value")),
                                                            Tree.SequenceExpression(
                                                              ArrayLite.reduce(
                                                                node.params,
                                                                (expression, pattern, index) => Tree.ConditionalExpression(
                                                                  Tree.BinaryExpression(
                                                                    "===",
                                                                    Scope.makeOpenExpression(scope, key_box),
                                                                    Tree.PrimitiveExpression(
                                                                      global_String(index))),
                                                                  Tree.SequenceExpression(
                                                                    Scope.makeWriteExpression(
                                                                      scope,
                                                                      pattern.name,
                                                                      Intrinsic.makeGetExpression(
                                                                        Scope.makeOpenExpression(scope, new_descriptor_box),
                                                                        Tree.PrimitiveExpression("value"),
                                                                        null)),
                                                                    Tree.PrimitiveExpression(void 0)),
                                                                  expression),
                                                                Tree.ThrowExpression(
                                                                  Tree.PrimitiveExpression("Arguments link marker out of bounds (defineProperty-write), this should never happen please consider submitting a bug report"))),
                                                              Tree.ConditionalExpression(
                                                                Tree.ConditionalExpression(
                                                                  Intrinsic.makeGetOwnPropertyDescriptorExpression(
                                                                    Scope.makeOpenExpression(scope, new_descriptor_box),
                                                                    Tree.PrimitiveExpression("writable")),
                                                                  Intrinsic.makeGetExpression(
                                                                    Scope.makeOpenExpression(scope, new_descriptor_box),
                                                                    Tree.PrimitiveExpression("writable"),
                                                                    null),
                                                                  Tree.PrimitiveExpression(true)),
                                                                Intrinsic.makeObjectExpression(
                                                                  Scope.makeOpenExpression(scope, new_descriptor_box),
                                                                  [
                                                                    [
                                                                      Tree.PrimitiveExpression("value"),
                                                                      Scope.makeOpenExpression(scope, marker_box)]]),
                                                                Scope.makeOpenExpression(scope, new_descriptor_box))),
                                                            Tree.ConditionalExpression(
                                                              Tree.ConditionalExpression(
                                                                Intrinsic.makeGetOwnPropertyDescriptorExpression(
                                                                  Scope.makeOpenExpression(scope, new_descriptor_box),
                                                                  Tree.PrimitiveExpression("writable")),
                                                                Intrinsic.makeGetExpression(
                                                                  Scope.makeOpenExpression(scope, new_descriptor_box),
                                                                  Tree.PrimitiveExpression("writable"),
                                                                  null),
                                                                Tree.PrimitiveExpression(true)),
                                                              Scope.makeOpenExpression(scope, new_descriptor_box),
                                                              Intrinsic.makeObjectExpression(
                                                                Scope.makeOpenExpression(scope, new_descriptor_box),
                                                                [
                                                                  [
                                                                    Tree.PrimitiveExpression("value"),
                                                                    ArrayLite.reduce(
                                                                      node.params,
                                                                      (expression, pattern, index) => Tree.ConditionalExpression(
                                                                        Tree.BinaryExpression(
                                                                          "===",
                                                                          Scope.makeOpenExpression(scope, key_box),
                                                                          Tree.PrimitiveExpression(
                                                                            global_String(index))),
                                                                        Scope.makeReadExpression(scope, pattern.name),
                                                                        expression),
                                                                      Tree.ThrowExpression(
                                                                        Tree.PrimitiveExpression("Arguments link marker out of bounds (defineProperty-read), this should never happen please consider submitting a bug report")))]]))))))))]))))))))],
                              [
                                "getOwnPropertyDescriptor",
                                Tree.ClosureExpression(
                                  "arrow",
                                  false,
                                  false,
                                  Scope.makeHeadClosureBlock(
                                    scope,
                                    {
                                      sort: "arrow",
                                      super: null,
                                      self: null,
                                      newtarget: false},
                                    false,
                                    [],
                                    (scope) => Scope.makeBoxStatement(
                                      scope,
                                      false,
                                      "target",
                                      Intrinsic.makeGetExpression(
                                        Scope.makeInputExpression(scope, "arguments"),
                                        Tree.PrimitiveExpression(0),
                                        null),
                                      (target_box) => Scope.makeBoxStatement(
                                        scope,
                                        false,
                                        "key",
                                        Intrinsic.makeGetExpression(
                                          Scope.makeInputExpression(scope, "arguments"),
                                          Tree.PrimitiveExpression(1),
                                          null),
                                        (key_box) => Scope.makeBoxStatement(
                                          scope,
                                          false,
                                          "descriptor",
                                          Intrinsic.makeGetOwnPropertyDescriptorExpression(
                                            Scope.makeOpenExpression(scope, target_box),
                                            Scope.makeOpenExpression(scope, key_box)),
                                          (descriptor_box) => Tree.ListStatement(
                                            [
                                              Tree.ExpressionStatement(
                                                Tree.ConditionalExpression(
                                                  Tree.BinaryExpression(
                                                    "!==",
                                                    Scope.makeOpenExpression(scope, descriptor_box),
                                                    Tree.PrimitiveExpression(void 0)),
                                                  Tree.ConditionalExpression(
                                                    Intrinsic.makeGetOwnPropertyDescriptorExpression(
                                                      Scope.makeOpenExpression(scope, descriptor_box),
                                                      Tree.PrimitiveExpression("value")),
                                                    Tree.ConditionalExpression(
                                                      Tree.BinaryExpression(
                                                        "===",
                                                        Intrinsic.makeGetExpression(
                                                          Scope.makeOpenExpression(scope, descriptor_box),
                                                          Tree.PrimitiveExpression("value"),
                                                          null),
                                                        Scope.makeOpenExpression(scope, marker_box)),
                                                      Intrinsic.makeSetExpression(
                                                        Scope.makeOpenExpression(scope, descriptor_box),
                                                        Tree.PrimitiveExpression("value"),
                                                        ArrayLite.reduce(
                                                          node.params,
                                                          (expression, pattern, index) => Tree.ConditionalExpression(
                                                            Tree.BinaryExpression(
                                                              "===",
                                                              Scope.makeOpenExpression(scope, key_box),
                                                              Tree.PrimitiveExpression(
                                                                global_String(index))),
                                                            Scope.makeReadExpression(scope, pattern.name),
                                                            expression),
                                                          Tree.ThrowExpression(
                                                            Tree.PrimitiveExpression("Arguments link marker out of bounds (getOwnPropertyDescriptor), this should never happen please consider submitting a bug report"))),
                                                        null,
                                                        false,
                                                        Intrinsic.SUCCESS_RESULT),
                                                      Tree.PrimitiveExpression(void 0)),
                                                    Tree.PrimitiveExpression(void 0)),
                                                  Tree.PrimitiveExpression(void 0))),
                                              Tree.CompletionStatement(
                                                Scope.makeOpenExpression(scope, descriptor_box))]))))))],
                              [
                                "get",
                                Tree.ClosureExpression(
                                  "arrow",
                                  false,
                                  false,
                                  Scope.makeHeadClosureBlock(
                                    scope,
                                    {
                                      sort: "arrow",
                                      super: null,
                                      self: null,
                                      newtarget: false},
                                    false,
                                    [],
                                    (scope) => Scope.makeBoxStatement(
                                      scope,
                                      false,
                                      "target",
                                      Intrinsic.makeGetExpression(
                                        Scope.makeInputExpression(scope, "arguments"),
                                        Tree.PrimitiveExpression(0),
                                        null),
                                      (target_box) => Scope.makeBoxStatement(
                                        scope,
                                        false,
                                        "key",
                                        Intrinsic.makeGetExpression(
                                          Scope.makeInputExpression(scope, "arguments"),
                                          Tree.PrimitiveExpression(1),
                                          null),
                                        (key_box) => Scope.makeBoxStatement(
                                          scope,
                                          false,
                                          "receiver",
                                          Intrinsic.makeGetExpression(
                                            Scope.makeInputExpression(scope, "arguments"),
                                            Tree.PrimitiveExpression(2),
                                            null),
                                          (receiver_box) => Scope.makeBoxStatement(
                                            scope,
                                            false,
                                            "value",
                                            Intrinsic.makeGetExpression(
                                              Scope.makeOpenExpression(scope, target_box),
                                              Scope.makeOpenExpression(scope, key_box),
                                              Scope.makeOpenExpression(scope, receiver_box)),
                                            (value_box) => Tree.CompletionStatement(
                                              Tree.ConditionalExpression(
                                                Tree.BinaryExpression(
                                                  "===",
                                                  Scope.makeOpenExpression(scope, value_box),
                                                  Scope.makeOpenExpression(scope, marker_box)),
                                                ArrayLite.reduce(
                                                  node.params,
                                                  (expression, pattern, index) => Tree.ConditionalExpression(
                                                    Tree.BinaryExpression(
                                                      "===",
                                                      Scope.makeOpenExpression(scope, key_box),
                                                      Tree.PrimitiveExpression(
                                                        global_String(index))),
                                                    Scope.makeReadExpression(scope, pattern.name),
                                                    expression),
                                                  Tree.ThrowExpression(
                                                    Tree.PrimitiveExpression("Arguments link marker out of bounds (get), this should never happen please consider submitting a bug report"))),
                                                Scope.makeOpenExpression(scope, value_box)))))))))]])))])) :
              Tree.ListStatement([])),
            (
              (
                _has_arguments &&
                ArrayLite.some(_hoisting2, is_arguments_variable)) ?
              Scope.makeBoxStatement(
                scope,
                false,
                "ArgumentsClosureVariableInitialization",
                Scope.makeReadExpression(scope, "arguments"),
                (box) => (
                  _bindings[_bindings.length] = {identifier:"arguments", box},
                  Tree.ListStatement([]))) :
              Tree.ListStatement([])),
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
              (statement, variable) => Scope.makeBoxStatement(
                scope,
                false,
                "ClosureVariableInitialization",
                Scope.makeReadExpression(scope, variable.name),
                (box) => (
                  _bindings[_bindings.length] = {identifier:variable.name, box},
                  statement)),
              Tree.ListStatement([])),
            Tree.BranchStatement(
              Tree.Branch(
                [],
                Visit.visitClosureBody(scope, node.body, {bindings: _bindings}))),
            Tree.CompletionStatement(
              (
                (
                  context.sort === "arrow" ||
                  context.sort === "method") ?
                Tree.PrimitiveExpression(void 0) :
                (
                  (
                    context.sort === "constructor" ||
                    context.sort === "derived-constructor") ?
                  Scope.makeReadExpression(scope, "this") :
                  Tree.ConditionalExpression( // console.assert(context.sort === "function")
                    Scope.makeReadExpression(scope, "new.target"),
                    Scope.makeReadExpression(scope, "this"),
                    Tree.PrimitiveExpression(void 0)))))]))),
    _expression = Intrinsic.makeDefinePropertyExpression(
      _expression,
      Tree.PrimitiveExpression("length"),
      {
        __proto__: null,
        value: Tree.PrimitiveExpression(
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
      Intrinsic.TARGET_RESULT),
    _expression = Intrinsic.makeDefinePropertyExpression(
      _expression,
      Tree.PrimitiveExpression("name"),
      {
        __proto__: null,
        value: (
          (
            (expression) => (
              context.accessor === null ?
              expression :
              Tree.BinaryExpression(
                "+",
                Tree.PrimitiveExpression(context.accessor + " "),
                Intrinsic.makeStringExpression(expression))))
          (
            (
              (
                context.sort === "arrow" ||
                node.id === null) ?
              (
                context.name === null ?
                Tree.PrimitiveExpression("") :
                Scope.makeOpenExpression(scope, context.name)) :
              Tree.PrimitiveExpression(node.id.name)))),
        writable: false,
        enumerable: false,
        configurable: true},
      true,
      Intrinsic.TARGET_RESULT),
    (
      (
        context.sort === "function" &&
        !Scope.isStrict(scope)) ?
      (
        _expression = Intrinsic.makeDefinePropertyExpression(
          _expression,
          Tree.PrimitiveExpression("arguments"),
          {
            __proto__: null,
            value: Tree.PrimitiveExpression(null),
            writable: false,
            enumerable: false,
            configurable: false},
          true,
          Intrinsic.TARGET_RESULT),
        _expression = Intrinsic.makeDefinePropertyExpression(
          _expression,
          Tree.PrimitiveExpression("caller"),
          {
            __proto__: null,
            value: Tree.PrimitiveExpression(null),
            writable: false,
            enumerable: false,
            configurable: false},
          true,
        Intrinsic.TARGET_RESULT)) :
      null),
    _expression = (
      (
        node.type !== "ArrowFunctionExpression" &&
        node.generator) ?
      Intrinsic.makeDefinePropertyExpression(
        _expression,
        Tree.PrimitiveExpression("prototype"),
        {
          __proto__: null,
          value: Intrinsic.makeObjectExpression(
            (
              node.async ?
              Intrinsic.makeGrabExpression("aran.asynchronousGeneratorPrototype") :
              Intrinsic.makeGrabExpression("aran.generatorPrototype")),
            []),
          writable: true,
          enumerable: false,
          configurable: false},
        true,
        Intrinsic.TARGET_RESULT) :
      (
        (
          !node.async &&
          (
            context.sort === "function" ||
            context.sort === "constructor" ||
            context.sort === "derived-constructor")) ?
        (
          (
            (closure) => (
              context.prototype === null ?
              Scope.makeBoxExpression(
                scope,
                false,
                "ClosurePrototype",
                Intrinsic.makeObjectExpression(
                  Intrinsic.makeGrabExpression("Object.prototype"),
                  []),
                closure) :
              closure(context.prototype)))
          (
            (box) => Intrinsic.makeGetExpression(
              Intrinsic.makeDefinePropertyExpression(
                Scope.makeOpenExpression(scope, box),
                Tree.PrimitiveExpression("constructor"),
                {
                  __proto__: null,
                  value: Intrinsic.makeDefinePropertyExpression(
                    _expression,
                    Tree.PrimitiveExpression("prototype"),
                    {
                      __proto__: null,
                      value: Scope.makeOpenExpression(scope, box),
                      writable: context.sort === "function",
                      enumerable: false,
                      configurable: false},
                    true,
                    Intrinsic.TARGET_RESULT),
                  writable: true,
                  enumerable: false,
                  configurable: true},
                true,
                Intrinsic.TARGET_RESULT),
              Tree.PrimitiveExpression("constructor"),
              null))) :
        _expression)),
    _expression));
