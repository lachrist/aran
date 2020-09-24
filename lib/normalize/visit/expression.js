"use strict";

const global_RegExp = global.RegExp;
const global_Reflect_apply = global.Reflect.apply;
const global_String_prototype_substring = global.String.prototype.substring;
const global_Array = global.Array;
const global_Error = global.Error;

const ArrayLite = require("array-lite");
const Tree = require("../tree.js");
const Scope = require("../scope/index.js");
const Mop = require("../mop.js");
const Query = require("../query/index.js");
const Common = require("./common");
const State = require("../state.js");
const Completion = require("../completion.js");
const Expression = exports;

// type Context = Maybe (Maybe Completion, Maybe SuperBox, Maybe NameBox, Dropped)
// type Completion = normalize.completion.Completion
// type SuperBox = normalize.scope.Box
// type NameBox = normalize.scope.Box
// type Dropped = Boolean

exports._default_context = {
  __proto__: null,
  completion: null,
  super: null,
  name: null,
  dropped: false
};

exports.visit = (scope, node, context) => State._visit(node, [scope, node, context], visitors[node.type]);

const visitors = {__proto__:null};

visitors.Literal = (scope, node, dropped, box) => (
  node.value instanceof global_RegExp ?
  Tree.construct(
    Tree.builtin("RegExp"),
    [
      Tree.primitive(node.regex.pattern),
      Tree.primitive(node.regex.flags)]) :
  Tree.primitive(node.value));

visitors.ArrowFunctionExpression = (scope, node, context) => Common.closure(
  scope,
  node,
  (
    context.completion === null ?
    Completion._arrow :
    context.completion),
  context.name,
  context.super);

visitors.FunctionExpression = (scope, node, context) => Common.closure(
  scope,
  node,
  (
    context.completion === null ?
    Completion._function :
    context.completion),
  context.name,
  context.super);

/////////////////
// Environment //
/////////////////

visitors.Identifier = (scope, node, context) => Scope.read(scope, node.name);

visitors.ThisExpression = (scope, node, context) => Scope.read(scope, "this");

visitors.Super = (scope, node, context) => Scope.read(scope, "super");

// No point in supporting import.meta when modules are not supported
visitors.MetaProperty = (scope, node, dropped, box) => (
  (
    node.meta.name === "new" &&
    node.property.name === "target") ?
  Scope.read(scope, "new.target") :
  (
    (() => { throw new global_Error("Aran currently only support the new.target meta property.") })
    ()));

