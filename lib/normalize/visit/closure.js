"use strict";

const global_Error = global.Error;

const ArrayLite = require("array-lite");
const Tree = require("../tree.js");
const Scope = require("../scope/index.js");
const Object = require("../object.js");
const Query = require("../query/index.js");
const Pattern = require("./pattern.js");
const Expression = require("./expression.js");
const Block = require("./block.js");
const Completion = require("../completion.js");

exports.class = (scope, node, dropped, box) => { throw new global_Error("Unfortunately, Aran does not support class expressions (yet)...") };

/////////////
// Closure //
/////////////

exports.arrow = (scope, node, dropped, name_box) => (
  node.async ?
  ((() => { throw new global_Error("Unfortunately, Aran does not yet support asynchronous arrows.") }) ()) :
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
              Query._get_parameter_hoisting(
                {
                  type: "ArrayPattern",
                  elements: node.params}),
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
                          Query._has_direct_eval_call(
                            (
                              node.expression ?
                              [
                                {
                                  type: "ReturnStatment",
                                  argument: node.body}] :
                              node.body.body)) ?
                          Scope.Box(
                            scope,
                            "EvalFrame",
                            true,
                            Tree.object(
                              Tree.primitive(null),
                              []),
                            (object_box) => closure(
                              Scope._extend_dynamic(scope, object_box, null))) :
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
              name_box === null ?
              Tree.primitive("") :
              Scope.get(scope, name_box))],
          [
            Tree.primitive("configurable"),
            Tree.primitive(true)]])]));

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


// // function f (x) {
// //   Reflect.defineProperty(arguments, 0, {
// //     __proto__:null,
// //     value: "foo",
// //     configurable: true,
// //     writable: false,
// //     enumerable: true
// //   });
// //   Reflect.defineProperty(arguments, 0, {
// //     __proto__:null,
// //     value: "foo",
// //     configurable: true,
// //     writable: true,
// //     enumerable: true
// //   });
// //   x = "bar";
// //   return arguments[0];
// // }
// 
// // ((function f (x) {
// //   Reflect.defineProperty(arguments, 0, {
// //     __proto__:null,
// //     value: "bar",
// //     configurable: true,
// //     writable: false,
// //     enumerable: true
// //   });
// //   console.log(x);
// // }) ("foo"));
// //   // Reflect.defineProperty(arguments, 0, {
// //   //   __proto__:null,
// //   //   value: "bar",
// //   //   configurable: true,
// //   //   writable: true,
// //   //   enumerable: true
// //   // });
// //   x = "qux";
// //   console.log(arguments[0]);
// //   // arguments[0] = "qux";
// //   // console.log(x);
// //   // x = "foo";
// //   // 
// //   // return arguments[0];
// //   // Reflect.defineProperty(arguments, 0, {
// //   //   __proto__:null,
// //   //   value: "foo",
// //   //   configurable: true,
// //   //   writable: true,
// //   //   enumerable: true
// //   // });
// //   // // arguments[0] = "bar";
// //   // return x;
// // }) ("zbra"));
// 
// const o = {
//   __proto__: null,
//   getOwnPropertyDescriptor: (target, key) => {
//     let target, key, descriptor;
//     target = Reflect.get(ARGUMENTS, 0);
//     key = Reflect.get(ARGUMENTS, 1);
//     descriptor = Reflect.getOwnPropertyDescriptor(target, key);
//     (key === "0" ? (_linked_0 ? Reflect.set(descriptor, "value", $$x) : null) : null);
//     // ... //
//     return descriptor;
//   },
//   // https://www.ecma-international.org/ecma-262/10.0/index.html#sec-arguments-exotic-objects-delete-p
//   deleteProperty: (...ARGUMENTS) => {
//     let target, key;
//     target = Reflect.get(ARGUMENTS, 0);
//     key = Reflect.get(ARGUMENTS, 1);
//     (key === "0" ? (_linked_0 = false) : null);
//     // ... //
//     return Reflect.deleteProperty(target, key);
//   },
//   // https://www.ecma-international.org/ecma-262/10.0/index.html#sec-arguments-exotic-objects-defineownproperty-p-desc
//   // ((function (x) {
//   //   Reflect.defineProperty(arguments, 0, {
//   //     __proto__:null,
//   //     value: "bar",
//   //     configurable: true,
//   //     writable: false,
//   //     enumerable: true
//   //   });
//   //   console.log(x); // bar
//   // }) ("foo"));
//   // ((function (x) {
//   //   Reflect.defineProperty(arguments, 0, {
//   //     __proto__:null,
//   //     value: "bar",
//   //     configurable: false,
//   //     writable: true,
//   //     enumerable: true
//   //   });
//   //   console.log(x); // bar
//   // }) ("foo"));
//   defineProperty: (...ARGUMENTS) => {
//     let target, key, descriptor, success;
//     target = Reflect.get(ARGUMENTS, 0);
//     key = Reflect.get(ARGUMENTS, 1);
//     descriptor = Reflect.get(ARGUMENTS, 2);
//     success = Reflect.defineProperty(target, key, descriptor);
//     // If it failed, the link must have already been broken //
//     (
//       (key === "0" ? (_linked_0 ? success : false) : false) ?
//       (
//         Reflect.getOwnPropertyDescriptor(descriptor, "value") === undefined ?
//         _linked_0 = false :
//         (
//           $$x = Relect.get(descriptor, "value"),
//           _linked_0 = Reflect.get(descriptor, "writable")) :
//       null);
//     // ... //
//     return success;
//   }
// }



