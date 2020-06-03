"use strict";

const ArrayLite = require("array-lite");
const Lang = require("../lang.js");
const Scope = require("../scope/index.js");
const Object = require("../object.js");
const Query = require("../query/index.js");

exports.ClassExpression = (node, scope, dropped, box) => { throw new global_Error("Unfortunately, Aran does not support class expressions (yet)...") };

/////////////
// Closure //
/////////////

exports.ArrowFunctionExpression = ({params:patterns, body:closure_body, generator:is_generator, async:is_async, expression:is_expression}, scope, dropped, box, _names) => (
  is_generator ?
  Util.Throw("Unfortunately, Aran does not support generator arrows (yet)...") :
  (
    is_async ?
    Util.Throw("Unfortunately, Aran does not support asynchronous arrows (yet)...") :
    (
      _names = (
        is_expression ?
        [] :
        Collect.VarESTreeNames(closure_body.body)),
      Lang.apply(
        Lang.builtin("Object.defineProperty"),
        Lang.primitive(void 0),
        [
          Lang.apply(
            Lang.builtin("Object.defineProperty"),
            Lang.primitive(void 0),
            [
              Lang.closure(
                Scope.CLOSURE(
                  scope,
                  (
                    !is_expression &&
                    Query.IsStrict(closure_body.body)),
                  ArrayLite.flatMap(
                    patterns,
                    (pattern) => Collect.Pattern(pattern)),
                  [],
                  (scope) => ArrayLite.concat(
                    Lang.Expression(
                      Lang.conditional(
                        Scope.parameter("new.target"),
                        Lang.throw(
                          Lang.construct(
                            Lang.builtin("TypeError"),
                            [
                              Lang.primitive("arrow is not a constructor")])),
                        Lang.primitive(void 0))),
                    // ArrayLite.flatMap(
                    //   patterns,
                    //   (pattern, index) => (
                    //     pattern.type,
                    //     Lang.Expression(
                    //     Scope.box(
                    //       scope,
                    //       "VisitExpressionArrowFunctionExpression",
                    // 
                    //       pattern,
                    // 
                    //     Pattern.assign1(
                    //       (
                    //         pattern.type === "RestElement" ?
                    //         pattern.argument :
                    //         pattern),
                    // 
                    //       scope,
                    //       true,
                    // 
                    //       (
                    //         pattern.type === "RestElement" ?
                    //         Lang.apply(
                    //           Lang.builtin("Array.prototype.slice"),
                    //           Scope.parameter("arguments"),
                    //           [
                    //             Lang.primitive(index)]) :
                    //         Object.get(
                    //           Scope.parameter("arguments"),
                    //           Lang.primitive(index)))))),
                    (
                      node.expression ?
                      Lang.Return(
                        Visit.node(closure_body, scope, false, null)) :
                      ArrayLite.concat(
                        Lang.Block(
                          [],
                          Scope.BLOCK(
                            scope,
                            false,
                            ArrayLite.concat(
                              _names,
                              Collect.Lets(closure_body.body)),
                            Collect.Consts(closure_body.body),
                            (scope) => ArrayLite.concat(
                              ArrayLite.flatMap(
                                _names,
                                (esidentifier) => Lang.Expression(
                                  Scope.initialize(
                                    scope,
                                    esidentifier,
                                    Lang.primitive(void 0)))),
                              Block.Body(
                                closure_body.body,
                                scope,
                                Lexic.CreateArrow())))),
                        Lang.Return(
                          Lang.primitive(void 0))))))),
              Lang.primitive("length"),
              Lang.object(
                Lang.primitive(null),
                [
                  [
                    Lang.primitive("value"),
                    Lang.primitive(
                      (
                        (
                          patterns.length > 0 &&
                          patterns[patterns.length - 1].type === "RestElement") ?
                        patterns.length - 1 :
                        patterns.length))],
                  [
                    Lang.primitive("configurable"),
                    Lang.primitive(true)]])]),
          Lang.primitive("name"),
          Lang.object(
            Lang.primitive(null),
            [
              [
                Lang.primitive("value"),
                (
                  box === null ?
                  Lang.primitive("") :
                  Scope.get(scope, box))],
              [
                Lang.primitive("configurable"),
                Lang.primitive(true)]])]))));

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
//       statement: Lang.Expression(
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
//     statement: Lang.Expression(
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
//     statement: Lang.Expression(
//       Split.declare_initialize_base(
//         scope,
//         nullable_identifier,
//         REGULAR_TAGS[false],
//         Lang.conditional(
//           Split.lookup_para(scope, "new.target", null),
//           Lang.object(
//             Object.get(
//               Split.lookup_para(scope, "new.target", null),
//               Lang.primitive("prototype")),
//             []),
//           (
//             Split.is_strict(scope) ?
//             Split.lookup_para(scope, "this", null) :
//             Lang.conditional(
//               Lang.binary(
//                 "===",
//                 Split.lookup_para(scope, "this", null),
//                 Lang.primitive(null)),
//               Lang.builtin("global"),
//               Lang.conditional(
//                 Lang.binary(
//                   "===",
//                   Split.lookup_para(scope, "this", null),
//                   Lang.primitive(void 0)),
//                 Lang.builtin("global"),
//                 Lang.apply(
//                   Lang.builtin("Object"),
//                   Lang.primitive(void 0),
//                   [
//                     Split.lookup_para(scope, "this", null)])))))))};
//   // arguments //
//   Split.declare_initialize_para(scope, "arguments");
//   if (!ArrayLite.includes(identifiers, "arguments") {
//     const aran_expression = Lang.apply(
//       Lang.builtin("Object.defineProperty"),
//       Lang.primitive(void 0),
//       [
//         Lang.apply(
//           Lang.builtin("Object.defineProperty"),
//           Lang.primitive(void 0),
//           [
//             Lang.apply(
//               Lang.builtin("Object.defineProperty"),
//               Lang.primitive(void 0),
//               [
//                 Lang.apply(
//                   Lang.builtin("Object.assign"),
//                   Lang.primitive(void 0),
//                   [
//                     Lang.object(
//                       Lang.primitive("Object.prototype"),
//                       []),
//                     Split.lookup_para(scope, "arguments", null)]),
//                 Lang.primitive("length"),
//                 Lang.object(
//                   Lang.primitive(null),
//                   [
//                     [
//                       Lang.primitive("value"),
//                       Object.get(
//                         Split.lookup_para(scope, "arguments", null),
//                         Lang.primitive("length"))],
//                     [
//                       Lang.primitive("writable"),
//                       Lang.primitive(true)],
//                     [
//                       Lang.primitive("configurable"),
//                       Lang.primitive(true)]])]),
//             Lang.primitive("callee"),
//             Lang.object(
//               Lang.primitive(null),
//               (
//                 Split.is_strict(scope) ?
//                 [
//                   [
//                     Lang.primitive("get"),
//                     Lang.builtin("Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').get")],
//                   [
//                     Lang.primitive("set"),
//                     Lang.builtin("Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').set")]] :
//                 [
//                   [
//                     Lang.primitive("value"),
//                     Container.get(scope, container)],
//                   [
//                     Lang.primitive("writable"),
//                     Lang.primitive(true)],
//                   [
//                     Lang.primitive("configurable"),
//                     Lang.primitive(true)]]))]),
//         Lang.builtin("Symbol.iterator"),
//         Lang.object(
//           Lang.primitive(null),
//           [
//             [
//               Lang.primitive("value"),
//               Lang.builtin("Array.prototype.values")],
//             [
//               Lang.primitive("writable"),
//               Lang.primitive(true)],
//             [
//               Lang.primitive("configurable"),
//               Lang.primitive(true)]])]);
//     if (Split.is_strict(scope) || !is_simple) {
//       optionals[optionals.length] = {
//         __proto__: null,
//         kind: "base",
//         identifier: "arguments",
//         statement: Lang.Expression(
//           Split.declare_initialize_base(
//             scope,
//             nullable_identifier,
//             REGULAR_TAGS[false],
//             aran_expression)};
//     } else {
//       for (let index = 0; index < identifiers.length; index++) {
//         const {identifier, aran_expression} = Split.declare_initialize_meta(scope, "argmap" + index, Lang.primitive(true));
//         aran_expressionss.meta[identifier] = aran_expression;
//         aran_expressionss.base[identifier] = Split.declare_initialize_base(scope, identifiers[index], Object.get(
//           Split.lookup_para(scope, "arguments", null),
//           Lang.primitive(index)));
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
//       expressions[meta_identifier] = Lang.primitive(true);
//       expressions[base_identifier] = Object.get(Lang.read(Identifier.PARAMETERS["arguments"], Lang.primitive(index)));
//     });
//     expressions["arguments"] = Lang.construct(
//       Lang.builtin("Proxy"),
//       [
//         expressions["arguments"],
//         Lang.object(
//           Lang.primitive(null),
//           [
//             [
//               Lang.primitive("defineProperty"),
//               Lang.arrow(
//                 Lang.BLOCK(
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
        Lang.primitive(null),
        (box) => Lang.sequence(
          Scope.set(
            scope,
            box,
            Lang.apply(
              Lang.builtin("Object.defineProperty"),
              Lang.primitive(void 0),
              [
                Lang.apply(
                  Lang.builtin("Object.defineProperty"),
                  Lang.primitive(void 0),
                  [
                    Lang.closure(
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
                          [ArrayLite.includes(esidentifier1, "arguments") ? "this" /* dirty trick */ : "arguments"]: () => Lang.apply(
                            Lang.builtin("Object.defineProperty"),
                            Lang.primitive(void 0),
                            [
                              Lang.apply(
                                Lang.builtin("Object.defineProperty"),
                                Lang.primitive(void 0),
                                [
                                  Lang.apply(
                                    Lang.builtin("Object.defineProperty"),
                                    Lang.primitive(void 0),
                                    [
                                      Lang.apply(
                                        Lang.builtin("Object.assign"),
                                        Lang.primitive(void 0),
                                        [
                                          Lang.object(
                                            Lang.primitive("Object.prototype"),
                                            []),
                                          Scope.parameter("arguments")]),
                                      Lang.primitive("length"),
                                      Lang.object(
                                        Lang.primitive(null),
                                        [
                                          [
                                            Lang.primitive("value"),
                                            Object.get(
                                              Scope.arguments(scope),
                                              Lang.primitive("length"))],
                                          [
                                            Lang.primitive("writable"),
                                            Lang.primitive(true)],
                                          [
                                            Lang.primitive("configurable"),
                                            Lang.primitive(true)]])]),
                                  Lang.primitive("callee"),
                                  Lang.object(
                                    Lang.primitive(null),
                                    (
                                      Scope.$GetStrict(scope) ?
                                      [
                                        [
                                          Lang.primitive("get"),
                                          Lang.builtin("Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').get")],
                                        [
                                          Lang.primitive("set"),
                                          Lang.builtin("Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').set")]] :
                                      [
                                        [
                                          Lang.primitive("value"),
                                          Scope.callee(scope)],
                                        [
                                          Lang.primitive("writable"),
                                          Lang.primitive(true)],
                                        [
                                          Lang.primitive("configurable"),
                                          Lang.primitive(true)]]))]),
                              Lang.builtin("Symbol.iterator"),
                              Lang.object(
                                Lang.primitive(null),
                                [
                                  [
                                    Lang.primitive("value"),
                                    Lang.builtin("Array.prototype.values")],
                                  [
                                    Lang.primitive("writable"),
                                    Lang.primitive(true)],
                                  [
                                    Lang.primitive("configurable"),
                                    Lang.primitive(true)]])]),
                          ["new.target"]: () => Scope.parameter("new.target"),
                          ["this"]: () => (
                            Scope.$IsStrict(scope) ?
                            Scope.parameter("this") :
                            Lang.conditional(
                              Lang.binary(
                                "===",
                                Scope.parameter("this"),
                                Lang.primitive(null)),
                              Lang.builtin("global"),
                              Lang.conditional(
                                Lang.binary(
                                  "===",
                                  Scope.parameter("this"),
                                  Lang.primitive(void 0)),
                                Lang.builtin("global"),
                                Lang.apply(
                                  Lang.builtin("Object"),
                                  Lang.primitive(void 0),
                                  [
                                    Scope.parameter("this")]))))},
                        (scope) => ArrayLite.concat(
                            ArrayLite.flatMap(
                              patterns,
                              (param, index) => Lang.Expression(
                                Pattern.assign1(
                                  scope,
                                  true,
                                  (
                                    param.type === "RestElement" ?
                                    param.argument :
                                    param),
                                  (
                                    param.type === "RestElement" ?
                                    Lang.apply(
                                      Lang.builtin("Array.prototype.slice"),
                                      Scope.arguments(scope),
                                      [
                                        Lang.primitive(index)]) :
                                    Object.get(
                                      Scope.arguments(scope),
                                      Lang.primitive(index)))))),
                            (
                              is_expression ?
                              Lang.Return(
                                Scope.box(
                                  scope,
                                  "StatementReturnArgument",
                                  Visit.node(node.argument, scope, false, null),
                                  (box) => Lang.conditional(
                                    Scope.read(scope, "new.target"),
                                    Lang.conditional(
                                      Lang.binary(
                                        "===",
                                        Lang.unary(
                                          "typeof",
                                          Scope.get(scope, box)),
                                        Lang.primitive("object")),
                                      Lang.conditional(
                                        Scope.get(scope, box),
                                        Scope.get(scope, box),
                                        Scope.read(scope, "this")),
                                      Lang.conditional(
                                        Lang.binary(
                                          "===",
                                          Lang.unary(
                                            "typeof",
                                            Scope.get(scope, box)),
                                          Lang.primitive("function")),
                                        Scope.get(scope, box),
                                        Scope.read(scope, "this"))),
                                    Scope.get(scope, box)))) :
                              ArrayLite.concat(
                                Lang.Block(
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
                                Lang.Return(
                                  Lang.conditional(
                                    Scope.read(scope, "new.target"),
                                    Scope.read(scope, "this"),
                                    Lang.primitive(void 0)))))))),
                    Lang.primitive("length"),
                    Lang.object(
                      Lang.primitive(null),
                      [
                        [
                          Lang.primitive("value"),
                          Lang.primitive(
                            (
                              (
                                params.length > 0 &&
                                params[params.length - 1].type === "RestElement") ?
                              params.length - 1 :
                              params.length))],
                        [
                          Lang.primitive("configurable"),
                          Lang.primitive(true)]])]),
                Lang.primitive("name"),
                Lang.object(
                  Lang.primitive(null),
                  [
                    [
                      Lang.primitive("value"),
                      options.name()],
                    [
                      Lang.primitive("configurable"),
                      Lang.primitive(true)]])])),
          Lang.sequence(
            Lang.apply(
              Lang.builtin("Reflect.set"),
              Lang.primitive(void 0),
              [
                Scope.get(scope, box2),
                Lang.primitive("prototype"),
                Lang.apply(
                  Lang.builtin("Object.defineProperty"),
                  Lang.primitive(void 0),
                  [
                    Lang.object(
                      Lang.builtin("Object.prototype"),
                      []),
                    Lang.primitive("constructor"),
                    Lang.object(
                      Lang.primitive(null),
                      [
                        [
                          Lang.primitive("value"),
                           Scope.get(scope, box1)],
                        [
                          Lang.primitive("writable"),
                          Lang.primitive(true)],
                        [
                          Lang.primitive("configurable"),
                          Lang.primitive(true)]])])]),
            Scope.get(scope, box2)))),
      (
        (
          Scope.$IsStrict(scope) ||
          (
            !is_expression &&
            Query.IsStrict(closure_body.body))) ?
        _expression :
        Lang.apply(
          Lang.builtin("Object.defineProperty"),
          Lang.primitive(void 0),
          [
            Lang.apply(
              Lang.builtin("Object.defineProperty"),
              Lang.primitive(void 0),
              [
                _expression,
                Lang.primitive("arguments"),
                Lang.object(
                  Lang.primitive(null),
                  [
                    [
                      Lang.primitive("value"),
                      Lang.primitive(null)]])]),
            Lang.primitive("caller"),
            Lang.object(
              Lang.primitive(null),
              [
                [
                  Lang.primitive("value"),
                  Lang.primitive(null)]])])))));
