
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Scope = require("../scope");
const Query = require("../query.js");
const Visit = require("./index.js");
const Closure = require("./closure.js");

const global_Reflect_apply = global.Reflect.apply;
const global_String_prototype_substring = global.String.prototype.substring;

exports.ThisExpression = (node, scope, options) => Scope.read(scope, "this");

exports.ArrayExpression = (node, scope, options) => (
  ArrayLite.every(
    node.elements,
    (node) => (
      node &&
      node.type !== "SpreadElement")) ?
  Build.apply(
    Build.builtin("Array.of"),
    Build.primitive(void 0),
    ArrayLite.map(
      node.elements,
      (node) => Visit.node(node, scope, false))) :
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
          Visit.node(element.argument, scope, false) :
          Build.apply(
            Build.builtin("Array.of"),
            Build.primitive(void 0),
            [
              Visit.node(element, scope, false)])) :
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
exports.ObjectExpression = (node, scope, options) => (
  (
    (closure) => (
      ArrayLite.every(node.properties, Query.IsPropertyInit) ?
      (
        (
          ArrayLite.every(node.properties, Query.IsPropertyStaticallyNamed) &&
          (
            node.properties.length === 0 ||
            !ArrayLite.some(
              ArrayLite.slice(node.properties, 1, node.properties.length),
              Query.IsPropertyProto))) ?
        Build.object(
          (
            (
              node.properties.length > 0 &&
              Query.IsPropertyProto(node.properties[0])) ?
            Scope.cache(
              scope,
              "ExpressionObjectProto1",
              Visit.node(node.properties[0].value, scope, false),
              closure) :
            Build.builtin("Object.prototype")),
          ArrayLite.map(
            (
              (
                node.properties.length > 0 &&
                Query.IsPropertyProto(node.properties[0])) ?
              ArrayLite.slice(node.properties, 1, node.properties.length) :
              node.properties),
            (property) => [
              (
                property.computed ?
                Visit.node(property.key, scope, false) :
                Build.primitive(
                  (
                    property.key.type === "Identifier"
                    property.key.name :
                    property.key.value))),
              Visit.node(
                property.value,
                scope,
                () => Query.GetPropertyStaticName(property))])) :
        (
          (
            function self (index, cache, cachess) { return (
              index === node.properties.length ?
              Build.object(
                (
                  cache ?
                  closure(cache) :
                  Build.builtin("Object.prototype")),
                ArrayLite.map(
                  cachess,
                  (caches) => [
                    caches[0](),
                    caches[1]()])) :
              (
                Query.IsPropertyProto(node.properties[index]) ?
                Scope.cache(
                  scope,
                  "ExpressionObjectProto2",
                  Visit.node(node.properties[index].value, scope, false),
                  (cache) => self(index + 1, cache, cachess)) :
                Scope.cache(
                  scope,
                  "ExpressionObjectKey",
                  Query.GetPropertyStaticName(
                    node.properties[index],
                    () => Visit.node(node.properties[index].key, scope, false)),
                  (cache1) => Scope.cache(
                    scope,
                    "ExpressionObjectValue",
                    Visit.node(node.properties[index].value, scope, cache1),
                    (cache2) => (
                      cachess[cachess.length] = [cache1, cache2],
                      self(index + 1, cache, cachess))))))})
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
              cache1() :
              Build.sequence(
                (
                  // https://github.com/tc39/proposal-object-rest-spread
                  node.properties[index].type === "SpreadElement" ?
                  Build.apply(
                    Build.builtin("Object.assign"),
                    Build.primitive(void 0),
                    [
                      cache1(),
                      Visit.node(node.properties[index].argument, scope, false)]) :
                  (
                    Query.IsPropertyProto(node.properties[index]) ?
                    Build.apply(
                      Build.builtin("Reflect.setPrototypeOf"),
                      Build.primitive(void 0),
                      [
                        cache1(),
                        Scope.cache(
                          scope,
                          "ExpressionObjectProto3",
                          Visit.node(node.properties[index].value, scope, false),
                          closure)]) :
                    Scope.cache(
                      scope,
                      "ExpressionObjectKey",
                      Query.GetStaticPropertyName(
                        node.properties[index],
                        () => Visit.node(node.properties[index].key, scope, false)),
                      (cache2) => Build.apply(
                        Build.builtin("Reflect.defineProperty"),
                        Build.primitive(void 0),
                        [
                          cache1(),
                          cache2(),
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
                                Visit.node(node.properties[index].value, scope, false)]])])))),
                self(index + 1)))})))))
  (
    (cache) => Build.conditional(
      Build.binary(
        "===",
        Build.unary(
          "typeof",
          cache()),
        Build.primitive("object")),
      cache(),
      Build.conditional(
        Build.binary(
          "===",
          Build.unary(
            "typeof",
            cache()),
          Build.primitive("function")),
        cache(),
        Build.builtin("Object.prototype")))));