// https://www.ecma-international.org/ecma-262/10.0/index.html#sec-functiondeclarationinstantiation


// exports.make_function_block = (scope, use_strict, nullable_identifier, container, is_simple, identifiers, kontinuation) => {
//   scope = Split.extend(scope, use_strict, true, null);
//   const optionals = [];
//   // callee //
//   if (nullable_identifier !== null && !ArrayLite.includes(identifiers, nullable_identifier)) {
//     optionals[optionals.length] = {
//       __proto__: null,
//       kind: "base",
//       identifier: nullable_identifier,
//       statement: Tree.Expression(
//         Split.declare_initialize_base(
//           scope,
//           nullable_identifier,
//           REGULAR_TAGS[true],
//           Container.get(scope, container)))};
//   }
//   // new.target //
//   Split.declare_initialize_para(scope, "new.target");
//   optionals[optionals.length] = {
//     __proto__: null,
//     kind: "base",
//     identifier: "new.target",
//     statement: Tree.Expression(
//       Split.declare_initialize_base(
//         scope,
//         nullable_identifier,
//         REGULAR_TAGS[false],
//         Split.lookup_para(scope, "new.target", null))};
//   // this //
//   Split.declare_initialize_para(scope, "this");
//   optionals[optionals.length] = {
//     __proto__: null,
//     kind: "base",
//     identifier: "this",
//     statement: Tree.Expression(
//       Split.declare_initialize_base(
//         scope,
//         nullable_identifier,
//         REGULAR_TAGS[false],
//         Tree.conditional(
//           Split.lookup_para(scope, "new.target", null),
//           Tree.object(
//             Object.get(
//               Split.lookup_para(scope, "new.target", null),
//               Tree.primitive("prototype")),
//             []),
//           (
//             Split.is_strict(scope) ?
//             Split.lookup_para(scope, "this", null) :
//             Tree.conditional(
//               Tree.binary(
//                 "===",
//                 Split.lookup_para(scope, "this", null),
//                 Tree.primitive(null)),
//               Tree.builtin("global"),
//               Tree.conditional(
//                 Tree.binary(
//                   "===",
//                   Split.lookup_para(scope, "this", null),
//                   Tree.primitive(void 0)),
//                 Tree.builtin("global"),
//                 Tree.apply(
//                   Tree.builtin("Object"),
//                   Tree.primitive(void 0),
//                   [
//                     Split.lookup_para(scope, "this", null)])))))))};
//   // arguments //
//   Split.declare_initialize_para(scope, "arguments");
//   if (!ArrayLite.includes(identifiers, "arguments") {
//     const aran_expression = Tree.apply(
//       Tree.builtin("Object.defineProperty"),
//       Tree.primitive(void 0),
//       [
//         Tree.apply(
//           Tree.builtin("Object.defineProperty"),
//           Tree.primitive(void 0),
//           [
//             Tree.apply(
//               Tree.builtin("Object.defineProperty"),
//               Tree.primitive(void 0),
//               [
//                 Tree.apply(
//                   Tree.builtin("Object.assign"),
//                   Tree.primitive(void 0),
//                   [
//                     Tree.object(
//                       Tree.primitive("Object.prototype"),
//                       []),
//                     Split.lookup_para(scope, "arguments", null)]),
//                 Tree.primitive("length"),
//                 Tree.object(
//                   Tree.primitive(null),
//                   [
//                     [
//                       Tree.primitive("value"),
//                       Object.get(
//                         Split.lookup_para(scope, "arguments", null),
//                         Tree.primitive("length"))],
//                     [
//                       Tree.primitive("writable"),
//                       Tree.primitive(true)],
//                     [
//                       Tree.primitive("configurable"),
//                       Tree.primitive(true)]])]),
//             Tree.primitive("callee"),
//             Tree.object(
//               Tree.primitive(null),
//               (
//                 Split.is_strict(scope) ?
//                 [
//                   [
//                     Tree.primitive("get"),
//                     Tree.builtin("Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').get")],
//                   [
//                     Tree.primitive("set"),
//                     Tree.builtin("Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').set")]] :
//                 [
//                   [
//                     Tree.primitive("value"),
//                     Container.get(scope, container)],
//                   [
//                     Tree.primitive("writable"),
//                     Tree.primitive(true)],
//                   [
//                     Tree.primitive("configurable"),
//                     Tree.primitive(true)]]))]),
//         Tree.builtin("Symbol.iterator"),
//         Tree.object(
//           Tree.primitive(null),
//           [
//             [
//               Tree.primitive("value"),
//               Tree.builtin("Array.prototype.values")],
//             [
//               Tree.primitive("writable"),
//               Tree.primitive(true)],
//             [
//               Tree.primitive("configurable"),
//               Tree.primitive(true)]])]);
//     if (Split.is_strict(scope) || !is_simple) {
//       optionals[optionals.length] = {
//         __proto__: null,
//         kind: "base",
//         identifier: "arguments",
//         statement: Tree.Expression(
//           Split.declare_initialize_base(
//             scope,
//             nullable_identifier,
//             REGULAR_TAGS[false],
//             aran_expression)};
//     } else {
//       for (let index = 0; index < identifiers.length; index++) {
//         const {identifier, aran_expression} = Split.declare_initialize_meta(scope, "argmap" + index, Tree.primitive(true));
//         aran_expressionss.meta[identifier] = aran_expression;
//         aran_expressionss.base[identifier] = Split.declare_initialize_base(scope, identifiers[index], Object.get(
//           Split.lookup_para(scope, "arguments", null),
//           Tree.primitive(index)));
//       }
//       $arguments = new Proxy(..., {
//         __proto__: null,
//         defineProperty (...args) => {
//           let target, key, descriptor, breaking;
//           target = Arguments[0];
//           key = Arguments[1];
//           descriptor = Arguments[2];
//           // https://www.ecma-international.org/ecma-262/10.0/index.html#sec-isdatadescriptor
//           breaking = ...;
//           (
//             (key === "0") ?
//             (
//               argmap_0_ARG0 = breaking ? false : argmap_0,
//               (
//                 armap_0_ARG0 ?
//                 $ARG0 = descriptor.value :
//                 void 0)) :
//             void 0);
//           return Reflect.defineProperty(target, key, descriptor);
//         }
//       });
//       identifiers = [];
//     }
//   }
//   return make_block(scope, identifiers, [], [], kontinuation);
// };
// 
//   if (!Data.get_is_strict(scope) && is_simple_parameters && !ArrayLite.includes(identifiers, "arguments")) {
//     ArrayLite.forEach(identifiers, (identifier, index) => {
//       const base_identiier = Identifier.base(identifier);
//       const meta_identifier = Identifier.meta("argmap_" + index + "_" + identifier);
//       Data.declare(scope, meta_identifier, null);
//       Data.initialize(scope, meta_identifier);
//       expressions[meta_identifier] = Tree.primitive(true);
//       expressions[base_identifier] = Object.get(Tree.read(Identifier.PARAMETERS["arguments"], Tree.primitive(index)));
//     });
//     expressions["arguments"] = Tree.construct(
//       Tree.builtin("Proxy"),
//       [
//         expressions["arguments"],
//         Tree.object(
//           Tree.primitive(null),
//           [
//             [
//               Tree.primitive("defineProperty"),
//               Tree.arrow(
//                 Tree.BLOCK(
//                   Identifier.base()
//   }
//   return make_block(scope, identifiers, [], expressions, kontinuation);
// };
// 
// exports.extend_closure = (scope, is_use_strict, identifiers, kontinuation) => {
//   return Layer.extend_closure(scope, is_use_strict, (scope) => {
//     for (let index = 0; index < identifiers.length; index++) {
//       Layer.declare_base(scope, identifiers[index], true);
//     }
//     return kontinuation(scope);
//   });
// };








