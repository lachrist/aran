
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Scope = require("../scope");
const Visit = require("./index.js");
const Closure = require("./closure.js");

const global_Reflect_apply = global.Reflect.apply;
const global_String_prototype_substring = global.String.prototype.substring;

exports.ThisExpression = (node, scope, boolean, cache) => Scope.read(scope, "this");

exports.ArrayExpression = (node, scope, boolean, cache) => (
  ArrayLite.every(
    node.elements,
    (node) => (
      node !== null &&
      node.type !== "SpreadElement")) ?
  Build.apply(
    Build.builtin("Array.of"),
    Build.primitive(void 0),
    ArrayLite.map(
      node.elements,
      (node) => Visit.node(node, scope, false, null))) :
  Build.apply(
    Build.builtin("Array.prototype.concat"),
    Build.apply(
      Build.builtin("Array.of"),
      Build.primitive(void 0),
      []),
    ArrayLite.map(
      node.elements,
      (element) => (
        element ?
        (
          element.type === "SpreadElement" ?
          Visit.node(element.argument, scope, false, null) :
          Build.apply(
            Build.builtin("Array.of"),
            Build.primitive(void 0),
            [
              Visit.node(element, scope, false, null)])) :
        Build.apply(
          Build.builtin("Array"),
          Build.primitive(void 0),
          [
            Build.primitive(1)])))));

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

// (
//   ArrayLite.every(
//     node.properties,
//     (property, index) => (
//       index === 0 ||
//       property.computed ||
//       (
//         property.key.type === "Identifier" ?
//         property.key.name !== "__proto__" :
//         property.key.value !== "__proto__"))) ?