// Function's name are not propagated through sequences:
//
// > var o = {x:(123, function () {})}
// undefined
// > o
// { x: [Function] }
// > o.x.name
// ''
exports.SequenceExpression = (node, scope, options) => (
  (
    function self (index) { return (
      index === (node.expressions.length - 1) ?
      Visit.node(node.expressions[index], scope, options.dropped) :
      Build.sequence(
        Visit.node(node.expressions[index], scope, true),
        self(index + 1)))})
  (0));

exports.UnaryExpression = (node, scope, options) => (
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
          Visit.node(node.argument.object, scope, false)),
        (cache) => Object.del(
          Scope.$GetStrict(scope),
          cache,
          (
            node.argument.computed ?
            Visit.node(node.argument.property, scope, false) :
            Build.primitive(node.argument.property.name)))) :
      (
        node.argument.type === "Identifier" ?
        Scope.delete(scope, node.argument.name) :
        Build.sequence(
          Visit.node(node.argument, scope, true),
          Build.primitive(true)))) :
    Build.unary(
      node.operator,
      Visit.node(node.argument, scope, false))));

exports.BinaryExpression = (node, scope, options) => Build.binary(
  node.operator,
  Visit.node(node.left, scope, false)
  Visit.node(node.right, scope, false));

exports.AssignmentExpression = (node, scope, name) => (
  node.operator === "=" ?
  (
    node.left.type === "MemberExpression" ?
    Scope.cache(
      scope,
      "ExpressionAssignmentObject",
      (
        node.left.object.type === "Literal" ?
        node.left.object.value :
        Visit(node.left.object, scope, options2)),
      (cache1) => (
        options.dropped ?
        Object.set(
          Scope.$GetStrict(scope),
          cache1,
          (
            node.left.computed ?
            Visit.node(node.left.property, scope, options2) :
            Build.primitive(node.left.property.name)),
          Visit.node(node.right, scope, options2)) :
        Scope.cache(
          scope,
          "ExpressionAssignmentProperty",
          (
            node.left.computed ?
            (
              node.left.property.type === "Literal" ?
              node.left.property.value :
              Visit.node(node.left.property, scope, options2)) :
            node.left.property.name),
          (cache2) => Scope.cache(
            scope,
            "ExpressionAssignmentResult1",
            (
              node.right.type === "Literal" ?
              node.right.value :
              Visit.node(node.right, scope, options2)),
            (cache3) => Build.sequence(
              Object.set(
                Scope.$GetStrict(scope),
                cache1,
                cache2(),
                cache3()),
              cache3()))))) :
    (
      options.dropped ?
      Pattern.assign(
        scope,
        false,
        node.left,
        Visit.node(node.right, scope, options2)) :
      Scope.cache(
        scope,
        "ExpressionAssignmentResult2",
        (
          node.right.type === "Literal" ?
          node.right.value :
          Visit.node(node.right, scope, options2)),
        (cache) => Build.sequence(
          Pattern.assign(
            scope,
            false,
            node.left,
            cache),
          cache())))) :
  (
    node.left.type === "MemberExpression" ?
    Scope.cache(
      scope,
      "ExpressionAssignmentUpdateObject",
      (
        node.left.object.type === "Literal" ?
        node.left.object.value :
        Visit(node.left.object, scope, options2)),
      (cache1) => (
        Scope.cache(
          scope,
          "ExpressionAssignmentUpdateProperty",
          (
            node.left.computed ?
            (
              node.left.property.type === "Literal" ?
              node.left.property.value :
              Visit.node(node.left.property, scope, options2)) :
            node.left.property.name),
          (cache2) => (
            options.dropped ?
            Object.set(
              Scope.$GetStrict(scope),
              cache1,
              cache2(),
              Build.binary(
                global_Reflect_apply(
                  global_String_prototype_substring,
                  node.operator,
                  [0, node.operator.length - 1]),
                Object.get(
                  cache1,
                  cache2()),
                Visit.node(node.right, scope, options2))) :
            Scope.cache(
              scope,
              "ExpressionAssignmentUpdateResult1",
              Build.binary(
                global_Reflect_apply(
                  global_String_prototype_substring,
                  node.operator,
                  [0, node.operator.length - 1]),
                Object.get(
                  cache1,
                  cache2()),
                Visit.node(node.right, scope, options2)),
              (cache3) => Build.sequence(
                Object.set(
                  Scope.$GetStrict(scope),
                  cache1,
                  cache2(),
                  cache3()),
                cache3())))))) :
    (
      node.left.type === "Identifier" ?
      (
        options.dropped ?
        Scope.write(
          scope,
          node.left.name,
          Build.binary(
            global_Reflect_apply(
              global_String_prototype_substring,
              node.operator,
              [0, node.operator.length - 1]),
            Scope.read(scope, node.left.name),
            Visit.node(node.right, scope, options2))) :
        Scope.cache(
          scope,
          "ExpressionAssignmentUpdateResult2",
          Build.binary(
            global_Reflect_apply(
              global_String_prototype_substring,
              node.operator,
              [0, node.operator.length - 1]),
            Scope.read(scope, node.left.name),
            Visit.node(node.right, scope, options2)),
          (cache) => Build.sequence(
            Scope.write(
              scope,
              node.left.name,
              cache()),
            cache()))) :
      (
        (
          () => { throw new Error("Invalid update left-hand saide") })
        ()))));

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
exports.UpdateExpression = (node, scope, options) => (
  node.argument.type === "Identifier" ?
  (
    options.dropped ?
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
            cache() :
            Build.binary(
              node.operator[0],
              cache(),
              Build.primitive(1)))),
        cache()))) :
  (
    node.argument.type === "MemberExpression" ?
    Scope.cache(
      scope,
      "ExpressionUpdateObject",
      (
        node.argument.object.type === "Literal" ?
        node.argument.object.value :
        Visit(node.argument.object, scope, options2)),
      (cache1) => (
        Scope.cache(
          scope,
          "ExpressionUpdateProperty",
          (
            node.argument.computed ?
            (
              node.argument.property.type === "Literal" ?
              node.argument.property.value :
              Visit(node.argument.property, scope, options2)) :
            node.argument.property.name),
          (cache2) => (
            options.dropped ?
            Object.set(
              Scope.$GetStrict(scope),
              cache1,
              cache2(),
              Build.binary(
                node.operator[0],
                Object.get(
                  cache1,
                  cache2()),
                Build.primitive(1))) :
            Scope.cache(
              scope,
              "ExpressionUpdateMemberResult",
              (
                node.prefix ?
                Object.get(
                  cache1,
                  cache2()) :
                Build.binary(
                  node.operator[0],
                  Object.get(
                    cache1,
                    cache2()),
                  Build.primitive(1))),
              (cache3) => Build.sequence(
                Object.set(
                  Scope.$GetStrict(scope),
                  cache1,
                  cache2(),
                  (
                    node.prefix ?
                    Build.binary(
                      node.operator[0],
                      cache3(),
                      Build.primitive(1)) :
                    cache3())),
                cache3())))))) :
    (
      (
        () => { throw new Error("Invalid left-hand side update") })
      ())));

