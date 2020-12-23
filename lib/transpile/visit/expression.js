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
  Visit.expression(scope, node.argument, null) :
  Intrinsic.construct_array(
    [
      Visit.expression(scope, node, null)]));

exports.super = (scope, node, context) => (
  Throw.assert(node.type === "Super", null, `Invalid super node`),
  context = global_Object_assign(
    {
      key: null,
      arguments: null},
    context),
  Scope.super(scope, context.key, context.arguments));

exports.member = (scope, node, context) => (
  Throw.assert(node.type === "MemberExpression", null, `Invalid member node`),
  context = global_Object_assign({kontinuation:null}, context),
  (
    node.object.type === "Super" ?
    context.kontinuation(
      Scope.super_member(
        scope,
        Visit.key(scope, node.property, null)),
      Scope.read(scope, "this")) :
    Scope.box(
      scope,
      false,
      "ExpressionMemberObject",
      Visit.expression(scope, node.object, null),
      (box) => context.kontinuation(
        (
          node.optional ?
          Intrinsic.fork_nullish(
            () => Scope.get(scope, box),
            Tree.primitive(void 0),
            Intrinsic.get(
              Intrinsic.convert_to_object(
                Scope.get(scope, box)),
              Visit.key(scope, node.property, {computed:node.computed}),
              null)) :
          Intrinsic.get(
            Intrinsic.fork_nullish(
              () => Scope.get(scope, box),
              null,
              null),
            Visit.key(scope, node.property, {computed:node.computed}),
            null)),
        Scope.get(scope, box)))));

const visitors = {__proto__:null};

/////////////////
// Unsupported //
/////////////////

visitors.YieldExpression = (scope, node, context) => Throw.abort(
  null,
  `yield expression should never be reached`);

visitors.AwaitExpression = (scope, node, context) => Throw.abort(
  null,
  `await expression should never be reached`);

/////////////
// Literal //
/////////////

visitors.Literal = (scope, node, context) => (
  node.value instanceof global_RegExp ?
  Intrinsic.construct_regexp(node.regex.pattern, node.regex.flags) :
  Tree.primitive(node.value));

exports.quasi = (scope, node, context) => (
  Throw.assert(node.type === "TemplateElement", null, `Invalid quasi node`),
  Tree.primitive(node.value.cooked));

visitors.TemplateLiteral = (scope, node, context) => (
  node.expressions.length === 0 ?
  Visit.quasi(scope, node.quasis[0], null) :
  Tree.binary(
    "+",
    ArrayLite.reduce(
      global_Array(node.expressions.length - 1),
      (expression, _, index) => Tree.binary(
        "+",
        expression,
        Tree.binary(
          "+",
          Visit.quasi(scope, node.quasis[index + 1], null),
          Visit.expression(scope, node.expressions[index + 1], null))),
      Tree.binary(
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
          kontinuation: (expression1, expression2) => Tree.apply(
            expression1,
            expression2,
            closure())}) :
      Tree.apply(
        Visit.expression(scope, node.tag, null),
        Tree.primitive(void 0),
        closure())))
  (
    () => ArrayLite.concat(
      [
        Intrinsic.freeze(
          Intrinsic.define_property(
            Intrinsic.construct_array(
              ArrayLite.map(
                node.quasi.quasis,
                (quasi) => Tree.primitive(quasi.value.cooked))),
            Tree.primitive("raw"),
            {
              __proto__: null,
              value: Intrinsic.freeze(
                Intrinsic.construct_array(
                  ArrayLite.map(
                    node.quasi.quasis,
                    (quasi) => Tree.primitive(quasi.value.raw))),
                true,
                Intrinsic._target_result)},
            true,
            Intrinsic._target_result),
          true,
          Intrinsic._target_result)],
      ArrayLite.map(
        node.quasi.expressions,
        (expression) => Visit.expression(scope, expression, null)))));

