"use strict";

const global_Error = global.Error;

const ArrayLite = require("array-lite");
const Tree = require("../../tree.js");
const Scope = require("../../scope/index.js");
const Mop = require("../../mop.js");
let Expression = null;

// Depth first:
//
// var iterator = () => ({
//   __proto__: null,
//   counter: 0,
//   next: function () {
//     console.log("yo", this.counter);
//     this.counter++;
//     return {
//       __proto__: null,
//       done: this.counter > 5,
//       value: undefined
//     }
//   }
// });
// var x, y;
// [(console.log("foo"), {})[(console.log("bar"))], x = console.log("qux"), y] = {__proto__:null, [Symbol.iterator]: iterator};
// foo
// bar
// yo 0
// yo 1
// qux
// yo 2

// exports.assign = (scope, pattern, expression, i) => visit(scope, pattern, expression, false);
//
// exports.initialize = (scope, pattern, expression) => visit(scope, pattern, expression, true);

const visit = (scope, pattern, expression, is_initialization) => visitors[pattern.type](scope, pattern, expression, is_initialization);

exports.assign = visit;

exports._resolve_circular_dependencies = (expression_module) => {
  Expression = expression_module;
};

const visitors = {__proto__:null};

// Safari:
//
// > [(console.log("foo"), {})[console.log("bar")] = console.log("qux")] = []
// qux
// foo
// bar
//
// Chrome/Node/Firefox:
//
// > [(console.log("foo"), {})[console.log("bar")] = console.log("qux")] = []
// foo
// bar
// qux
//
// We choose the safari evaluation order for consistency reason:
// visitors of this file receives a box as right-hand side which means that it
// has already been evaluated (or it has no side effects -- e.g. primitive).
visitors.MemberExpression = (scope, pattern, expression, is_initialization) => (
  is_initialization ?
  ((() => { throw new global_Error("Cannot initialize member expressions") }) ()) :
  Scope.box(
    scope,
    "AssignMemberRight",
    false,
    expression,
    (right_box) => (
      Scope._is_strict(scope) ?
      Mop.set(
        Expression.visit(scope, pattern.object, false, null),
        (
          pattern.computed ?
          Expression.visit(scope, pattern.property, false, null) :
          Tree.primitive(pattern.property.name)),
        Scope.get(scope, right_box),
        null,
        true,
        Mop._success_result) :
      Scope.box(
        scope,
        "AssignMemberObject",
        false,
        Expression.visit(scope, pattern.object, false, null),
        (object_box) => Scope.box(
          scope,
          "AssignMemberProperty",
          false,
          (
            pattern.computed ?
            Expression.visit(scope, pattern.property, false, null) :
            Tree.primitive(pattern.property.name)),
          (property_box) => Mop.set(
            Mop.convert(
              () => Scope.get(scope, object_box)),
            Scope.get(scope, property_box),
            Scope.get(scope, right_box),
            null,
            false,
            Mop._success_result))))));

visitors.Identifier = (scope, pattern, expression, is_initialization) => (
  is_initialization ?
  Scope.initialize(scope, pattern.name, expression) :
  Scope.write(scope, pattern.name, expression));

visitors.AssignmentPattern = (scope, pattern, expression, is_initialization) => Scope.box(
  scope,
  "AssignAssignmentRight",
  false,
  expression,
  (box) => visit(
    scope,
    pattern.left,
    Tree.conditional(
      Tree.binary(
        "===",
        Scope.get(scope, box),
        Tree.primitive(void 0)),
      Expression.visit(scope, pattern.right, false, null),
      Scope.get(scope, box)),
    is_initialization));

// We have to check if `null` or `undefined` before (even if no properties):
//
// > var {[(console.log("yo"), "foo")]:foo} = null;
// Thrown:
// TypeError: Cannot destructure 'undefined' or 'null'.
// > var {} = null;
// Thrown:
// TypeError: Cannot destructure 'undefined' or 'null'.

// BUT we have to cast into `Object` at each property:
//
// > let thisfoo = null;
// undefined
// > let thisbar = null;
// undefined
// Reflect.defineProperty(String.prototype, "foo", {
//  get: function () {
//     thisfoo = this;
//     return "yolo";
//   }
// });
// true
// Reflect.defineProperty(String.prototype, "bar", {
//   get: function () {
//     thisbar = this;
//     return "swag";
//   }
// });
// true
// > var {foo,bar} = "qux";
// undefined
// > thisfoo
// [String: 'qux']
// > thisbar
// [String: 'qux']
// > thisfoo === thisbar
// false

