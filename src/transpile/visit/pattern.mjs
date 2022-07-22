
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

import {visitExpression} from "./expression.mjs";

exports.visitPattern = (scope, pattern, context) => (
  context = global_Object_assign(
    {
      kind: null,
      surrounding: "statement",
      expression: void 0},
    context),
  visitors[pattern.type](scope, pattern, context));

const generateVisit1 = (visitors) => (node, argument1) => {
  const visitor = visitors[node.type];
  return visitor(node, argument1);
};

const visitKey = (node, scope, state, computed) =>
  computed
    ? visitExpression(node, scope, false)
    : makeLiteralExpression(node.name, node.location);

const visitPattern = generateVisit1({
  CallExpression: (node, serial, scope, state, meta) => makeSequenceEffect(
    makeExpressionEffect(
      visitExpression(node, scope, state, true),
    ),
    makeExpressionEffect(
      makeThrowReferenceErrorExpression("Cannot assign to call expression"),
    ),
    serial,
  ),
  MemberExpression: (node, serial, scope, meta) => makeSetExpression(
    isStrictScope(scope),
    visitExpression(node.object, scope, false),
    node.computed
      ? visitExpression(node.property, scope, false)
      : makeLiteralExpression(node.name)
    makeMetaReadExpression(scope, meta),
    serial,
  ),
}) => {};

const visitors = {__proto__:null};

visitors.RestElement = (scope, node, context) => Visit.visitPattern(scope, node.argument, context);

visitors.Property = (scope, node, context) => Visit.visitPattern(scope, node.value, context);

visitors.CallExpression = (scope, node, context) => sequence(
  context.surrounding,
  lift(context.surrounding, context.expression),
  sequence(
    context.surrounding,
    lift(
      context.surrounding,
      Visit.visitExpression(scope, node, null)),
    lift(
      context.surrounding,
      Intrinsic.makeThrowReferenceErrorExpression("Cannot assign to call expression"))));

// Scope.makeBoxExpression(
//   scope,
//   false,
//   "AssignMemberObject",
//   Visit.visitExpression(scope, node.object, null),
//   (object_box) => Scope.makeBoxExpression(
//     scope,
//     false,
//     "AssignMemberProperty",
//     Visit.visitKey(scope, node.property, {computed:node.computed}),
//     (key_box) => Intrinsic.makeSetExpression(
//       (
//         Scope.isStrict(scope) ?
//         Scope.makeOpenExpression(scope, object_box) :
//         Intrinsic.makeNullishExpression(
//           () => Scope.makeOpenExpression(scope, object_box),
//           null,
//           null)),
//       Scope.makeOpenExpression(scope, key_box),
//       context.expression,
//       null,
//       Scope.isStrict(scope),
//       Intrinsic.SUCCESS_RESULT)
//
//       Intrinsic.makeSetExpression(
//         Visit.visitExpression(scope, node.object, null),
//         Visit.visitKey(scope, node.property, {computed:node.computed}),
//         context.expression,
//         null,
//         true,
//         Intrinsic.SUCCESS_RESULT)


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
  context.surrounding,
  scope,
  false,
  "AssignMemberRight",
  context.expression,
  (right_box) => (
    Scope.isStrict(scope) ?
    lift(
      context.surrounding,
      Intrinsic.makeSetExpression(
        Visit.visitExpression(scope, node.object, null),
        Visit.visitKey(scope, node.property, {computed:node.computed}),
        context.expression,
        null,
        true,
        Intrinsic.SUCCESS_RESULT)) :
    boxify(
      context.surrounding,
      scope,
      false,
      "AssignMemberObject",
      Visit.visitExpression(scope, node.object, null),
      (object_box) => boxify(
        context.surrounding,
        scope,
        false,
        "AssignMemberProperty",
        Visit.visitKey(scope, node.property, {computed:node.computed}),
        (key_box) => lift(
          context.surrounding,
          Intrinsic.makeSetExpression(
            Intrinsic.makeNullishExpression(
              () => Scope.makeOpenExpression(scope, object_box),
              null,
              null),
            Scope.makeOpenExpression(scope, key_box),
            Scope.makeOpenExpression(scope, right_box),
            null,
            false,
            Intrinsic.SUCCESS_RESULT))))));

visitors.Identifier = (scope, node, context) => (
  context.kind === null ?
  lift(
    context.surrounding,
    Scope.makeWriteExpression(scope, node.name, context.expression)) :
  (
    Throw.assert(context.surrounding === "statement", null, `Cannot initialize variable in an expression context`),
    Scope.makeInitializeStatement(scope, context.kind, node.name, context.expression)));

