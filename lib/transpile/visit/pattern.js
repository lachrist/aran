"use strict";

const global_Object_assign = global.Object.assign;

const ArrayLite = require("array-lite");
const Tree = require("../tree.js");
const State = require("../state.js");
const Scope = require("../scope");
const Intrinsic = require("../intrinsic.js");
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

const lift = (kind, expression) => (
  kind === null ?
  expression :
  Tree.ExpressionStatement(expression));

const sequence = (kind, node1, node2) => (
  kind === null ?
  // console.assert(typeof node1 === "expression" && typeof node2 === "expression")
  Tree.SequenceExpression(node1, node2) :
  // console.assert(typeof node1 === "statement" && typeof node2 === "statement")
  Tree.BundleStatement([node1, node2]));

const boxify = (kind, scope, writable, identifier, expression, callback) => Scope[kind === null ? "box" : "Box"](
  scope,
  writable,
  identifier,
  expression,
  callback);

exports._pattern = (scope, pattern, context) => (
  context = global_Object_assign(
    {
      kind: null,
      expression: null},
    context),
  visitors[pattern.type](scope, pattern, context));

const visitors = {__proto__:null};

visitors.RestElement = (scope, node, context) => Visit._pattern(scope, node.argument, context);

visitors.Property = (scope, node, context) => Visit._pattern(scope, node.value, context);

visitors.CallExpression = (scope, node, context) => sequence(
  context.kind,
  lift(
    context.kind,
    Visit.expression(scope, node, null)),
  sequence(
    context.kind,
    lift(
      context.kind,
      Intrinsic.throw_reference_error("Cannot assign to call expression")),
    lift(
      context.kind,
      context.expression)));

// Scope.box(
//   scope,
//   false,
//   "AssignMemberObject",
//   Visit.expression(scope, node.object, null),
//   (object_box) => Scope.box(
//     scope,
//     false,
//     "AssignMemberProperty",
//     Visit.key(scope, node.property, {computed:node.computed}),
//     (key_box) => Intrinsic.set(
//       (
//         Scope._is_strict(scope) ?
//         Scope.get(scope, object_box) :
//         Intrinsic.fork_nullish(
//           () => Scope.get(scope, object_box),
//           null,
//           null)),
//       Scope.get(scope, key_box),
//       context.expression,
//       null,
//       Scope._is_strict(scope),
//       Intrinsic._success_result)
//
//       Intrinsic.set(
//         Visit.expression(scope, node.object, null),
//         Visit.key(scope, node.property, {computed:node.computed}),
//         context.expression,
//         null,
//         true,
//         Intrinsic._success_result)


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
visitors.MemberExpression = (scope, node, context) => boxify(
  context.kind,
  scope,
  false,
  "AssignMemberRight",
  context.expression,
  (right_box) => (
    Scope._is_strict(scope) ?
    lift(
      context.kind,
      Intrinsic.set(
        Visit.expression(scope, node.object, null),
        Visit.key(scope, node.property, {computed:node.computed}),
        context.expression,
        null,
        true,
        Intrinsic._success_result)) :
    boxify(
      context.kind,
      scope,
      false,
      "AssignMemberObject",
      Visit.expression(scope, node.object, null),
      (object_box) => boxify(
        context.kind,
        scope,
        false,
        "AssignMemberProperty",
        Visit.key(scope, node.property, {computed:node.computed}),
        (key_box) => lift(
          context.kind,
          Intrinsic.set(
            Intrinsic.fork_nullish(
              () => Scope.get(scope, object_box),
              null,
              null),
            Scope.get(scope, key_box),
            Scope.get(scope, right_box),
            null,
            false,
            Intrinsic._success_result))))));

visitors.Identifier = (scope, node, context) => (
  context.kind === null ?
  Scope.write(scope, node.name, context.expression) :
  Scope.Initialize(scope, context.kind, node.name, context.expression));

