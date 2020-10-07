"use strict";

const global_RegExp = global.RegExp;
const global_Reflect_apply = global.Reflect.apply;
const global_String_prototype_substring = global.String.prototype.substring;
const global_Array = global.Array;
const global_Error = global.Error;

const ArrayLite = require("array-lite");
const Tree = require("../tree.js");
const Scope = require("../scope/index.js");
const Builtin = require("../builtin.js");
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

visitors.YieldExpression = (scope, node, context) => { throw new global_Error("Unfortunately, Aran does not yet support generator closures and yield expressions.") };

visitors.AwaitExpression = (scope, node, context) => { throw new global_Error("Unfortunately, Aran does not yet support asynchronous closures and await expressions.") };

visitors.ImportExpression = (scope, node, context) => { throw new global_Error("Unfortunately, Aran does not yet support native modules and import expressions.")}

/////////////
// Literal //
/////////////

visitors.Literal = (scope, node, dropped, box) => (
  node.value instanceof global_RegExp ?
  Builtin.construct_regexp(node.regex.pattern, node.regex.flags) :
  Tree.primitive(node.value));

visitors.TemplateLiteral = (scope, node, context) => (
  node.expressions.length === 0 ?
  Tree.primitive(node.quasis[0].value.cooked) :
  Tree.binary(
    "+",
    ArrayLite.reduce(
      global_Array(node.expressions.length - 1),
      (expression, _, index) => Tree.binary(
        "+",
        expression,
        Tree.binary(
          "+",
          Tree.primitive(node.quasis[index + 1].value.cooked),
          Expression.visit(scope, node.expressions[index + 1], false, null))),
      Tree.binary(
        "+",
        Tree.primitive(node.quasis[0].value.cooked),
        Expression.visit(scope, node.expressions[0], false, null))),
    Tree.primitive(node.quasis[node.quasis.length - 1].value.cooked)));

// Tagged template cannot lead to a direct eval call because it receives an array instead of a string:
// cf: https://www.ecma-international.org/ecma-262/10.0/index.html#sec-performeval
visitors.TaggedTemplateExpression = (scope, node, context) => Scope.box(
  scope,
  "TaggedTemplateExpressionObject",
  false,
  (
    node.tag.type === "MemberExpression" ?
    Expression.visit(scope, node.tag.object, Expression._default_context) :
    Tree.primitive(void 0)),
  (this_box) => Tree.apply(
    (
      // Optional chaining cannot appear in the tag of tagged template expressions
      node.tag.type === "MemberExpression" ?
      Builtin.get(
        Builtin.fork_nullish(
          () => Scope.get(scope, this_box),
          null,
          null),
        (
          node.tag.computed ?
          Expression.visit(scope, node.tag.property, Expression._default_context) :
          Tree.primitive(node.tag.property.name)),
        null) :
      Expression.visit(scope, node.tag, Expression._default_context)),
    Scope.get(scope, this_box),
    ArrayLite.concat(
      [
        Builtin.freeze(
          Builtin.define_property(
            Builtin.construct_array(
              ArrayLite.map(
                node.quasi.quasis,
                (quasi) => Tree.primitive(quasi.value.cooked))),
            Tree.primitive("raw"),
            {
              __proto__: null,
              value: Builtin.freeze(
                Builtin.construct_array(
                  ArrayLite.map(
                    node.quasi.quasis,
                    (quasi) => Tree.primitive(quasi.value.raw))),
                true,
                Builtin._target_result)},
            true,
            Builtin._target_result),
          true,
          Builtin._target_result)],
      ArrayLite.map(
        node.quasi.expressions,
        (expression) => Expression.visit(scope, expression, false, null)))));

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

