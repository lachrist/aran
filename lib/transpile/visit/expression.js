"use strict";

const global_Object_assign = global.Object.assign;
const global_RegExp = global.RegExp;
const global_Reflect_apply = global.Reflect.apply;
const global_String_prototype_substring = global.String.prototype.substring;
const global_Array = global.Array;

const ArrayLite = require("array-lite");
const Throw = require("../../throw.js");
const Tree = require("../tree.js");
const Scope = require("../scope/index.js");
const Intrinsic = require("../intrinsic.js");
const Query = require("../query/index.js");
const Completion = require("../completion.js");
const Visit = require("./index.js");

const identity = (any) => any;

const is_spread_element_node = (node) => node.type === "SpreadElement";

exports.expression = (scope, node, context) => (
  context = global_Object_assign(
    {dropped:false},
    context),
  visitors[node.type](scope, node, context));

exports.spreadable = (scope, node, context) => (
  node.type === "SpreadElement" ?
  // *Unfortunately*, Array.from does not work because it accepts array-like objects
  Tree.ApplyExpression(
    Tree.ClosureExpression(
      "arrow",
      false,
      false,
      Scope.makeHeadClosureBlock(
        scope,
        "arrow",
        false,
        [],
        (scope) => Scope.makeBoxStatement(
          scope,
          false,
          "result",
          Intrinsic.makeObjectExpression(
            Tree.PrimitiveExpression(null),
            [
              [
                Intrinsic.makeGrabExpression("Symbol.isConcatSpreadable"),
                Tree.PrimitiveExpression(true)]]),
          (result_box) => Scope.makeBoxStatement(
            scope,
            true,
            "length",
            Tree.PrimitiveExpression(0),
            (length_box) => Scope.makeBoxStatement(
              scope,
              false,
              "iterable",
              Intrinsic.makeGetExpression(
                Scope.makeInputExpression(scope, "arguments"),
                Tree.PrimitiveExpression(0),
                null),
              (iterable_box) => Scope.makeBoxStatement(
                scope,
                false,
                "iterator",
                Tree.ApplyExpression(
                  Intrinsic.makeGetExpression(
                    Scope.makeOpenExpression(scope, iterable_box),
                    Intrinsic.makeGrabExpression("Symbol.iterator"),
                    null),
                  Scope.makeOpenExpression(scope, iterable_box),
                  []),
                (iterator_box) => Scope.makeBoxStatement(
                  scope,
                  true,
                  "step",
                  Tree.PrimitiveExpression(void 0),
                  (step_box) => Tree.BundleStatement(
                    [
                      Tree.WhileStatement(
                        Tree.SequenceExpression(
                          Scope.makeCloseExpression(
                            scope,
                            step_box,
                            Tree.ApplyExpression(
                              Intrinsic.makeGetExpression(
                                Scope.makeOpenExpression(scope, iterator_box),
                                Tree.PrimitiveExpression("next"),
                                null),
                              Scope.makeOpenExpression(scope, iterator_box),
                              [])),
                          Tree.UnaryExpression(
                            "!",
                            Intrinsic.makeGetExpression(
                              Scope.makeOpenExpression(scope, step_box),
                              Tree.PrimitiveExpression("done"),
                              null))),
                        Scope.makeNormalBlock(
                          scope,
                          [],
                          [],
                          (scope) => Tree.BundleStatement(
                            [
                              Tree.ExpressionStatement(
                                Intrinsic.makeSetExpression(
                                  Scope.makeOpenExpression(scope, result_box),
                                  Scope.makeOpenExpression(scope, length_box),
                                  Intrinsic.makeGetExpression(
                                    Scope.makeOpenExpression(scope, step_box),
                                    Tree.PrimitiveExpression("value"),
                                    null),
                                  null,
                                  false,
                                  Intrinsic.SUCCESS_RESULT)),
                              Tree.ExpressionStatement(
                                Scope.makeCloseExpression(
                                  scope,
                                  length_box,
                                  Tree.BinaryExpression(
                                    "+",
                                    Scope.makeOpenExpression(scope, length_box),
                                    Tree.PrimitiveExpression(1))))]))),
                      Tree.ExpressionStatement(
                        Intrinsic.makeSetExpression(
                          Scope.makeOpenExpression(scope, result_box),
                          Tree.PrimitiveExpression("length"),
                          Scope.makeOpenExpression(scope, length_box),
                          null,
                          false,
                          Intrinsic.SUCCESS_RESULT)),
                      Tree.ReturnStatement(
                        Scope.makeOpenExpression(scope, result_box))])))))))),
    Tree.PrimitiveExpression(void 0),
    [
      Visit.expression(scope, node.argument, null)]) :
  Intrinsic.makeArrayExpression(
    [
      Visit.expression(scope, node, null)]));

// exports.super = (scope, node, context) => (
//   Throw.assert(node.type === "Super", null, `Invalid super node`),
//   context = global_Object_assign(
//     {
//       key: null,
//       arguments: null},
//     context),
//   Throw.assert(
//     (context.key === null) !== (context.argument === null),
//     null,
//     `context.key xor context.arguments`),
//   (
//     context.key === null ?
//     Scope.makeSuperCallExpression(scope, context.arguments) :
//     Scope.makeSuperMemberExpression(scope, context.key)));