exports.ObjectExpression = (node, scope, boolean, cache) => (
  (
    (closure) => (
      ArrayLite.every(
        node.properties,
        (property) => (
          property.type !== "SpreadElement" &&
          property.kind === "int")) ?
      (
        ArrayLite.every(
          node.properties,
          (property, index) => (
            (
              index === 0 ||
              property.computed ||
              (
                property.key.type === "Identifier" ?
                property.key.name !== "__proto__" :
                property.key.value !== "__proto__")) &&
            (
              !property.computed ||
              property.key.type === "Literal" ||
              (
                property.value.type === "FuntionExpression" ?
                property.value.id !== null :
                property.value.type !== "ArrowFunctionExpression")))) ?
        Build.object(
          (
            (
              node.properties.length > 0 &&
              !node.properties[0].computed &&
              (
                node.properties[0].key.type === "Identifier" ?
                node.properties[0].key.name === "__proto__" :
                node.properties[0].key.value === "__proto__")) ?
            Scope.cache(
              scope,
              "ExpressionObjectProto1",
              Visit.node(node.properties[0].value, scope, false, null),
              closure) :
            Build.builtin("Object.prototype")),
          ArrayLite.map(
            (
              (
                node.properties.length > 0 &&
                !node.properties[0].computed &&
                (
                  node.properties[0].key.type === "Identifier" ?
                  node.properties[0].key.name === "__proto__" :
                  node.properties[0].key.value === "__proto__")) ?
              ArrayLite.slice(node.properties, 1, node.properties.length) :
              node.properties),
            (property) => [
              (
                property.computed ?
                Visit.node(property.key, scope, false, null) :
                Build.primitive(
                  (
                    property.key.type === "Identifier" ?
                    property.key.name :
                    property.key.value))),
              Scope.cache(
                scope,
                "ExpressionObjectKey1",
                (
                  property.key.type === "Literal" ?
                  property.key.value :
                  (
                    property.computed ?
                    property.key.name :
                    "")),
                 (cache) => Visit.node(property.value, scope, false, cache))])) :
        (
          (
            function self (index, cache, expressionss) { return (
              index === node.properties.length ?
              Build.object(
                (
                  cache === null ?
                  Build.builtin("Object.prototype") :
                  closure(cache)),
                expressionss) :
              (
                (
                  !node.properties[index].computed &&
                  (
                    node.properties[index].key.type === "Identifier" ?
                    node.properties[index].key.name === "__proto__" :
                    node.properties[index].key.value === "__proto__")) ?
                Scope.cache(
                  scope,
                  "ExpressionObjectProto2",
                  Visit.node(node.properties[index].value, scope, false, null),
                  (cache) => self(index + 1, cache, expressionss)) :
                Scope.cache(
                  scope,
                  "ExpressionObjectKey2",
                  (
                    node.node.properties[index].key.type === "Literal" ?
                    node.node.properties[index].key.value :
                    (
                      node.properties[index].key.computed ?
                      Visit.node(node.properties[index].key, scope, false, null) :
                      node.node.properties[index].key.name)),
                  (cache1) => Scope.cache(
                    scope,
                    "ExpressionObjectValue",
                    Visit.node(node.properties[index].value, scope, false, cache1),
                    (cache2) => (
                      expressionss[expressionss.length] = [
                        Scope.get(scope, cache1),
                        Scope.get(scope, cache2)],
                      self(index + 1, cache, expressionss))))))})
          (
            0,
            null,
            []))) :
      Scope.cache(
        scope,
        "ExpressionObjectResult",
        Build.object(
          Build.builtin("Object.prototype"),
          []),
        (cache1) => (
          (
            function self (index) { return (
              index === node.properties.length ?
              Scope.get(scope, cache1) :
              Build.sequence(
                (
                  // https://github.com/tc39/proposal-object-rest-spread
                  node.properties[index].type === "SpreadElement" ?
                  Build.apply(
                    Build.builtin("Object.assign"),
                    Build.primitive(void 0),
                    [
                      Scope.get(scope, cache1),
                      Visit.node(node.properties[index].argument, scope, false, null)]) :
                  (
                    (
                      !node.properties[index].computed &&
                      (
                        node.properties[index].key.type === "Identifier" ?
                        node.properties[index].key.name === "__proto__" :
                        node.properties[index].key.value === "__proto__")) ?
                    Build.apply(
                      Build.builtin("Reflect.setPrototypeOf"),
                      Build.primitive(void 0),
                      [
                        Scope.get(scope, cache1),
                        Scope.cache(
                          scope,
                          "ExpressionObjectProto3",
                          Visit.node(node.properties[index].value, scope, false, null),
                          closure)]) :
                    Scope.cache(
                      scope,
                      "ExpressionObjectKey3",
                      (
                        node.node.properties[index].key.type === "Literal" ?
                        node.node.properties[index].key.value :
                        (
                          node.properties[index].key.computed ?
                          Visit.node(node.properties[index].key, scope, false, null) :
                          node.node.properties[index].key.name)),
                      (cache2) => Build.apply(
                        Build.builtin("Reflect.defineProperty"),
                        Build.primitive(void 0),
                        [
                          Scope.get(scope, cache1),
                          Scope.get(scope, cache2),
                          // > var o = {};
                          // undefined
                          // > Reflect.defineProperty(o, "foo", {configurable:true, enumerable:true, get: () => {}})
                          // true
                          // > o
                          // { foo: [Getter] }
                          // > Reflect.defineProperty(o, "foo", {configurable:true, enumerable:true, set: () => {}})
                          // true
                          // > o
                          // { foo: [Getter/Setter] }
                          Build.object(
                            Build.primitive(null),
                            [
                              [
                                Build.primitive("configurable"),
                                Build.primitive(true)],
                              [
                                Build.primitive("enumerable"),
                                Build.primitive(true)],
                              [
                                Build.primitive(
                                  node.properties[index].kind === "init" ?
                                  "value" :
                                  node.properties[index].kind),
                                Visit.node(node.properties[index].value, scope, false, null)]])])))),
                self(index + 1)))})))))
  (
    (cache) => Build.conditional(
      Build.binary(
        "===",
        Build.unary(
          "typeof",
          Scope.get(scope, cache)),
        Build.primitive("object")),
      Scope.get(scope, cache),
      Build.conditional(
        Build.binary(
          "===",
          Build.unary(
            "typeof",
            Scope.get(scope, cache)),
          Build.primitive("function")),
        Scope.get(scope, cache),
        Build.builtin("Object.prototype")))));

// Function's name are not propagated through sequences:
//
// > var o = {x:(123, function () {})}
// undefined
// > o
// { x: [Function] }
// > o.x.name
// ''
exports.SequenceExpression = (node, scope, boolean, cache) => (
  (
    function self (index) { return (
      index === (node.expressions.length - 1) ?
      Visit.node(node.expressions[index], scope, boolean, null) :
      Build.sequence(
        Visit.node(node.expressions[index], scope, true, null),
        self(index + 1)))})
  (0));

