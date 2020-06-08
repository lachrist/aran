"use strict";

const ArrayLite = require("array-lite");
const Lang = require("../lang.js");
const Expression = require("./expression.js");
const Scope = require("../scope/index.js");
const Object = require("../object.js");

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

exports.assign = (pattern, expression, scope) => (
  pattern.type === "Identifier" ?
  Scope.write(scope, pattern.name, expression) :
  Scope.box(
    scope,
    "PatternAssignRight",
    expression,
    (box) => visit(pattern, box, scope, false)));

exports.initialize = (pattern, expression, scope) => (
  pattern.type === "Identifier" ?
  Scope.initialize(scope, pattern.name, expression) :
  Scope.box(
    scope,
    "PatternInitializeRight",
    expression,
    (box) => visit(pattern, box, scope, true)));

const visit = (pattern, box, scope, is_initialization) => visitors[pattern.type](pattern, box, scope, is_initialization);

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
visitors.MemberExpression = (pattern, box, scope, is_initialization) => (
  is_initialization ?
  ((() => { throw new global_Error("Cannot initialize member expressions") }) ()) :
  (
    Scope._is_strict(scope) ?
    Object.set(
      true,
      Expression.visit(pattern.object, scope, false, null),
      (
        pattern.computed ?
        Expression.visit(pattern.property, scope, false, null) :
        Lang.primitive(pattern.property.name)),
      Scope.get(scope, box)) :
    Scope.box(
      scope,
      "PatternMemberObject",
      false,
      Expression.visit(pattern.object, scope, false, null),
      (object_box) => Scope.box(
        scope,
        "PatternMemberProperty",
        false,
        (
          pattern.computed ?
          Expression.visit(pattern.property, scope, false, null) :
          Lang.primitive(pattern.property.name)),
        (property_box) => Object.set(
          false,
          Object.obj(
            () => Scope.get(scope, object_box)),
          Scope.get(scope, property_box),
          Scope.get(scope, box))))));

visitors.Identifier = (pattern, scope, box, is_initialization) => (
  is_initialization ?
  Scope.initialize(
    scope,
    pattern.name,
    Scope.get(scope, box)) :
  Scope.write(
    scope,
    pattern.name,
    Scope.get(scope, box)));

visitors.AssignmentPattern = (pattern, scope, box, is_initialization) => Scope.box(
  scope,
  "PatternAssignmentChild",
  Lang.conditional(
    Lang.binary(
      "===",
      Scope.get(scope, box),
      Lang.primitive(void 0)),
    Expression.visit(pattern.right, scope, false, null),
    Scope.get(scope, box)),
  (box) => visit(pattern.left, box, scope, is_initialization));

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

visitors.ObjectPattern = (pattern, scope, box, is_initialization) => Lang.conditional(
  Lang.conditional(
    Lang.binary(
      "===",
      Scope.get(scope, box),
      Lang.primitive(null)),
    Lang.primitive(true),
    Lang.binary(
      "===",
      Scope.get(scope, box),
      Lang.primitive(void 0))),
  Lang.throw(
    Lang.construct(
      Lang.builtin("TypeError"),
      [
        Lang.primitive("Cannot destructure 'undefined' or 'null'")])),
  (
    (
      pattern.properties.length > 0 &&
      pattern.properties[pattern.properties.length - 1].type === "RestElement") ?
    ArrayLite.mapReduce(
      ArrayLite.slice(pattern.properties, 0, pattern.properties.length - 1),
      (next, property) => Scope.box(
        scope,
        "PatternObjectRestKey",
        false,
        (
          property.computed ?
          Expression.visit(property.key, scope, false, null) :
          Lang.primitive(property.key.name)),
        (key_box) => Lang.sequence(
          Scope.box(
            scope,
            "PatternObjectRestChild",
            false,
            Object.get(
              Object.obj(
                () => Scope.get(scope, box)),
              Scope.get(scope, key_box)),
            (box) => visit(property.value, box, scope, is_initialization)),
          next(key_box))),
      (key_box_array) => Scope.box(
        scope,
        "PatternObjectRest",
        false,
        Lang.apply(
          Lang.builtin("Object.assign"),
          Lang.primitive(void 0),
          [
            Lang.object(
              Lang.builtin("Object.prototype"),
              []),
            Scope.get(scope, box)]),
        (box) => Lang.sequence(
          ArrayLite.reduce(
            key_box_array,
            (expression, key_box) => Lang.sequence(
              expression,
              Object.del(
                false,
                Scope.get(scope, box),
                Scope.get(scope, key_box),
                null)),
            Lang.primitive(void 0)),
          visit(pattern.properties[pattern.properties.length - 1].argument, box, scope, is_initialization)))) :
    ArrayLite.reduce(
      pattern.properties,
      (expression, property) => Lang.sequence(
        expression,
        Scope.box(
          scope,
          "PatternObjectChild",
          false,
          Object.get(
            Object.obj(
              () => Scope.get(scope, box)),
            (
              property.computed ?
              Expression.visit(property.key, scope, false, null) :
              Lang.primitive(property.key.name, scope, false, null))),
          (box) => visit(scope, property.value, scope, is_initialization))),
      Lang.primitive(void 0))));

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

visitors.ArrayPattern = (pattern, box, scope, is_initialization) => Scope.box(
  scope,
  "PatternArrayIterator",
  Lang.apply(
    Object.get(
      () => Scope.get(scope, box),
      Lang.builtin("Symbol.iterator")),
    Scope.get(scope, box),
    []),
  (iterator_box) => Arraylite.reduce(
    pattern.elements,
    (expression, element) => Lang.sequence(
      expression,
      (
        element.type === "RestElement" ?
        Scope.box(
          scope,
          "PatternArrayRestChild",
          false,
          Lang.apply(
            Lang.builtin("Array.from"),
            Lang.primitive(void 0),
            [
              Lang.object(
                Lang.primitive(null),
                [
                  [
                    Lang.builtin("Symbol.iterator"),
                    Lang.arrow(
                      Scope.EXTEND_STATIC(
                        Scope._extend_closure(scope),
                        {__proto__:null},
                        (scope) => Lang.Return(
                          Scope.get(iterator_box))))]])]),
          (box) => visit(element.argument, box, scope, is_initialization)) :
        Scope.box(
          scope,
          "PatternArrayChild",
          false,
          Object.get(
            Lang.apply(
              Object.get(
                Scope.get(scope, iterator_box),
                Lang.primitive("next")),
              Scope.get(scope, iterator_box),
              []),
            Lang.primitive("value")),
          (box) => visit(element, box, scope, is_initialization)))),
    Lang.primitive(void 0)));