exports.member = (scope, node, context) => (
  Throw.assert(node.type === "MemberExpression", null, `Invalid member node`),
  context = global_Object_assign({kontinuation:null}, context),
  (
    node.object.type === "Super" ?
    context.kontinuation(
      Scope.makeSuperMemberExpression(
        scope,
        Visit.key(scope, node.property, {computed:node.computed})),
      Scope.makeReadExpression(scope, "this")) :
    Scope.makeBoxExpression(
      scope,
      false,
      "ExpressionMemberObject",
      Visit.expression(scope, node.object, null),
      (box) => context.kontinuation(
        (
          node.optional ?
          Intrinsic.makeNullishExpression(
            () => Scope.makeOpenExpression(scope, box),
            Tree.PrimitiveExpression(void 0),
            Intrinsic.makeGetExpression(
              Intrinsic.makeObjectifyExpression(
                Scope.makeOpenExpression(scope, box)),
              Visit.key(scope, node.property, {computed:node.computed}),
              null)) :
          Intrinsic.makeGetExpression(
            Intrinsic.makeNullishExpression(
              () => Scope.makeOpenExpression(scope, box),
              null,
              null),
            Visit.key(scope, node.property, {computed:node.computed}),
            null)),
        Scope.makeOpenExpression(scope, box)))));

const visitors = {__proto__:null};

/////////////////
// Unsupported //
/////////////////

visitors.YieldExpression = (scope, node, context) => Tree.YieldExpression(
  node.delegate,
  (
    node.argument === null ?
    Tree.PrimitiveExpression(void 0) :
    Visit.expression(
      scope,
      node.argument,
      null)));

visitors.AwaitExpression = (scope, node, context) => Tree.AwaitExpression(
  Visit.expression(
    scope,
    node.argument,
    null));

/////////////
// Literal //
/////////////

visitors.Literal = (scope, node, context) => (
  node.value instanceof global_RegExp ?
  Intrinsic.makeRegExpExpression(node.regex.pattern, node.regex.flags) :
  Tree.PrimitiveExpression(node.value));

exports.quasi = (scope, node, context) => (
  Throw.assert(node.type === "TemplateElement", null, `Invalid quasi node`),
  Tree.PrimitiveExpression(node.value.cooked));

visitors.TemplateLiteral = (scope, node, context) => (
  node.expressions.length === 0 ?
  Visit.quasi(scope, node.quasis[0], null) :
  Tree.BinaryExpression(
    "+",
    ArrayLite.reduce(
      global_Array(node.expressions.length - 1),
      (expression, _, index) => Tree.BinaryExpression(
        "+",
        expression,
        Tree.BinaryExpression(
          "+",
          Visit.quasi(scope, node.quasis[index + 1], null),
          Visit.expression(scope, node.expressions[index + 1], null))),
      Tree.BinaryExpression(
        "+",
        Visit.quasi(scope, node.quasis[0], null),
        Visit.expression(scope, node.expressions[0], null))),
    Visit.quasi(scope, node.quasis[node.quasis.length - 1], null)));

// Tagged template cannot lead to a direct eval call because it receives an array instead of a string:
// cf: https://www.ecma-international.org/ecma-262/10.0/index.html#sec-performeval
visitors.TaggedTemplateExpression = (scope, node, context) => (
  (
    (closure) => (
      // We do not need to check for node.tag.type === "ChainExpression" because:
      // require("acorn").parse("(123)?.[456]`foo`;")
      // SyntaxError: Optional chaining cannot appear in the tag of tagged template expressions (1:12)
      node.tag.type === "MemberExpression" ?
      Visit.member(
        scope,
        node.tag,
        {
          kontinuation: (expression1, expression2) => Tree.ApplyExpression(
            expression1,
            expression2,
            closure())}) :
      Tree.ApplyExpression(
        Visit.expression(scope, node.tag, null),
        Tree.PrimitiveExpression(void 0),
        closure())))
  (
    () => ArrayLite.concat(
      [
        Intrinsic.makeFreezeExpression(
          Intrinsic.makeDefinePropertyExpression(
            Intrinsic.makeArrayExpression(
              ArrayLite.map(
                node.quasi.quasis,
                (quasi) => Tree.PrimitiveExpression(quasi.value.cooked))),
            Tree.PrimitiveExpression("raw"),
            {
              __proto__: null,
              value: Intrinsic.makeFreezeExpression(
                Intrinsic.makeArrayExpression(
                  ArrayLite.map(
                    node.quasi.quasis,
                    (quasi) => Tree.PrimitiveExpression(quasi.value.raw))),
                true,
                Intrinsic.TARGET_RESULT)},
            true,
            Intrinsic.TARGET_RESULT),
          true,
          Intrinsic.TARGET_RESULT)],
      ArrayLite.map(
        node.quasi.expressions,
        (expression) => Visit.expression(scope, expression, null)))));

visitors.ArrowFunctionExpression = (scope, node, context) => Visit.closure(scope, node, null);

visitors.FunctionExpression = (scope, node, context) => Visit.closure(scope, node, null);

visitors.ClassExpression = (scope, node, context) => Visit.class(scope, node, null);

/////////////////
// Environment //
/////////////////

visitors.Identifier = (scope, node, context) => Scope.makeReadExpression(scope, node.name);

// // We can assume self is always a proper object
// visitors.Super = (scope, node, context) => ( // console.assert(Scope._get_binding_super_nullable_box(scope) !== null)
//   Scope._has_super(scope) ?
//   Tree.ConditionalExpression(
//     Scope.makeReadExpression(scope, "this"),
//     Intrinsic.makeGetPrototypeOfExpression(
//       Scope.makeOpenExpression_self(scope)),
//     Intrinsic.makeThrowReferenceErrorExpression("Must call super constructor in derived class before accessing 'this' or returning from derived constructor")) :
//   Intrinsic.makeGetPrototypeOfExpression(
//     Scope.makeOpenExpression_self(scope)));

visitors.ThisExpression = (scope, node, context) => Scope.makeReadExpression(scope, "this");