visitors.ClassExpression = (scope, node, context) => Common.class(
  scope,
  node,
  context.name);

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
    Builtin.set(
      Expression.visit(scope, node.left.object, Expression._default_context),
      (
        node.left.computed ?
        Expression.visit(scope, node.left.property, Expression._default_context) :
        Tree.primitive(node.left.property.name)),
      Expression.visit(scope, node.right, Expression._default_context),
      null,
      true,
      Builtin._success_result) :
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
        Builtin.set(
          Builtin.fork_nullish(
            () => Scope.get(scope, object_box),
            null,
            null),
          (
            node.left.computed ?
            Expression.visit(scope, node.left.property, Expression._default_context) :
            Tree.primitive(node.left.property.name)),
          Expression.visit(scope, node.right, Expression._default_context),
          null,
          false,
          Builtin._success_result) :
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
                Builtin.get(
                  Builtin.fork_nullish(
                    () => Scope.get(scope, object_box),
                    null,
                    null),
                  Scope.get(scope, key_box),
                  null),
                Expression.visit(scope, node.right, Expression._default_context))),
            (
              context.dropped ?
              // MemberExpression >> Special Case #1 >> (dropped && +=)
              Builtin.set(
                (
                  Scope._is_strict(scope) ?
                  Scope.get(scope, object_box) :
                  Builtin.fork_nullish(
                    () => Scope.get(scope, object_box),
                    null,
                    null)),
                Scope.get(scope, key_box),
                _expression,
                null,
                Scope._is_strict(scope),
                Builtin._success_result) :
              // MemberExpression >> General Case
              Scope.box(
                scope,
                "ExpressionAssignmentMemberValue",
                false,
                _expression,
                (value_box) => Builtin.set(
                  (
                    Scope._is_strict(scope) ?
                    Scope.get(scope, object_box) :
                    Builtin.fork_nullish(
                      () => Scope.get(scope, object_box),
                      null,
                      null)),
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
visitors.UpdateExpression = (scope, node, context) => (
  node.argument.type === "MemberExpression" ?
  Scope.box(
    scope,
    "ExpressionUpdateMemberObject",
    false,
    Expression.visit(scope, node.argument.object, Expression._default_context),
    (object_box) => Scope.box(
      scope,
      "ExpressionUpdateMemberKey",
      false,
      // toString is called twice:
      // =========================
      // ({__proto__:null, foo:"bar"})[{__proto__: null, toString: () => (console.log("toString"), "foo")}]++
      // toString
      // toString
      // NaN
      (
        node.argument.computed ?
        Expression.visit(scope, node.argument.property, Expression._default_context) :
        Tree.primitive(node.argument.property.name)),
      (key_box) => (
        context.dropped ?
        Builtin.set(
          (
            Scope._is_strict(scope) ?
            Scope.get(scope, object_box) :
            Builtin.fork_nullish(
              () => Scope.get(scope, object_box),
              null,
              null)),
          Scope.get(scope, key_box),
          Tree.binary(
            node.operator[0],
            Builtin.get(
              Builtin.fork_nullish(
                () => Scope.get(scope, object_box),
                null,
                null),
              Scope.get(scope, key_box),
              null),
            Tree.primitive(1)),
          null,
          Scope._is_strict(scope),
          Builtin._success_result) :
        Scope.box(
          scope,
          "ExpressionUpdateMemberResult",
          false,
          (
            node.prefix ?
            Tree.binary(
              node.operator[0],
              Builtin.get(
                Builtin.fork_nullish(
                  () => Scope.get(scope, object_box),
                  null,
                  null),
                Scope.get(scope, key_box),
                null),
              Tree.primitive(1)) :
            Builtin.get(
              Builtin.fork_nullish(
                () => Scope.get(scope, object_box),
                null,
                null),
              Scope.get(scope, key_box),
              null)),
          (result_box) => Builtin.set(
            (
              Scope._is_strict(scope) ?
              Scope.get(scope, object_box) :
              Builtin.fork_nullish(
                () => Scope.get(scope, object_box),
                null,
                null)),
            Scope.get(scope, key_box),
            (
              node.prefix ?
              Scope.get(scope, result_box) :
              Tree.binary(
                node.operator[0],
                Scope.get(scope, result_box),
                Tree.primitive(1))),
            null,
            Scope._is_strict(scope),
            Scope.get(scope, result_box)))))) :
  ( // console.assert(node.argument.type === "Identifier")
    context.dropped ?
    Scope.write(
      scope,
      node.argument.name,
      Tree.binary(
        node.operator[0],
        Scope.read(scope, node.argument.name),
        Tree.primitive(1))) :
    Scope.box(
      scope,
      "ExpressionUpdateIdentifierResult",
      false,
      (
        node.prefix ?
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
            node.prefix ?
            Scope.get(scope, box) :
            Tree.binary(
              node.operator[0],
              Scope.get(scope, box),
              Tree.primitive(1)))),
        Scope.get(scope, box)))));

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
  (expression, node) => Tree.sequence(
    Expression.visit(
      scope,
      node,
      {
        __proto__: Expression._default_context,
        dropped: true}),
    expression),
  Expression.visit(
    scope,
    node.expressions[node.expressions.length - 1],
    {
      __proto__: Expression._default_context,
      dropped: context.dropped})),