visitors.ArrowFunctionExpression = (scope, node, context) => Visit.closure(scope, node, null);

visitors.FunctionExpression = (scope, node, context) => Visit.closure(scope, node, null);

visitors.ClassExpression = (scope, node, context) => Visit.class(scope, node, null);

/////////////////
// Environment //
/////////////////

visitors.Identifier = (scope, node, context) => Scope.read(scope, node.name);

// // We can assume self is always a proper object
// visitors.Super = (scope, node, context) => ( // console.assert(Scope._get_binding_super_nullable_box(scope) !== null)
//   Scope._has_super(scope) ?
//   Tree.conditional(
//     Scope.read(scope, "this"),
//     Intrinsic.get_prototype_of(
//       Scope.get_self(scope)),
//     Intrinsic.throw_reference_error("Must call super constructor in derived class before accessing 'this' or returning from derived constructor")) :
//   Intrinsic.get_prototype_of(
//     Scope.get_self(scope)));

visitors.ThisExpression = (scope, node, context) => Scope.read(scope, "this");

// No point in supporting import.meta when modules are not supported
visitors.MetaProperty = (scope, node, dropped, box) => (
  (
    node.meta.name === "new" &&
    node.property.name === "target") ?
  Scope.read(scope, "new.target") :
  (
    (
      node.meta.name === "import" &&
      node.property.name === "meta") ?
    Scope.read(scope, "import.meta") :
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
      Scope._is_strict(scope)) ?
    // MemberExpression >> Special Case #1 >> (dropped && strict && =)
    Intrinsic.set(
      Visit.expression(scope, node.left.object, null),
      (
        node.left.computed ?
        Visit.expression(scope, node.left.property, null) :
        Tree.primitive(node.left.property.name)),
      Visit.expression(scope, node.right, null),
      null,
      true,
      Intrinsic._success_result) :
    Scope.box(
      scope,
      false,
      "ExpressionAssignmentMemberObject",
      Visit.expression(scope, node.left.object, null),
      (object_box) => (
        (
          node.operator === "=" &&
          context.dropped &&
          !Scope._is_strict(scope)) ? // this last `and` clause could go away but it is kept for readability
        // MemberExpression >> Special Case #1 >> (dropped && !strict && =)
        Intrinsic.set(
          Intrinsic.fork_nullish(
            () => Scope.get(scope, object_box),
            null,
            null),
          (
            node.left.computed ?
            Visit.expression(scope, node.left.property, null) :
            Tree.primitive(node.left.property.name)),
          Visit.expression(scope, node.right, null),
          null,
          false,
          Intrinsic._success_result) :
        Scope.box(
          scope,
          false,
          "ExpressionAssignmentMemberProperty",
          (
            node.left.computed ?
            Visit.expression(scope, node.left.property, null) :
            Tree.primitive(node.left.property.name)),
          (key_box) => (
            _expression = (
              node.operator === "=" ?
              Visit.expression(scope, node.right, null) :
              Tree.binary(
                global_Reflect_apply(
                  global_String_prototype_substring,
                  node.operator,
                  [0, node.operator.length - 1]),
                Intrinsic.get(
                  Intrinsic.fork_nullish(
                    () => Scope.get(scope, object_box),
                    null,
                    null),
                  Scope.get(scope, key_box),
                  null),
                Visit.expression(scope, node.right, null))),
            (
              context.dropped ?
              // MemberExpression >> Special Case #1 >> (dropped && +=)
              Intrinsic.set(
                (
                  Scope._is_strict(scope) ?
                  Scope.get(scope, object_box) :
                  Intrinsic.fork_nullish(
                    () => Scope.get(scope, object_box),
                    null,
                    null)),
                Scope.get(scope, key_box),
                _expression,
                null,
                Scope._is_strict(scope),
                Intrinsic._success_result) :
              // MemberExpression >> General Case
              Scope.box(
                scope,
                false,
                "ExpressionAssignmentMemberValue",
                _expression,
                (value_box) => Intrinsic.set(
                  (
                    Scope._is_strict(scope) ?
                    Scope.get(scope, object_box) :
                    Intrinsic.fork_nullish(
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
          false,
          "AssignmentExpressionIdentifierName",
          Tree.primitive(node.left.name),
          (name_box) => Visit.named(
            scope,
            node.right,
            {name: name_box})) :
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
          Visit.expression(scope, node.right, null))),
      (
        context.dropped ?
        Visit.pattern(
          scope,
          node.left,
          {
            kind: null,
            expression: _expression}) :
        Scope.box(
          scope,
          false,
          "ExpressionAssignmentIdentifierRight",
          _expression,
          (value_box) => Tree.sequence(
            Visit.pattern(
              scope,
              node.left,
              {
                kind: null,
                expression: Scope.get(scope, value_box)}),
            Scope.get(scope, value_box))))) :
    (
      context.dropped ?
      Visit.pattern(
        scope,
        node.left,
        {
          kind: null,
          expression: Visit.expression(scope, node.right, null)}) :
      Scope.box(
        scope,
        false,
        "ExpressionAssignmentPatternRight",
        Visit.expression(scope, node.right, null),
        (box) => Tree.sequence(
          Visit.pattern(
            scope,
            node.left,
            {
              kind: null,
              expression: Scope.get(scope, box)}),
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
    false,
    "ExpressionUpdateMemberObject",
    Visit.expression(scope, node.argument.object, null),
    (object_box) => Scope.box(
      scope,
      false,
      "ExpressionUpdateMemberKey",
      // toString is called twice:
      // =========================
      // ({__proto__:null, foo:"bar"})[{__proto__: null, toString: () => (console.log("toString"), "foo")}]++
      // toString
      // toString
      // NaN
      (
        node.argument.computed ?
        Visit.expression(scope, node.argument.property, null) :
        Tree.primitive(node.argument.property.name)),
      (key_box) => (
        context.dropped ?
        Intrinsic.set(
          (
            Scope._is_strict(scope) ?
            Scope.get(scope, object_box) :
            Intrinsic.fork_nullish(
              () => Scope.get(scope, object_box),
              null,
              null)),
          Scope.get(scope, key_box),
          Tree.binary(
            node.operator[0],
            Intrinsic.get(
              Intrinsic.fork_nullish(
                () => Scope.get(scope, object_box),
                null,
                null),
              Scope.get(scope, key_box),
              null),
            Tree.primitive(1)),
          null,
          Scope._is_strict(scope),
          Intrinsic._success_result) :
        Scope.box(
          scope,
          false,
          "ExpressionUpdateMemberResult",
          (
            node.prefix ?
            Tree.binary(
              node.operator[0],
              Intrinsic.get(
                Intrinsic.fork_nullish(
                  () => Scope.get(scope, object_box),
                  null,
                  null),
                Scope.get(scope, key_box),
                null),
              Tree.primitive(1)) :
            Intrinsic.get(
              Intrinsic.fork_nullish(
                () => Scope.get(scope, object_box),
                null,
                null),
              Scope.get(scope, key_box),
              null)),
          (result_box) => Intrinsic.set(
            (
              Scope._is_strict(scope) ?
              Scope.get(scope, object_box) :
              Intrinsic.fork_nullish(
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
    Visit.pattern(
      scope,
      node.argument,
      {
        kind: null,
        expression: Tree.binary(
          node.operator[0],
          Scope.read(scope, node.argument.name),
          Tree.primitive(1))}) :
    Scope.box(
      scope,
      false,
      "ExpressionUpdateIdentifierResult",
      (
        node.prefix ?
        Tree.binary(
          node.operator[0],
          Scope.read(scope, node.argument.name),
          Tree.primitive(1)) :
        Scope.read(scope, node.argument.name)),
      (box) => Tree.sequence(
        Visit.pattern(
          scope,
          node.argument,
          {
            kind: null,
            expression: (
              node.prefix ?
              Scope.get(scope, box) :
              Tree.binary(
                node.operator[0],
                Scope.get(scope, box),
                Tree.primitive(1)))}),
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
  Tree.conditional(
    Visit.expression(scope, node.left, null),
    (
      node.operator === "&&" ?
      Visit.expression(
        scope,
        node.right,
        {dropped: true}) :
      Tree.primitive(void 0)),
    (
      node.operator === "||" ?
      Visit.expression(
        scope,
        node.right,
        {dropped: true}) :
      Tree.primitive(void 0))) :
  Scope.box(
    scope,
    false,
    "ExpressionLogicalLeft",
    Visit.expression(scope, node.left, null),
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
        Visit.expression(
          scope,
          node.right,
          {dropped: context.dropped}),
        (
          context.dropped ?
          Tree.primitive(void 0) :
          Scope.get(scope, box))) :
      Tree.conditional( // console.assert(!context.dropped)
        Scope.get(scope, box),
        (
          node.operator === "&&" ?
          Visit.expression(scope, node.right, null) :
          Scope.get(scope, box)),
        (
          node.operator === "||" ?
          Visit.expression(scope, node.right, null) :
          Scope.get(scope, box))))));

visitors.ConditionalExpression = (scope, node, context) => Tree.conditional(
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
    Intrinsic.assign(
      context.target,
      [
        Visit.expression(scope, node.argument, null)],
      true,
      Intrinsic._target_result) :
    (
      is_proto_property_node(node) ?
      Intrinsic.set_prototype_of(
        context.target,
        Visit.proto_property(scope, node, null),
        true,
        Intrinsic._target_result) :
      (
        (
          node.value.type === "ArrowFunctionExpression" ||
          node.value.type === "FunctionExpression") ?
        Scope.box(
          scope,
          false,
          "PropertyKey",
          Visit.key(scope, node.key, {computed:node.computed}),
          (box) => Intrinsic.define_property(
            context.target,
            Scope.get(scope, box),
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
            Intrinsic._target_result)) :
        // console.assert(node.kind === "init" && !node.method)
        Intrinsic.define_property(
          context.target,
          Visit.key(scope, node.key, {computed:node.computed}),
          {
            __proto__: null,
            value: Visit.expression(scope, node.value, null),
            writable: true,
            enumerable: true,
            configurable: true},
          true,
          Intrinsic._target_result)))));

exports.proto_property = (scope, node, context, _key_box) => (
  Throw.assert(
    is_proto_property_node(node),
    null,
    `Invalid proto node`),
  Scope.box(
    scope,
    false,
    "PropertyRawPrototype",
    Visit.expression(scope, node.value, null),
    (prototype_box) => Tree.conditional(
      Tree.conditional(
        Tree.binary(
          "===",
          Tree.unary(
            "typeof",
            Scope.get(scope, prototype_box)),
          Tree.primitive("object")),
        Tree.primitive(true),
        Tree.binary(
          "===",
          Tree.unary(
            "typeof",
            Scope.get(scope, prototype_box)),
          Tree.primitive("function"))),
      Scope.get(scope, prototype_box),
      Intrinsic.grab("Object.prototype"))));

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
      Scope.box(
        scope,
        false,
        "ExpressionObjectKey",
        Visit.key(scope, node.key, {computed:node.computed}),
        (key_box) => (
          _key_box = key_box,
          Scope.get(scope, key_box))),
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
      Scope.box(
        scope,
        false,
        "ExpressionObjectSuper",
        Intrinsic.construct_object(
          Tree.primitive(null),
          [
            [
              Tree.primitive("constructor"),
              Tree.primitive(null)],
            [
              Tree.primitive("prototype"),
              Tree.primitive(null)]]),
        (super_box) => Tree.sequence(
          Intrinsic.set(
            Scope.get(scope, super_box),
            Tree.primitive("prototype"),
            closure(super_box),
            null,
            false,
            Intrinsic._success_result),
          Intrinsic.get(
            Scope.get(scope, super_box),
            Tree.primitive("prototype"),
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
        Intrinsic.construct_object(
          Intrinsic.grab("Object.prototype"),
          [])) :
      (
        ArrayLite.some(node.properties, is_proto_property_node) ?
        (
          is_proto_property_node(node.properties[0]) ?
          // Special Case #1 //
          Intrinsic.construct_object(
            Visit.proto_property(scope, node.properties[0], null),
            ArrayLite.map(
              ArrayLite.slice(node.properties, 1, node.properties.length),
              (node) => Visit._regular_property(scope, node, {super:super_nullable_box}))) :
          (
            is_proto_property_node(node.properties[node.properties.length - 1]) ?
            // Special Case #2 //
            Intrinsic.set_prototype_of(
              Intrinsic.construct_object(
                Tree.primitive(null),
                ArrayLite.map(
                  ArrayLite.slice(node.properties, 0, node.properties.length - 1),
                  (node) => Visit._regular_property(scope, node, {super:super_nullable_box}))),
              Visit.proto_property(scope, node.properties[node.properties.length - 1], null),
              true,
              Intrinsic._target_result) :
            // Special Case #3 //
            Intrinsic.set_prototype_of(
              Intrinsic.construct_object(
                Tree.primitive(null),
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
                            Scope.box(
                              scope,
                              false,
                              "ExpressionObjectCookedPrototype",
                              _expression,
                              (box) => (
                                _prototype_box = box,
                                _pair[1]))]) :
                        Visit._regular_property(scope, node, {super:super_nullable_box}))]))),
              Scope.get(scope, _prototype_box),
              true,
              Intrinsic._target_result))) :
        // Special Case #4 //
        Intrinsic.construct_object(
          Intrinsic.grab("Object.prototype"),
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
  Intrinsic.construct_array(
    ArrayLite.map(
      node.elements,
      (element) => Visit.expression(scope, element, null))) :
  Intrinsic.concat(
    ArrayLite.map(
      node.elements,
      (node) => (
        node === null ?
        Intrinsic.construct_empty_array(1) :
        Visit.spreadable(scope, node, null)))));

visitors.ImportExpression = (scope, node, context) => Tree.require(
  Visit.expression(scope, node.source, null));

visitors.UnaryExpression = (scope, node, context) => (
  (
    node.operator === "typeof" &&
    node.argument.type === "Identifier") ?
  Scope.typeof(scope, node.argument.name) :
  (
    node.operator === "delete" ?
    (
      node.argument.type === "MemberExpression" ?
      Intrinsic.delete_property(
          Scope.box(
            scope,
            false,
            "OtherDeleteObject",
            Visit.expression(scope, node.argument.object, null),
            (box) => Intrinsic.fork_nullish(
              () => Scope.get(scope, box),
              null,
              null)),
          Visit.key(scope, node.argument.property, {computed:node.argument.computed}),
          Scope._is_strict(scope),
          Intrinsic._success_result) :
      (
        node.argument.type === "Identifier" ?
        Scope.delete(scope, node.argument.name) :
        Tree.sequence(
          Visit.expression(
            scope,
            node.argument,
            {dropped: true}),
          Tree.primitive(true)))) :
    Tree.unary(
      node.operator,
      Visit.expression(scope, node.argument, null))));

visitors.BinaryExpression = (scope, node, context) => Tree.binary(
  node.operator,
  Visit.expression(scope, node.left, null),
  Visit.expression(scope, node.right, null));

visitors.MemberExpression = (scope, node, context) => Visit.member(
  scope,
  node,
  {
    // we can safely drop the secon expression because it  comes from
    // Scope.get(scope, box) which should not have any side effect
    kontinuation: identity});

visitors.ChainExpression = (scope, node, context) => Visit.expression(scope, node.expression, null)

visitors.NewExpression = (scope, node, context) => (
  ArrayLite.some(node.arguments, is_spread_element_node) ?
  Intrinsic.construct(
    Visit.expression(scope, node.callee, null),
    Intrinsic.concat(
      ArrayLite.map(
        node.arguments,
        (node) => Visit.spreadable(scope, node, null))),
    null) :
  Tree.construct(
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
  Scope.box(
    scope,
    false,
    "ExpressionCallEvalCallee",
    Visit.expression(scope, node.callee, null),
    (box, _expression) => (
      _expression = ArrayLite.mapReduce(
        node.arguments,
        (next, argument) => Scope.box( // console.assert(argument.type !== "SpreadElement")
          scope,
          false,
          "ExpressionCallEvalArgument",
          (
            ArrayLite.some(node.arguments, is_spread_element_node) ?
            Visit.spreadable(scope, argument, null) :
            Visit.expression(scope, argument, null)),
          next),
        (boxes) => Tree.conditional(
          Tree.binary(
            "===",
            Scope.get(scope, box),
            Intrinsic.grab("eval")),
          Scope.eval(
            scope,
            (
              ArrayLite.some(node.arguments, is_spread_element_node) ?
              Intrinsic.get(
                Intrinsic.concat(
                  ArrayLite.map(
                    boxes,
                    (box) => Scope.get(scope, box))),
                Tree.primitive(0),
                null) :
              (
                boxes.length === 0 ?
                // https://www.ecma-international.org/ecma-262/#sec-eval-x
                // if the first argument is not a string, return the first argument
                Tree.primitive(void 0) :
                Scope.get(scope, boxes[0])))),
          (
            ArrayLite.some(node.arguments, is_spread_element_node) ?
            Intrinsic.apply(
              _closure1(
                Scope.get(scope, box)),
              Tree.primitive(void 0),
              Intrinsic.concat(
                ArrayLite.map(
                  boxes,
                  (box) => Scope.get(scope, box)))) :
            Tree.apply(
              _closure1(
                Scope.get(scope, box)),
              Tree.primitive(void 0),
              ArrayLite.map(
                boxes,
                (box) => Scope.get(scope, box)))))),
      (
        node.optional ?
        Intrinsic.fork_nullish(
          () => Scope.get(scope, box),
          Tree.primitive(void 0),
          _expression) :
        _expression))) :
  (
    // We do not need to check for node.callee.type === "ChainExpression" because:
    // require("acorn").parse(`(123).?456(789)`).body[0].type === "ChainExpression")
    _closure1 = (expression, callback) => (
      node.optional ?
      Scope.box(
        scope,
        false,
        "ExpressionCallOptionalCallee",
        expression,
        (callee_box) => Intrinsic.fork_nullish(
          () => Scope.get(scope, callee_box),
          Tree.primitive(void 0),
          callback(
            Scope.get(scope, callee_box)))) :
      callback(expression)),
    _closure2 = (callback1, callback2) => (
      ArrayLite.some(node.arguments, is_spread_element_node) ?
      callback2(
        Intrinsic.construct_array(
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
      Scope.super_call(
        scope,
        _closure2(
          (expressions) => Intrinsic.concat(expressions),
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
                (expression1) => Tree.apply(
                  expression1,
                  expression2,
                  expressions)),
              (expression) => _closure1(
                expression1,
                (expression1) => Intrinsic.apply(
                  expression1,
                  expression2,
                  expression)))}) :
        _closure1(
          Visit.expression(scope, node.callee, null),
          (expression1) => _closure2(
            (expressions) => Tree.apply(
              expression1,
              Tree.primitive(void 0),
              expressions),
            (expression2) => Intrinsic.apply(
              expression1,
              Tree.primitive(void 0),
              expression2)))))));