// No point in supporting import.meta when modules are not supported
visitors.MetaProperty = (scope, node, dropped, box) => (
  (
    node.meta.name === "new" &&
    node.property.name === "target") ?
  Scope.makeReadExpression(scope, "new.target") :
  (
    (
      node.meta.name === "import" &&
      node.property.name === "meta") ?
    Scope.makeReadExpression(scope, "import.meta") :
    Throw.abort(null, `Unknown meta property`)));

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
      Scope.isStrict(scope)) ?
    // MemberExpression >> Special Case #1 >> (dropped && strict && =)
    Intrinsic.makeSetExpression(
      Visit.expression(scope, node.left.object, null),
      (
        node.left.computed ?
        Visit.expression(scope, node.left.property, null) :
        Tree.PrimitiveExpression(node.left.property.name)),
      Visit.expression(scope, node.right, null),
      null,
      true,
      Intrinsic.SUCCESS_RESULT) :
    Scope.makeBoxExpression(
      scope,
      false,
      "ExpressionAssignmentMemberObject",
      Visit.expression(scope, node.left.object, null),
      (object_box) => (
        (
          node.operator === "=" &&
          context.dropped &&
          !Scope.isStrict(scope)) ? // this last `and` clause could go away but it is kept for readability
        // MemberExpression >> Special Case #1 >> (dropped && !strict && =)
        Intrinsic.makeSetExpression(
          Intrinsic.makeNullishExpression(
            () => Scope.makeOpenExpression(scope, object_box),
            null,
            null),
          (
            node.left.computed ?
            Visit.expression(scope, node.left.property, null) :
            Tree.PrimitiveExpression(node.left.property.name)),
          Visit.expression(scope, node.right, null),
          null,
          false,
          Intrinsic.SUCCESS_RESULT) :
        Scope.makeBoxExpression(
          scope,
          false,
          "ExpressionAssignmentMemberProperty",
          (
            node.left.computed ?
            Visit.expression(scope, node.left.property, null) :
            Tree.PrimitiveExpression(node.left.property.name)),
          (key_box) => (
            _expression = (
              node.operator === "=" ?
              Visit.expression(scope, node.right, null) :
              Tree.BinaryExpression(
                global_Reflect_apply(
                  global_String_prototype_substring,
                  node.operator,
                  [0, node.operator.length - 1]),
                Intrinsic.makeGetExpression(
                  Intrinsic.makeNullishExpression(
                    () => Scope.makeOpenExpression(scope, object_box),
                    null,
                    null),
                  Scope.makeOpenExpression(scope, key_box),
                  null),
                Visit.expression(scope, node.right, null))),
            (
              context.dropped ?
              // MemberExpression >> Special Case #1 >> (dropped && +=)
              Intrinsic.makeSetExpression(
                (
                  Scope.isStrict(scope) ?
                  Scope.makeOpenExpression(scope, object_box) :
                  Intrinsic.makeNullishExpression(
                    () => Scope.makeOpenExpression(scope, object_box),
                    null,
                    null)),
                Scope.makeOpenExpression(scope, key_box),
                _expression,
                null,
                Scope.isStrict(scope),
                Intrinsic.SUCCESS_RESULT) :
              // MemberExpression >> General Case
              Scope.makeBoxExpression(
                scope,
                false,
                "ExpressionAssignmentMemberValue",
                _expression,
                (value_box) => Intrinsic.makeSetExpression(
                  (
                    Scope.isStrict(scope) ?
                    Scope.makeOpenExpression(scope, object_box) :
                    Intrinsic.makeNullishExpression(
                      () => Scope.makeOpenExpression(scope, object_box),
                      null,
                      null)),
                  Scope.makeOpenExpression(scope, key_box),
                  Scope.makeOpenExpression(scope, value_box),
                  null,
                  Scope.isStrict(scope),
                  Scope.makeOpenExpression(scope, value_box))))))))) :
  (
    node.left.type === "Identifier" ?
    (
      _expression = (
        node.operator === "=" ?
        Scope.makeBoxExpression(
          scope,
          false,
          "AssignmentExpressionIdentifierName",
          Tree.PrimitiveExpression(node.left.name),
          (name_box) => Visit.named(
            scope,
            node.right,
            {name: name_box})) :
        Tree.BinaryExpression(
          global_Reflect_apply(
            global_String_prototype_substring,
            node.operator,
            [0, node.operator.length - 1]),
          Scope.makeReadExpression(scope, node.left.name),
          // Name are not transmitted on update:
          //
          // > var f = "foo"
          // undefined
          // > f += function () {}
          // 'foofunction () {}'
          Visit.expression(scope, node.right, null))),
      (
        context.dropped ?
        Visit._pattern(
          scope,
          node.left,
          {
            kind: null,
            expression: _expression}) :
        Scope.makeBoxExpression(
          scope,
          false,
          "ExpressionAssignmentIdentifierRight",
          _expression,
          (value_box) => Tree.SequenceExpression(
            Visit._pattern(
              scope,
              node.left,
              {
                kind: null,
                expression: Scope.makeOpenExpression(scope, value_box)}),
            Scope.makeOpenExpression(scope, value_box))))) :
    (
      context.dropped ?
      Visit._pattern(
        scope,
        node.left,
        {
          kind: null,
          expression: Visit.expression(scope, node.right, null)}) :
      Scope.makeBoxExpression(
        scope,
        false,
        "ExpressionAssignmentPatternRight",
        Visit.expression(scope, node.right, null),
        (box) => Tree.SequenceExpression(
          Visit._pattern(
            scope,
            node.left,
            {
              kind: null,
              expression: Scope.makeOpenExpression(scope, box)}),
          Scope.makeOpenExpression(scope, box))))));

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
visitors.UpdateExpression = (scope, node, context, _closure) => (
  _closure = (old_value_box, closure, _expression) => (
    _expression = Tree.BinaryExpression(
      node.operator[0],
      Scope.makeOpenExpression(scope, old_value_box),
      Tree.ConditionalExpression(
        Tree.BinaryExpression(
          "===",
          Tree.UnaryExpression(
            "typeof",
            Scope.makeOpenExpression(scope, old_value_box)),
          Tree.PrimitiveExpression("bigint")),
        Tree.PrimitiveExpression(1n),
        Tree.PrimitiveExpression(1))),
    (
      context.dropped ?
      closure(_expression) :
      (
        node.prefix ?
        Scope.makeBoxExpression(
          scope,
          false,
          "ExpressionMemberNewValue",
          _expression,
          (new_value_box) => Tree.SequenceExpression(
            closure(
              Scope.makeOpenExpression(scope, new_value_box)),
            Scope.makeOpenExpression(scope, new_value_box))) :
        Tree.SequenceExpression(
          closure(_expression),
          Scope.makeOpenExpression(scope, old_value_box))))),
  (
    node.argument.type === "MemberExpression" ?
    Scope.makeBoxExpression(
      scope,
      false,
      "ExpressionUpdateMemberObject",
      Visit.expression(scope, node.argument.object, null),
      (object_box) => Scope.makeBoxExpression(
        scope,
        false,
        "ExpressionUpdateMemberKey",
        // toString is called twice:
        // =========================
        // ({__proto__:null, foo:"bar"})[{__proto__: null, toString: () => (console.log("toString"), "foo")}]++
        // toString
        // toString
        // NaN
        Visit.key(
          scope,
          node.argument.property,
          {computed:node.argument.computed}),
        (key_box) => Scope.makeBoxExpression(
          scope,
          false,
          "ExpressionUpdateMemberOldValue",
          // console.assert(!node.argument.optional) // obj?.key++ is invalid
          Intrinsic.makeGetExpression(
            Intrinsic.makeNullishExpression(
              () => Scope.makeOpenExpression(scope, object_box),
              null,
              null),
            Scope.makeOpenExpression(scope, key_box),
            null),
          (old_value_box) => _closure(
            old_value_box,
            (expression) => Intrinsic.makeSetExpression(
              (
                Scope.isStrict(scope) ?
                Scope.makeOpenExpression(scope, object_box) :
                Intrinsic.makeNullishExpression(
                  () => Scope.makeOpenExpression(scope, object_box),
                  null,
                  null)),
              Scope.makeOpenExpression(scope, key_box),
              expression,
              null,
              Scope.isStrict(scope),
              Intrinsic.SUCCESS_RESULT))))) :
    // console.assert(node.argument.type === "Identifier")
    Scope.makeBoxExpression(
      scope,
      false,
      "ExpressionUpdateIdentifierOldValue",
      Scope.makeReadExpression(scope, node.argument.name),
      (old_value_box) => _closure(
        old_value_box,
        (expression) => Scope.makeWriteExpression(
          scope,
          node.argument.name,
          expression)))));

