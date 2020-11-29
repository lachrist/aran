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

const abort = (message) => { throw new global.Error(message) }

const is_not_proto_property = (property) => (
  property.type === "SpreadElement" ||
  property.kind !== "init" ||
  property.method ||
  property.computed ||
  property.key[property.key.type === "Identifier" ? "name" : "value"] !== "__proto__");

const is_not_spread_element_node = (node) => node.type !== "SpreadElement";

const is_spread_element_node = (node) => node.type === "SpreadElement";

exports._default_context = {
  __proto__: null,
  accessor: null,
  sort: null,
  self: null,
  super: null,
  name: null,
  dropped: false
};

exports.visit = (scope, node, context) => State._visit(node, [scope, node, context], visitors[node.type]);

const visitors = {__proto__:null};

visitors.YieldExpression = (scope, node, context) => { throw new global_Error("Unfortunately, Aran does not yet support generator closures and yield expressions") };

visitors.AwaitExpression = (scope, node, context) => { throw new global_Error("Unfortunately, Aran does not yet support asynchronous closures and await expressions") };

/////////////
// Literal //
/////////////

visitors.Literal = (scope, node, context) => (
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
          Expression.visit(scope, node.expressions[index + 1], Expression._default_context))),
      Tree.binary(
        "+",
        Tree.primitive(node.quasis[0].value.cooked),
        Expression.visit(scope, node.expressions[0], Expression._default_context))),
    Tree.primitive(node.quasis[node.quasis.length - 1].value.cooked)));

// Tagged template cannot lead to a direct eval call because it receives an array instead of a string:
// cf: https://www.ecma-international.org/ecma-262/10.0/index.html#sec-performeval
visitors.TaggedTemplateExpression = (scope, node, context) => Scope.box(
  scope,
  false,
  "TaggedTemplateExpressionObject",
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
        (expression) => Expression.visit(scope, expression, Expression._default_context)))));

visitors.ArrowFunctionExpression = Common.closure;

visitors.FunctionExpression = Common.closure;

visitors.ClassExpression = Common.class;

/////////////////
// Environment //
/////////////////

visitors.Identifier = (scope, node, context) => Scope.read(scope, node.name);

// We can assume self is always a proper object
visitors.Super = (scope, node, context) => ( // console.assert(Scope._get_binding_self_nullable_box(scope) !== null)
  Scope._has_super(scope) ?
  Tree.conditional(
    Scope.read(scope, "this"),
    Builtin.get_prototype_of(
      Scope.get_self(scope)),
    Builtin.throw_reference_error("Must call super constructor in derived class before accessing 'this' or returning from derived constructor")) :
  Builtin.get_prototype_of(
    Scope.get_self(scope)));

