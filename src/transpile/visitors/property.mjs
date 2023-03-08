
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

const isProtoProperty = (node) => (
  node.type === "Property" &&
  node.kind === "init" &&
  node.method === false &&
  node.computed === false &&
  node.key.type === "Identifier" &&
  node.key.name === "__proto__";

const visitRegularObjectPropertyClosure = (node, context, site) => {
  const variable = declareScopeMeta(
    "RegularObjectPropertyValue",
    context,
  );
  return [
    reduceReverse(
      makeScopeMetaWriteEffectArray(context, variable, site.key),
      makeSequenceExpression,
      makeScopeMetaReadExpression(context, variable),
    ),
    visitClosure(
      node,
      context,
      {
        method: site.method,
        super: site.super,
        name: makeScopeMetaReadExpression(context, variable),
      },
    ),
  ];
}

export default {
  RegularObjectPropertyValue: {
    FunctionExpression: visitRegularObjectPropertyClosure,
    ArrowFunctionExpression: visitRegularObjectPropertyClosure,
    [DEFAULT_CLAUSE]: (node, context, site) => [
      site.key,
      visitExpression(node, context, ANONYMOUS),
    ],
  },
  RegularObjectProperty: {
    Property: (node, context, site) => {
      assert(node.kind === "init", "unexpected accessor property");
      assert(!isProtoProperty(node), "unexpected proto property");
      return visitRegularObjectPropertyValue(
        node.value,
        context,
        site: {
          method: node.method,
          super: site.super,
          key: visitKey(node.key, context, node),
        },
      );
    },
    SpreadElement: deadcode___("unexpected spread property"),
  },
  SpreadableRegularObjectProperty: {
    Property: (node, context, site) => makeObjectExpression(
      makeLiteralExpression(null),
      [visitRegularObjectProperty(node, context, site)],
    ),
    SpreadElement: (node, context, site) => visitExpression(
      node.argument,
      context,
      ANONYMOUS,
    ),
  },


  RegularObjectProperty: {
    Property: (node, context, _site) => {
      assert(!isProtoProperty(node), "unexpected proto property");
      if (node.kind === "init") {
        return [
          visitKey(node.key, context, node),
          makeDataDescriptorExpression(


          visitExpression(node.value, context, node),
        ];
      } else {
      }

    },
    SpreadElement: deadcode___("unexpected spread property"),
  },



  GeneralObjectProperty: {
    Property: (node, context, site) => {

    },
    SpreadElement: (node, context, site) => {

    },
  },

    SpreadElement: (node, context, site) => {},
    Property: (node, context, site) => {},
  },
};


exports.visitProperty = (scope, node, context) => (
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
        Visit.visitExpression(scope, node.argument, null)],
      true,
      Intrinsic.TARGET_RESULT) :
    (
      is_proto_property_node(node) ?
      Intrinsic.makeSetPrototypeOfExpression(
        context.target,
        Visit.visitProtoProperty(scope, node, null),
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
          Visit.visitKey(scope, node.key, {computed:node.computed}),
          (box) => Intrinsic.makeDefinePropertyExpression(
            context.target,
            Scope.makeOpenExpression(scope, box),
            (
              node.kind === "init" ?
              {
                __proto__: null,
                value: Visit.visitClosure(
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
                [node.kind]: Visit.visitClosure(
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
          Visit.visitKey(scope, node.key, {computed:node.computed}),
          {
            __proto__: null,
            value: Visit.visitExpression(scope, node.value, null),
            writable: true,
            enumerable: true,
            configurable: true},
          true,
          Intrinsic.TARGET_RESULT)))));

exports.visitProtoProperty = (scope, node, context, _key_box) => (
  Throw.assert(
    is_proto_property_node(node),
    null,
    `Invalid proto node`),
  Scope.makeBoxExpression(
    scope,
    false,
    "PropertyRawPrototype",
    Visit.visitExpression(scope, node.value, null),
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

exports.visitNormalProperty = (scope, node, context, _key_box) => (
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
        Visit.visitKey(scope, node.key, {computed:node.computed}),
        (key_box) => (
          _key_box = key_box,
          Scope.makeOpenExpression(scope, key_box))),
      Visit.visitClosure(
        scope,
        node.value,
        {
          sort: node.method ? "method" : null,
          name: _key_box,
          super: context.super})] :
    // console.assert(!node.method)
    [
      Visit.visitKey(scope, node.key, {computed:node.computed}),
      Visit.visitExpression(scope, node.value, null)]));

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
        (expression, node) => Visit.visitProperty(
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
            Visit.visitProtoProperty(scope, node.properties[0], null),
            ArrayLite.map(
              ArrayLite.slice(node.properties, 1, node.properties.length),
              (node) => Visit.visitNormalProperty(scope, node, {super:super_nullable_box}))) :
          (
            is_proto_property_node(node.properties[node.properties.length - 1]) ?
            // Special Case #2 //
            Intrinsic.makeSetPrototypeOfExpression(
              Intrinsic.makeObjectExpression(
                Tree.PrimitiveExpression(null),
                ArrayLite.map(
                  ArrayLite.slice(node.properties, 0, node.properties.length - 1),
                  (node) => Visit.visitNormalProperty(scope, node, {super:super_nullable_box}))),
              Visit.visitProtoProperty(scope, node.properties[node.properties.length - 1], null),
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
                          _expression = Visit.visitProtoProperty(scope, nodes[index - 1], null),
                          _pair = Visit.visitNormalProperty(scope, node, {super:super_nullable_box}),
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
                        Visit.visitNormalProperty(scope, node, {super:super_nullable_box}))]))),
              Scope.makeOpenExpression(scope, _prototype_box),
              true,
              Intrinsic.TARGET_RESULT))) :
        // Special Case #4 //
        Intrinsic.makeObjectExpression(
          Intrinsic.makeGrabExpression("Object.prototype"),
          ArrayLite.map(
            node.properties,
            (node) => Visit.visitNormalProperty(scope, node, {super:super_nullable_box})))))));