// Evaluation order of member assignment:
// ======================================
// (console.log("obj"), {
//   __proto__: null,
//   get foo () {
//     console.log("get");
//     return {
//       __proto__: null,
//       toString: () => {
//         console.log("toString");
//         return "foo";
//       }
//     };
//   },
//   set foo (value) {
//     console.log("set", value);
//   }
// })[(console.log("key"), "foo")] += (console.log("val"), "bar");
// obj
// key
// get
// qux
// toString
// 'foobar'
//
// No objectify in strict mode:
// ============================
// > function f () { "use strict"; var foo = 1; foo.bar = 123 }
// undefined
// > f()
// Thrown:
// TypeError: Cannot create property 'bar' on number '1'
//     at f (repl:1:52)
visitors.AssignmentExpression = (scope, node, context, _expression) => (
  node.left.type === "MemberExpression" ?
  (
    (
      node.operator === "=" &&
      context.dropped &&
      Scope._is_strict(scope)) ?
    // MemberExpression >> Special Case #1 >> (dropped && strict && =)
    Mop.set(
      Expression.visit(scope, node.left.object, Expression._default_context),
      (
        node.left.computed ?
        Expression.visit(scope, node.left.property, Expression._default_context) :
        Tree.primitive(node.left.property.name)),
      Expression.visit(scope, node.right, Expression._default_context),
      null,
      true,
      Mop._success_result) :
    Scope.box(
      scope,
      "ExpressionAssignmentMemberObject",
      false,
      Expression.visit(scope, node.left.object, Expression._default_context),
      (object_box) => (
        (
          node.operator === "=" &&
          context.dropped &&
          !Scope._is_strict(scope)) ? // this last `and` clause could go away but it is kept for readability
        // MemberExpression >> Special Case #1 >> (dropped && !strict && =)
        Mop.set(
          Mop.convert(
            () => Scope.get(scope, object_box)),
          (
            node.left.computed ?
            Expression.visit(scope, node.left.property, Expression._default_context) :
            Tree.primitive(node.left.property.name)),
          Expression.visit(scope, node.right, Expression._default_context),
          null,
          false,
          Mop._success_result) :
        Scope.box(
          scope,
          "ExpressionAssignmentMemberProperty",
          false,
          (
            node.left.computed ?
            Expression.visit(scope, node.left.property, Expression._default_context) :
            Tree.primitive(node.left.property.name)),
          (key_box) => (
            _expression = (
              node.operator === "=" ?
              Expression.visit(scope, node.right, Expression._default_context) :
              Tree.binary(
                global_Reflect_apply(
                  global_String_prototype_substring,
                  node.operator,
                  [0, node.operator.length - 1]),
                Mop.get(
                  Mop.convert(
                    () => Scope.get(scope, object_box)),
                  Scope.get(scope, key_box),
                  null),
                Expression.visit(scope, node.right, Expression._default_context))),
            (
              context.dropped ?
              // MemberExpression >> Special Case #1 >> (dropped && +=)
              Mop.set(
                (
                  Scope._is_strict(scope) ?
                  Scope.get(scope, object_box) :
                  Mop.convert(
                    () => Scope.get(scope, object_box))),
                Scope.get(scope, key_box),
                _expression,
                null,
                Scope._is_strict(scope),
                Mop._success_result) :
              // MemberExpression >> General Case
              Scope.box(
                scope,
                "ExpressionAssignmentMemberValue",
                false,
                _expression,
                (value_box) => Mop.set(
                  (
                    Scope._is_strict(scope) ?
                    Scope.get(scope, object_box) :
                    Mop.convert(
                      () => Scope.get(scope, object_box))),
                  Scope.get(scope, key_box),
                  Scope.get(scope, value_box),
                  null,
                  Scope._is_strict(scope),
                  Scope.get(scope, value_box))))))))) :
  (
    node.left.type === "Identifier" ?
    (
      _expression = (
        node.operator === "=" ?
        Scope.box(
          scope,
          "AssignmentExpressionIdentifierName",
          false,
          Tree.primitive(node.left.name),
          (name_box) => Expression.visit(
            scope,
            node.right,
            {
              __proto__: Expression._default_context,
              name: name_box})) :
        Tree.binary(
          global_Reflect_apply(
            global_String_prototype_substring,
            node.operator,
            [0, node.operator.length - 1]),
          Scope.read(scope, node.left.name),
          // Name are not transmitted on update:
          //
          // > var f = "foo"
          // undefined
          // > f += function () {}
          // 'foofunction () {}'
          Expression.visit(scope, node.right, Expression._default_context))),
      (
        context.dropped ?
        Scope.write(
          scope,
          node.left.name,
          _expression) :
        Scope.box(
          scope,
          "ExpressionAssignmentIdentifierRight",
          false,
          _expression,
          (value_box) => Tree.sequence(
            Scope.write(
              scope,
              node.left.name,
              Scope.get(scope, value_box)),
            Scope.get(scope, value_box))))) :
    (
      context.dropped ?
      Common.assign(
        scope,
        node.left,
        Expression.visit(scope, node.right, Expression._default_context),
        false) :
      Scope.box(
        scope,
        "ExpressionAssignmentPatternRight",
        false,
        Expression.visit(scope, node.right, Expression._default_context),
        (box) => Tree.sequence(
          Common.assign(
            scope,
            node.left,
            Scope.get(scope, box),
            false),
          Scope.get(scope, box))))));