// function f (x, y, z) {
//   Reflect.defineProperty(arguments, 0, {__proto__: null, set: () => console.log("wesh"), get:() => "foo", configurable:true, enumerable:true});
//   Reflect.defineProperty(arguments, 0, {__proto__: null, writable: true, value: "foo", configurable:true, enumerable:true});
//   // Reflect.defineProperty(arguments, 0, {__proto__: null, writable: true, value:"foo", configurable:true, enumerable:true});
//   // Reflect.defineProperty(arguments, 0, {__proto__: null, writable: false, value:"foo", configurable:false, enumerable:true});
//   x = "bar";
//   console.log(Object.getOwnPropertyDescriptors(arguments));
//   return x;
// }
// 
// function f (x) {
//   eval("var x; console.log(x)");
// }
// 
// const bool_x = ;
// const bool_y;
// const bool_z;
// const raw_args = ...;
// const arguments = new Proxy({
//   raw_args,
//   {
//     ["defineProperty"]: (tgt, key, des1) => {
//       const result = Reflect.defineProperty(tgt, key, des1);
//       if (result && bool_x && key === "0") {
//         const des2 = Reflect.getOwnProperty(tgt, key);
//         if (Reflect.getOwnPropertyDescriptor(des, "value")) {
//           x = Reflect.get(des, "value");
//         } else {
//           bool_x = false;
//         }
//       } else if (bool_y && key === "1") {
// 
//       } else if (bool_z && key === "2") {
// 
//       }
//       return result;
//     }
//   },
// });