exports.LogicalExpression = (node, scope, options) => Scope.cache(
  scope,
  "ExpressionLogicalLeft",
  Visit.node(node.left, scope, false),
  (cache) => Build.conditional(
    cache(),
    (
      node.operator === "&&" ?
      Visit.node(node.right, scope, options.dropped) :
      cache()),
    (
      node.operator === "||" ?
      Visit.node(node.right, scope, options.dropped) :
      cache())));

exports.ConditionalExpression = (node, scope, options) => Build.conditional(
  Visit.node(node.test, scope, false),
  Visit.node(node.consequent, scope, options.dropped),
  Visit.node(node.alternate, scope, options.dropped));

exports.NewExpression = (node, scope, options) => (
  ArrayLite.any(node.arguments, Query.IsElementSpread) ?
  Build.apply(
    Build.builtin("Reflect.construct"),
    Build.primitive(void 0),
    [
      Visit.node(node.callee, scope, false),
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
            Visit.node(node.argument, scope, false) :
            Build.apply(
              Build.builtin("Array.of"),
              Build.primitive(void 0),
              [
                Visit.node(node, scope, false)]))))]) :
  Build.construct(
    Visit.node(node.callee, scope, false),
    ArrayLite.map(
      node.arguments,
      (node) => Visit.node(node, scope, fasle))));