visitors.ThisExpression = (scope, node, context) => (
  Scope._has_super(scope) ?
  Tree.conditional(
    Scope.read(scope, "this"),
    Scope.read(scope, "this"),
    Builtin.throw_reference_error("Must call super constructor in derived class before accessing 'this' or returning from derived constructor")) :
  Scope.read(scope, "this"));

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
    abort("Aran currently only support the meta properties new.target and import.meta")));

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
      false,
      "ExpressionAssignmentMemberObject",
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
          false,
          "ExpressionAssignmentMemberProperty",
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
                false,
                "ExpressionAssignmentMemberValue",
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
          false,
          "AssignmentExpressionIdentifierName",
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
          false,
          "ExpressionAssignmentIdentifierRight",
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
        null,
        node.left,
        Expression.visit(scope, node.right, Expression._default_context)) :
      Scope.box(
        scope,
        false,
        "ExpressionAssignmentPatternRight",
        Expression.visit(scope, node.right, Expression._default_context),
        (box) => Tree.sequence(
          Common.assign(
            scope,
            null,
            node.left,
            Scope.get(scope, box)),
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
    Expression.visit(scope, node.argument.object, Expression._default_context),
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
          false,
          "ExpressionUpdateMemberResult",
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
    false,
    "ExpressionLogicalLeft",
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

visitors.ObjectExpression = (scope, node, context, _closure) => (
  _closure = (self_nullable_box, _closure1, _closure2) => (
    _closure1 = (node) => Scope.box(
      scope,
      false,
      "ExpressionObjectPrototype",
      Expression.visit(scope, node, Expression._default_context),
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
        Builtin.grab("Object.prototype"))),
    _closure2 = (node, _key_box) => (// console.assert(is_not_proto_property(property) && is_not_spread_element_node(property))
      (
        node.value.type === "ArrowFunctionExpression" ||
        node.value.type === "FunctionExpression") ?
      [
        Scope.box(
          scope,
          false,
          "ExpressionObjectKey",
          (
            node.computed ?
            Expression.visit(scope, node.key, Expression._default_context) :
            Tree.primitive(
              (
                node.key.type === "Identifier" ?
                node.key.name :
                node.key.value))),
          (key_box) => (
            _key_box = key_box,
            Scope.get(scope, key_box))),
        (
          node.kind === "init" ?
          {
            __proto__: null,
            value: Expression.visit(
              scope,
              node.value,
              {
                __proto__: Expression._default_context,
                sort: node.method ? "method" : null,
                name: _key_box,
                self: self_nullable_box}), // console.assert(!node.method || self_nullable_box !== null)
            writable: true,
            enumerable: true,
            configurable: true} :
          {
            __proto__: null,
            [node.kind]: Expression.visit(
              scope,
              node.value,
              {
                __proto__: Expression._default_context,
                sort: "method",
                accessor: node.kind,
                name: _key_box,
                self: self_nullable_box}), // console.assert(self_nullable_box !== null)
            enumerable: true,
            configurable: true})] :
      [
        (
          node.computed ?
          Expression.visit(scope, node.key, Expression._default_context) :
          Tree.primitive(
            (
              node.key.type === "Identifier" ?
              node.key.name :
              node.key.value))),
        { // console.assert(node.kind === "init")
          __proto__: null,
          value: Expression.visit(scope, node.value, Expression._default_context),
          writable: true,
          enumerable: true,
          configurable: true}]),
    (
      (
        ArrayLite.every(node.properties, is_not_spread_element_node) &&
        (
          node.properties.length === 0 ||
          ArrayLite.every(
            ArrayLite.slice(node.properties, 1, node.properties.length),
            is_not_proto_property))) ?
      (
        (
          node.properties.length === 0 ||
          is_not_proto_property(node.properties[0])) ?
        Builtin.construct_object(
          Builtin.grab("Object.prototype"),
          ArrayLite.map(node.properties, _closure2)) :
        Builtin.construct_object(
          _closure1(node.properties[0].value),
          ArrayLite.map(
            ArrayLite.slice(node.properties, 1, node.properties.length),
            _closure2))) :
      ArrayLite.reduce(
        node.properties,
        (expression, property, _expression, _descriptor) => (
          property.type === "SpreadElement" ?
          Builtin.assign(
            expression,
            [
              Expression.visit(scope, property.argument, Expression._default_context)],
            true,
            Builtin._target_result) :
          (
            !is_not_proto_property(property) ?
            Builtin.set_prototype_of(
              expression,
              _closure1(property.value),
              true,
              Builtin._target_result) :
            (
              {0:_expression, 1:_descriptor} = _closure2(property),
              Builtin.define_property(expression, _expression, _descriptor, true, Builtin._target_result)))),
        Builtin.construct_object(
          Builtin.grab("Object.prototype"),
          [])))),
  (
    ArrayLite.every(node.properties, (node) => (
      node.type === "SpreadElement" ||
      (
        !node.method &&
        node.kind === "init"))) ?
    _closure(null) :
    Scope.box(
      scope,
      true,
      "ExpressionObjectSelf",
      Tree.primitive(void 0),
      (self_box) => Tree.sequence(
        Scope.set(
          scope,
          self_box,
          _closure(self_box)),
        Scope.get(scope, self_box)))));

visitors.ImportExpression = (scope, node, context) => Tree.import(
  Expression.visit(scope, node.source, Expression._default_context));

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
          false,
          "ExpressionUnaryDeleteObject",
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
  false,
  "ExpressionMemberObject",
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
  ArrayLite.every(node.arguments, is_not_spread_element_node) ?
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
          argument.type === "SpreadElement" ?
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

visitors.CallExpression = (scope, node, context) => (
  (
    node.callee.type === "Identifier" &&
    node.callee.name === "eval") ?
  Scope.box(
    scope,
    false,
    "ExpressionCallEvalCallee",
    Scope.read(scope, "eval"),
    (box, _expression) => (
      _expression = ArrayLite.mapReduce(
        node.arguments,
        (next, argument) => Scope.box( // console.assert(argument.type !== "SpreadElement")
          scope,
          false,
          "ExpressionCallEvalArgument",
          Expression.visit(scope, argument, Expression._default_context),
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
  (
    node.callee.type === "Super" ?
    Tree.conditional( // console.assert(node.optional === false)
      Scope.read(scope, "this"),
      Builtin.throw_reference_error("Super constructor may only be called once"),
      Tree.sequence(
        Scope.write(
          scope,
          "this",
          (
            ArrayLite.some(node.arguments, is_spread_element_node) ?
            Builtin.construct(
              Scope.get_super(scope), // console.assert(Scope._get_binding_super_nullable_box(scope) !== null)
              Builtin.concat(
                ArrayLite.map(
                  node.arguments,
                  (argument) => (
                    argument.type === "SpreadElement" ?
                    Expression.visit(scope, argument.argument, Expression._default_context) :
                    Builtin.construct_array(
                      [
                        Expression.visit(scope, argument, Expression._default_context)])))),
              null) :
            Tree.construct(
              Scope.get_super(scope),
              ArrayLite.map(
                node.arguments,
                (argument) => Expression.visit(scope, argument, Expression._default_context))))),
        Scope.read(scope, "this"))) :
    Scope.box(
      scope,
      false,
      "ExpressionCallThis",
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
          ArrayLite.some(node.arguments, is_spread_element_node) ?
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
            false,
            "ExpressionCallOptionalCallee",
            _expression,
            (callee_box) => Builtin.fork_nullish(
              () => Scope.get(scope, callee_box),
              Tree.primitive(void 0),
              _closure(
                Scope.get(scope, callee_box)))) :
          _closure(_expression))))));