exports.UnaryExpression = (node, scope, boolean, cache) => (
  (
    node.operator === "typeof" &&
    node.argument.type === "Identifier") ?
  Scope.typeof(scope, node.argument.name) :
  (
    node.operator === "delete" ?
    (
      node.argument.type === "MemberExpression" ?
      Scope.cache(
        scope,
        "ExpressionUnaryDeleteObject",
        (
          node.argument.object.type === "Literal" ?
          node.argument.object.value :
          Visit.node(node.argument.object, scope, false, null)),
        (cache) => Object.del(
          Scope.$GetStrict(scope),
          cache,
          (
            node.argument.computed ?
            Visit.node(node.argument.property, scope, false, null) :
            Build.primitive(node.argument.property.name)))) :
      (
        node.argument.type === "Identifier" ?
        Scope.delete(scope, node.argument.name) :
        Build.sequence(
          Visit.node(node.argument, scope, true, null),
          Build.primitive(true)))) :
    Build.unary(
      node.operator,
      Visit.node(node.argument, scope, false, null))));

exports.BinaryExpression = (node, scope, boolean, cache) => Build.binary(
  node.operator,
  Visit.node(node.left, scope, false, null),
  Visit.node(node.right, scope, false, null));

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
exports.AssignmentExpression = (node, scope, boolean, cache) => (
  node.left.type === "MemberExpression" ?
  (
    (
      node.operator === "=" &&
      boolean &&
      Scope.$GetStrict(node)) ?
    // Special Case #1:
    Object.set(
      true,
      Visit.node(node.left.object, scope, false, null),
      (
        node.left.computed ?
        Visit.node(node.left.property, scope, false, null) :
        Build.primitive(node.left.property.name, scope, false, null)),
      Visit.node(node.right, scope, false, null)],
      null) :
    Scope.cache(
      scope,
      "ExpressionAssignmentMemberObject",
      (
        node.left.object.type === "Literal" ?
        node.left.object.value :
        Visit.node(node.left.object, scope, false, null)),
      (cache2) => Scope.cache(
        scope,
        "ExpressionAssignmentMemberProperty",
        (
          node.left.computed ?
          (
            node.left.property.type === "Literal" ?
            node.left.property.value :
            Visit.node(node.left.property, scope, false, null)) :
          Build.primitive(node.left.property.name)),
        (cache3) => (
          (
            (any) => (
              (
                Scope.$GetStrict(scope) &&
                boolean) ?
              // Special Case #2:
              Object.set(
                true,
                Scope.get(scope, cache2),
                Scope.get(scope, cache3),
                (
                  (
                    typeof any === "object" &&
                    any !== null) ?
                  any :
                  Build.primitive(any)),
                null) :
              // General Case:
              Scope.cache(
                scope,
                "ExpressionAssignmentMemberRight",
                any,
                (cache4) => Object.set(
                  Scope.$GetStrict(scope),
                  Object.obj(
                    () => Scope.get(scope, cache2)),
                  Scope.get(scope, cache3),
                  Scope.get(scope, cache4),
                  (
                    boolean ?
                    null :
                    Scope.get(scope, cache4))))))
          (
            node.operator === "=" ?
            (
              node.right.type === "Literal" ?
              node.right.value :
              Visit.node(node.right, scope, false, null)) :
            Build.binary(
              global_Reflect_apply(
                global_String_prototype_substring,
                node.operator,
                [0, node.operator.length - 1]),
              Object.get(
                Helper.obj(
                  () => Scope.get(scope, cache2)),
                Scope.get(scope, cache3)),
              Visit.node(node.right, scope, false, null))))))) :
  (
    node.left.type === "Identifier" ?
    (
      (
        (any) => (
          boolean ?
          Scope.write(
            scope,
            node.left.name,
            (
              (
                typeof any === "object" &&
                any !== null) ?
              any :
              Build.primitive(any))) :
          Scope.cache(
            scope,
            "AssignmentIdentifierRight",
            any,
            (cache2) => Build.sequence(
              Scope.write(
                scope,
                node.left.name,
                Scope.get(scope, cache2)),
              Scope.get(scope, cache2)))))
      (
        node.operator === "=" ?
        (
          node.right.type === "Literal" ?
          node.right.value :
          Visit.node(
            node.right,
            scope,
            false,
            Scope.$Cache(node.left.name))) :
        Build.binary(
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
          Visit.node(node.right, scope, false, null)))) :
    Scope.cache(
      scope,
      "ExpressionAssignmentPatternRight",
      (
        node.right.type === "Literal" ?
        node.right.value :
        Visit.node(node.right, scope, false, null)),
      (cache2) => Pattern.assign(scope, false, node.left, cache2))));

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
exports.UpdateExpression = (node, scope, boolean, cache) => (
  node.argument.type === "MemberExpression" ?
  Scope.cache(
    scope,
    "ExpressionUpdateMemberObject",
    (
      node.argument.object.type === "Literal" ?
      node.argument.object.value :
      Visit(node.argument.object, scope, false, null)),
    (cache1) => Scope.cache(
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
      (cache2) => (
        (
          Scope.$GetStrict(scope) &&
          boolean) ?
        // Special Case #1:
        Object.set(
          true,
          Scope.get(scope, cache1),
          Scope.get(scope, cache2),
          Build.binary(
            node.operator[0],
            Object.get(
              Object.obj(
                () => Scope.get(scope, cache1)),
              Scope.get(scope, cache2)),
            Build.primitive(1))) :
        (
          (
            boolean ||
            node.prefix) ?
          // Special Case #2:
          Scope.cache(
            scope,
            "ExpressionUpdateMemberRight2",
            Build.binary(
              node.operator[0],
              Object.get(
                Object.obj(
                  () => Scope.get(scope, cache1)),
                Scope.get(scope, cache2)),
              Build.primitive(1)),
            (cache3) => Object.set(
              Scope.$GetStrict(scope),
              (
                Scope.$GetStrict(scope) ?
                Scope.get(scope, cache1) :
                Object.obj(
                  () => Scope.get(scope, cache1))),
              Scope.get(scope, cache2),
              Scope.get(scope, cache3),
              (
                boolean ?
                null :
                Scope.get(scope, cache3)))) :
          (
            Scope.$GetStrict(scope) ?
            // Special Case #3:
            Scope.cache(
              scope,
              "ExpressionUpdateMemberResult3",
              (
                node.prefix ?
                Build.binary(
                  node.operator[0],
                  Object.get(
                    Object.obj(
                      () => Scope.get(scope, cache1)),
                    Scope.get(scope, cache2)),
                  Build.primitive(1)) :
                Object.get(
                  Object.obj(
                    () => Scope.get(scope, cache1)),
                  Scope.get(scope, cache2))),
              (cache3) => Object.set(
                true,
                Scope.get(scope, cache1),
                Scope.get(scope, cache2),
                (
                  node.prefix ?
                  Scope.get(scope, cache3) :
                  Build.binary(
                    node.operator[0],
                    Scope.get(scope, cache3),
                    Build.primitive(1))),
                Scope.get(scope, cache3))) :
            // General Case:
            Scope.cache(
              scope,
              "ExpressionUpdateMemberGet",
              Object.get(
                Object.obj(
                  () => Scope.get(scope, cache1)),
                Scope.get(scope, cache2)),
              (cache3) => Scope.cache(
                scope,
                "ExpressionUpdateMemberRight",
                Build.binary(
                  node.operator[0],
                  Scope.get(scope, cache3),
                  Build.primitive(1)),
                (cache4) => Object.set(
                  Scope.$GetStrict(scope),
                  (
                    Scope.$GetStrict(scope) ?
                    Scope.get(scope, cache1) :
                    Object.obj(
                      () => Scope.get(scope, cache1))),
                  Scope.get(scope, cache2),
                  Scope.get(scope, cache4),
                  (
                    boolean ?
                    null :
                    (
                      node.prefix ?
                      Scope.get(scope, cache4) :
                      Scope.get(scope, cache3))))))))))) :
  (
    node.argument.type === "Identifier" ?
    (
      boolean ?
      Scope.write(
        scope,
        node.argument.name,
        Build.binary(
          node.operator[0],
          Scope.read(scope, node.argument.name),
          Build.primitive(1))) :
      Scope.cache(
        scope,
        "ExpressionUpdateResult",
        (
          node.prefix ?
          Build.binary(
            node.operator[0],
            Scope.read(scope, node.argument.name),
            Build.primitive(1)) :
          Scope.read(scope, node.argument.name)),
        (cache) => Build.sequence(
          Scope.write(
            scope,
            node.argument.name,
            (
              node.prefix ?
              Scope.get(scope, cache) :
              Build.binary(
                node.operator[0],
                Scope.get(scope, cache),
                Build.primitive(1)))),
          Scope.get(scope, cache)))) :
    (
      (
        () => { throw new Error("Invalid left-hand side update") })
      ())));