visitors.LogicalExpression = (scope, node, context) => (
  (
    node.operator !== "??" &&
    context.dropped) ?
  Tree.conditional(
    Expression.visit(scope, node.left, Expression._default_context),
    (
      node.operator === "&&" ?
      Expression.visit(
        scope,
        node.right,
        {
          __proto__: Expression._default_context,
          dropped: true}) :
      Tree.primitive(void 0)),
    (
      node.operator === "||" ?
      Expression.visit(
        scope,
        node.right,
        {
          __proto__: Expression._default_context,
          dropped: true}) :
      Tree.primitive(void 0))) :
  Scope.box(
    scope,
    "ExpressionLogicalLeft",
    false,
    Expression.visit(scope, node.left, Expression._default_context),
    (box) => (
      node.operator === "??" ?
      Tree.conditional(
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
        Expression.visit(
          scope,
          node.right,
          {
            __proto__: Expression._default_context,
            dropped: context.dropped}),
        (
          context.dropped ?
          Tree.primitive(void 0) :
          Scope.get(scope, box))) :
      Tree.conditional( // console.assert(!context.dropped)
        Scope.get(scope, box),
        (
          node.operator === "&&" ?
          Expression.visit(scope, node.right, Expression._default_context) :
          Scope.get(scope, box)),
        (
          node.operator === "||" ?
          Expression.visit(scope, node.right, Expression._default_context) :
          Scope.get(scope, box))))));

visitors.ConditionalExpression = (scope, node, context) => Tree.conditional(
  Expression.visit(scope, node.test, Expression._default_context),
  Expression.visit(
    scope,
    node.consequent,
    {
      __proto__: Expression._default_context,
      dropped: context.dropped}),
  Expression.visit(
    scope,
    node.alternate,
    {
      __proto__: Expression._default_context,
      dropped: context.dropped}));

/////////////////
// Combination //
/////////////////

visitors.ArrayExpression = (scope, node, dropped, box) => (
  ArrayLite.every(
    node.elements,
    (element) => (
      element !== null &&
      element.type !== "SpreadElement")) ?
  Builtin.construct_array(
    ArrayLite.map(
      node.elements,
      (element) => Expression.visit(scope, element, Expression._default_context))) :
  Builtin.concat(
    ArrayLite.map(
      node.elements,
      (element) => (
        element === null ?
        Builtin.construct_empty_array(1) :
        (
          element.type === "SpreadElement" ?
          Expression.visit(scope, element.argument, Expression._default_context) :
          Builtin.construct_array(
            [
              Expression.visit(scope, element, Expression._default_context)]))))));

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