/////////////
// Control //
/////////////

// Function's name are not propagated through sequences:
//
// > var o = {x:(123, function () {})}
// undefined
// > o
// { x: [Function] }
// > o.x.name
// ''
visitors.SequenceExpression = (scope, node, context) => ArrayLite.reduce(
  ArrayLite.reverse(
    ArrayLite.slice(node.expressions, 0, node.expressions.length - 1)),
  (expression, node) => Tree.SequenceExpression(
    Visit.expression(
      scope,
      node,
      {dropped: true}),
    expression),
  Visit.expression(
    scope,
    node.expressions[node.expressions.length - 1],
    {dropped: context.dropped})),

visitors.LogicalExpression = (scope, node, context) => (
  (
    node.operator !== "??" &&
    context.dropped) ?
  Tree.ConditionalExpression(
    Visit.expression(scope, node.left, null),
    (
      node.operator === "&&" ?
      Visit.expression(
        scope,
        node.right,
        {dropped: true}) :
      Tree.PrimitiveExpression(void 0)),
    (
      node.operator === "||" ?
      Visit.expression(
        scope,
        node.right,
        {dropped: true}) :
      Tree.PrimitiveExpression(void 0))) :
  Scope.makeBoxExpression(
    scope,
    false,
    "ExpressionLogicalLeft",
    Visit.expression(scope, node.left, null),
    (box) => (
      node.operator === "??" ?
      Tree.ConditionalExpression(
        Tree.ConditionalExpression(
          Tree.BinaryExpression(
            "===",
            Scope.makeOpenExpression(scope, box),
            Tree.PrimitiveExpression(null)),
          Tree.PrimitiveExpression(true),
          Tree.BinaryExpression(
            "===",
            Scope.makeOpenExpression(scope, box),
            Tree.PrimitiveExpression(void 0))),
        Visit.expression(
          scope,
          node.right,
          {dropped: context.dropped}),
        (
          context.dropped ?
          Tree.PrimitiveExpression(void 0) :
          Scope.makeOpenExpression(scope, box))) :
      Tree.ConditionalExpression( // console.assert(!context.dropped)
        Scope.makeOpenExpression(scope, box),
        (
          node.operator === "&&" ?
          Visit.expression(scope, node.right, null) :
          Scope.makeOpenExpression(scope, box)),
        (
          node.operator === "||" ?
          Visit.expression(scope, node.right, null) :
          Scope.makeOpenExpression(scope, box))))));

visitors.ConditionalExpression = (scope, node, context) => Tree.ConditionalExpression(
  Visit.expression(scope, node.test, null),
  Visit.expression(
    scope,
    node.consequent,
    {dropped: context.dropped}),
  Visit.expression(
    scope,
    node.alternate,
    {dropped: context.dropped}));

////////////
// Object //
////////////

// __proto__ property does not gives name to function:
//
// > var o = {__proto__: function () {}}
// undefined
// > o
// > Reflect.getPrototypeOf(o);
// [Function]
// > var o = {"__proto__": function () {}}
// undefined
// > Reflect.getPrototypeOf(o);
// [Function]
// > Reflect.getPrototypeOf(o).name
// ''