exports.LogicalExpression = (node, scope, boolean, cache) => Scope.cache(
  scope,
  "ExpressionLogicalLeft",
  Visit.node(node.left, scope, false, null),
  (cache) => Build.conditional(
    Scope.get(scope, cache),
    (
      node.operator === "&&" ?
      Visit.node(node.right, scope, boolean, null) :
      Scope.get(scope, cache)),
    (
      node.operator === "||" ?
      Visit.node(node.right, scope, boolean, null) :
      Scope.get(scope, cache))));

exports.ConditionalExpression = (node, scope, boolean, cache) => Build.conditional(
  Visit.node(node.test, scope, false, null),
  Visit.node(node.consequent, scope, boolean, cache),
  Visit.node(node.alternate, scope, boolean, cache)):

exports.NewExpression = (node, scope, boolean, cache) => (
  ArrayLite.every(
    node.arguments,
    (argument) => argument.type !== "SpreadElement") ?
  Build.construct(
    Visit.node(node.callee, scope, false, null),
    ArrayLite.map(
      node.arguments,
      (node) => Visit.node(node, scope, false, null))) :
  Build.apply(
    Build.builtin("Reflect.construct"),
    Build.primitive(void 0),
    [
      Visit.node(node.callee, scope, false, null),
      Build.apply(
        Build.builtin("Array.prototype.concat"),
        Build.apply(
          Build.builtin("Array.of"),
          Build.primitive(void 0),
          []),
        ArrrayLite.map(
          node.arguments,
          (node) => (
            node.type === "SpreadElement" ?
            Visit.node(node.argument, scope, false, null) :
            Build.apply(
              Build.builtin("Array.of"),
              Build.primitive(void 0),
              [
                Visit.node(node, scope, false, null)]))))]));