visitors.ObjectExpression = (scope, node, context) => (
  node.properties.length === 0 ?
  Builtin.construct_object(
    Builtin.grab("Object.prototype"),
    []) :
  (
    (
      ArrayLite.every(
        ArrayLite.slice(node.properties, 1, node.properties.length),
        Query._is_not_proto_property) &&
      ArrayLite.every(
        node.properties,
        Query._is_not_spread_property)) ?
    Scope.box(
      scope,
      "ExpressionObjectOptimizedPrototype",
      false,
      (
        Query._is_proto_property(node.properties[0]) ?
        Expression.visit(scope, node.properties[0].value, Expression._default_context) :
        Builtin.grab("Object.prototype")),
      (prototype_box) => Builtin.construct_object(
        Scope.get(scope, prototype_box),
        ArrayLite.map(
          (
            Query._is_proto_property(node.properties[0]) ?
            ArrayLite.slice(node.properties, 1, node.properties.length) :
            node.properties),
          (property, _key_box) => [
            Scope.box(
              scope,
              "ExpressionObjectOptimizedKey",
              false,
              (
                property.computed ?
                Expression.visit(scope, property.key, Expression._default_context) :
                Tree.primitive(
                  (
                    property.key.type === "Identifier" ?
                    property.key.name :
                    property.key.value))),
              (key_box) => (
                _key_box = key_box,
                Scope.get(scope, key_box))),
            {
              __proto__: null,
              [property.kind === "init" ? "value" : property.kind]: Expression.visit(
                scope,
                property.value,
                {
                  __proto__: Expression._default_context,
                  completion: (
                    property.method ?
                    Completion._method :
                    (
                      property.kind === "init" ?
                      null :
                      Completion._accessor)),
                  name: _key_box,
                  super: prototype_box}),
              [property.kind === "init" ? "writable" : "foobar"]: true,
              enumerable: true,
              configurable: true}]))) :
    Scope.box(
      scope,
      "ExpressionObjectUnoptimizedPrototype",
      true,
      Builtin.grab("Object.prototype"),
      (prototype_box) => ArrayLite.reduce(
        node.properties,
        (expression, property) => (
          property.type === "SpreadElement" ?
          Builtin.assign(
            expression,
            [
              Expression.visit(scope, property.argument, Expression._default_context)],
            true,
            Builtin._target_result) :
          (
            Query._is_proto_property(property) ?
            Builtin.set_prototype_of(
              expression,
              Tree.sequence(
                Scope.set(
                  scope,
                  prototype_box,
                  Expression.visit(scope, property.value, Expression._default_context)),
                Scope.get(scope, prototype_box)),
              true,
              Builtin._target_result) :
            Scope.box(
              scope,
              "MemberObjectUnoptimizedKey",
              false,
              (
                property.computed ?
                Expression.visit(scope, property.key, Expression._default_context) :
                Tree.primitive(
                  (
                    property.key.type === "Identifier" ?
                    property.key.name :
                    property.key.value))),
              (key_box) => Builtin.define_property(
                expression,
                Scope.get(scope, key_box),
                {
                  __proto__: null,
                  [property.kind === "init" ? "value" : property.kind]: Expression.visit(
                    scope,
                    property.value,
                    {
                      __proto__: Expression._default_context,
                      completion: (
                        property.method ?
                        Completion._method :
                        (
                          property.kind === "init" ?
                          null :
                          Completion._accessor)),
                      name: key_box,
                      super: prototype_box}),
                  [property.kind === "init" ? "writable" : "foobar"]: true,
                  enumerable: true,
                  configurable: true},
                true,
                Builtin._target_result)))),
        Builtin.construct_object(
          Scope.get(scope, prototype_box),
          [])))));


visitors.UnaryExpression = (scope, node, context) => (
  (
    node.operator === "typeof" &&
    node.argument.type === "Identifier") ?
  Scope.typeof(scope, node.argument.name) :
  (
    node.operator === "delete" ?
    (
      node.argument.type === "MemberExpression" ?
      Builtin.delete_property(
        Scope.box(
          scope,
          "ExpressionUnaryDeleteObject",
          false,
          Expression.visit(scope, node.argument.object, Expression._default_context),
          (box) => Builtin.fork_nullish(
            () => Scope.get(scope, box),
            null,
            null)),
        (
          node.argument.computed ?
          Expression.visit(scope, node.argument.property, Expression._default_context) :
          Tree.primitive(node.argument.property.name)),
        Scope._is_strict(scope),
        Builtin._success_result) :
      (
        node.argument.type === "Identifier" ?
        Scope.delete(scope, node.argument.name) :
        Tree.sequence(
          Expression.visit(
            scope,
            node.argument,
            {
              __proto__: Expression._default_context,
              dropped: true}),
          Tree.primitive(true)))) :
    Tree.unary(
      node.operator,
      Expression.visit(scope, node.argument, Expression._default_context))));

visitors.BinaryExpression = (scope, node, context) => Tree.binary(
  node.operator,
  Expression.visit(scope, node.left, Expression._default_context),
  Expression.visit(scope, node.right, Expression._default_context));

visitors.MemberExpression = (scope, node, context) => Scope.box(
  scope,
  "ExpressionMemberObject",
  false,
  Expression.visit(scope, node.object, Expression._default_context),
  (box) => (
    node.optional ?
    Builtin.fork_nullish(
      () => Scope.get(scope, box),
      Tree.primitive(void 0),
      Builtin.get(
        Builtin.convert_to_object(
          Scope.get(scope, box)),
        (
          node.computed ?
          Expression.visit(scope, node.property, Expression._default_context) :
          Tree.primitive(node.property.name)),
        null)) :
    Builtin.get(
      Builtin.fork_nullish(
        () => Scope.get(scope, box),
        null,
        null),
      (
        node.computed ?
        Expression.visit(scope, node.property, Expression._default_context) :
        Tree.primitive(node.property.name)),
      null)));

visitors.ChainExpression = (scope, node, context) => Expression.visit(scope, node.expression, Expression._default_context)