exports.FunctionExpression = ({id:{name:nullable_identifier}={name:null}, params:patterns, body:body, generator:is_generator, async:is_async, expression:is_expression}, scope, dropped, box) => (
  is_generator ?
  Util.Throw("Unfortunately, Aran does not support generator functions (yet)...") :
  (
    is_async ?
    Util.Throw("Unfortunately, Aran does not support asynchronous functions (yet)...") :
    (
      _identifiers1 = ArrayLite.flatMap(
        patterns,
        (param) => Collect.Pattern(param)),
      _identifiers2 = (
        is_expression ?
        [] :
        Collect.Vars(closure_body.body)),
      _expression = Scope.box(
        scope,
        "ClosureFunctionResult",
        Tree.primitive(null),
        (box) => Tree.sequence(
          Scope.set(
            scope,
            box,
            Tree.apply(
              Tree.builtin("Object.defineProperty"),
              Tree.primitive(void 0),
              [
                Tree.apply(
                  Tree.builtin("Object.defineProperty"),
                  Tree.primitive(void 0),
                  [
                    Tree.closure(
                      // function f (arguments = arguments) { return arguments }
                      // Thrown:
                      // ReferenceError: Cannot access 'arguments' before initialization
                      //     at f (repl:1:25)
                      Scope.CLOSURE(
                        scope,
                        (
                          !is_expression &&
                          Query.IsStrict(closure_body.body)),
                        ArrayLite.concat(
                          identifiers1,
                          (
                            ArrayLite.includes(identifiers1, "arguments") ?
                            [] :
                            ["arguments"]),
                          (
                            (
                              nullable_identifier === null ||
                              ArrayLite.includes(identifiers1, nullable_identifier)) ?
                            [] :
                            ["arguments"])),
                        ["new.target", "this"],
                        {
                          __proto__: null,
                          [(nullable_identifier === null || ArrayLite.includes(identifiers1, nullable_identifier)) ? "this" /* dirty trick */ : nullable_identifier]: () => Scope.get(scope, box),
                          [ArrayLite.includes(esidentifier1, "arguments") ? "this" /* dirty trick */ : "arguments"]: () => Tree.apply(
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
                                      Tree.apply(
                                        Tree.builtin("Object.assign"),
                                        Tree.primitive(void 0),
                                        [
                                          Tree.object(
                                            Tree.primitive("Object.prototype"),
                                            []),
                                          Scope.parameter("arguments")]),
                                      Tree.primitive("length"),
                                      Tree.object(
                                        Tree.primitive(null),
                                        [
                                          [
                                            Tree.primitive("value"),
                                            Object.get(
                                              Scope.arguments(scope),
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
                                      Scope.$GetStrict(scope) ?
                                      [
                                        [
                                          Tree.primitive("get"),
                                          Tree.builtin("Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').get")],
                                        [
                                          Tree.primitive("set"),
                                          Tree.builtin("Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').set")]] :
                                      [
                                        [
                                          Tree.primitive("value"),
                                          Scope.callee(scope)],
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
                                    Tree.primitive(true)]])]),
                          ["new.target"]: () => Scope.parameter("new.target"),
                          ["this"]: () => (
                            Scope.$IsStrict(scope) ?
                            Scope.parameter("this") :
                            Tree.conditional(
                              Tree.binary(
                                "===",
                                Scope.parameter("this"),
                                Tree.primitive(null)),
                              Tree.builtin("global"),
                              Tree.conditional(
                                Tree.binary(
                                  "===",
                                  Scope.parameter("this"),
                                  Tree.primitive(void 0)),
                                Tree.builtin("global"),
                                Tree.apply(
                                  Tree.builtin("Object"),
                                  Tree.primitive(void 0),
                                  [
                                    Scope.parameter("this")]))))},
                        (scope) => ArrayLite.concat(
                            ArrayLite.flatMap(
                              patterns,
                              (param, index) => Tree.Expression(
                                Pattern.assign1(
                                  scope,
                                  true,
                                  (
                                    param.type === "RestElement" ?
                                    param.argument :
                                    param),
                                  (
                                    param.type === "RestElement" ?
                                    Tree.apply(
                                      Tree.builtin("Array.prototype.slice"),
                                      Scope.arguments(scope),
                                      [
                                        Tree.primitive(index)]) :
                                    Object.get(
                                      Scope.arguments(scope),
                                      Tree.primitive(index)))))),
                            (
                              is_expression ?
                              Tree.Return(
                                Scope.box(
                                  scope,
                                  "StatementReturnArgument",
                                  Visit.node(node.argument, scope, false, null),
                                  (box) => Tree.conditional(
                                    Scope.read(scope, "new.target"),
                                    Tree.conditional(
                                      Tree.binary(
                                        "===",
                                        Tree.unary(
                                          "typeof",
                                          Scope.get(scope, box)),
                                        Tree.primitive("object")),
                                      Tree.conditional(
                                        Scope.get(scope, box),
                                        Scope.get(scope, box),
                                        Scope.read(scope, "this")),
                                      Tree.conditional(
                                        Tree.binary(
                                          "===",
                                          Tree.unary(
                                            "typeof",
                                            Scope.get(scope, box)),
                                          Tree.primitive("function")),
                                        Scope.get(scope, box),
                                        Scope.read(scope, "this"))),
                                    Scope.get(scope, box)))) :
                              ArrayLite.concat(
                                Tree.Block(
                                  [],
                                  Scope.BLOCK(
                                    scope,
                                    false,
                                    Collect.Lets(closure_body.body),
                                    Collect.Consts(closure_body.body),
                                    (scope) => Block.Body(
                                      closure_body.body,
                                      scope,
                                      Lexic.CreateFunction()))),
                                Tree.Return(
                                  Tree.conditional(
                                    Scope.read(scope, "new.target"),
                                    Scope.read(scope, "this"),
                                    Tree.primitive(void 0)))))))),
                    Tree.primitive("length"),
                    Tree.object(
                      Tree.primitive(null),
                      [
                        [
                          Tree.primitive("value"),
                          Tree.primitive(
                            (
                              (
                                params.length > 0 &&
                                params[params.length - 1].type === "RestElement") ?
                              params.length - 1 :
                              params.length))],
                        [
                          Tree.primitive("configurable"),
                          Tree.primitive(true)]])]),
                Tree.primitive("name"),
                Tree.object(
                  Tree.primitive(null),
                  [
                    [
                      Tree.primitive("value"),
                      options.name()],
                    [
                      Tree.primitive("configurable"),
                      Tree.primitive(true)]])])),
          Tree.sequence(
            Tree.apply(
              Tree.builtin("Reflect.set"),
              Tree.primitive(void 0),
              [
                Scope.get(scope, box2),
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
                           Scope.get(scope, box1)],
                        [
                          Tree.primitive("writable"),
                          Tree.primitive(true)],
                        [
                          Tree.primitive("configurable"),
                          Tree.primitive(true)]])])]),
            Scope.get(scope, box2)))),
      (
        (
          Scope.$IsStrict(scope) ||
          (
            !is_expression &&
            Query.IsStrict(closure_body.body))) ?
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
                  Tree.primitive(null)]])])))));