// // object `super` behavior: super.foo >> Reflect.getPrototypeOf(self).foo
// ((() => {
//   const o = {
//     __proto__: {
//       __proto__: null,
//       foo: 123
//     },
//     foo: "noope",
//     bar () {
//       console.assert(Reflect.getPrototypeOf(this).foo === 789);
//       console.assert(o.foo == "noope");
//       console.assert(Reflect.getPrototypeOf(o).foo === 123 && super.foo === 123);
//       Reflect.setPrototypeOf(o, {
//         __proto__: null,
//         foo: 456
//       });
//       console.assert(Reflect.getPrototypeOf(o).foo === 456 && super.foo === 456);
//     }
//   }
//   Reflect.apply(o.bar, {
//     __proto__: {
//       __proto__: null,
//       foo: 789
//     }
//   }, []);
// }) ());
//
// ((() => {
//   const C = function () {};
//   C.prototype = {
//     __proto__: null,
//     foo: 123
//   };
//   const D = class extends C {
//     foo () {
//       return "noope";
//     }
//     bar () {
//       console.assert(Reflect.getPrototypeOf(this).foo === 789);
//       console.assert(D.prototype.foo() === "noope");
//       console.assert(Reflect.getPrototypeOf(D.prototype).foo === 123 && super.foo === 123);
//       Reflect.setPrototypeOf(D.prototype, {
//         __proto__: null,
//         foo: 456
//       });
//       console.assert(Reflect.getPrototypeOf(D.prototype).foo === 456 && super.foo === 456);
//     }
//   };
//   Reflect.apply(D.prototype.bar, {
//     __proto__: {
//       __proto__: null,
//       foo: 789
//     }
//   }, []);
// }) ());
//
// {
//   const C = function () { return {__proto__: null, foo:123} };
//   class D extends C {
//     constructor () {
//       console.log(Reflect.getPrototypeOf(D.prototype).constructor());
//       // Reflect.setPrototypeOf(D.prototype, {
//       //   __proto__: null,
//       //   constructor: function () {
//       //     return {__proto__:null, foo:456};
//       //   }
//       // });
//       // Reflect.getPrototypeOf(D.prototype).constructor = function () {
//       //   return {__proto__:null, foo:456};
//       // };
//       C.prototype.constructor = function () {
//         return {__proto__:null, foo:456};
//       };
//       console.log(Object.getOwnPropertyDescriptors(D.prototype));
//       console.log(Reflect.getPrototypeOf(D.prototype).constructor());
//       console.log(Reflect.getPrototypeOf(new.target.prototype).constructor());
//       super();
//       console.log(this);
//     }
//   }
//   // Reflect.setPrototypeOf(D.prototype, null);
//   new D();
//   "foobar";
// }

const is_proto_property_node = (node) => (
  node.type === "Property" &&
  node.kind === "init" &&
  !node.method &&
  !node.computed &&
  (
    node.key.type === "Identifier" ?
    node.key.name === "__proto__" :
    node.key.value === "__proto__"));

const is_super_property_node = (node) => (
  node.type === "Property" &&
  (
    node.method ||
    node.kind !== "init"));

const is_simple_property_node = (node) => (
  node.type === "Property" &&
  node.kind === "init");

exports.property = (scope, node, context) => (
  Throw.assert(node.type === "SpreadElement" || node.type === "Property", null, `Invalid property node`),
  context = global_Object_assign(
    {
      target: null,
      super: null},
    context),
  Throw.assert(context.target !== null, null, `Missing target for property node`),
  (
    node.type === "SpreadElement" ?
    Intrinsic.makeAssignExpression(
      context.target,
      [
        Visit.expression(scope, node.argument, null)],
      true,
      Intrinsic.TARGET_RESULT) :
    (
      is_proto_property_node(node) ?
      Intrinsic.makeSetPrototypeOfExpression(
        context.target,
        Visit.proto_property(scope, node, null),
        true,
        Intrinsic.TARGET_RESULT) :
      (
        (
          node.value.type === "ArrowFunctionExpression" ||
          node.value.type === "FunctionExpression") ?
        Scope.makeBoxExpression(
          scope,
          false,
          "PropertyKey",
          Visit.key(scope, node.key, {computed:node.computed}),
          (box) => Intrinsic.makeDefinePropertyExpression(
            context.target,
            Scope.makeOpenExpression(scope, box),
            (
              node.kind === "init" ?
              {
                __proto__: null,
                value: Visit.closure(
                  scope,
                  node.value,
                  {
                    sort: node.method ? "method" : null,
                    super: context.super,
                    name: box}),
                writable: true,
                enumerable: true,
                configurable: true} :
              {
                __proto__: null,
                [node.kind]: Visit.closure(
                  scope,
                  node.value,
                  {
                    sort: "method",
                    super: context.super,
                    name: box,
                    accessor: node.kind}),
                enumerable: true,
                configurable: true}),
            true,
            Intrinsic.TARGET_RESULT)) :
        // console.assert(node.kind === "init" && !node.method)
        Intrinsic.makeDefinePropertyExpression(
          context.target,
          Visit.key(scope, node.key, {computed:node.computed}),
          {
            __proto__: null,
            value: Visit.expression(scope, node.value, null),
            writable: true,
            enumerable: true,
            configurable: true},
          true,
          Intrinsic.TARGET_RESULT)))));