// Eval with spread element is not direct:
//
// > var x = "foo";
// undefined
// > function f () { var x = "bar"; return eval(...["x"])}
// undefined
// > f()
// 'foo'
exports.CallExpression = (node, scope, boolean, cache) => (
  ArrayLite.every(
    node.arguments,
    (argument) => argument.type !== "SpreadElement") ?
  (
    (
      node.callee.type === "Identifier" &&
      node.callee.name === "eval" &&
      node.arguments.length > 0) ?
    Scope.cache(
      scope,
      "ExpressionCallEvalCallee"
      Scope.read(scope, "eval"),
      (cache) => (
        (
          function self (index, caches) { return (
            index === node.arguments.length ?
            Build.conditional(
              Build.binary(
                "===",
                Scope.get(scope, cache),
                Build.builtin("eval")),
              Build.eval(
                Scope.get(scope, caches[0])),
              Build.apply(
                Scope.get(scope, cache),
                Build.primitive(void 0),
                ArrayLite.map(
                  caches,
                  (cache) => Scope.get(scope, cache)))) :
            Scope.cache(
              scope,
              "ExpressionCallEvalArgument",
              Visit.node(node.arguments[index], scope, false, null),
              (cache) => (
                caches[caches.length] = cache,
                self(index + 1, caches))))})
        (0, []))) :
    (
      node.callee.type === "MemberExpression" ?
      // Evaluation order:
      // =================
      // var o = null;
      // > o[console.log("key")](console.log("arg"))
      // key
      // Thrown:
      // TypeError: Cannot read property 'undefined' of null
      Scope.cache(
        scope,
        "ExpressionCallMemberObject",
        Visit.node(node.callee.object, scope),
        (cache1) => Build.apply(
            Scope.cache(
              scope,
              "ExpressionCallMemberProperty",
              (
                node.callee.computed ?
                (
                  node.callee.property.type === "Literal" ?
                  node.callee.property.value :
                  Visit.node(node.callee.property, scope, false, null)) :
                node.callee.property.name),
              (cache2) => Object.get(
                  Object.obj(
                    () => Scope.get(scope, cache1)),
                  Scope.get(scope, cache2))),
            Scope.get(scope, cache1),
            ArrayLite.map(
              node.arguments,
              (node) => Visit.node(node, scope, false, null))))) :
      Build.apply(
        Visit.node(node.callee, scope, false, null),
        Build.primitive(void 0),
        ArrayLite.map(
          node.arguments,
          (node) => Visit.node(node, scope, false, null))))) :
  Scope.cache(
    scope,
    "ExpressionCallSpreadMemberObject",
    (
      node.callee.type === "MemberExpression" ?
      Visit.node(node.callee.object, scope) :
      void 0),
    (cache1) => Build.apply(
      Build.builtin("Reflect.apply"),
      Build.primitive(void 0),
      [
        (
          node.callee.type === "MemberExpression" ?
          Scope.cache(
            scope,
            "ExpressionCallMemberProperty",
            (
              node.callee.computed ?
              (
                node.callee.property.type === "Literal" ?
                node.callee.property.value :
                Visit.node(node.callee.property, scope, false, null)) :
              node.callee.property.name),
            (cache2) => Object.get(
                Object.obj(
                  () => Scope.get(scope, cache1)),
                Scope.get(scope, cache2))) :
          Visit.node(node.callee, scope)),
        Scope.get(scope, cache1),
        Build.apply(
          Build.builtin("Array.prototype.concat"),
          Build.apply(
            Build.builtin("Array.of"),
            Build.primitive(void 0),
            []),
          ArrayLite.map(
            node.arguments,
            (node) => (
              node.type === "SpreadElement" ?
              Visit.node(node.argument, scope, false, null) :
              Build.apply(
                Build.builtin("Array.of"),
                Build.primitive(void 0),
                [
                  Visit.node(node, scope, false, null)]))))])));