// Object is converted twice.
//
// Reflect.defineProperty(String.prototype, "foo", {
//   get: function () {
//     this.bar = 123;
//     console.log("get");
//     return "yolo"
//   },
//   set: function (value) {
//     console.log("set", this.bar);
//   }
// });
// true
// > var x = "qux"
// undefined
// > x.foo++;
// get
// set undefined
// NaN
// > x.foo += 1;
// get
// set undefined
// 'yolo1'
// >
visitors.UpdateExpression = (scope, node, dropped, box) => (
  node.argument.type === "MemberExpression" ?
  Scope[node.argument.object.type === Literal ? "primitive_box" : "expression_box"](
    scope,
    "ExpressionUpdateMemberObject",
    (
      node.argument.object.type === "Literal" ?
      node.argument.object.value :
      Visit(node.argument.object, scope, false, null)),
    (box1) => Scope.box(
      scope,
      "ExpressionUpdateMemberProperty",
      // toString is called twice:
      // =========================
      // ({__proto__:null, foo:"bar"})[{__proto__: null, toString: () => (console.log("toString"), "foo")}]++
      // toString
      // toString
      // NaN
      (
        node.argument.computed ?
        (
          node.argument.property.type === "Literal" ?
          node.argument.property.value :
          Visit(node.argument.property, scope, false, null)) :
        node.argument.property.name),
      (box2) => (
        (
          Scope.$IsStrict(scope) &&
          dropped) ?
        // Special Case #1:
        Object.set(
          true,
          Scope.get(scope, box1),
          Scope.get(scope, box2),
          Tree.binary(
            node.operator[0],
            Object.get(
              Object.obj(
                () => Scope.get(scope, box1)),
              Scope.get(scope, box2)),
            Tree.primitive(1))) :
        (
          (
            dropped ||
            update.prefix) ?
          // Special Case #2:
          Scope.box(
            scope,
            "ExpressionUpdateMemberRight2",
            Tree.binary(
              node.operator[0],
              Object.get(
                Object.obj(
                  () => Scope.get(scope, box1)),
                Scope.get(scope, box2)),
              Tree.primitive(1)),
            (box3) => Object.set(
              Scope.$IsStrict(scope),
              (
                Scope.$IsStrict(scope) ?
                Scope.get(scope, box1) :
                Object.obj(
                  () => Scope.get(scope, box1))),
              Scope.get(scope, box2),
              Scope.get(scope, box3),
              (
                dropped ?
                null :
                Scope.get(scope, box3)))) :
          (
            Scope.$IsStrict(scope) ?
            // Special Case #3:
            Scope.box(
              scope,
              "ExpressionUpdateMemberResult3",
              (
                update.prefix ?
                Tree.binary(
                  node.operator[0],
                  Object.get(
                    Object.obj(
                      () => Scope.get(scope, box1)),
                    Scope.get(scope, box2)),
                  Tree.primitive(1)) :
                Object.get(
                  Object.obj(
                    () => Scope.get(scope, box1)),
                  Scope.get(scope, box2))),
              (box3) => Object.set(
                true,
                Scope.get(scope, box1),
                Scope.get(scope, box2),
                (
                  update.prefix ?
                  Scope.get(scope, box3) :
                  Tree.binary(
                    node.operator[0],
                    Scope.get(scope, box3),
                    Tree.primitive(1))),
                Scope.get(scope, box3))) :
            // General Case:
            Scope.box(
              scope,
              "ExpressionUpdateMemberGet",
              Object.get(
                Object.obj(
                  () => Scope.get(scope, box1)),
                Scope.get(scope, box2)),
              (box3) => Scope.box(
                scope,
                "ExpressionUpdateMemberRight",
                Tree.binary(
                  node.operator[0],
                  Scope.get(scope, box3),
                  Tree.primitive(1)),
                (box4) => Object.set(
                  Scope.$IsStrict(scope),
                  (
                    Scope.$IsStrict(scope) ?
                    Scope.get(scope, box1) :
                    Object.obj(
                      () => Scope.get(scope, box1))),
                  Scope.get(scope, box2),
                  Scope.get(scope, box4),
                  (
                    dropped ?
                    null :
                    (
                      update.prefix ?
                      Scope.get(scope, box4) :
                      Scope.get(scope, box3))))))))))) :
  (
    node.argument.type === "Identifier" ?
    (
      dropped ?
      Scope.write(
        scope,
        node.argument.name,
        Tree.binary(
          node.operator[0],
          Scope.read(scope, node.argument.name),
          Tree.primitive(1))) :
      Scope.box(
        scope,
        "ExpressionUpdateResult",
        (
          update.prefix ?
          Tree.binary(
            node.operator[0],
            Scope.read(scope, node.argument.name),
            Tree.primitive(1)) :
          Scope.read(scope, node.argument.name)),
        (box) => Tree.sequence(
          Scope.write(
            scope,
            node.argument.name,
            (
              update.prefix ?
              Scope.get(scope, box) :
              Tree.binary(
                node.operator[0],
                Scope.get(scope, box),
                Tree.primitive(1)))),
          Scope.get(scope, box)))) :
    Util.Throw("Invalid left-hand side update")));

//////////////
// Literal //
//////////////


