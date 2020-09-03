"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

require("../tree.js")._toggle_debug_mode();
const Acorn = require("acorn");
const Closure = require("./closure.js");
const Lang = require("../../lang/index.js");
const State = require("../state.js");
const Scope = require("../scope/index.js");
const Completion = require("../completion.js");
const Tree = require("../tree.js");

const Block = {
  CLOSURE: (scope, statements, completion) => Scope.EXTEND_STATIC(
    scope,
    {
      __proto__: null},
    (scope) => Tree.Bundle(
      statements.map(
        (statement) => Statement.Visit(scope, statement))))};

const Statement = {
  Visit: (scope, statement) => {
    if (statement.type === "ExpressionStatement") {
      return Tree.Lift(Expression.visit(scope, statement.expression));
    }
    Assert.fail("Unexpected statement type");
  }
};

const Expression = {
  visit: (scope, expression) => {
    if (expression.type === "Literal") {
      return Tree.primitive(expression.value);
    }
    if (expression.type === "Identifier") {
      return Scope.read(scope, expression.name);
    }
    if (expression.type === "SequenceExpression") {
      Assert.deepEqual(expression.expressions.length, 2);
      return Tree.sequence(
        Expression.visit(scope, expression.expressions[0]),
        Expression.visit(scope, expression.expressions[1]));
    }
    if (expression.type === "CallExpression") {
      Assert.deepEqual(expression.callee.type, "Identifier");
      Assert.deepEqual(expression.callee.name, "eval");
      Assert.deepEqual(expression.arguments.length, 1);
      return Scope.eval(scope, Expression.visit(scope, expression.arguments[0]));
    }
    Assert.fail("Unexpected expression type");
  }
};

Closure._resolve_circular_dependencies(Expression, Block);

const failure = (key, code, message) => Assert.throws(
  () => Closure[key](
    Scope._make_root(),
    Acorn.parse(code).body[0].expression,
    null),
  new Error(message));

const success = (key, name, length, code1, code2, _scope) => (
  _scope = Scope._make_root(),
  Lang._match_expression(
    Scope.box(
      _scope,
      "foobar",
      false,
      Tree.primitive(name),
      (box) => Closure[key](
        _scope,
        Acorn.parse(code1).body[0].expression,
        box)),
    Lang.parse_expression(`
      #Object.defineProperty(
        #Object.defineProperty(
          ${code2},
          "length",
          {
            __proto__: null,
            value: ${length},
            configurable: true}),
        "name",
        {
          __proto__: null,
          value: ${JSON.stringify(name)},
          configurable: true})`),
    Assert));

State._run_session({nodes:[], serials:new Map(), evals:{__proto__:null}}, [], () => {
  // Arrow //
  {
    // Asynchronous //
    failure(
      "arrow",
      `(async () => {});`,
      "Unfortunately, Aran does not yet support asynchronous arrows.");
    // Regular //
    success(
      "arrow",
      "foo",
      2,
      `((x1, x2) => { 123; });`,
      `() => {
        let x1, x2;
        x1 = #Reflect.get(ARGUMENTS, 0);
        x2 = #Reflect.get(ARGUMENTS, 1);
        { 123; }
        return void 0; }`);
    // RestElement + ExpressionBody //
    success(
      "arrow",
      "foo",
      2,
      `((x1, x2, ...xs) => 123);`,
      `() => {
        let x1, x2, xs;
        x1 = #Reflect.get(ARGUMENTS, 0);
        x2 = #Reflect.get(ARGUMENTS, 1);
        xs = #Array.prototype.slice(@ARGUMENTS, 2);
        return 123;}`);
    // Eval //
    success(
      "arrow",
      "foo",
      0,
      `(() => (eval("var x = 123;"), x));`,
      `() => {
        let _frame;
        _frame = {__proto__:null};
        return (
          eval(§_frame, "var x = 123;"),
          (
            #Reflect.has(_frame, "x") ?
            #Reflect.get(_frame, "x") :
            (
              #Reflect.has(#global, "x") ?
              #Reflect.get(#global, "x") :
              throw new #ReferenceError("x is not defined"))));}`);
  }
  // Function //
  {
    // Asynchronous //
    failure(
      "function",
      `(async function () {});`,
      "Unfortunately, Aran does not yet support asynchronous functions.");
    // Generator //
    failure(
      "function",
      `(function* () {});`,
      "Unfortunately, Aran does not yet support generator functions.");
    // Success //
    success(
      "function",
      "foo",
      0,
      `(function f () {123;});`,
      `function () {
        let arguments, this, new.target;
        123;
        return NEW_TARGET ? THIS : void 0;}`);
  }
});





















