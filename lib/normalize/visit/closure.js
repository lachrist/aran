
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
      Build.apply(
        Build.builtin("Object.defineProperty"),
        Build.primitive(void 0),
        [
          Build.apply(
            Build.builtin("Object.defineProperty"),
            Build.primitive(void 0),
            [
              Build.closure(
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
                    Build.Expression(
                      Build.conditional(
                        Scope.parameter("new.target"),
                        Build.throw(
                          Build.construct(
                            Build.builtin("TypeError"),
                            [
                              Build.primitive("arrow is not a constructor")])),
                        Build.primitive(void 0))),
                    ArrayLite.flatMap(
                      patterns,
                      (pattern, index) => (
                        pattern.type
                        Build.Expression(
                        Scope.box(
                          scope,
                          "VisitExpressionArrowFunctionExpression",
                          
                          pattern,
                          
                        Pattern.assign1(
                          (
                            pattern.type === "RestElement" ?
                            pattern.argument :
                            pattern),
                            
                          scope,
                          true,
                          
                          (
                            pattern.type === "RestElement" ?
                            Build.apply(
                              Build.builtin("Array.prototype.slice"),
                              Scope.parameter("arguments"),
                              [
                                Build.primitive(index)]) :
                            Object.get(
                              Scope.parameter("arguments"),
                              Build.primitive(index)))))),
                    (
                      node.expression ?
                      Build.Return(
                        Visit.node(closure_body, scope, false, null)) :
                      ArrayLite.concat(
                        Build.Block(
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
                                (esidentifier) => Build.Expression(
                                  Scope.initialize(
                                    scope,
                                    esidentifier,
                                    Build.primitive(void 0)))),
                              Block.Body(
                                closure_body.body,
                                scope,
                                Lexic.CreateArrow())))),
                        Build.Return(
                          Build.primitive(void 0))))))),
              Build.primitive("length"),
              Build.object(
                Build.primitive(null),
                [
                  [
                    Build.primitive("value"),
                    Build.primitive(
                      (
                        (
                          patterns.length > 0 &&
                          patterns[patterns.length - 1].type === "RestElement") ?
                        patterns.length - 1 :
                        patterns.length))],
                  [
                    Build.primitive("configurable"),
                    Build.primitive(true)]])]),
          Build.primitive("name"),
          Build.object(
            Build.primitive(null),
            [
              [
                Build.primitive("value"),
                (
                  box === null ?
                  Build.primitive("") :
                  Scope.get(scope, box))],
              [
                Build.primitive("configurable"),
                Build.primitive(true)]])]));

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
//       statement: Build.Expression(
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
//     statement: Build.Expression(
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
//     statement: Build.Expression(
//       Split.declare_initialize_base(
//         scope,
//         nullable_identifier,
//         REGULAR_TAGS[false],
//         Build.conditional(
//           Split.lookup_para(scope, "new.target", null),
//           Build.object(
//             Object.get(
//               Split.lookup_para(scope, "new.target", null),
//               Build.primitive("prototype")),
//             []),
//           (
//             Split.is_strict(scope) ?
//             Split.lookup_para(scope, "this", null) :
//             Build.conditional(
//               Build.binary(
//                 "===",
//                 Split.lookup_para(scope, "this", null),
//                 Build.primitive(null)),
//               Build.builtin("global"),
//               Build.conditional(
//                 Build.binary(
//                   "===",
//                   Split.lookup_para(scope, "this", null),
//                   Build.primitive(void 0)),
//                 Build.builtin("global"),
//                 Build.apply(
//                   Build.builtin("Object"),
//                   Build.primitive(void 0),
//                   [
//                     Split.lookup_para(scope, "this", null)])))))))};
//   // arguments //
//   Split.declare_initialize_para(scope, "arguments");
//   if (!ArrayLite.includes(identifiers, "arguments") {
//     const aran_expression = Build.apply(
//       Build.builtin("Object.defineProperty"),
//       Build.primitive(void 0),
//       [
//         Build.apply(
//           Build.builtin("Object.defineProperty"),
//           Build.primitive(void 0),
//           [
//             Build.apply(
//               Build.builtin("Object.defineProperty"),
//               Build.primitive(void 0),
//               [
//                 Build.apply(
//                   Build.builtin("Object.assign"),
//                   Build.primitive(void 0),
//                   [
//                     Build.object(
//                       Build.primitive("Object.prototype"),
//                       []),
//                     Split.lookup_para(scope, "arguments", null)]),
//                 Build.primitive("length"),
//                 Build.object(
//                   Build.primitive(null),
//                   [
//                     [
//                       Build.primitive("value"),
//                       Object.get(
//                         Split.lookup_para(scope, "arguments", null),
//                         Build.primitive("length"))],
//                     [
//                       Build.primitive("writable"),
//                       Build.primitive(true)],
//                     [
//                       Build.primitive("configurable"),
//                       Build.primitive(true)]])]),
//             Build.primitive("callee"),
//             Build.object(
//               Build.primitive(null),
//               (
//                 Split.is_strict(scope) ?
//                 [
//                   [
//                     Build.primitive("get"),
//                     Build.builtin("Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').get")],
//                   [
//                     Build.primitive("set"),
//                     Build.builtin("Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').set")]] :
//                 [
//                   [
//                     Build.primitive("value"),
//                     Container.get(scope, container)],
//                   [
//                     Build.primitive("writable"),
//                     Build.primitive(true)],
//                   [
//                     Build.primitive("configurable"),
//                     Build.primitive(true)]]))]),
//         Build.builtin("Symbol.iterator"),
//         Build.object(
//           Build.primitive(null),
//           [
//             [
//               Build.primitive("value"),
//               Build.builtin("Array.prototype.values")],
//             [
//               Build.primitive("writable"),
//               Build.primitive(true)],
//             [
//               Build.primitive("configurable"),
//               Build.primitive(true)]])]);
//     if (Split.is_strict(scope) || !is_simple) {
//       optionals[optionals.length] = {
//         __proto__: null,
//         kind: "base",
//         identifier: "arguments",
//         statement: Build.Expression(
//           Split.declare_initialize_base(
//             scope,
//             nullable_identifier,
//             REGULAR_TAGS[false],
//             aran_expression)};
//     } else {
//       for (let index = 0; index < identifiers.length; index++) {
//         const {identifier, aran_expression} = Split.declare_initialize_meta(scope, "argmap" + index, Build.primitive(true));
//         aran_expressionss.meta[identifier] = aran_expression;
//         aran_expressionss.base[identifier] = Split.declare_initialize_base(scope, identifiers[index], Object.get(
//           Split.lookup_para(scope, "arguments", null),
//           Build.primitive(index)));
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
//       expressions[meta_identifier] = Build.primitive(true);
//       expressions[base_identifier] = Object.get(Build.read(Identifier.PARAMETERS["arguments"], Build.primitive(index)));
//     });
//     expressions["arguments"] = Build.construct(
//       Build.builtin("Proxy"),
//       [
//         expressions["arguments"],
//         Build.object(
//           Build.primitive(null),
//           [
//             [
//               Build.primitive("defineProperty"),
//               Build.arrow(
//                 Build.BLOCK(
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
        Build.primitive(null),
        (box) => Build.sequence(
          Scope.set(
            scope,
            box,
            Build.apply(
              Build.builtin("Object.defineProperty"),
              Build.primitive(void 0),
              [
                Build.apply(
                  Build.builtin("Object.defineProperty"),
                  Build.primitive(void 0),
                  [
                    Build.closure(
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
                          [ArrayLite.includes(esidentifier1, "arguments") ? "this" /* dirty trick */ : "arguments"]: () => Build.apply(
                            Build.builtin("Object.defineProperty"),
                            Build.primitive(void 0),
                            [
                              Build.apply(
                                Build.builtin("Object.defineProperty"),
                                Build.primitive(void 0),
                                [
                                  Build.apply(
                                    Build.builtin("Object.defineProperty"),
                                    Build.primitive(void 0),
                                    [
                                      Build.apply(
                                        Build.builtin("Object.assign"),
                                        Build.primitive(void 0),
                                        [
                                          Build.object(
                                            Build.primitive("Object.prototype"),
                                            []),
                                          Scope.parameter("arguments")]),
                                      Build.primitive("length"),
                                      Build.object(
                                        Build.primitive(null),
                                        [
                                          [
                                            Build.primitive("value"),
                                            Object.get(
                                              Scope.arguments(scope),
                                              Build.primitive("length"))],
                                          [
                                            Build.primitive("writable"),
                                            Build.primitive(true)],
                                          [
                                            Build.primitive("configurable"),
                                            Build.primitive(true)]])]),
                                  Build.primitive("callee"),
                                  Build.object(
                                    Build.primitive(null),
                                    (
                                      Scope.$GetStrict(scope) ?
                                      [
                                        [
                                          Build.primitive("get"),
                                          Build.builtin("Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').get")],
                                        [
                                          Build.primitive("set"),
                                          Build.builtin("Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').set")]] :
                                      [
                                        [
                                          Build.primitive("value"),
                                          Scope.callee(scope)],
                                        [
                                          Build.primitive("writable"),
                                          Build.primitive(true)],
                                        [
                                          Build.primitive("configurable"),
                                          Build.primitive(true)]]))]),
                              Build.builtin("Symbol.iterator"),
                              Build.object(
                                Build.primitive(null),
                                [
                                  [
                                    Build.primitive("value"),
                                    Build.builtin("Array.prototype.values")],
                                  [
                                    Build.primitive("writable"),
                                    Build.primitive(true)],
                                  [
                                    Build.primitive("configurable"),
                                    Build.primitive(true)]])]),
                          ["new.target"]: () => Scope.parameter("new.target"),
                          ["this"]: () => (
                            Scope.$IsStrict(scope) ?
                            Scope.parameter("this") :
                            Build.conditional(
                              Build.binary(
                                "===",
                                Scope.parameter("this"),
                                Build.primitive(null)),
                              Build.builtin("global"),
                              Build.conditional(
                                Build.binary(
                                  "===",
                                  Scope.parameter("this"),
                                  Build.primitive(void 0)),
                                Build.builtin("global"),
                                Build.apply(
                                  Build.builtin("Object"),
                                  Build.primitive(void 0),
                                  [
                                    Scope.parameter("this")]))))},
                        (scope) => ArrayLite.concat(
                            ArrayLite.flatMap(
                              patterns,
                              (param, index) => Build.Expression(
                                Pattern.assign1(
                                  scope,
                                  true,
                                  (
                                    param.type === "RestElement" ?
                                    param.argument :
                                    param),
                                  (
                                    param.type === "RestElement" ?
                                    Build.apply(
                                      Build.builtin("Array.prototype.slice"),
                                      Scope.arguments(scope),
                                      [
                                        Build.primitive(index)]) :
                                    Object.get(
                                      Scope.arguments(scope),
                                      Build.primitive(index)))))),
                            (
                              is_expression ?
                              Build.Return(
                                Scope.box(
                                  scope,
                                  "StatementReturnArgument",
                                  Visit.node(node.argument, scope, false, null),
                                  (box) => Build.conditional(
                                    Scope.read(scope, "new.target"),
                                    Build.conditional(
                                      Build.binary(
                                        "===",
                                        Build.unary(
                                          "typeof",
                                          Scope.get(scope, box)),
                                        Build.primitive("object")),
                                      Build.conditional(
                                        Scope.get(scope, box),
                                        Scope.get(scope, box),
                                        Scope.read(scope, "this")),
                                      Build.conditional(
                                        Build.binary(
                                          "===",
                                          Build.unary(
                                            "typeof",
                                            Scope.get(scope, box)),
                                          Build.primitive("function")),
                                        Scope.get(scope, box),
                                        Scope.read(scope, "this"))),
                                    Scope.get(scope, box)))) :
                              ArrayLite.concat(
                                Build.Block(
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
                                Build.Return(
                                  Build.conditional(
                                    Scope.read(scope, "new.target"),
                                    Scope.read(scope, "this"),
                                    Build.primitive(void 0)))))))),
                    Build.primitive("length"),
                    Build.object(
                      Build.primitive(null),
                      [
                        [
                          Build.primitive("value"),
                          Build.primitive(
                            (
                              (
                                params.length > 0 &&
                                params[params.length - 1].type === "RestElement") ?
                              params.length - 1 :
                              params.length))],
                        [
                          Build.primitive("configurable"),
                          Build.primitive(true)]])]),
                Build.primitive("name"),
                Build.object(
                  Build.primitive(null),
                  [
                    [
                      Build.primitive("value"),
                      options.name()],
                    [
                      Build.primitive("configurable"),
                      Build.primitive(true)]])])),
          Build.sequence(
            Build.apply(
              Build.builtin("Reflect.set"),
              Build.primitive(void 0),
              [
                Scope.get(scope, box2),
                Build.primitive("prototype"),
                Build.apply(
                  Build.builtin("Object.defineProperty"),
                  Build.primitive(void 0),
                  [
                    Build.object(
                      Build.builtin("Object.prototype"),
                      []),
                    Build.primitive("constructor"),
                    Build.object(
                      Build.primitive(null),
                      [
                        [
                          Build.primitive("value"),
                           Scope.get(scope, box1)],
                        [
                          Build.primitive("writable"),
                          Build.primitive(true)],
                        [
                          Build.primitive("configurable"),
                          Build.primitive(true)]])])]),
            Scope.get(scope, box2)))),
      (
        (
          Scope.$IsStrict(scope) ||
          (
            !is_expression &&
            Query.IsStrict(closure_body.body))),
        _expression :
        Build.apply(
          Build.builtin("Object.defineProperty"),
          Build.primitive(void 0),
          [
            Build.apply(
              Build.builtin("Object.defineProperty"),
              Build.primitive(void 0),
              [
                _expression,
                Build.primitive("arguments"),
                Build.object(
                  Build.primitive(null),
                  [
                    [
                      Build.primitive("value"),
                      Build.primitive(null)]])]),
            Build.primitive("caller"),
            Build.object(
              Build.primitive(null),
              [
                [
                  Build.primitive("value"),
                  Build.primitive(null)]])])))));