visitors.NewExpression = (scope, node, context) => (
  ArrayLite.every(node.arguments, Query._is_not_spread_argument) ?
  Tree.construct(
    Expression.visit(scope, node.callee, Expression._default_context),
    ArrayLite.map(
      node.arguments,
      (argument) => Expression.visit(scope, argument, Expression._default_context))) :
  Builtin.construct(
    Expression.visit(scope, node.callee, Expression._default_context),
    Builtin.concat(
      ArrayLite.map(
        node.arguments,
        (argument) => (
          Query._is_spread_argument(argument) ?
          Expression.visit(scope, argument.argument, Expression._default_context) :
          Builtin.construct_array(
            [
              Expression.visit(scope, argument, Expression._default_context)])))),
    null));

// Eval with spread element is not direct:
//
// > var x = "foo";
// undefined
// > function f () { var x = "bar"; return eval(...["x"])}
// undefined
// > f()
// 'foo'
//
// Eval with optional chaining is direct:
//
// > function yo (foo) { return eval?.("foo") }
// > yo(123)
// 123
//
visitors.CallExpression = (scope, node, dropped, box) => (
  Query._is_direct_eval_call(node) ?
  Scope.box(
    scope,
    "ExpressionCallEvalCallee",
    false,
    Scope.read(scope, "eval"),
    (box, _expression) => (
      _expression = ArrayLite.mapReduce(
        node.arguments,
        (next, argument) => Scope.box( // console.assert(argument.type !== "SpreadElement")
          scope,
          "ExpressionCallEvalArgument",
          false,
          Expression.visit(scope, argument, false, null),
          next),
        (boxes) => Tree.conditional(
          Tree.binary(
            "===",
            Scope.get(scope, box),
            Builtin.grab("eval")),
          Scope.eval(
            scope,
            Scope.get(scope, boxes[0])),
          Tree.apply(
            Scope.get(scope, box),
            Tree.primitive(void 0),
            ArrayLite.map(
              boxes,
              (box) => Scope.get(scope, box))))),
      (
        node.optional ?
        Builtin.fork_nullish(
          () => Scope.get(scope, box),
          Tree.primitive(void 0),
          _expression) :
        _expression))) :
  Scope.box(
    scope,
    "ExpressionCallThis",
    false,
    (
      node.callee.type === "MemberExpression" ?
      Expression.visit(scope, node.callee.object, Expression._default_context) :
      Tree.primitive(void 0)),
    (this_box, _expression, _closure) => (
      _expression = (
        node.callee.type === "MemberExpression" ?
        (
          node.callee.optional ?
          Builtin.fork_nullish(
            () => Scope.get(scope, this_box),
            Tree.primitive(void 0),
            Builtin.get(
              Builtin.convert_to_object(
                Scope.get(scope, this_box)),
              (
                node.callee.computed ?
                Expression.visit(scope, node.callee.property, Expression._default_context) :
                Tree.primitive(node.callee.property.name)),
              null)) :
          Builtin.get(
            Builtin.fork_nullish(
              () => Scope.get(scope, this_box),
              null,
              null),
            (
              node.callee.computed ?
              Expression.visit(scope, node.callee.property, Expression._default_context) :
              Tree.primitive(node.callee.property.name)),
            null)) :
        Expression.visit(scope, node.callee, Expression._default_context)),
      _closure = (expression) => (
        ArrayLite.some(node.arguments, Query._is_spread_argument) ?
        Builtin.apply(
          expression,
          Scope.get(scope, this_box),
          Builtin.concat(
            ArrayLite.map(
              node.arguments,
              (argument) => (
                argument.type === "SpreadElement" ?
                Expression.visit(scope, argument.argument, Expression._default_context) :
                Builtin.construct_array(
                  [
                    Expression.visit(scope, argument, Expression._default_context)]))))) :
        Tree.apply(
          expression,
          Scope.get(scope, this_box),
          ArrayLite.map(
            node.arguments,
            (argument) => Expression.visit(scope, argument, Expression._default_context)))), // console.assert(arguments.type !== "SpreadElement")
      (
        node.optional ?
        Scope.box(
          scope,
          "ExpressionCallOptionalCallee",
          false,
          _expression,
          (callee_box) => Builtin.fork_nullish(
            () => Scope.get(scope, callee_box),
            Tree.primitive(void 0),
            _closure(
              Scope.get(scope, callee_box)))) :
        _closure(_expression)))));