exports.proto_property = (scope, node, context, _key_box) => (
  Throw.assert(
    is_proto_property_node(node),
    null,
    `Invalid proto node`),
  Scope.makeBoxExpression(
    scope,
    false,
    "PropertyRawPrototype",
    Visit.expression(scope, node.value, null),
    (prototype_box) => Tree.ConditionalExpression(
      Tree.ConditionalExpression(
        Tree.BinaryExpression(
          "===",
          Tree.UnaryExpression(
            "typeof",
            Scope.makeOpenExpression(scope, prototype_box)),
          Tree.PrimitiveExpression("object")),
        Tree.PrimitiveExpression(true),
        Tree.BinaryExpression(
          "===",
          Tree.UnaryExpression(
            "typeof",
            Scope.makeOpenExpression(scope, prototype_box)),
          Tree.PrimitiveExpression("function"))),
      Scope.makeOpenExpression(scope, prototype_box),
      Intrinsic.makeGrabExpression("Object.prototype"))));

exports._regular_property = (scope, node, context, _key_box) => (
  Throw.assert(
    (
      is_simple_property_node(node) &&
      !is_proto_property_node(node)),
    null,
    `Invalid regular property node`),
  context = global_Object_assign({super:null}, context),
  (
    (
      node.value.type === "ArrowFunctionExpression" ||
      node.value.type === "FunctionExpression") ?
    // console.assert(!node.method || context.super !== null)
    [
      Scope.makeBoxExpression(
        scope,
        false,
        "ExpressionObjectKey",
        Visit.key(scope, node.key, {computed:node.computed}),
        (key_box) => (
          _key_box = key_box,
          Scope.makeOpenExpression(scope, key_box))),
      Visit.closure(
        scope,
        node.value,
        {
          sort: node.method ? "method" : null,
          name: _key_box,
          super: context.super})] :
    // console.assert(!node.method)
    [
      Visit.key(scope, node.key, {computed:node.computed}),
      Visit.expression(scope, node.value, null)]));

visitors.ObjectExpression = (scope, node, context) => (
  (
    (closure) => (
      ArrayLite.some(node.properties, is_super_property_node) ?
      Scope.makeBoxExpression(
        scope,
        false,
        "ExpressionObjectSuper",
        Intrinsic.makeObjectExpression(
          Tree.PrimitiveExpression(null),
          [
            [
              Tree.PrimitiveExpression("constructor"),
              Tree.PrimitiveExpression(null)],
            [
              Tree.PrimitiveExpression("prototype"),
              Tree.PrimitiveExpression(null)]]),
        (super_box) => Tree.SequenceExpression(
          Intrinsic.makeSetExpression(
            Scope.makeOpenExpression(scope, super_box),
            Tree.PrimitiveExpression("prototype"),
            closure(super_box),
            null,
            false,
            Intrinsic.SUCCESS_RESULT),
          Intrinsic.makeGetExpression(
            Scope.makeOpenExpression(scope, super_box),
            Tree.PrimitiveExpression("prototype"),
            null))) :
      closure(null)))
  (
    (super_nullable_box, _prototype_box) => (
      !ArrayLite.every(node.properties, is_simple_property_node) ?
      // General Case //
      ArrayLite.reduce(
        node.properties,
        (expression, node) => Visit.property(
          scope,
          node,
          {
            target: expression,
            super: super_nullable_box}),
        Intrinsic.makeObjectExpression(
          Intrinsic.makeGrabExpression("Object.prototype"),
          [])) :
      (
        ArrayLite.some(node.properties, is_proto_property_node) ?
        (
          is_proto_property_node(node.properties[0]) ?
          // Special Case #1 //
          Intrinsic.makeObjectExpression(
            Visit.proto_property(scope, node.properties[0], null),
            ArrayLite.map(
              ArrayLite.slice(node.properties, 1, node.properties.length),
              (node) => Visit._regular_property(scope, node, {super:super_nullable_box}))) :
          (
            is_proto_property_node(node.properties[node.properties.length - 1]) ?
            // Special Case #2 //
            Intrinsic.makeSetPrototypeOfExpression(
              Intrinsic.makeObjectExpression(
                Tree.PrimitiveExpression(null),
                ArrayLite.map(
                  ArrayLite.slice(node.properties, 0, node.properties.length - 1),
                  (node) => Visit._regular_property(scope, node, {super:super_nullable_box}))),
              Visit.proto_property(scope, node.properties[node.properties.length - 1], null),
              true,
              Intrinsic.TARGET_RESULT) :
            // Special Case #3 //
            Intrinsic.makeSetPrototypeOfExpression(
              Intrinsic.makeObjectExpression(
                Tree.PrimitiveExpression(null),
                ArrayLite.flatMap(
                  node.properties,
                  (node, index, nodes, _expression, _pair) => (
                    is_proto_property_node(node) ?
                    [] :
                    [
                      (
                        (
                          index > 0 &&
                          is_proto_property_node(nodes[index - 1])) ?
                        (
                          _expression = Visit.proto_property(scope, nodes[index - 1], null),
                          _pair = Visit._regular_property(scope, node, {super:super_nullable_box}),
                          [
                            _pair[0],
                            Scope.makeBoxExpression(
                              scope,
                              false,
                              "ExpressionObjectCookedPrototype",
                              _expression,
                              (box) => (
                                _prototype_box = box,
                                _pair[1]))]) :
                        Visit._regular_property(scope, node, {super:super_nullable_box}))]))),
              Scope.makeOpenExpression(scope, _prototype_box),
              true,
              Intrinsic.TARGET_RESULT))) :
        // Special Case #4 //
        Intrinsic.makeObjectExpression(
          Intrinsic.makeGrabExpression("Object.prototype"),
          ArrayLite.map(
            node.properties,
            (node) => Visit._regular_property(scope, node, {super:super_nullable_box})))))));

/////////////////
// Combination //
/////////////////