//
// visitors.TemplateLiteral = (scope, node, dropped, box) => (
//   node.expressions.length === 0 ?
//   Tree.primitive(node.quasis[0].value.cooked) :
//   Tree.binary(
//     "+",
//     ArrayLite.reduce(
//       global_Array(node.expressions.length - 1),
//       (expression, _, index) => Tree.binary(
//         "+",
//         expression,
//         Tree.binary(
//           "+",
//           Tree.primitive(node.quasis[index + 1].value.cooked),
//           Expression.visit(scope, node.expressions[index + 1], false, null))),
//       Tree.binary(
//         "+",
//         Tree.primitive(node.quasis[0].value.cooked),
//         Expression.visit(scope, node.expressions[0], false, null))),
//     Tree.primitive(node.quasis[node.quasis.length - 1].value.cooked)));
//
// // Tagged template cannot lead to a direct eval call because it receives an array instead of a string:
// // cf: https://www.ecma-international.org/ecma-262/10.0/index.html#sec-performeval
// visitors.TaggedTemplateExpression = (scope, node, dropped, box) => Scope.box(
//   scope,
//   "TaggedTemplateExpressionObject",
//   false,
//   (
//     node.tag.type === "MemberExpression" ?
//     Expression.visit(scope, node.tag.object, dropped, box) :
//     Tree.primitive(void 0)),
//   (box) => Tree.apply(
//     (
//       node.tag.type === "MemberExpression" ?
//       Object.get(
//         Object.obj(
//           () => Scope.get(scope, box)),
//         (
//           node.tag.computed ?
//           Expression.visit(scope, node.tag.property, false, null) :
//           Tree.primitive(node.tag.property.name))) :
//       Expression.visit(scope, node.tag, false, null)),
//     Scope.get(scope, box),
//     ArrayLite.concat(
//       [
//         Tree.apply(
//           Tree.builtin("Object.freeze"),
//           Tree.primitive(void 0),
//           [
//             Tree.apply(
//               Tree.builtin("Object.defineProperty"),
//               Tree.primitive(void 0),
//               [
//                 Tree.apply(
//                   Tree.builtin("Array.of"),
//                   Tree.primitive(void 0),
//                   ArrayLite.map(
//                     node.quasi.quasis,
//                     (quasi) => Tree.primitive(quasi.value.cooked))),
//                 Tree.primitive("raw"),
//                 Tree.object(
//                   Tree.primitive(null),
//                   [
//                     [
//                       Tree.primitive("value"),
//                       Tree.apply(
//                         Tree.builtin("Object.freeze"),
//                         Tree.primitive(void 0),
//                         [
//                           Tree.apply(
//                             Tree.builtin("Array.of"),
//                             Tree.primitive(void 0),
//                             ArrayLite.map(
//                               node.quasi.quasis,
//                               (quasi) => Tree.primitive(quasi.value.raw)))])]])])])],
//       ArrayLite.map(
//         node.quasi.expressions,
//         (expression) => Expression.visit(scope, expression, false, null)))));
//
// /////////////
// // Control //
// /////////////
//
// // Function's name are not propagated through sequences:
// //
// // > var o = {x:(123, function () {})}
// // undefined
// // > o
// // { x: [Function] }
// // > o.x.name
// // ''
// visitors.SequenceExpression = (scope, node, dropped, box) => ArrayLite.reduce(
//   ArrayLite.slice(node.expressions, 1, node.expressions.length),
//   (aran_expression, expression, index, expressions) => Tree.sequence(
//     aran_expression,
//     Expression.visit(
//       scope,
//       expression,
//       (index < expressions.length - 1) || dropped,
//       null)),
//   Expression.visit(scope, node.expressions[0], true, null));
//
// visitors.LogicalExpression = (scope, node, dropped, box) => Scope.box(
//   scope,
//   "ExpressionLogicalLeft",
//   false,
//   Expression.visit(scope, node.left, false, null),
//   (box) => (
//     node.operator === "??" ?
//     /* istanbul ignore next */ // ES2020 Acorn limitations
//     Tree.conditional(
//       Tree.conditional(
//         Tree.binary(
//           "===",
//           Scope.get(scope, box),
//           Tree.primitive(null)),
//         Tree.primitive(true),
//         Tree.binary(
//           "===",
//           Scope.get(scope, box),
//           Tree.primitive(void 0))),
//       Expression.visit(scope, node.right, dropped, null),
//       Scope.get(scope, box)) :
//     Tree.conditional(
//       Scope.get(scope, box),
//       (
//         node.operator === "&&" ?
//         Expression.visit(scope, node.right, dropped, null) :
//         Scope.get(scope, box)),
//       (
//         node.operator === "||" ?
//         Expression.visit(scope, node.right, dropped, null) :
//         Scope.get(scope, box)))));
//
// visitors.ConditionalExpression = (scope, node, dropped, box) => Tree.conditional(
//   Expression.visit(scope, node.test, false, null),
//   Expression.visit(scope, node.consequent, dropped, box),
//   Expression.visit(scope, node.alternate, dropped, box));
//
// /////////////////
// // Combination //
// /////////////////
//
// visitors.ArrayExpression = (scope, node, dropped, box) => (
//   ArrayLite.every(
//     node.elements,
//     (element) => (
//       element !== null &&
//       element.type !== "SpreadElement")) ?
//   Tree.apply(
//     Tree.builtin("Array.of"),
//     Tree.primitive(void 0),
//     ArrayLite.map(
//       node.elements,
//       (element) => Expression.visit(scope, element, false, null))) :
//   Tree.apply(
//     Tree.builtin("Array.prototype.concat"),
//     Tree.apply(
//       Tree.builtin("Array.of"),
//       Tree.primitive(void 0),
//       []),
//     ArrayLite.map(
//       node.elements,
//       (element) => (
//         element === null ?
//         Tree.apply(
//           Tree.builtin("Array"),
//           Tree.primitive(void 0),
//           [
//             Tree.primitive(1)]) :
//         (
//           element.type === "SpreadElement" ?
//           Expression.visit(scope, element.argument, false, null) :
//           Tree.apply(
//             Tree.builtin("Array.of"),
//             Tree.primitive(void 0),
//             [
//               Expression.visit(scope, element, false, null)]))))));
//
// // __proto__ property does not gives name to function:
// //
// // > var o = {__proto__: function () {}}
// // undefined
// // > o
// // > Reflect.getPrototypeOf(o);
// // [Function]
// // > var o = {"__proto__": function () {}}
// // undefined
// // > Reflect.getPrototypeOf(o);
// // [Function]
// // > Reflect.getPrototypeOf(o).name
// // ''
//
//
// visitors.ObjectExpression = (node, scope, dropped, nullable_box, _closure, _nullable_box, _boxs1, _boxs2) => (
//   Query._has_super(node) ?
//   Scope.EXTEND_STATIC(
//
//   //
//   _closure = (box) => Tree.conditional(
//     Tree.binary(
//       "===",
//       Tree.unary(
//         "typeof",
//         Scope.get(scope, box)),
//       Tree.primitive("object")),
//     Scope.get(scope, box),
//     Tree.conditional(
//       Tree.binary(
//         "===",
//         Tree.unary(
//           "typeof",
//           Scope.get(scope, box)),
//         Tree.primitive("function")),
//       Scope.get(scope, box),
//       Tree.builtin("Object.prototype"))),
//   (
//     ArrayLite.every(
//       node.properties,
//       (property) => (
//         property.type !== "SpreadElement" &&
//         property.kind === "init")) ?
//     (
//       ArrayLite.every(
//         node.properties,
//         (property, index) => (
//           (
//             index === 0 ||
//             property.computed ||
//             (
//               property.key.type === "Identifier" ?
//               property.key.name !== "__proto__" :
//               property.key.value !== "__proto__")) &&
//           (
//             !property.computed ||
//             property.key.type === "Literal" ||
//             (
//               property.value.type === "FuntionExpression" ?
//               property.value.id !== null :
//               property.value.type !== "ArrowFunctionExpression")))) ?
//       // Special Case #1:
//       //   - Only init properties
//       //   - Only side-effect free names
//       //   - __proto__ only appears first
//       Tree.object(
//         (
//           (
//             node.properties.length > 0 &&
//             !node.properties[0].computed &&
//             (
//               node.properties[0].key.type === "Identifier" ?
//               node.properties[0].key.name === "__proto__" :
//               node.properties[0].key.value === "__proto__")) ?
//           Scope.box(
//             scope,
//             "ExpressionObjectProto1",
//             Visit.expression(node.properties[0].value, scope, false, null),
//             true,
//             closure) :
//           Tree.builtin("Object.prototype")),
//         ArrayLite.map(
//           (
//             (
//               node.properties.length > 0 &&
//               !node.properties[0].computed &&
//               (
//                 node.properties[0].key.type === "Identifier" ?
//                 node.properties[0].key.name === "__proto__" :
//                 node.properties[0].key.value === "__proto__")) ?
//             ArrayLite.slice(node.properties, 1, node.properties.length) :
//             node.properties),
//           (property) => [
//             (
//               property.computed ?
//               Visit.expression(property.key, scope, false, null) :
//               Tree.primitive(
//                 (
//                   property.key.type === "Identifier" ?
//                   property.key.name :
//                   property.key.value))),
//             Scope.box(
//               scope,
//               "ExpressionObjectKey1",
//               Tree.primitive(
//                 (
//                   property.computed ?
//                   (
//                     property.type === "Literal" ?
//                     property.value :
//                     void 0) :
//                   property.name)),
//                 true,
//                 (box) => Visit.expression(property.value, scope, false, box))])) :
//       // Special Case #2: Only init properties //
//       (
//         _nullable_box = null,
//         _boxs1 = [],
//         _boxs2 = [],
//         Util.Fix(
//           node.properties,
//           (property, next) => (
//             (
//               !node.properties[index].computed &&
//               (
//                 node.properties[index].key.type === "Identifier" ?
//                 node.properties[index].key.name === "__proto__" :
//                 node.properties[index].key.value === "__proto__")) ?
//             Scope.box(
//               scope,
//               "ExpressionObjectProto2",
//               // No name for __proto__ propeties:
//               //
//               // > var o = {__proto__: function () {}}
//               // undefined
//               // > Reflect.getPrototypeOf(o).name
//               // ''
//               Visit.expression(property.value, scope, false, null),
//               (box) => (
//                 _nullable_box = box,
//                 next())) :
//             Scope.box(
//               scope,
//               "ExpressionObjectKey2",
//               (
//                 property.computed ?
//                 Visit.expression(property.key, scope, false, null) :
//                 Tree.primitive(
//                   (
//                     property.key.type === "Identifier" ?
//                     property.key.name :
//                     property.key.value))),
//               (box1) => Scope.box(
//                 scope,
//                 "ExpressionObjectValue",
//                 Visit.expression(node.properties[index].value, scope, false, box1),
//                 (box2) => (
//                   _boxs1[_boxs1.length] = box1,
//                   _boxs2[_boxs2.length] = box2,
//                   next())))),
//           () => Tree.object(
//             (
//               _nullable_box === null ?
//               Tree.builtin("Object.prototype") :
//               closure(_nullable_box)),
//             ArrayLite.map(
//               _boxs1,
//               (box, index) => [
//                 Scope.get(scope, box),
//                 Scope.get(scope, _boxs2[index])]))))) :
//     // General Case //
//     Scope.box(
//       scope,
//       "ExpressionObjectResult",
//       Tree.object(
//         Tree.builtin("Object.prototype"),
//         []),
//       (box1) => Util.Fix(
//         node.properties,
//         (property, next) => Tree.sequence(
//           (
//             // https://github.com/tc39/proposal-object-rest-spread
//             property.type === "SpreadElement" ?
//             Tree.apply(
//               Tree.builtin("Object.assign"),
//               Tree.primitive(void 0),
//               [
//                 Scope.get(scope, box1),
//                 Visit.expression(property.argument, scope, false, null)]) :
//             (
//               (
//                 !property.computed &&
//                 (
//                   property.key.type === "Identifier" ?
//                   property.key.name === "__proto__" :
//                   property.key.value === "__proto__")) ?
//               Tree.apply(
//                 Tree.builtin("Reflect.setPrototypeOf"),
//                 Tree.primitive(void 0),
//                 [
//                   Scope.get(scope, box1),
//                   Scope.box(
//                     scope,
//                     "ExpressionObjectProto3",
//                     Visit.expression(property.value, scope, false, null),
//                     closure)]) :
//               Scope.box(
//                 scope,
//                 "ExpressionObjectKey3",
//                 (
//                   property.computed ?
//                   Visit.expression(property.key, scope, false, null) :
//                   Tree.primitive(
//                     (
//                       property.key.type === "Identifier" ?
//                       property.key.name :
//                       property.key.value))),
//                 (box2) => Tree.apply(
//                   Tree.builtin("Reflect.defineProperty"),
//                   Tree.primitive(void 0),
//                   [
//                     Scope.get(scope, box1),
//                     Scope.get(scope, box2),
//                     // > var o = {};
//                     // undefined
//                     // > Reflect.defineProperty(o, "foo", {configurable:true, enumerable:true, get: () => {}})
//                     // true
//                     // > o
//                     // { foo: [Getter] }
//                     // > Reflect.defineProperty(o, "foo", {configurable:true, enumerable:true, set: () => {}})
//                     // true
//                     // > o
//                     // { foo: [Getter/Setter] }
//                     Tree.object(
//                       Tree.primitive(null),
//                       [
//                         [
//                           Tree.primitive("configurable"),
//                           Tree.primitive(true)],
//                         [
//                           Tree.primitive("enumerable"),
//                           Tree.primitive(true)],
//                         [
//                           Tree.primitive(
//                             node.properties[index].kind === "init" ?
//                             "value" :
//                             node.properties[index].kind),
//                           Visit.expression(node.properties[index].value, scope, false, null)]])])))),
//         () => Scope.get(scope, box1))
//         (
//           function self (index) { return (
//             index === node.properties.length ?
//             Scope.get(scope, box1) :
//             Tree.sequence(
//               (
//                 // https://github.com/tc39/proposal-object-rest-spread
//                 node.properties[index].type === "SpreadElement" ?
//                 Tree.apply(
//                   Tree.builtin("Object.assign"),
//                   Tree.primitive(void 0),
//                   [
//                     Scope.get(scope, box1),
//                     Visit.expression(node.properties[index].argument, scope, false, null)]) :
//                 (
//                   (
//                     !node.properties[index].computed &&
//                     (
//                       node.properties[index].key.type === "Identifier" ?
//                       node.properties[index].key.name === "__proto__" :
//                       node.properties[index].key.value === "__proto__")) ?
//                   Tree.apply(
//                     Tree.builtin("Reflect.setPrototypeOf"),
//                     Tree.primitive(void 0),
//                     [
//                       Scope.get(scope, box1),
//                       Scope.box(
//                         scope,
//                         "ExpressionObjectProto3",
//                         Visit.expression(node.properties[index].value, scope, false, null),
//                         closure)]) :
//                   Scope.box(
//                     scope,
//                     "ExpressionObjectKey3",
//                     (
//                       node.properties[index].key.type === "Literal" ?
//                       node.properties[index].key.value :
//                       (
//                         node.properties[index].key.computed ?
//                         Visit.expression(node.properties[index].key, scope, false, null) :
//                         node.properties[index].key.name)),
//                     (box2) => Tree.apply(
//                       Tree.builtin("Reflect.defineProperty"),
//                       Tree.primitive(void 0),
//                       [
//                         Scope.get(scope, box1),
//                         Scope.get(scope, box2),
//                         // > var o = {};
//                         // undefined
//                         // > Reflect.defineProperty(o, "foo", {configurable:true, enumerable:true, get: () => {}})
//                         // true
//                         // > o
//                         // { foo: [Getter] }
//                         // > Reflect.defineProperty(o, "foo", {configurable:true, enumerable:true, set: () => {}})
//                         // true
//                         // > o
//                         // { foo: [Getter/Setter] }
//                         Tree.object(
//                           Tree.primitive(null),
//                           [
//                             [
//                               Tree.primitive("configurable"),
//                               Tree.primitive(true)],
//                             [
//                               Tree.primitive("enumerable"),
//                               Tree.primitive(true)],
//                             [
//                               Tree.primitive(
//                                 node.properties[index].kind === "init" ?
//                                 "value" :
//                                 node.properties[index].kind),
//                               Visit.expression(node.properties[index].value, scope, false, null)]])])))),
//               self(index + 1)))})))));
//
// visitors.UnaryExpression = (scope, node, dropped, box) => (
//   (
//     node.operator === "typeof" &&
//     node.argument.type === "Identifier") ?
//   Scope.typeof(scope, node.argument.name) :
//   (
//     node.operator === "delete" ?
//     (
//       node.argument.type === "MemberExpression" ?
//       Object.del(
//         Scope._is_strict(scope),
//         Scope.box(
//           scope,
//           "ExpressionUnaryDeleteObject",
//           false,
//           Expression.visit(scope, node.argument.object, false, null),
//           (box) =>  Object.obj(
//             () => Scope.get(scope, box))),
//         (
//           node.argument.computed ?
//           Expression.visit(scope, node.argument.property, false, null) :
//           Tree.primitive(node.argument.property.name)),
//         null) :
//       (
//         node.argument.type === "Identifier" ?
//         Scope.delete(scope, node.argument.name) :
//         Tree.sequence(
//           Expression.visit(scope, node.argument, true, null),
//           Tree.primitive(true)))) :
//     Tree.unary(
//       node.operator,
//       Expression.visit(scope, node.argument, false, null))));
//
// visitors.BinaryExpression = (scope, node, dropped, box) => Tree.binary(
//   node.operator,
//   Expression.visit(scope, node.left, false, null),
//   Expression.visit(scope, node.right, false, null));
//
// visitors.NewExpression = (scope, node, dropped, box) => (
//   ArrayLite.every(
//     node.arguments,
//     (argument) => argument.type !== "SpreadElement") ?
//   Tree.construct(
//     Expression.visit(scope, node.callee, false, null),
//     ArrayLite.map(
//       node.arguments,
//       (argument) => Expression.visit(scope, argument, false, null))) :
//   Tree.apply(
//     Tree.builtin("Reflect.construct"),
//     Tree.primitive(void 0),
//     [
//       Expression.visit(scope, node.callee, false, null),
//       Tree.apply(
//         Tree.builtin("Array.prototype.concat"),
//         Tree.apply(
//           Tree.builtin("Array.of"),
//           Tree.primitive(void 0),
//           []),
//         ArrayLite.map(
//           node.arguments,
//           (argument) => (
//             argument.type === "SpreadElement" ?
//             Expression.visit(scope, argument.argument, false, null) :
//             Tree.apply(
//               Tree.builtin("Array.of"),
//               Tree.primitive(void 0),
//               [
//                 Expression.visit(scope, argument, false, null)]))))]));
//
// // Eval with spread element is not direct:
// //
// // > var x = "foo";
// // undefined
// // > function f () { var x = "bar"; return eval(...["x"])}
// // undefined
// // > f()
// // 'foo'
// visitors.CallExpression = (scope, node, dropped, box) => (
//   Query._is_direct_eval_call(node) ?
//   Scope.box(
//     scope,
//     "ExpressionCallEvalCallee",
//     false,
//     Scope.read(scope, "eval"),
//     (box) => ArrayLite.mapReduce(
//       node.arguments,
//       (next, argument) => Scope.box(
//         scope,
//         "ExpressionCallEvalArgument",
//         false,
//         Expression.visit(scope, argument, false, null),
//         next),
//       (boxes) => Tree.conditional(
//         Tree.binary(
//           "===",
//           Scope.get(scope, box),
//           Tree.builtin("eval")),
//         Scope.eval(
//           scope,
//           Scope.get(scope, boxes[0])),
//         Tree.apply(
//           Scope.get(scope, box),
//           Tree.primitive(void 0),
//           ArrayLite.map(
//             boxes,
//             (box) => Scope.get(scope, box)))))) :
//   (
//     ArrayLite.some(node.arguments, Query._is_spread_element) ?
//     Scope.box(
//       scope,
//       "ExpressionCallSpreadMemberObject",
//       false,
//       (
//         node.callee.type === "MemberExpression" ?
//         Expression.visit(scope, node.callee.object, false, null) :
//         Tree.primitive(void 0)),
//       (box) => Tree.apply(
//         Tree.builtin("Reflect.apply"),
//         Tree.primitive(void 0),
//         [
//           (
//             node.callee.type === "MemberExpression" ?
//             Object.get(
//               Object.obj(
//                 () => Scope.get(scope, box)),
//               (
//                 node.callee.computed ?
//                 Expression.visit(scope, node.callee.property, false, null) :
//                 Tree.primitive(node.callee.property.name))) :
//             Expression.visit(scope, node.callee, false, null)),
//           Scope.get(scope, box),
//           Tree.apply(
//             Tree.builtin("Array.prototype.concat"),
//             Tree.apply(
//               Tree.builtin("Array.of"),
//               Tree.primitive(void 0),
//               []),
//             ArrayLite.map(
//               node.arguments,
//               (argument) => (
//                 argument.type === "SpreadElement" ?
//                 Expression.visit(scope, argument.argument, false, null) :
//                 Tree.apply(
//                   Tree.builtin("Array.of"),
//                   Tree.primitive(void 0),
//                   [
//                     Expression.visit(scope, argument, false, null)]))))])) :
//     (
//       node.callee.type === "MemberExpression" ?
//       // Evaluation order:
//       // =================
//       // var o = null;
//       // > o[console.log("key")](console.log("arg"))
//       // key
//       // Thrown:
//       // TypeError: Cannot read property 'undefined' of null
//       Scope.box(
//         scope,
//         "ExpressionCallMemberObject",
//         false,
//         Expression.visit(scope, node.callee.object, false, null),
//         (box) => Tree.apply(
//           Object.get(
//             Object.obj(
//               () => Scope.get(scope, box)),
//             (
//               node.callee.computed ?
//               Expression.visit(scope, node.callee.property, false, null) :
//               Tree.primitive(node.callee.property.name))),
//             Scope.get(scope, box),
//             ArrayLite.map(
//               node.arguments,
//               (argument) => Expression.visit(scope, argument, false, null)))) :
//       Tree.apply(
//         Expression.visit(scope, node.callee, false, null),
//         Tree.primitive(void 0),
//         ArrayLite.map(
//           node.arguments,
//           (argument) => Expression.visit(scope, argument, false, null))))));
//
// visitors.MemberExpression = (scope, node, dropped, box) => Object.get(
//   Scope.box(
//     scope,
//     "ExpressionMemberObject",
//     false,
//     Expression.visit(scope, node.object, false, null),
//     (box) => Object.obj(
//       () => Scope.get(scope, box))),
//   (
//     node.computed ?
//     Expression.visit(scope, node.property, false, null) :
//     Tree.primitive(node.property.name)));
//
//
// visitors.ClassExpression = (scope, node, dropped, context) => Common.class(
//   scope,
//   node,
//   context.name);
//
// visitors.YieldExpression = (scope, node, context) => { throw new global_Error("Unfortunately, Aran does not support generator closures.") };
//
// visitors.AwaitExpression = (scope, node, context) => { throw new global_Error("Unfortunately, Aran does not support asynchronous closure.") };