visitors.ObjectPattern = (scope, pattern, expression, is_initialization) => Scope.box(
  scope,
  "AssignObjectRight",
  false,
  expression,
  (box) => Tree.conditional(
    Tree.conditional(
      Tree.binary(
        "===",
        Scope.get(scope, box),
        Tree.primitive(null)),
      Tree.primitive(true),
      Tree.binary(
        "===",
        Scope.get(scope, box),
        Tree.primitive(void 0))),
    Tree.throw(
      Tree.construct(
        Tree.builtin("TypeError"),
        [
          Tree.primitive("Cannot destructure 'undefined' or 'null'")])),
    (
      (
        pattern.properties.length > 0 &&
        pattern.properties[pattern.properties.length - 1].type === "RestElement") ?
      ArrayLite.mapReduce(
        ArrayLite.slice(pattern.properties, 0, pattern.properties.length - 1),
        (next, property) => Scope.box(
          scope,
          "AssignObjectRestKey",
          false,
          (
            property.computed ?
            Expression.visit(scope, property.key, false, null) :
            Tree.primitive(property.key.name)),
          (key_box) => Tree.sequence(
            visit(
              scope,
              property.value,
              Mop.get(
                Tree.apply(
                  Tree.builtin("Object"),
                  Tree.primitive(void 0),
                  [
                    Scope.get(scope, box)]),
                Scope.get(scope, key_box),
                null),
              is_initialization),
            next(key_box))),
        (key_box_array) => Scope.box(
          scope,
          "AssignObjectRest",
          false,
          Tree.apply(
            Tree.builtin("Object.assign"),
            Tree.primitive(void 0),
            [
              Mop.create(
                Tree.builtin("Object.prototype"),
                []),
              Scope.get(scope, box)]),
          (box) => Tree.sequence(
            ArrayLite.reduce(
              key_box_array,
              (expression, key_box) => Tree.sequence(
                expression,
                Mop.deleteProperty(
                  Scope.get(scope, box),
                  Scope.get(scope, key_box),
                  false,
                  Mop._success_result)),
              Tree.primitive(void 0)),
            visit(
              scope,
              pattern.properties[pattern.properties.length - 1].argument,
              Scope.get(scope, box),
              is_initialization)))) :
      ArrayLite.reduce(
        pattern.properties,
        (expression, property) => Tree.sequence(
          expression,
          visit(
            scope,
            property.value,
            Mop.get(
              Tree.apply(
                Tree.builtin("Object"),
                Tree.primitive(void 0),
                [
                  Scope.get(scope, box)]),
              (
                property.computed ?
                Expression.visit(scope, property.key, false, null) :
                Tree.primitive(property.key.name)),
              null),
            is_initialization)),
        Tree.primitive(void 0)))));

// Even empty pattern trigger getting a Symbol.iterator:
//
// > var p = new Proxy([], {
//   __proto__: null,
//   get: (tgt, key, rec) => (console.log("get", key), Reflect.get(tgt, key, rec))
// });
// undefined
// > var [] = p;
// get Symbol(Symbol.iterator)
// undefined
//
// Not need to convert it to an object:
//
// > var iterator = () => "foo";
// undefined
// >  var [x, y, z] = {[Symbol.iterator]:iterator};
// Thrown:
// Typeglobal_Error: Result of the Symbol.iterator method is not an object
//
// Functions work:
//
// > var iterator = () => { var f = function () {}; f.next = () => ({}); return f; }
// undefined
// > var [x, y, z] = {[Symbol.iterator]:iterator};
// undefined
//
// Not need to convert it to an object:
//
// > var iterator = () => ({__proto__: null, next:() => "foo"});
// undefined
// > var [x, y, z] = {__proto__:null, [Symbol.iterator]:iterator};
// Thrown:
// Typeglobal_Error: Typeglobal_Error: Iterator result foo is not an object
//
// Functions work:
// > var iterator = () => ({__proto__: null, next:() => () => {}});
// undefined
// > var [x, y, z] = {__proto__:null, [Symbol.iterator]:iterator};
// undefined

visitors.ArrayPattern = (scope, pattern, expression, is_initialization) => Scope.box(
  scope,
  "PatterArrayRight",
  false,
  expression,
  (right_box) => Scope.box(
    scope,
    "AssignArrayIterator",
    false,
    Tree.apply(
      Mop.get(
        Mop.convert(
          () => Scope.get(scope, right_box)),
        Tree.builtin("Symbol.iterator"),
        null),
      Scope.get(scope, right_box),
      []),
    (iterator_box) => ArrayLite.reduce(
      pattern.elements,
      (expression, element) => Tree.sequence(
        expression,
        (
          element.type === "RestElement" ?
          visit(
            scope,
            element.argument,
            Tree.apply(
              Tree.builtin("Array.from"),
              Tree.primitive(void 0),
              [
                Mop.create(
                  Tree.primitive(null),
                  [
                    [
                      Tree.builtin("Symbol.iterator"),
                      {
                        __proto__: null,
                        value: Tree.arrow(
                          Scope.EXTEND_STATIC(
                            Scope._extend_closure(scope),
                            {__proto__:null},
                            (scope) => Tree.Return(
                              Scope.get(scope, iterator_box)))),
                        writable: true,
                        enumerable: true,
                        configurable: true}]])]),
            is_initialization) :
          visit(
            scope,
            element,
            Mop.get(
              Tree.apply(
                Mop.get(
                  Scope.get(scope, iterator_box),
                  Tree.primitive("next"),
                  null),
                Scope.get(scope, iterator_box),
                []),
              Tree.primitive("value"),
              null),
            is_initialization))),
      Tree.primitive(void 0))));
