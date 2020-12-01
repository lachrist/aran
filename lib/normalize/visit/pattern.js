"use strict";

const global_Object_assign = global.Object.assign;
const global_Error = global.Error;

const ArrayLite = require("array-lite");
const Tree = require("../tree.js");
const State = require("../state.js");
const Scope = require("../scope");
const Builtin = require("../builtin.js");
const Visit = require("./index.js");

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

exports.pattern = (scope, pattern, context) => (
  context = global_Object_assign(
    {
      kind: null,
      expression: null},
    context),
  visitors[pattern.type](scope, pattern, context));

const visitors = {__proto__:null};

visitors.RestElement = (scope, node, context) => Visit.pattern(scope, node.argument, context);

visitors.Property = (scope, node, context) => Visit.pattern(scope, node.value, context);

visitors.CallExpression = (scope, node, context) => Tree.sequence(
  Visit.expression(scope, node, null),
  Tree.sequence(
    Builtin.throw_reference_error("Cannot assign to call expression"),
    context.expression));

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
visitors.MemberExpression = (scope, node, context) => Scope.box(
  scope,
  false,
  "AssignMemberRight",
  context.expression,
  (right_box) => (
    Scope._is_strict(scope) ?
    Builtin.set(
      Visit.expression(scope, node.object, null),
      Visit.key(scope, node.property, {computed:node.computed}),
      Scope.get(scope, right_box),
      null,
      true,
      Builtin._success_result) :
    Scope.box(
      scope,
      false,
      "AssignMemberObject",
      Visit.expression(scope, node.object, null),
      (object_box) => Scope.box(
        scope,
        false,
        "AssignMemberProperty",
        Visit.key(scope, node.property, {computed:node.computed}),
        (key_box) => Builtin.set(
          Builtin.fork_nullish(
            () => Scope.get(scope, object_box),
            null,
            null),
          Scope.get(scope, key_box),
          Scope.get(scope, right_box),
          null,
          false,
          Builtin._success_result)))));

visitors.Identifier = (scope, node, context) => (
  context.kind === null ?
  Scope.write(scope, node.name, context.expression) :
  Scope.initialize(scope, context.kind, node.name, context.expression));

visitors.AssignmentPattern = (scope, node, context) => Scope.box(
  scope,
  false,
  "AssignAssignmentRight",
  context.expression,
  (box) => Visit.pattern(
    scope,
    node.left,
    {
      kind: context.kind,
      expression: Tree.conditional(
        Tree.binary(
          "===",
          Scope.get(scope, box),
          Tree.primitive(void 0)),
        Visit.expression(scope, node.right, null),
        Scope.get(scope, box))}));

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

visitors.ObjectPattern = (scope, node, context) => Scope.box(
  scope,
  false,
  "AssignObjectRight",
  context.expression,
  (box) => Builtin.fork_nullish(
    () => Scope.get(scope, box),
    Builtin.throw_type_error("Cannot destructure 'undefined' or 'null'"),
    (
      (
        node.properties.length > 0 &&
        node.properties[node.properties.length - 1].type === "RestElement") ?
      ArrayLite.mapReduce(
        ArrayLite.slice(node.properties, 0, node.properties.length - 1),
        (next, property) => Scope.box(
          scope,
          false,
          "AssignObjectRestKey",
          Visit.key(scope, property.key, {computed:property.computed}),
          (key_box) => Tree.sequence(
            Visit.pattern(
              scope,
              property.value,
              {
                kind: context.kind,
                expression: Builtin.get(
                  Builtin.convert_to_object(
                    Scope.get(scope, box)),
                  Scope.get(scope, key_box),
                  null)}),
            next(key_box))),
        (key_box_array) => Visit.pattern(
          scope,
          node.properties[node.properties.length - 1],
          {
            kind: context.kind,
            expression: Scope.box(
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
                Scope.get(scope, box)))})) :
      ArrayLite.reduce(
        node.properties,
        (expression, property) => Tree.sequence(
          expression,
          Visit.pattern(
            scope,
            property,
            {
              kind: context.kind,
              expression: Builtin.get(
                Builtin.convert_to_object(
                  Scope.get(scope, box)),
                Visit.key(scope, property.key, {computed:property.computed}),
                null)})),
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

visitors.ArrayPattern = (scope, node, context) => Scope.box(
  scope,
  false,
  "PatternArrayRight",
  context.expression,
  (right_box) => Scope.box(
    scope,
    false,
    "PatternArrayIterator",
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
      node.elements,
      (expression, node) => Tree.sequence(
        expression,
        Visit.pattern(
          scope,
          node,
          {
            kind: context.kind,
            expression: (
              node.type === "RestElement" ?
              Builtin.convert_to_array(
                Builtin.construct_object(
                  Tree.primitive(null),
                  [
                    [
                      Builtin.grab("Symbol.iterator"),
                      {
                        __proto__: null,
                        value: Tree.arrow(
                          Scope.CLOSURE_HEAD(
                            scope,
                            {
                              kind: "arrow",
                              super: null,
                              self: null,
                              newtarget: false},
                            false,
                            [],
                            (scope) => Tree.Return(
                              Scope.get(scope, iterator_box)))),
                        writable: true,
                        enumerable: true,
                        configurable: true}]])) :
              Builtin.get(
                Tree.apply(
                  Builtin.get(
                    Scope.get(scope, iterator_box),
                    Tree.primitive("next"),
                    null),
                  Scope.get(scope, iterator_box),
                  []),
                Tree.primitive("value"),
                null))})),
      Tree.primitive(void 0))));