// // // function f (x) {
// // //   Reflect.defineProperty(arguments, 0, {
// // //     __proto__:null,
// // //     value: "foo",
// // //     configurable: true,
// // //     writable: false,
// // //     enumerable: true
// // //   });
// // //   Reflect.defineProperty(arguments, 0, {
// // //     __proto__:null,
// // //     value: "foo",
// // //     configurable: true,
// // //     writable: true,
// // //     enumerable: true
// // //   });
// // //   x = "bar";
// // //   return arguments[0];
// // // }
// //
// // // ((function f (x) {
// // //   Reflect.defineProperty(arguments, 0, {
// // //     __proto__:null,
// // //     value: "bar",
// // //     configurable: true,
// // //     writable: false,
// // //     enumerable: true
// // //   });
// // //   console.log(x);
// // // }) ("foo"));
// // //   // Reflect.defineProperty(arguments, 0, {
// // //   //   __proto__:null,
// // //   //   value: "bar",
// // //   //   configurable: true,
// // //   //   writable: true,
// // //   //   enumerable: true
// // //   // });
// // //   x = "qux";
// // //   console.log(arguments[0]);
// // //   // arguments[0] = "qux";
// // //   // console.log(x);
// // //   // x = "foo";
// // //   //
// // //   // return arguments[0];
// // //   // Reflect.defineProperty(arguments, 0, {
// // //   //   __proto__:null,
// // //   //   value: "foo",
// // //   //   configurable: true,
// // //   //   writable: true,
// // //   //   enumerable: true
// // //   // });
// // //   // // arguments[0] = "bar";
// // //   // return x;
// // // }) ("zbra"));
// //
// // const o = {
// //   __proto__: null,
// //   getOwnPropertyDescriptor: (target, key) => {
// //     let target, key, descriptor;
// //     target = Reflect.get(ARGUMENTS, 0);
// //     key = Reflect.get(ARGUMENTS, 1);
// //     descriptor = Reflect.getOwnPropertyDescriptor(target, key);
// //     (key === "0" ? (_linked_0 ? Reflect.set(descriptor, "value", $$x) : null) : null);
// //     // ... //
// //     return descriptor;
// //   },
// //   // https://www.ecma-international.org/ecma-262/10.0/index.html#sec-arguments-exotic-objects-delete-p
// //   deleteProperty: (...ARGUMENTS) => {
// //     let target, key;
// //     target = Reflect.get(ARGUMENTS, 0);
// //     key = Reflect.get(ARGUMENTS, 1);
// //     (key === "0" ? (_linked_0 = false) : null);
// //     // ... //
// //     return Reflect.deleteProperty(target, key);
// //   },
// //   // https://www.ecma-international.org/ecma-262/10.0/index.html#sec-arguments-exotic-objects-defineownproperty-p-desc
// //   // ((function (x) {
// //   //   Reflect.defineProperty(arguments, 0, {
// //   //     __proto__:null,
// //   //     value: "bar",
// //   //     configurable: true,
// //   //     writable: false,
// //   //     enumerable: true
// //   //   });
// //   //   console.log(x); // bar
// //   // }) ("foo"));
// //   // ((function (x) {
// //   //   Reflect.defineProperty(arguments, 0, {
// //   //     __proto__:null,
// //   //     value: "bar",
// //   //     configurable: false,
// //   //     writable: true,
// //   //     enumerable: true
// //   //   });
// //   //   console.log(x); // bar
// //   // }) ("foo"));
// //   defineProperty: (...ARGUMENTS) => {
// //     let target, key, descriptor, success;
// //     target = Reflect.get(ARGUMENTS, 0);
// //     key = Reflect.get(ARGUMENTS, 1);
// //     descriptor = Reflect.get(ARGUMENTS, 2);
// //     success = Reflect.defineProperty(target, key, descriptor);
// //     // If it failed, the link must have already been broken //
// //     (
// //       (key === "0" ? (_linked_0 ? success : false) : false) ?
// //       (
// //         Reflect.getOwnPropertyDescriptor(descriptor, "value") === undefined ?
// //         _linked_0 = false :
// //         (
// //           $$x = Relect.get(descriptor, "value"),
// //           _linked_0 = Reflect.get(descriptor, "writable")) :
// //       null);
// //     // ... //
// //     return success;
// //   }
// // }
//
//
//
// // https://www.ecma-international.org/ecma-262/10.0/index.html#sec-functiondeclarationinstantiation
//
//
// // exports.make_function_block = (scope, use_strict, nullable_identifier, container, is_simple, identifiers, kontinuation) => {
// //   scope = Split.extend(scope, use_strict, true, null);
// //   const optionals = [];
// //   // callee //
// //   if (nullable_identifier !== null && !ArrayLite.includes(identifiers, nullable_identifier)) {
// //     optionals[optionals.length] = {
// //       __proto__: null,
// //       kind: "base",
// //       identifier: nullable_identifier,
// //       statement: Tree.Expression(
// //         Split.declare_initialize_base(
// //           scope,
// //           nullable_identifier,
// //           REGULAR_TAGS[true],
// //           Container.get(scope, container)))};
// //   }
// //   // new.target //
// //   Split.declare_initialize_para(scope, "new.target");
// //   optionals[optionals.length] = {
// //     __proto__: null,
// //     kind: "base",
// //     identifier: "new.target",
// //     statement: Tree.Expression(
// //       Split.declare_initialize_base(
// //         scope,
// //         nullable_identifier,
// //         REGULAR_TAGS[false],
// //         Split.lookup_para(scope, "new.target", null))};
// //   // this //
// //   Split.declare_initialize_para(scope, "this");
// //   optionals[optionals.length] = {
// //     __proto__: null,
// //     kind: "base",
// //     identifier: "this",
// //     statement: Tree.Expression(
// //       Split.declare_initialize_base(
// //         scope,
// //         nullable_identifier,
// //         REGULAR_TAGS[false],
// //         Tree.conditional(
// //           Split.lookup_para(scope, "new.target", null),
// //           Tree.object(
// //             Object.get(
// //               Split.lookup_para(scope, "new.target", null),
// //               Tree.primitive("prototype")),
// //             []),
// //           (
// //             Split.is_strict(scope) ?
// //             Split.lookup_para(scope, "this", null) :
// //             Tree.conditional(
// //               Tree.binary(
// //                 "===",
// //                 Split.lookup_para(scope, "this", null),
// //                 Tree.primitive(null)),
// //               Tree.builtin("global"),
// //               Tree.conditional(
// //                 Tree.binary(
// //                   "===",
// //                   Split.lookup_para(scope, "this", null),
// //                   Tree.primitive(void 0)),
// //                 Tree.builtin("global"),
// //                 Tree.apply(
// //                   Tree.builtin("Object"),
// //                   Tree.primitive(void 0),
// //                   [
// //                     Split.lookup_para(scope, "this", null)])))))))};
// //   // arguments //
// //   Split.declare_initialize_para(scope, "arguments");
// //   if (!ArrayLite.includes(identifiers, "arguments") {
// //     const aran_expression = Tree.apply(
// //       Tree.builtin("Object.defineProperty"),
// //       Tree.primitive(void 0),
// //       [
// //         Tree.apply(
// //           Tree.builtin("Object.defineProperty"),
// //           Tree.primitive(void 0),
// //           [
// //             Tree.apply(
// //               Tree.builtin("Object.defineProperty"),
// //               Tree.primitive(void 0),
// //               [
// //                 Tree.apply(
// //                   Tree.builtin("Object.assign"),
// //                   Tree.primitive(void 0),
// //                   [
// //                     Tree.object(
// //                       Tree.primitive("Object.prototype"),
// //                       []),
// //                     Split.lookup_para(scope, "arguments", null)]),
// //                 Tree.primitive("length"),
// //                 Tree.object(
// //                   Tree.primitive(null),
// //                   [
// //                     [
// //                       Tree.primitive("value"),
// //                       Object.get(
// //                         Split.lookup_para(scope, "arguments", null),
// //                         Tree.primitive("length"))],
// //                     [
// //                       Tree.primitive("writable"),
// //                       Tree.primitive(true)],
// //                     [
// //                       Tree.primitive("configurable"),
// //                       Tree.primitive(true)]])]),
// //             Tree.primitive("callee"),
// //             Tree.object(
// //               Tree.primitive(null),
// //               (
// //                 Split.is_strict(scope) ?
// //                 [
// //                   [
// //                     Tree.primitive("get"),
// //                     Tree.builtin("Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').get")],
// //                   [
// //                     Tree.primitive("set"),
// //                     Tree.builtin("Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').set")]] :
// //                 [
// //                   [
// //                     Tree.primitive("value"),
// //                     Container.get(scope, container)],
// //                   [
// //                     Tree.primitive("writable"),
// //                     Tree.primitive(true)],
// //                   [
// //                     Tree.primitive("configurable"),
// //                     Tree.primitive(true)]]))]),
// //         Tree.builtin("Symbol.iterator"),
// //         Tree.object(
// //           Tree.primitive(null),
// //           [
// //             [
// //               Tree.primitive("value"),
// //               Tree.builtin("Array.prototype.values")],
// //             [
// //               Tree.primitive("writable"),
// //               Tree.primitive(true)],
// //             [
// //               Tree.primitive("configurable"),
// //               Tree.primitive(true)]])]);
// //     if (Split.is_strict(scope) || !is_simple) {
// //       optionals[optionals.length] = {
// //         __proto__: null,
// //         kind: "base",
// //         identifier: "arguments",
// //         statement: Tree.Expression(
// //           Split.declare_initialize_base(
// //             scope,
// //             nullable_identifier,
// //             REGULAR_TAGS[false],
// //             aran_expression)};
// //     } else {
// //       for (let index = 0; index < identifiers.length; index++) {
// //         const {identifier, aran_expression} = Split.declare_initialize_meta(scope, "argmap" + index, Tree.primitive(true));
// //         aran_expressionss.meta[identifier] = aran_expression;
// //         aran_expressionss.base[identifier] = Split.declare_initialize_base(scope, identifiers[index], Object.get(
// //           Split.lookup_para(scope, "arguments", null),
// //           Tree.primitive(index)));
// //       }
// //       $arguments = new Proxy(..., {
// //         __proto__: null,
// //         defineProperty (...args) => {
// //           let target, key, descriptor, breaking;
// //           target = Arguments[0];
// //           key = Arguments[1];
// //           descriptor = Arguments[2];
// //           // https://www.ecma-international.org/ecma-262/10.0/index.html#sec-isdatadescriptor
// //           breaking = ...;
// //           (
// //             (key === "0") ?
// //             (
// //               argmap_0_ARG0 = breaking ? false : argmap_0,
// //               (
// //                 armap_0_ARG0 ?
// //                 $ARG0 = descriptor.value :
// //                 void 0)) :
// //             void 0);
// //           return Reflect.defineProperty(target, key, descriptor);
// //         }
// //       });
// //       identifiers = [];
// //     }
// //   }
// //   return make_block(scope, identifiers, [], [], kontinuation);
// // };
// //
// //   if (!Data.get_is_strict(scope) && is_simple_parameters && !ArrayLite.includes(identifiers, "arguments")) {
// //     ArrayLite.forEach(identifiers, (identifier, index) => {
// //       const base_identiier = Identifier.base(identifier);
// //       const meta_identifier = Identifier.meta("argmap_" + index + "_" + identifier);
// //       Data.declare(scope, meta_identifier, null);
// //       Data.initialize(scope, meta_identifier);
// //       expressions[meta_identifier] = Tree.primitive(true);
// //       expressions[base_identifier] = Object.get(Tree.read(Identifier.PARAMETERS["arguments"], Tree.primitive(index)));
// //     });
// //     expressions["arguments"] = Tree.construct(
// //       Tree.builtin("Proxy"),
// //       [
// //         expressions["arguments"],
// //         Tree.object(
// //           Tree.primitive(null),
// //           [
// //             [
// //               Tree.primitive("defineProperty"),
// //               Tree.arrow(
// //                 Tree.BLOCK(
// //                   Identifier.base()
// //   }
// //   return make_block(scope, identifiers, [], expressions, kontinuation);
// // };
// //
// // exports.extend_closure = (scope, is_use_strict, identifiers, kontinuation) => {
// //   return Layer.extend_closure(scope, is_use_strict, (scope) => {
// //     for (let index = 0; index < identifiers.length; index++) {
// //       Layer.declare_base(scope, identifiers[index], true);
// //     }
// //     return kontinuation(scope);
// //   });
// // };
//
//
//
//
//
//
//
//
// // function f (x, y, z) {
// //   Reflect.defineProperty(arguments, 0, {__proto__: null, set: () => console.log("wesh"), get:() => "foo", configurable:true, enumerable:true});
// //   Reflect.defineProperty(arguments, 0, {__proto__: null, writable: true, value: "foo", configurable:true, enumerable:true});
// //   // Reflect.defineProperty(arguments, 0, {__proto__: null, writable: true, value:"foo", configurable:true, enumerable:true});
// //   // Reflect.defineProperty(arguments, 0, {__proto__: null, writable: false, value:"foo", configurable:false, enumerable:true});
// //   x = "bar";
// //   console.log(Object.getOwnPropertyDescriptors(arguments));
// //   return x;
// // }
// //
// // function f (x) {
// //   eval("var x; console.log(x)");
// // }
// //
// // const bool_x = ;
// // const bool_y;
// // const bool_z;
// // const raw_args = ...;
//
//
//
// const target = {__proto__:null};
// const proxy = new Proxy(target, {
//   __proto__: null,
//   defineProperty: (tgt, key, des) => (
//     console.log("defineProperty", tgt, typeof key, key, des),
//     Reflect.defineProperty(tgt, key, des)),
//   set: (tgt, key, val, rec) => (
//     console.log("set", tgt, typeof key, key, val, rec),
//     Reflect.set(tgt, key, val, rec))});
// //
// // > proxy.foo = "bar"
// // set [Object: null prototype] {} foo bar [Object: null prototype] {}
// // defineProperty [Object: null prototype] {} foo { value: 'bar', writable: true, enumerable: true, configurable: true }
// // 'bar'
// // > proxy.foo = "qux"
// // set [Object: null prototype] { foo: 'bar' } foo qux [Object: null prototype] { foo: 'bar' }
// // defineProperty [Object: null prototype] { foo: 'bar' } foo { value: 'qux' }
// // 'qux'
//
// const arguments = new Proxy({
//   Reflect.apply(
//     Array.prototype.fill,
//     Object.defineProperty(
//       Object.defineownproperty(
//
//   {
//     __proto__: null,
//     get: (tgt, key, rec) => {
//       const val = Reflect.get(tgt, key, rec);
//       return (
//         val === tgt ?
//         (
//           val === "0" ?
//           x :
//           (
//             val === "1" ?
//             y :
//             null)) :
//         val)},
//     getOwnPropertyDescriptor: (tgt, key) => {
//       const des = Reflect.getOwnPropertyDescriptor(tgt, key);
//       (
//         (
//           Reflect.getOwnPropertyDescriptor(des, "value") &&
//           Reflect.get(des, "value") === tgt) ?
//         Reflect.set(
//           des,
//           "value",
//           (
//             key === "0" ?
//             x :
//             (
//               key === "1" ?
//               y :
//               null))) :
//         null);
//       return des;},
//   defineProperty: (tgt, key, des) => (
//     (
//       Reflect.get(Reflect.getOwnPropertyDescriptor(tgt, key), "value") === tgt &&
//       Reflect.getOwnPropertyDescriptor(des, "value") &&
//       Reflect.get(des, "writable") &&
//       Reflect.get(des, "configurable")) ?
//     (
//       (
//         key === "0" ?
//         x = Reflect.get(des, "value") :
//         (
//           key === "1" ?
//           y = Reflect.get(des, "value") :
//           null)),
//       true) :
//     Reflect.defineProperty(tgt, key, des))
//
//         ...
//
//
//     (
//       Reflect.getOwnPropertyDescriptor(des, "value")
//     (
//       key === "0" ?
//       bool_x :
//       false) ?
//     (
//       x = des.value
//
//
//     const result = Reflect.defineProperty(tgt, key, des1);
//     (
//       result &&
//
//   }
//   // > const p = {set 0 (x) { console.log("wesh") }};
//   // undefined
//   // > function f (x) { Reflect.setPrototypeOf(arguments, p); arguments[0] = "foo"; return x }
//   // undefined
//   // > f()
//   // wesh
//   // undefined
//     set: (tgt, key, val, rec) => {
//
//     },
//
//
//       if (val === tgt) {
//         return
//       }
//     }
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
//
// const proxy = new Proxy(
//   {
//     foo:"bar"
//   },
//   {
//     __proto__: null,
//     getOwnPropertyDescriptor: (tgt, key) => (
//       console.log("getOwnPropertyDescriptor", tgt, key),
//       Reflect.getOwnPropertyDescriptor(tgt, key)),
//     defineProperty: (tgt, key, des) => (
//       console.log("defineProperty", tgt, key, des),
//       Reflect.defineProperty(tgt, key, des))});