// Eval with spread element is not direct:
//
// > var x = "foo";
// undefined
// > function f () { var x = "bar"; return eval(...["x"])}
// undefined
// > f()
// 'foo'
exports.CallExpression = (node, scope, options) => (
  ArrayLite.some(node.arguments, Query.IsElementSpread) ?
  Scope.cache(
    scope,
    "ExpressionCallSpreadMemberObject",
    (
      node.callee.type === "MemberExpression" ?
      Visit.node(node.callee.object, scope, false) :
      void 0),
    (cache) => Build.apply(
      Build.builtin("Reflect.apply"),
      Build.primitive(void 0),
      [
        (
          node.callee.type === "MemberExpression" ?
          Object.get(
            cache,
            (
              node.callee.computed ?
              Visit.node(node.callee.property, scope, false) :
              Build.primitive(node.callee.property.name))) :
          Visit.node(node.callee, scope, false)),
        cache(),
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
              Visit.node(node.argument, scope, false) :
              Build.apply(
                Build.builtin("Array.of"),
                Build.primitive(void 0),
                [
                  Visit.node(node, scope, false)]))))])) :
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
                cache1(),
                Build.builtin("eval")),
              Build.eval(
                caches[0]()),
              Build.apply(
                cache1(),
                Build.primitive(void 0),
                ArrayLite.map(
                  caches,
                  (cache) => cache()))) :
            Scope.cache(
              scope,
              "ExpressionCallEvalArgument",
              Visit.node(node.arguments[index], scope, false),
              (cache) => (
                caches[caches.length] = cache,
                self(index + 1, caches))))})
        (0, []))) :
    (
      node.callee.type === "MemberExpression" ?
      Scope.cache(
        scope,
        "ExpressionCallMemberObject",
        Visit.node(node.callee.object, scope, false),
        (cache) => Build.apply(
          Object.get(
            cache,
            (
              node.callee.computed ?
              Visit.node(node.callee.property, scope, false) :
              Build.primitive(node.callee.property.name)),
                Scope.read(scope, token)]),
          cache,
          ArrayLite.map(
            node.arguments,
            (node) => Visit.node(node, scope, false)))) :
      Build.apply(
        Visit.node(node.callee, scope, false),
        Build.primitive(void 0),
        ArrayLite.map(
          node.arguments,
          (node) => Visit.node(node, scope, false))))))


exports.MemberExpression = (node, scope, name) => Scope.cache(
  scope,
  "ExpressionMemberObject",
  Visit.node(node.object, scope),
  (cache) => Object.get(
    cache,
    (
      node.computed ?
      Visit.node(node.property, scope, "") :
      Build.primitive(node.property.name))));

exports.MetaProperty = (node, scope, name) => Scope.read(scope, "new.target");

exports.Identifier = (node, scope, name) => Scope.read(scope, node.name);

exports.Literal = (node, scope, name) => (
  node.regex ?
  Build.construct(
    Build.builtin("RegExp"),
    [
      Build.primitive(node.regex.pattern),
      Build.primitive(node.regex.flags)]) :
  Build.primitive(node.value));

exports.TemplateLiteral = (node, scope, options) => (
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
            Visit.node(node.expressions[index], scope, false)))))})
  (0));

exports.TaggedTemplateExpression = (node, scope, options) => Build.apply(
  Visit.node(node.tag, scope, false),
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
      (node) => Visit.node(node, scope, false))));

exports.ArrowFunctionExpression = Closure.ArrowFunctionExpression;

exports.FunctionExpression = Closure.FunctionExpression;