visitors.ArrayExpression = (scope, node, context) => (
  ArrayLite.every(
    node.elements,
    (element) => (
      element !== null &&
      element.type !== "SpreadElement")) ?
  Intrinsic.makeArrayExpression(
    ArrayLite.map(
      node.elements,
      (element) => Visit.expression(scope, element, null))) :
  Intrinsic.makeConcatExpression(
    ArrayLite.map(
      node.elements,
      (node) => (
        node === null ?
        // Array(1) does not work because of Array.prototype and Object.prototype pollution:
        // Array.prototype[0] = "foo";
        // Array.prototype[1] = "bar";
        // console.log([, , , ].indexOf("foo"));
        // console.log([, , , ].indexOf("bar"));
        Intrinsic.makeObjectExpression(
          Tree.PrimitiveExpression(null),
          [
            [
              Tree.PrimitiveExpression("length"),
              Tree.PrimitiveExpression(1)],
            [
              Intrinsic.makeGrabExpression("Symbol.isConcatSpreadable"),
              Tree.PrimitiveExpression(true)]]) :
        Visit.spreadable(scope, node, null)))));

visitors.ImportExpression = (scope, node, context) => Tree.RequireExpression(
  Visit.expression(scope, node.source, null));

visitors.UnaryExpression = (scope, node, context) => (
  (
    node.operator === "typeof" &&
    node.argument.type === "Identifier") ?
  Scope.makeTypeofExpression(scope, node.argument.name) :
  (
    node.operator === "delete" ?
    (
      node.argument.type === "MemberExpression" ?
      Intrinsic.makeDeletePropertyExpression(
        Scope.makeBoxExpression(
          scope,
          false,
          "OtherDeleteObject",
          Visit.expression(scope, node.argument.object, null),
          (box) => Intrinsic.makeNullishExpression(
            () => Scope.makeOpenExpression(scope, box),
            null,
            null)),
        Visit.key(scope, node.argument.property, {computed:node.argument.computed}),
        Scope.isStrict(scope),
        Intrinsic.SUCCESS_RESULT) :
      (
        node.argument.type === "Identifier" ?
        Scope.makeDeleteExpression(scope, node.argument.name) :
        Tree.SequenceExpression(
          Visit.expression(
            scope,
            node.argument,
            {dropped: true}),
          Tree.PrimitiveExpression(true)))) :
    Tree.UnaryExpression(
      node.operator,
      Visit.expression(scope, node.argument, null))));

visitors.BinaryExpression = (scope, node, context) => Tree.BinaryExpression(
  node.operator,
  Visit.expression(scope, node.left, null),
  Visit.expression(scope, node.right, null));

// visitors.AwaitExpression = (scope, node, context, kontinuation) => Visit.expression(
//   scope,
//   node.argument,
//   null,
//   (scope, expression) => Scope.makeBoxStatement(
//     scope,
//     false,
//     "await1",
//     (scope, box) => Scope.makeBoxExpression(
//       scope,
//       false,
//       "await2",
//       Tree.ConditionalExpression(
//         Tree.ConditionalExpression(
//           Tree.ConditionalExpression(
//             Tree.BinaryExpression(
//               "===",
//               Tree.UnaryExpression(
//                 "typeof",
//                 Scope.makeOpenExpression(scope, box)),
//               Tree.PrimitiveExpression("object")),
//             Scope.makeOpenExpression(scope, box),
//             Tree.BinaryExpression(
//               "===",
//               Tree.UnaryExpression(
//                 "typeof",
//                 Scope.makeOpenExpression(scope, box)),
//               Tree.PrimitiveExpression("function"))),
//           Intrinsic.makeHasExpression(
//             Scope.makeOpenExpression(scope, box),
//             Tree.PrimitiveExpression("then")),
//           Tree.PrimitiveExpression(false)),
//         Scope.makeOpenExpression(scope, box),
//         Tree.ApplyExpression(
//           Instrinsic.grab("Promise.resolve"),
//           Tree.PrimitiveExpression(void 0),
//           [
//             Scope.makeOpenExpression(scope, box)])),
//       (box) => Tree.ApplyExpression(
//         Intrinsic.makeGetExpression(
//           Scope.makeOpenExpression(scope, box),
//           Tree.PrimitiveExpression("then"),
//           null),
//         Scope.makeOpenExpression(scope, box),
//         Tree.arrow(
//           Scope.makeNormalBlock(
//             [],
//             [],
//             (scope) => kontinuation(
//               scope,
//               Intrinsic.makeGetExpression(
//                 Scope.parameter(scope, "arguments"),
//                 Tree.PrimitiveExpression(0),
//                 null))))))));
// 
// visitors.Literal = (scope, node, context, kontinuation) => kontinue(
//   scope,
//   kontinuation,
//   Tree.PrimitiveExpression(node.value));
// 
// visitors.UnaryExpression = (scope, node, context, kontinuation) => Visit.expression(
//   scope,
//   node.left,
//   null,
//   (scope, box) => kontinue(
//     scope,
//     kontinuation,
//     Tree.UnaryExpression(
//       node.operator,
//       Scope.makeOpenExpression(scope, box))));
// 
// visitors.BinaryExpression = (scope, node, context, kontinuation) => Visit.expression(
//   scope,
//   node.left,
//   null,
//   (scope, expression1) => Visit.expression(
//     scope,
//     node.right,
//     null,
//     (scope, expression2) => kontinue(
//       scope,
//       kontinuation,
//       Tree.BinaryExpression(expression1, expression2))));
// 
// const kontinue = (scope, kontinuation, expression) => (
//   Scope._is_async(scope) ?
//   Scope.makeBoxExpression(
//     scope,
//     false,
//     "async",
//     expression,
//     (box) => kontinuation(
//       scope,
//       Scope.makeOpenExpression(scope, box))) :
//   kontinuation(scope, box));

visitors.MemberExpression = (scope, node, context) => Visit.member(
  scope,
  node,
  {
    // we can safely drop the secon expression because it  comes from
    // Scope.makeOpenExpression(scope, box) which should not have any side effect
    kontinuation: identity});

visitors.ChainExpression = (scope, node, context) => Visit.expression(scope, node.expression, null)