visitors.AssignmentPattern = (scope, node, context) => boxify(
  context.kind,
  scope,
  false,
  "AssignAssignmentRight",
  context.expression,
  (box) => Visit._pattern(
    scope,
    node.left,
    {
      kind: context.kind,
      expression: Tree.ConditionalExpression(
        Tree.BinaryExpression(
          "===",
          Scope.get(scope, box),
          Tree.PrimitiveExpression(void 0)),
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

visitors.ObjectPattern = (scope, node, context) => boxify(
  context.kind,
  scope,
  false,
  "AssignObjectRight",
  context.expression,
  (box) => boxify(
    context.kind,
    scope,
    false,
    "ConvertedObjectRight",
    Intrinsic.fork_nullish(
      () => Scope.get(scope, box),
      Intrinsic.throw_type_error("Cannot destructure 'undefined' or 'null'"),
      null),
    (box) => (
      (
        node.properties.length > 0 &&
        node.properties[node.properties.length - 1].type === "RestElement") ?
      ArrayLite.mapReduce(
        ArrayLite.slice(node.properties, 0, node.properties.length - 1),
        (next, property) => boxify(
          context.kind,
          scope,
          false,
          "AssignObjectRestKey",
          Visit.key(scope, property.key, {computed:property.computed}),
          (key_box) => sequence(
            context.kind,
            Visit._pattern(
              scope,
              property.value,
              {
                kind: context.kind,
                expression: Intrinsic.get(
                  Scope.get(scope, box),
                  Scope.get(scope, key_box),
                  null)}),
            next(key_box))),
        (key_box_array) => Visit._pattern(
          scope,
          node.properties[node.properties.length - 1],
          {
            kind: context.kind,
            expression: Scope.box(
              scope,
              false,
              "AssignObjectRest",
              Intrinsic.assign(
                Intrinsic.construct_object(
                  Intrinsic.grab("Object.prototype"),
                  []),
                [
                  Scope.get(scope, box)],
                true,
                Intrinsic._target_result),
              (box) => Tree.SequenceExpression(
                ArrayLite.reduce(
                  key_box_array,
                  (node, key_box) => sequence(
                    context.kind,
                    node,
                    lift(
                      context.kind,
                      Intrinsic.delete_property(
                        Scope.get(scope, box),
                        Scope.get(scope, key_box),
                        false,
                        Intrinsic._success_result))),
                  lift(
                    context.kind,
                    Tree.PrimitiveExpression(void 0))),
                Scope.get(scope, box)))})) :
      ArrayLite.reduce(
        node.properties,
        (node, property) => sequence(
          context.kind,
          node,
          Visit._pattern(
            scope,
            property,
            {
              kind: context.kind,
              expression: Intrinsic.get(
                Scope.get(scope, box),
                Visit.key(scope, property.key, {computed:property.computed}),
                null)})),
        lift(
          context.kind,
          Tree.PrimitiveExpression(void 0))))));

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
// Not need to convert it to an ObjectExpression:
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
// Not need to convert it to an ObjectExpression:
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

visitors.ArrayPattern = (scope, node, context) => boxify(
  context.kind,
  scope,
  false,
  "PatternArrayRight",
  context.expression,
  (right_box) => boxify(
    context.kind,
    scope,
    false,
    "PatternArrayIterator",
    Tree.ApplyExpression(
      Intrinsic.get(
        Intrinsic.fork_nullish(
          () => Scope.get(scope, right_box),
          null,
          null),
        Intrinsic.grab("Symbol.iterator"),
        null),
      Scope.get(scope, right_box),
      []),
    (iterator_box) => ArrayLite.reduce(
      node.elements,
      (node1, node2) => sequence(
        context.kind,
        node1,
        (
          node2 === null ?
          lift(
            context.kind,
            Tree.ApplyExpression(
              Intrinsic.get(
                Scope.get(scope, iterator_box),
                Tree.PrimitiveExpression("next"),
                null),
              Scope.get(scope, iterator_box),
              [])) :
          Visit._pattern(
            scope,
            node2,
            {
              kind: context.kind,
              expression: (
                node2.type === "RestElement" ?
                Intrinsic.convert_to_array(
                  Intrinsic.construct_object(
                    Tree.PrimitiveExpression(null),
                    [
                      [
                        Intrinsic.grab("Symbol.iterator"),
                        Tree.ClosureExpression(
                          "arrow",
                          false,
                          false,
                          Scope.CLOSURE_HEAD(
                            scope,
                            {
                              kind: "arrow",
                              super: null,
                              self: null,
                              newtarget: false},
                            false,
                            [],
                            (scope) => Tree.ReturnStatement(
                              Scope.get(scope, iterator_box))))]])) :
                Intrinsic.get(
                  Tree.ApplyExpression(
                    Intrinsic.get(
                      Scope.get(scope, iterator_box),
                      Tree.PrimitiveExpression("next"),
                      null),
                    Scope.get(scope, iterator_box),
                    []),
                  Tree.PrimitiveExpression("value"),
                  null))}))),
      lift(
        context.kind,
        Tree.PrimitiveExpression(void 0)))));
