"use strict";

const global_Error = global.Error;

const ArrayLite = require("array-lite");
const Tree = require("../../tree.js");
const Scope = require("../../scope/index.js");
const Builtin = require("../../builtin.js");
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

const visit = (scope, pattern, expression, kind) => visitors[pattern.type](scope, pattern, expression, kind);

exports.assign = visit;

exports._resolve_circular_dependencies = (expression_module) => (
  Expression = expression_module,
  void 0);

const visitors = {__proto__:null};

visitors.CallExpression = (scope, pattern, expression, kind) => Tree.sequence(
  Expression.visit(scope, pattern, Expression._default_context),
  Tree.sequence(
    Builtin.throw_reference_error("Cannot assign to call expression"),
    expression));

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
visitors.MemberExpression = (scope, pattern, expression, kind) => Scope.box(
  scope,
  false,
  "AssignMemberRight",
  expression,
  (right_box) => (
    Scope._is_strict(scope) ?
    Builtin.set(
      Expression.visit(scope, pattern.object, Expression._default_context),
      (
        pattern.computed ?
        Expression.visit(scope, pattern.property, Expression._default_context) :
        Tree.primitive(pattern.property.name)),
      Scope.get(scope, right_box),
      null,
      true,
      Builtin._success_result) :
    Scope.box(
      scope,
      false,
      "AssignMemberObject",
      Expression.visit(scope, pattern.object, Expression._default_context),
      (object_box) => Scope.box(
        scope,
        false,
        "AssignMemberProperty",
        (
          pattern.computed ?
          Expression.visit(scope, pattern.property, Expression._default_context) :
          Tree.primitive(pattern.property.name)),
        (property_box) => Builtin.set(
          Builtin.fork_nullish(
            () => Scope.get(scope, object_box),
            null,
            null),
          Scope.get(scope, property_box),
          Scope.get(scope, right_box),
          null,
          false,
          Builtin._success_result)))));

visitors.Identifier = (scope, pattern, expression, kind) => (
  kind === null ?
  Scope.write(scope, pattern.name, expression) :
  Scope.initialize(scope, kind, pattern.name, expression));

visitors.AssignmentPattern = (scope, pattern, expression, kind) => Scope.box(
  scope,
  false,
  "AssignAssignmentRight",
  expression,
  (box) => visit(
    scope,
    pattern.left,
    Tree.conditional(
      Tree.binary(
        "===",
        Scope.get(scope, box),
        Tree.primitive(void 0)),
      Expression.visit(scope, pattern.right, Expression._default_context),
      Scope.get(scope, box)),
    kind));

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

visitors.ObjectPattern = (scope, pattern, expression, kind) => Scope.box(
  scope,
  false,
  "AssignObjectRight",
  expression,
  (box) => Builtin.fork_nullish(
    () => Scope.get(scope, box),
    Builtin.throw_type_error("Cannot destructure 'undefined' or 'null'"),
    (
      (
        pattern.properties.length > 0 &&
        pattern.properties[pattern.properties.length - 1].type === "RestElement") ?
      ArrayLite.mapReduce(
        ArrayLite.slice(pattern.properties, 0, pattern.properties.length - 1),
        (next, property) => Scope.box(
          scope,
          false,
          "AssignObjectRestKey",
          (
            property.computed ?
            Expression.visit(scope, property.key, Expression._default_context) :
            Tree.primitive(property.key.name)),
          (key_box) => Tree.sequence(
            visit(
              scope,
              property.value,
              Builtin.get(
                Builtin.convert_to_object(
                  Scope.get(scope, box)),
                Scope.get(scope, key_box),
                null),
              kind),
            next(key_box))),
        (key_box_array) => Scope.box(
          scope,
          false,
          "AssignObjectRest",
          Builtin.assign(
            Builtin.construct_object(
              Builtin.grab("Object.prototype"),
              []),
            [
              Scope.get(scope, box)],
            true,
            Builtin._target_result),
          (box) => Tree.sequence(
            ArrayLite.reduce(
              key_box_array,
              (expression, key_box) => Tree.sequence(
                expression,
                Builtin.delete_property(
                  Scope.get(scope, box),
                  Scope.get(scope, key_box),
                  false,
                  Builtin._success_result)),
              Tree.primitive(void 0)),
            visit(
              scope,
              pattern.properties[pattern.properties.length - 1].argument,
              Scope.get(scope, box),
              kind)))) :
      ArrayLite.reduce(
        pattern.properties,
        (expression, property) => Tree.sequence(
          expression,
          visit(
            scope,
            property.value,
            Builtin.get(
              Builtin.convert_to_object(
                Scope.get(scope, box)),
              (
                property.computed ?
                Expression.visit(scope, property.key, Expression._default_context) :
                Tree.primitive(property.key.name)),
              null),
            kind)),
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

visitors.ArrayPattern = (scope, pattern, expression, kind) => Scope.box(
  scope,
  false,
  "PatterArrayRight",
  expression,
  (right_box) => Scope.box(
    scope,
    false,
    "AssignArrayIterator",
    Tree.apply(
      Builtin.get(
        Builtin.fork_nullish(
          () => Scope.get(scope, right_box),
          null,
          null),
        Builtin.grab("Symbol.iterator"),
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
            Builtin.convert_to_array(
              Builtin.construct_object(
                Tree.primitive(null),
                [
                  [
                    Builtin.grab("Symbol.iterator"),
                    {
                      __proto__: null,
                      value: Tree.arrow(
                        Scope.CLOSURE(
                          scope,
                          false,
                          {
                            kind: "arrow",
                            super: null,
                            self: null,
                            newtarget: false},
                          false,
                          [],
                          (scope) => Tree.Bundle([]),
                          false,
                          [],
                          (scope) => Tree.Return(
                            Scope.get(scope, iterator_box)))),
                      writable: true,
                      enumerable: true,
                      configurable: true}]])),
            kind) :
          visit(
            scope,
            element,
            Builtin.get(
              Tree.apply(
                Builtin.get(
                  Scope.get(scope, iterator_box),
                  Tree.primitive("next"),
                  null),
                Scope.get(scope, iterator_box),
                []),
              Tree.primitive("value"),
              null),
            kind))),
      Tree.primitive(void 0))));