visitors.NewExpression = (scope, node, context) => (
  ArrayLite.some(node.arguments, is_spread_element_node) ?
  Intrinsic.makeConstructExpression(
    Visit.expression(scope, node.callee, null),
    Intrinsic.makeConcatExpression(
      ArrayLite.map(
        node.arguments,
        (node) => Visit.spreadable(scope, node, null))),
    null) :
  Tree.ConstructExpression(
    Visit.expression(scope, node.callee, null),
    ArrayLite.map(
      node.arguments,
      (argument) => Visit.expression(scope, argument, null))));

// Eval with spread element is not direct:
//
// > var x = "foo";
// undefined
// > function f () { var x = "bar"; return eval(...["x"])}
// undefined
// > f()
// 'foo'
//
// Eval with optional chaining is direct (not for firefox 81.0.2 though):
//
// > function yo (foo) { return eval?.("foo") }
// > yo(123)
// 123
//
// Super return value is this:
//
// {
//   class C {
//     constructor () {
//       return {__proto__:null, foo:123};
//     }
//   }
//   class D extends C {
//     constructor () {
//       console.log(super() === this);
//     }
//   }
//   new D();
// }

visitors.CallExpression = (scope, node, context, _closure1, _closure2) => (
  (
    node.callee.type === "Identifier" &&
    node.callee.name === "eval") ?
  Scope.makeBoxExpression(
    scope,
    false,
    "ExpressionCallEvalCallee",
    Visit.expression(scope, node.callee, null),
    (box, _expression) => (
      _expression = ArrayLite.mapReduce(
        node.arguments,
        (next, argument) => Scope.makeBoxExpression( // console.assert(argument.type !== "SpreadElement")
          scope,
          false,
          "ExpressionCallEvalArgument",
          (
            ArrayLite.some(node.arguments, is_spread_element_node) ?
            Visit.spreadable(scope, argument, null) :
            Visit.expression(scope, argument, null)),
          next),
        (boxes) => Tree.ConditionalExpression(
          Tree.BinaryExpression(
            "===",
            Scope.makeOpenExpression(scope, box),
            Intrinsic.makeGrabExpression("eval")),
          Scope.makeEvalExpression(
            scope,
            (
              ArrayLite.some(node.arguments, is_spread_element_node) ?
              Intrinsic.makeGetExpression(
                Intrinsic.makeConcatExpression(
                  ArrayLite.map(
                    boxes,
                    (box) => Scope.makeOpenExpression(scope, box))),
                Tree.PrimitiveExpression(0),
                null) :
              (
                boxes.length === 0 ?
                // https://www.ecma-international.org/ecma-262/#sec-eval-x
                // if the first argument is not a string, return the first argument
                Tree.PrimitiveExpression(void 0) :
                Scope.makeOpenExpression(scope, boxes[0])))),
          (
            ArrayLite.some(node.arguments, is_spread_element_node) ?
            Intrinsic.makeApplyExpression(
              Scope.makeOpenExpression(scope, box),
              Tree.PrimitiveExpression(void 0),
              Intrinsic.makeConcatExpression(
                ArrayLite.map(
                  boxes,
                  (box) => Scope.makeOpenExpression(scope, box)))) :
            Tree.ApplyExpression(
              Scope.makeOpenExpression(scope, box),
              Tree.PrimitiveExpression(void 0),
              ArrayLite.map(
                boxes,
                (box) => Scope.makeOpenExpression(scope, box)))))),
      (
        node.optional ?
        Intrinsic.makeNullishExpression(
          () => Scope.makeOpenExpression(scope, box),
          Tree.PrimitiveExpression(void 0),
          _expression) :
        _expression))) :
  (
    // We do not need to check for node.callee.type === "ChainExpression" because:
    // require("acorn").parse(`(123).?456(789)`).body[0].type === "ChainExpression")
    _closure1 = (expression, callback) => (
      node.optional ?
      Scope.makeBoxExpression(
        scope,
        false,
        "ExpressionCallOptionalCallee",
        expression,
        (callee_box) => Intrinsic.makeNullishExpression(
          () => Scope.makeOpenExpression(scope, callee_box),
          Tree.PrimitiveExpression(void 0),
          callback(
            Scope.makeOpenExpression(scope, callee_box)))) :
      callback(expression)),
    _closure2 = (callback1, callback2) => (
      ArrayLite.some(node.arguments, is_spread_element_node) ?
      callback2(
        Intrinsic.makeConcatExpression(
          ArrayLite.map(
            node.arguments,
            (node) => Visit.spreadable(scope, node, null)))) :
      callback1(
        ArrayLite.map(
          node.arguments,
          (node) => Visit.expression(scope, node, null)))),
    (
      node.callee.type === "Super" ?
      // super.?(123) is invalid
      // console.assert(node.optional === false)
      Scope.makeSuperCallExpression(
        scope,
        _closure2(
          (expressions) => Intrinsic.makeArrayExpression(expressions),
          identity)) :
      (
        node.callee.type === "MemberExpression" ?
        Visit.member(
          scope,
          node.callee,
          {
            kontinuation: (expression1, expression2) => _closure2(
              (expressions) => _closure1(
                expression1,
                (expression1) => Tree.ApplyExpression(
                  expression1,
                  expression2,
                  expressions)),
              (expression) => _closure1(
                expression1,
                (expression1) => Intrinsic.makeApplyExpression(
                  expression1,
                  expression2,
                  expression)))}) :
        _closure1(
          Visit.expression(scope, node.callee, null),
          (expression1) => _closure2(
            (expressions) => Tree.ApplyExpression(
              expression1,
              Tree.PrimitiveExpression(void 0),
              expressions),
            (expression2) => Intrinsic.makeApplyExpression(
              expression1,
              Tree.PrimitiveExpression(void 0),
              expression2)))))));