exports.MemberExpression = (node, scope, boolean, cache1) => Scope.cache(
  scope,
  "ExpressionMemberObject",
  (
    node.object.type === "Literal" ?
    node.object.value :
    Visit.node(node.object, scope, false, null)),
  (cache2) => Scope.cache(
    scope,
    "ExpressionMemberProperty",
    (
      (
        node.computed ?
        (
          node.property.type === "Literal" ?
          node.property.value : 
          Visit.node(node.property, scope, false, null)) :
        node.property.name)),
    (cache3) => Build.apply(
      Build.builtin("Reflect.get"),
      Build.primitive(void 0),
      [
        (
          Helper.objectify(
          () => Scope.get(scope, cache2)),
        Scope.get(scope, cache3)])));

exports.MetaProperty = (node, scope, boolean, cache) => Scope.read(scope, "new.target");

exports.Identifier = (node, scope, boolean, cache) => Scope.read(scope, node.name);

exports.Literal = (node, scope, boolean, cache) => (
  node.regex ?
  Build.construct(
    Build.builtin("RegExp"),
    [
      Build.primitive(node.regex.pattern),
      Build.primitive(node.regex.flags)]) :
  Build.primitive(node.value));

exports.TemplateLiteral = (node, scope, boolean, cache) => (
  (
    function self (index) { return (
      index === node.quasis.length ?
      Build.primitive("") :
      (
        node.quasis[index].tail ?
        Build.binary(
          "+",
          self(index + 1),
          Build.primitive(element.value.cooked)) :
        Build.binary(
          "+",
          self(index + 1),
          Build.binary(
            "+",
            Build.primitive(element.value.cooked),
            Visit.node(node.expressions[index], scope, false, null)))))})
  (0));

exports.TaggedTemplateExpression = (node, scope, boolean, cache) => Build.apply(
  Visit.node(node.tag, scope),
  Build.primitive(void 0),
  ArrayLite.concat(
    [
      Build.apply(
        Build.builtin("Object.freeze"),
        Build.primitive(void 0),
        [
          Build.apply(
            Build.builtin("Object.defineProperty"),
            Build.primitive(void 0),
            [
              Build.apply(
                Build.builtin("Array.of"),
                Build.primitive(void 0),
                ArrayLite.map(
                  node.quasi.quasis,
                  (element) => Build.primitive(element.value.cooked))),
              Build.primitive("raw"),
              Build.object(
                Build.primitive(null),
                [
                  Build.primitive("value"),
                  Build.apply(
                    Build.builtin("Object.freeze"),
                    Build.primitive(void 0),
                    [
                      Build.apply(
                        Build.builtin("Array.of"),
                        Build.primitive(void 0),
                        ArrayLite.map(
                          node.quasi.quasis,
                          (element) => Build.primitive(element.value.raw)))])])])])],
    ArrayLite.map(
      node.quasi.expressions,
      (node) => Visit.node(node, scope, false, null))));

exports.ArrowFunctionExpression = Closure.ArrowFunctionExpression;

exports.FunctionExpression = Closure.FunctionExpression;