visitors.AssignmentPattern = (scope, node, context) => boxify(
  context.surrounding,
  scope,
  false,
  "AssignAssignmentRight",
  context.expression,
  (box) => Visit.visitPattern(
    scope,
    node.left,
    {
      kind: context.kind,
      surrounding: context.surrounding,
      expression: Tree.ConditionalExpression(
        Tree.BinaryExpression(
          "===",
          Scope.makeOpenExpression(scope, box),
          Tree.PrimitiveExpression(void 0)),
        Visit.visitExpression(scope, node.right, null),
        Scope.makeOpenExpression(scope, box))}));

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
  context.surrounding,
  scope,
  false,
  "AssignObjectRight",
  context.expression,
  (box) => boxify(
    context.surrounding,
    scope,
    false,
    "ConvertedObjectRight",
    Intrinsic.makeNullishExpression(
      () => Scope.makeOpenExpression(scope, box),
      Intrinsic.makeThrowTypeErrorExpression("Cannot destructure 'undefined' or 'null'"),
      null),
    (box) => (
      (
        node.properties.length > 0 &&
        node.properties[node.properties.length - 1].type === "RestElement") ?
      ArrayLite.mapReduce(
        ArrayLite.slice(node.properties, 0, node.properties.length - 1),
        (next, property) => boxify(
          context.surrounding,
          scope,
          false,
          "AssignObjectRestKey",
          Visit.visitKey(scope, property.key, {computed:property.computed}),
          (key_box) => sequence(
            context.surrounding,
            Visit.visitPattern(
              scope,
              property.value,
              {
                kind: context.kind,
                surrounding: context.surrounding,
                expression: Intrinsic.makeGetExpression(
                  Scope.makeOpenExpression(scope, box),
                  Scope.makeOpenExpression(scope, key_box),
                  null)}),
            next(key_box))),
        (key_box_array) => Visit.visitPattern(
          scope,
          node.properties[node.properties.length - 1],
          {
            kind: context.kind,
            surrounding: context.surrounding,
            expression: Scope.makeBoxExpression(
              scope,
              false,
              "AssignObjectRest",
              Intrinsic.makeAssignExpression(
                Intrinsic.makeObjectExpression(
                  Intrinsic.makeGrabExpression("Object.prototype"),
                  []),
                [
                  Scope.makeOpenExpression(scope, box)],
                true,
                Intrinsic.TARGET_RESULT),
              (box) => ArrayLite.mapReduce(
                key_box_array,
                (next, key_box) => Tree.SequenceExpression(
                  Intrinsic.makeDeletePropertyExpression(
                    Scope.makeOpenExpression(scope, box),
                    Scope.makeOpenExpression(scope, key_box),
                    false,
                    Intrinsic.SUCCESS_RESULT),
                  next(null)),
                (array) => Scope.makeOpenExpression(scope, box)))})) :
      ArrayLite.mapReduce(
        node.properties,
        (next, property) => sequence(
          context.surrounding,
          Visit.visitPattern(
            scope,
            property,
            {
              kind: context.kind,
              surrounding: context.surrounding,
              expression: Intrinsic.makeGetExpression(
                Scope.makeOpenExpression(scope, box),
                Visit.visitKey(scope, property.key, {computed:property.computed}),
                null)}),
          next(null)),
        (array) => empty(context.surrounding)))));

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
  context.surrounding,
  scope,
  false,
  "PatternArrayRight",
  context.expression,
  (right_box) => boxify(
    context.surrounding,
    scope,
    false,
    "PatternArrayIterator",
    Tree.ApplyExpression(
      Intrinsic.makeGetExpression(
        Intrinsic.makeNullishExpression(
          () => Scope.makeOpenExpression(scope, right_box),
          null,
          null),
        Intrinsic.makeGrabExpression("Symbol.iterator"),
        null),
      Scope.makeOpenExpression(scope, right_box),
      []),
    (iterator_box) => ArrayLite.mapReduce(
      node.elements,
      (next, node) => sequence(
        context.surrounding,
        (
          node === null ?
          lift(
            context.surrounding,
            Tree.ApplyExpression(
              Intrinsic.makeGetExpression(
                Scope.makeOpenExpression(scope, iterator_box),
                Tree.PrimitiveExpression("next"),
                null),
              Scope.makeOpenExpression(scope, iterator_box),
              [])) :
          Visit.visitPattern(
            scope,
            node,
            {
              kind: context.kind,
              surrounding: context.surrounding,
              expression: (
                node.type === "RestElement" ?
                Intrinsic.makeArrayifyExpression(
                  Intrinsic.makeObjectExpression(
                    Tree.PrimitiveExpression(null),
                    [
                      [
                        Intrinsic.makeGrabExpression("Symbol.iterator"),
                        Tree.ClosureExpression(
                          "arrow",
                          false,
                          false,
                          Scope.makeHeadClosureBlock(
                            scope,
                            {
                              kind: "arrow",
                              super: null,
                              self: null,
                              newtarget: false},
                            false,
                            [],
                            (scope) => Tree.CompletionStatement(
                              Scope.makeOpenExpression(scope, iterator_box))))]])) :
                Intrinsic.makeGetExpression(
                  Tree.ApplyExpression(
                    Intrinsic.makeGetExpression(
                      Scope.makeOpenExpression(scope, iterator_box),
                      Tree.PrimitiveExpression("next"),
                      null),
                    Scope.makeOpenExpression(scope, iterator_box),
                    []),
                  Tree.PrimitiveExpression("value"),
                  null))})),
        next(null)),
      (array) => empty(context.surrounding))));
