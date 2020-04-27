
const ArrayLite = require("array-lite");

const Build = require("../build.js");
const Scope = require("../scope");
const Object = require("../object.js");
const Visit = require("./index.js");
const Util = require("../../throw.js");
const Query = require("../query.js");

const global_Reflect_apply = global.Reflect.apply;
const global_String_prototype_substring = global.String.prototype.substring;

/////////////////
// Environment //
/////////////////

exports.Identifier = ({name:identifier}, scope, dropped, cache) => Scope.read(scope, identifier);

exports.ThisExpression = ({}, scope, dropped, cache) => Scope.read(scope, "this");

exports.MetaProperty = ({meta:{name:identifier1}, property:{name:identifier2}}, scope, dropped, cache) => (
  (
    identifier1 !== "new" ||
    identifier2 !== "target")
  Util.Throw("According to the ESTree specification, only new.target is currently used for meta properties") :
  Scope.read(scope, "new.target"));

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
exports.AssignmentExpression = ({operator:operator, left:pattern, right:expression}, scope, dropped, cache) => (
  pattern.type === "MemberExpression" ?
  (
    (
      operator === "=" &&
      dropped &&
      Scope.$IsStrict(scope)) ?
    // Special Case #1:
    Object.set(
      true,
      Visit.expression(pattern.object, scope, false, null),
      (
        pattern.computed ?
        Visit.expression(pattern.property, scope, false, null) :
        Build.primitive(pattern.property.name, scope, false, null)),
      Visit.expression(expression, scope, false, null),
      null) :
    Scope.cache(
      scope,
      "ExpressionAssignmentMemberObject",
      (
        pattern.object.type === "Literal" ?
        pattern.object.value :
        Visit.expression(pattern.object, scope, false, null)),
      (cache1) => Scope[pattern.computed && pattern.property.type !== "Literal" ? "expression_cache" : "primitive_cache"](
        scope,
        "ExpressionAssignmentMemberProperty",
        (
          pattern.computed ?
          (
            pattern.property.type === "Literal" ?
            pattern.property.value :
            Visit.expression(pattern.property, scope, false, null)) :
          pattern.property.name),
        (cache2) => (
          (
            (any) => (
              (
                Scope.$IsStrict(scope) &&
                dropped) ?
              // Special Case #2:
              Object.set(
                true,
                Scope.get(scope, cache1),
                Scope.get(scope, cache2),
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
                (cache3) => Object.set(
                  Scope.$IsStrict(scope),
                  Object.obj(
                    () => Scope.get(scope, cache1)),
                  Scope.get(scope, cache2),
                  Scope.get(scope, cache3),
                  (
                    dropped ?
                    null :
                    Scope.get(scope, cache3))))))
          (
            operator === "=" ?
            (
              expression.type === "Literal" ?
              expression.value :
              Visit.expression(expression, scope, false, null)) :
            Build.binary(
              global_Reflect_apply(
                global_String_prototype_substring,
                operator,
                [0, operator.length - 1]),
              Object.get(
                Helper.obj(
                  () => Scope.get(scope, cache1)),
                Scope.get(scope, cache2)),
              Visit.expression(expression, scope, false, null))))))) :
  (
    pattern.type === "Identifier" ?
    (
      (
        (any) => (
          dropped ?
          Scope.write(
            scope,
            pattern.name,
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
                pattern.name,
                Scope.get(scope, cache2)),
              Scope.get(scope, cache2)))))
      (
        operator === "=" ?
        (
          expression.type === "Literal" ?
          expression.value :
          Visit.expression(
            expression,
            scope,
            false,
            Scope.$Cache(pattern.name))) :
        Build.binary(
          global_Reflect_apply(
            global_String_prototype_substring,
            operator,
            [0, operator.length - 1]),
          Scope.read(scope, pattern.name),
          // Name are not transmitted on update:
          //
          // > var f = "foo"
          // undefined
          // > f += function () {}
          // 'foofunction () {}'
          Visit.expression(expression, scope, false, null)))) :
    Pattern.assign2(pattern, expression, scope, false)));

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
exports.UpdateExpression = ({operator:operator, argument:expression}, scope, dropped, cache) => (
  expression.type === "MemberExpression" ?
  Scope[expression.object.type === Literal ? "primitive_cache" : "expression_cache"](
    scope,
    "ExpressionUpdateMemberObject",
    (
      expression.object.type === "Literal" ?
      expression.object.value :
      Visit(expression.object, scope, false, null)),
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
        expression.computed ?
        (
          expression.property.type === "Literal" ?
          expression.property.value :
          Visit(expression.property, scope, false, null)) :
        expression.property.name),
      (cache2) => (
        (
          Scope.$IsStrict(scope) &&
          dropped) ?
        // Special Case #1:
        Object.set(
          true,
          Scope.get(scope, cache1),
          Scope.get(scope, cache2),
          Build.binary(
            operator[0],
            Object.get(
              Object.obj(
                () => Scope.get(scope, cache1)),
              Scope.get(scope, cache2)),
            Build.primitive(1))) :
        (
          (
            dropped ||
            update.prefix) ?
          // Special Case #2:
          Scope.cache(
            scope,
            "ExpressionUpdateMemberRight2",
            Build.binary(
              operator[0],
              Object.get(
                Object.obj(
                  () => Scope.get(scope, cache1)),
                Scope.get(scope, cache2)),
              Build.primitive(1)),
            (cache3) => Object.set(
              Scope.$IsStrict(scope),
              (
                Scope.$IsStrict(scope) ?
                Scope.get(scope, cache1) :
                Object.obj(
                  () => Scope.get(scope, cache1))),
              Scope.get(scope, cache2),
              Scope.get(scope, cache3),
              (
                dropped ?
                null :
                Scope.get(scope, cache3)))) :
          (
            Scope.$IsStrict(scope) ?
            // Special Case #3:
            Scope.cache(
              scope,
              "ExpressionUpdateMemberResult3",
              (
                update.prefix ?
                Build.binary(
                  operator[0],
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
                  update.prefix ?
                  Scope.get(scope, cache3) :
                  Build.binary(
                    operator[0],
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
                  operator[0],
                  Scope.get(scope, cache3),
                  Build.primitive(1)),
                (cache4) => Object.set(
                  Scope.$IsStrict(scope),
                  (
                    Scope.$IsStrict(scope) ?
                    Scope.get(scope, cache1) :
                    Object.obj(
                      () => Scope.get(scope, cache1))),
                  Scope.get(scope, cache2),
                  Scope.get(scope, cache4),
                  (
                    dropped ?
                    null :
                    (
                      update.prefix ?
                      Scope.get(scope, cache4) :
                      Scope.get(scope, cache3))))))))))) :
  (
    expression.type === "Identifier" ?
    (
      dropped ?
      Scope.write(
        scope,
        expression.name,
        Build.binary(
          operator[0],
          Scope.read(scope, expression.name),
          Build.primitive(1))) :
      Scope.cache(
        scope,
        "ExpressionUpdateResult",
        (
          update.prefix ?
          Build.binary(
            operator[0],
            Scope.read(scope, expression.name),
            Build.primitive(1)) :
          Scope.read(scope, expression.name)),
        (cache) => Build.sequence(
          Scope.write(
            scope,
            expression.name,
            (
              update.prefix ?
              Scope.get(scope, cache) :
              Build.binary(
                operator[0],
                Scope.get(scope, cache),
                Build.primitive(1)))),
          Scope.get(scope, cache)))) :
    Util.Throw("Invalid left-hand side update")));

//////////////
// Literal //
//////////////

exports.Literal = ({value:value, regex:regex}, scope, dropped, cache) => (
  value instanceof global_RegExp ?
  Build.construct(
    Build.builtin("RegExp"),
    [
      Build.primitive(regex.pattern),
      Build.primitive(regex.flags)]) :
  Build.primitive(value));
 
exports.TemplateLiteral = ({quasis:template_elements, expressions:expressions}, scope, dropped, cache) => (
  (
    function self (index) { return (
      index === template_elements.length ?
      Build.primitive("") :
      (
        template_elements[index].tail ?
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
            Visit.expression(expressions[index], scope, false, null)))))})
  (0));

exports.TaggedTemplateExpression = ({tag:expression, quasi:{quasis:template_elements, expressions:expressions}}, scope, dropped, cache) => Build.apply(
  Visit.expression(expression, scope),
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
                  template_elements,
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
                          template_elements,
                          (element) => Build.primitive(element.value.raw)))])])])])],
    ArrayLite.map(
      expressions,
      (expression) => Visit.expression(expression, scope, false, null))));

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
exports.SequenceExpression = ({expressions:expressions}, scope, dropped, cache) => (
  (
    function self (index) { return (
      index === (expressions.length - 1) ?
      Visit.expression(expressions[index], scope, dropped, null) :
      Build.sequence(
        Visit.expression(expressions[index], scope, true, null),
        self(index + 1)))})
  (0));

exports.LogicalExpression = ({operator:operator, left:expression1, right:expression2}, scope, dropped, cache) => Scope.cache(
  scope,
  "ExpressionLogicalLeft",
  Visit.expression(expression1, scope, false, null),
  (cache) => Build.conditional(
    Scope.get(scope, cache),
    (
      operator === "&&" ?
      Visit.expression(expression2, scope, dropped, null) :
      Scope.get(scope, cache)),
    (
      operator === "||" ?
      Visit.expression(expression2, scope, dropped, null) :
      Scope.get(scope, cache))));

exports.ConditionalExpression = ({test:expression1, consequent:expression2, alternate:expression3}, scope, dropped, cache) => Build.conditional(
  Visit.expression(expression1, scope, false, null),
  Visit.expression(expression2, scope, dropped, cache),
  Visit.expression(expression3, scope, dropped, cache));

/////////////////
// Combination //
/////////////////

exports.ArrayExpression = ({elements:elements}, scope, dropped, cache) => (
  ArrayLite.every(
    elements,
    (element) => (
      element !== null &&
      element.type !== "SpreadElement")) ?
  Build.apply(
    Build.builtin("Array.of"),
    Build.primitive(void 0),
    ArrayLite.map(
      elements,
      (element) => Visit.expression(element, scope, false, null))) :
  Build.apply(
    Build.builtin("Array.prototype.concat"),
    Build.apply(
      Build.builtin("Array.of"),
      Build.primitive(void 0),
      []),
    ArrayLite.map(
      elements,
      (element) => (
        element === null ?
        Build.apply(
          Build.builtin("Array"),
          Build.primitive(void 0),
          [
            Build.primitive(1)]) :
        (
          element.type === "SpreadElement" ?
          Visit.expression(element.argument, scope, false, null) :
          Build.apply(
            Build.builtin("Array.of"),
            Build.primitive(void 0),
            [
              Visit.expression(element, scope, false, null)]))))));

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

exports.ObjectExpression = ({properties:properties}, scope, dropped, nullable_cache, _closure, _nullable_cache, _caches1, _caches2) => (
  // 
  _closure = (cache) => Build.conditional(
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
      Build.builtin("Object.prototype"))),
  (
    ArrayLite.every(
      properties,
      (property) => (
        property.type !== "SpreadElement" &&
        property.kind === "init")) ?
    (
      ArrayLite.every(
        properties,
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
      // Special Case #1: 
      //   - Only init properties
      //   - Only side-effect free names
      //   - __proto__ only appears first
      Build.object(
        (
          (
            properties.length > 0 &&
            !properties[0].computed &&
            (
              properties[0].key.type === "Identifier" ?
              properties[0].key.name === "__proto__" :
              properties[0].key.value === "__proto__")) ?
          Scope.cache(
            scope,
            "ExpressionObjectProto1",
            Visit.expression(properties[0].value, scope, false, null),
            true,
            closure) :
          Build.builtin("Object.prototype")),
        ArrayLite.map(
          (
            (
              properties.length > 0 &&
              !properties[0].computed &&
              (
                properties[0].key.type === "Identifier" ?
                properties[0].key.name === "__proto__" :
                properties[0].key.value === "__proto__")) ?
            ArrayLite.slice(properties, 1, properties.length) :
            properties),
          (property) => [
            (
              property.computed ?
              Visit.expression(property.key, scope, false, null) :
              Build.primitive(
                (
                  property.key.type === "Identifier" ?
                  property.key.name :
                  property.key.value))),
            Scope.cache(
              scope,
              "ExpressionObjectKey1",
              Build.primitive(
                (
                  property.computed ?
                  (
                    property.type === "Literal" ?
                    property.value :
                    void 0) :
                  property.name)),
                true,
                (cache) => Visit.expression(property.value, scope, false, cache))])) :
      // Special Case #2: Only init properties //
      (
        _nullable_cache = null,
        _caches1 = [],
        _caches2 = [],
        Util.Fix(
          properties,
          (property, next) => (
            (
              !properties[index].computed &&
              (
                properties[index].key.type === "Identifier" ?
                properties[index].key.name === "__proto__" :
                properties[index].key.value === "__proto__")) ?
            Scope.cache(
              scope,
              "ExpressionObjectProto2",
              // No name for __proto__ propeties:
              //
              // > var o = {__proto__: function () {}}
              // undefined
              // > Reflect.getPrototypeOf(o).name
              // ''
              Visit.expression(property.value, scope, false, null),
              (cache) => (
                _nullable_cache = cache,
                next())) :
            Scope.cache(
              scope,
              "ExpressionObjectKey2",
              (
                property.computed ?
                Visit.expression(property.key, scope, false, null) :
                Build.primitive(
                  (
                    property.key.type === "Identifier" ?
                    property.key.name :
                    property.key.value))),
              (cache1) => Scope.cache(
                scope,
                "ExpressionObjectValue",
                Visit.expression(properties[index].value, scope, false, cache1),
                (cache2) => (
                  _caches1[_caches1.length] = cache1,
                  _caches2[_caches2.length] = cache2,
                  next())))),
          () => Build.object(
            (
              _nullable_cache === null ?
              Build.builtin("Object.prototype") :
              closure(_nullable_cache)),
            ArrayLite.map(
              _caches1,
              (cache, index) => [
                Scope.get(scope, cache),
                Scope.get(scope, _caches2[index])]))))) :
    // General Case //
    Scope.cache(
      scope,
      "ExpressionObjectResult",
      Build.object(
        Build.builtin("Object.prototype"),
        []),
      (cache1) => Util.Fix(
        properties,
        (property, next) => Build.sequence(
          (
            // https://github.com/tc39/proposal-object-rest-spread
            property.type === "SpreadElement" ?
            Build.apply(
              Build.builtin("Object.assign"),
              Build.primitive(void 0),
              [
                Scope.get(scope, cache1),
                Visit.expression(property.argument, scope, false, null)]) :
            (
              (
                !property.computed &&
                (
                  property.key.type === "Identifier" ?
                  property.key.name === "__proto__" :
                  property.key.value === "__proto__")) ?
              Build.apply(
                Build.builtin("Reflect.setPrototypeOf"),
                Build.primitive(void 0),
                [
                  Scope.get(scope, cache1),
                  Scope.cache(
                    scope,
                    "ExpressionObjectProto3",
                    Visit.expression(property.value, scope, false, null),
                    closure)]) :
              Scope.cache(
                scope,
                "ExpressionObjectKey3",
                (
                  property.computed ?
                  Visit.expression(property.key, scope, false, null) :
                  Build.primitive(
                    (
                      property.key.type === "Identifier" ?
                      property.key.name :
                      property.key.value))),
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
                            properties[index].kind === "init" ?
                            "value" :
                            properties[index].kind),
                          Visit.expression(properties[index].value, scope, false, null)]])])))),
        () => Scope.get(scope, cache1))
        (
          function self (index) { return (
            index === properties.length ?
            Scope.get(scope, cache1) :
            Build.sequence(
              (
                // https://github.com/tc39/proposal-object-rest-spread
                properties[index].type === "SpreadElement" ?
                Build.apply(
                  Build.builtin("Object.assign"),
                  Build.primitive(void 0),
                  [
                    Scope.get(scope, cache1),
                    Visit.expression(properties[index].argument, scope, false, null)]) :
                (
                  (
                    !properties[index].computed &&
                    (
                      properties[index].key.type === "Identifier" ?
                      properties[index].key.name === "__proto__" :
                      properties[index].key.value === "__proto__")) ?
                  Build.apply(
                    Build.builtin("Reflect.setPrototypeOf"),
                    Build.primitive(void 0),
                    [
                      Scope.get(scope, cache1),
                      Scope.cache(
                        scope,
                        "ExpressionObjectProto3",
                        Visit.expression(properties[index].value, scope, false, null),
                        closure)]) :
                  Scope.cache(
                    scope,
                    "ExpressionObjectKey3",
                    (
                      properties[index].key.type === "Literal" ?
                      properties[index].key.value :
                      (
                        properties[index].key.computed ?
                        Visit.expression(properties[index].key, scope, false, null) :
                        properties[index].key.name)),
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
                                properties[index].kind === "init" ?
                                "value" :
                                properties[index].kind),
                              Visit.expression(properties[index].value, scope, false, null)]])])))),
              self(index + 1)))}))));

exports.UnaryExpression = ({operator:operator, argument:expression}, scope, dropped, cache) => (
  (
    operator === "typeof" &&
    expression.type === "Identifier") ?
  Scope.typeof(scope, expression.name) :
  (
    operator === "delete" ?
    (
      expression.type === "MemberExpression" ?
      Scope.cache(
        scope,
        "ExpressionUnaryDeleteObject",
        (
          expression.object.type === "Literal" ?
          expression.object.value :
          Visit.expression(expression.object, scope, false, null)),
        (cache) => Object.del(
          Scope.$IsStrict(scope),
          Object.obj(
            () => Scope.get(scope, cache)),
          (
            expression.computed ?
            Visit.expression(expression.property, scope, false, null) :
            Build.primitive(expression.property.name)))) :
      (
        expression.type === "Identifier" ?
        Scope.delete(scope, expression.name) :
        Build.sequence(
          Visit.expression(expression, scope, true, null),
          Build.primitive(true)))) :
    Build.unary(
      operator,
      Visit.expression(expression, scope, false, null))));

exports.BinaryExpression = ({operator:operator, left:expression1, right:expression2}, scope, dropped, cache) => Build.binary(
  operator,
  Visit.expression(expression1, scope, false, null),
  Visit.expression(expression2, scope, false, null));

exports.NewExpression = ({callee:expression, arguments:arguments}, scope, dropped, cache) => (
  ArrayLite.every(
    arguments,
    (argument) => argument.type !== "SpreadElement") ?
  Build.construct(
    Visit.expression(expression, scope, false, null),
    ArrayLite.map(
      arguments,
      (argument) => Visit.expression(argument, scope, false, null))) :
  Build.apply(
    Build.builtin("Reflect.construct"),
    Build.primitive(void 0),
    [
      Visit.expression(expression, scope, false, null),
      Build.apply(
        Build.builtin("Array.prototype.concat"),
        Build.apply(
          Build.builtin("Array.of"),
          Build.primitive(void 0),
          []),
        ArrrayLite.map(
          arguments,
          (argument) => (
            argument.type === "SpreadElement" ?
            Visit.expression(argument.argument, scope, false, null) :
            Build.apply(
              Build.builtin("Array.of"),
              Build.primitive(void 0),
              [
                Visit.expression(argument, scope, false, null)]))))]));

// Eval with spread element is not direct:
//
// > var x = "foo";
// undefined
// > function f () { var x = "bar"; return eval(...["x"])}
// undefined
// > f()
// 'foo'
exports.CallExpression = ({callee:expression, arguments:arguments}, scope, dropped, cache) => (
  ArrayLite.every(
    arguments,
    (argument) => argument.type !== "SpreadElement") ?
  (
    (
      expression.type === "Identifier" &&
      expression.name === "eval" &&
      arguments.length > 0) ?
    Scope.cache(
      scope,
      "ExpressionCallEvalCallee",
      Scope.read(scope, "eval"),
      (cache) => (
        (
          function self (index, caches) { return (
            index === arguments.length ?
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
              Visit.expression(arguments[index], scope, false, null),
              (cache) => (
                caches[caches.length] = cache,
                self(index + 1, caches))))})
        (0, []))) :
    (
      expression.type === "MemberExpression" ?
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
        Visit.expression(expression.object, scope),
        (cache) => Build.apply(
          Object.get(
            Object.obj(
              () => Scope.get(scope, cache)),
            (
              expression.computed ?
              Visit.expression(expression.property, scope, false, null) :
              Build.primitive(expression.property.name))),
            Scope.get(scope, cache),
            ArrayLite.map(
              arguments,
              (argument) => Visit.expression(argument, scope, false, null)))) :
      Build.apply(
        Visit.expression(expression, scope, false, null),
        Build.primitive(void 0),
        ArrayLite.map(
          arguments,
          (argument) => Visit.expression(argument, scope, false, null))))) :
  Scope.cache(
    scope,
    "ExpressionCallSpreadMemberObject",
    (
      expression.type === "MemberExpression" ?
      Visit.expression(expression.object, scope) :
      void 0),
    (cache) => Build.apply(
      Build.builtin("Reflect.apply"),
      Build.primitive(void 0),
      [
        (
          expression.type === "MemberExpression" ?
          Object.get(
            Object.obj(
              () => Scope.get(scope, cache)),
            (
              expression.computed ?
              Visit.expression(expression.property, scope, false, null) :
              Build.primitive(expression.property.name))) :
          Visit.expression(expression, scope)),
        Scope.get(scope, cache),
        Build.apply(
          Build.builtin("Array.prototype.concat"),
          Build.apply(
            Build.builtin("Array.of"),
            Build.primitive(void 0),
            []),
          ArrayLite.map(
            arguments,
            (argument) => (
              argument.type === "SpreadElement" ?
              Visit.expression(argument.argument, scope, false, null) :
              Build.apply(
                Build.builtin("Array.of"),
                Build.primitive(void 0),
                [
                  Visit.expression(argument, scope, false, null)]))))])));

exports.MemberExpression = ({computed:is_computed, object:expression1, property:expression2}, scope, dropped, cache) => Scope.cache(
  scope,
  "ExpressionMemberObject",
  (
    expression1.type === "Literal" ?
    expression1.value :
    Visit.expression(expression1, scope, false, null)),
  (cache) => Object.get(
    Object.obj(
      () => Scope.get(scope, cache)),
    (
      is_computed ?
      Visit.expression(expression2, scope, false, null) :
      Build.primitive(expression2.name))));

/////////////
// Closure //
/////////////

exports.ArrowFunctionExpression = ({params:patterns, body:closure_body, generator:is_generator, async:is_async, expression:is_expression}, scope, dropped, cache, _names) => (
  is_generator ?
  Util.Throw("Unfortunately, Aran does not support generator arrows (yet)...") :
  (
    is_async ?
    Util.Throw("Unfortunately, Aran does not support asynchronous arrows (yet)...") :
    (
      _names = (
        is_expression ?
        [] :
        Collect.VarESTreeNames(closure_body.body)),
      Build.apply(
        Build.builtin("Object.defineProperty"),
        Build.primitive(void 0),
        [
          Build.apply(
            Build.builtin("Object.defineProperty"),
            Build.primitive(void 0),
            [
              Build.closure(
                Scope.CLOSURE(
                  scope,
                  (
                    !is_expression &&
                    Query.IsStrict(closure_body.body)),
                  ArrayLite.flatMap(
                    patterns,
                    (pattern) => Collect.Pattern(pattern)),
                  [],
                  (scope) => ArrayLite.concat(
                    Build.Expression(
                      Build.conditional(
                        Scope.parameter("new.target"),
                        Build.throw(
                          Build.construct(
                            Build.builtin("TypeError"),
                            [
                              Build.primitive("arrow is not a constructor")])),
                        Build.primitive(void 0))),
                    ArrayLite.flatMap(
                      patterns,
                      (pattern, index) => (
                        pattern.type
                        Build.Expression(
                        Scope.cache(
                          scope,
                          "VisitExpressionArrowFunctionExpression",
                          
                          pattern,
                          
                        Pattern.assign1(
                          (
                            pattern.type === "RestElement" ?
                            pattern.argument :
                            pattern),
                            
                          scope,
                          true,
                          
                          (
                            pattern.type === "RestElement" ?
                            Build.apply(
                              Build.builtin("Array.prototype.slice"),
                              Scope.parameter("arguments"),
                              [
                                Build.primitive(index)]) :
                            Object.get(
                              Scope.parameter("arguments"),
                              Build.primitive(index)))))),
                    (
                      node.expression ?
                      Build.Return(
                        Visit.node(closure_body, scope, false, null)) :
                      ArrayLite.concat(
                        Build.Block(
                          [],
                          Scope.BLOCK(
                            scope,
                            false,
                            ArrayLite.concat(
                              _names,
                              Collect.Lets(closure_body.body)),
                            Collect.Consts(closure_body.body),
                            (scope) => ArrayLite.concat(
                              ArrayLite.flatMap(
                                _names,
                                (esidentifier) => Build.Expression(
                                  Scope.initialize(
                                    scope,
                                    esidentifier,
                                    Build.primitive(void 0)))),
                              Block.Body(
                                closure_body.body,
                                scope,
                                Lexic.CreateArrow())))),
                        Build.Return(
                          Build.primitive(void 0))))))),
              Build.primitive("length"),
              Build.object(
                Build.primitive(null),
                [
                  [
                    Build.primitive("value"),
                    Build.primitive(
                      (
                        (
                          patterns.length > 0 &&
                          patterns[patterns.length - 1].type === "RestElement") ?
                        patterns.length - 1 :
                        patterns.length))],
                  [
                    Build.primitive("configurable"),
                    Build.primitive(true)]])]),
          Build.primitive("name"),
          Build.object(
            Build.primitive(null),
            [
              [
                Build.primitive("value"),
                (
                  cache === null ?
                  Build.primitive("") :
                  Scope.get(scope, cache))],
              [
                Build.primitive("configurable"),
                Build.primitive(true)]])]));

// https://tc39.github.io/ecma262/#sec-function-instances

// Two different scope frame:
// ==========================
// > function f (x = y) { var y; return x; } 
// undefined
// > y
// Thrown:
// ReferenceError: y is not defined
// > f()
// Thrown:
// ReferenceError: y is not defined
//     at f (repl:1:17)

exports.FunctionExpression = ({id:{name:nullable_identifier}={name:null}, params:patterns, body:body, generator:is_generator, async:is_async, expression:is_expression}, scope, dropped, cache) => (
  is_generator ?
  Util.Throw("Unfortunately, Aran does not support generator functions (yet)...") :
  (
    Util.Throw("Unfortunately, Aran does not support asynchronous functions (yet)...") :
    (
      _identifiers1 = ArrayLite.flatMap(
        patterns,
        (param) => Collect.Pattern(param)),
      _identifiers2 = (
        is_expression ?
        [] :
        Collect.Vars(closure_body.body)),
      _expression = Scope.cache(
        scope,
        "ClosureFunctionResult",
        Build.primitive(null),
        (cache) => Build.sequence(
          Scope.set(
            scope,
            cache,
            Build.apply(
              Build.builtin("Object.defineProperty"),
              Build.primitive(void 0),
              [
                Build.apply(
                  Build.builtin("Object.defineProperty"),
                  Build.primitive(void 0),
                  [
                    Build.closure(
                      // function f (arguments = arguments) { return arguments }
                      // Thrown:
                      // ReferenceError: Cannot access 'arguments' before initialization
                      //     at f (repl:1:25)
                      Scope.CLOSURE(
                        scope,
                        (
                          !is_expression &&
                          Query.IsStrict(closure_body.body)),
                        ArrayLite.concat(
                          identifiers1,
                          (
                            ArrayLite.includes(identifiers1, "arguments") ?
                            [] :
                            ["arguments"]),
                          (
                            (
                              nullable_identifier === null ||
                              ArrayLite.includes(identifiers1, nullable_identifier)) ?
                            [] :
                            ["arguments"])),
                        ["new.target", "this"],
                        {
                          __proto__: null,
                          [(nullable_identifier === null || ArrayLite.includes(identifiers1, nullable_identifier)) ? "this" /* dirty trick */ : nullable_identifier]: () => Scope.get(scope, cache),
                          [ArrayLite.includes(esidentifier1, "arguments") ? "this" /* dirty trick */ : "arguments"]: () => Build.apply(
                            Build.builtin("Object.defineProperty"),
                            Build.primitive(void 0),
                            [
                              Build.apply(
                                Build.builtin("Object.defineProperty"),
                                Build.primitive(void 0),
                                [
                                  Build.apply(
                                    Build.builtin("Object.defineProperty"),
                                    Build.primitive(void 0),
                                    [
                                      Build.apply(
                                        Build.builtin("Object.assign"),
                                        Build.primitive(void 0),
                                        [
                                          Build.object(
                                            Build.primitive("Object.prototype"),
                                            []),
                                          Scope.parameter("arguments")]),
                                      Build.primitive("length"),
                                      Build.object(
                                        Build.primitive(null),
                                        [
                                          [
                                            Build.primitive("value"),
                                            Object.get(
                                              Scope.arguments(scope),
                                              Build.primitive("length"))],
                                          [
                                            Build.primitive("writable"),
                                            Build.primitive(true)],
                                          [
                                            Build.primitive("configurable"),
                                            Build.primitive(true)]])]),
                                  Build.primitive("callee"),
                                  Build.object(
                                    Build.primitive(null),
                                    (
                                      Scope.$GetStrict(scope) ?
                                      [
                                        [
                                          Build.primitive("get"),
                                          Build.builtin("Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').get")],
                                        [
                                          Build.primitive("set"),
                                          Build.builtin("Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').set")]] :
                                      [
                                        [
                                          Build.primitive("value"),
                                          Scope.callee(scope)],
                                        [
                                          Build.primitive("writable"),
                                          Build.primitive(true)],
                                        [
                                          Build.primitive("configurable"),
                                          Build.primitive(true)]]))]),
                              Build.builtin("Symbol.iterator"),
                              Build.object(
                                Build.primitive(null),
                                [
                                  [
                                    Build.primitive("value"),
                                    Build.builtin("Array.prototype.values")],
                                  [
                                    Build.primitive("writable"),
                                    Build.primitive(true)],
                                  [
                                    Build.primitive("configurable"),
                                    Build.primitive(true)]])]),
                          ["new.target"]: () => Scope.parameter("new.target"),
                          ["this"]: () => (
                            Scope.$IsStrict(scope) ?
                            Scope.parameter("this") :
                            Build.conditional(
                              Build.binary(
                                "===",
                                Scope.parameter("this"),
                                Build.primitive(null)),
                              Build.builtin("global"),
                              Build.conditional(
                                Build.binary(
                                  "===",
                                  Scope.parameter("this"),
                                  Build.primitive(void 0)),
                                Build.builtin("global"),
                                Build.apply(
                                  Build.builtin("Object"),
                                  Build.primitive(void 0),
                                  [
                                    Scope.parameter("this")]))))},
                        (scope) => ArrayLite.concat(
                            ArrayLite.flatMap(
                              patterns,
                              (param, index) => Build.Expression(
                                Pattern.assign1(
                                  scope,
                                  true,
                                  (
                                    param.type === "RestElement" ?
                                    param.argument :
                                    param),
                                  (
                                    param.type === "RestElement" ?
                                    Build.apply(
                                      Build.builtin("Array.prototype.slice"),
                                      Scope.arguments(scope),
                                      [
                                        Build.primitive(index)]) :
                                    Object.get(
                                      Scope.arguments(scope),
                                      Build.primitive(index)))))),
                            (
                              is_expression ?
                              Build.Return(
                                Scope.cache(
                                  scope,
                                  "StatementReturnArgument",
                                  Visit.node(node.argument, scope, false, null),
                                  (cache) => Build.conditional(
                                    Scope.read(scope, "new.target"),
                                    Build.conditional(
                                      Build.binary(
                                        "===",
                                        Build.unary(
                                          "typeof",
                                          Scope.get(scope, cache)),
                                        Build.primitive("object")),
                                      Build.conditional(
                                        Scope.get(scope, cache),
                                        Scope.get(scope, cache),
                                        Scope.read(scope, "this")),
                                      Build.conditional(
                                        Build.binary(
                                          "===",
                                          Build.unary(
                                            "typeof",
                                            Scope.get(scope, cache)),
                                          Build.primitive("function")),
                                        Scope.get(scope, cache),
                                        Scope.read(scope, "this"))),
                                    Scope.get(scope, cache)))) :
                              ArrayLite.concat(
                                Build.Block(
                                  [],
                                  Scope.BLOCK(
                                    scope,
                                    false,
                                    Collect.Lets(closure_body.body),
                                    Collect.Consts(closure_body.body),
                                    (scope) => Block.Body(
                                      closure_body.body,
                                      scope,
                                      Lexic.CreateFunction()))),
                                Build.Return(
                                  Build.conditional(
                                    Scope.read(scope, "new.target"),
                                    Scope.read(scope, "this"),
                                    Build.primitive(void 0)))))))),
                    Build.primitive("length"),
                    Build.object(
                      Build.primitive(null),
                      [
                        [
                          Build.primitive("value"),
                          Build.primitive(
                            (
                              (
                                params.length > 0 &&
                                params[params.length - 1].type === "RestElement") ?
                              params.length - 1 :
                              params.length))],
                        [
                          Build.primitive("configurable"),
                          Build.primitive(true)]])]),
                Build.primitive("name"),
                Build.object(
                  Build.primitive(null),
                  [
                    [
                      Build.primitive("value"),
                      options.name()],
                    [
                      Build.primitive("configurable"),
                      Build.primitive(true)]])])),
          Build.sequence(
            Build.apply(
              Build.builtin("Reflect.set"),
              Build.primitive(void 0),
              [
                Scope.get(scope, cache2),
                Build.primitive("prototype"),
                Build.apply(
                  Build.builtin("Object.defineProperty"),
                  Build.primitive(void 0),
                  [
                    Build.object(
                      Build.builtin("Object.prototype"),
                      []),
                    Build.primitive("constructor"),
                    Build.object(
                      Build.primitive(null),
                      [
                        [
                          Build.primitive("value"),
                           Scope.get(scope, cache1)],
                        [
                          Build.primitive("writable"),
                          Build.primitive(true)],
                        [
                          Build.primitive("configurable"),
                          Build.primitive(true)]])])]),
            Scope.get(scope, cache2)))),
      (
        (
          Scope.$IsStrict(scope) ||
          (
            !is_expression &&
            Query.IsStrict(closure_body.body))),
        _expression :
        Build.apply(
          Build.builtin("Object.defineProperty"),
          Build.primitive(void 0),
          [
            Build.apply(
              Build.builtin("Object.defineProperty"),
              Build.primitive(void 0),
              [
                _expression,
                Build.primitive("arguments"),
                Build.object(
                  Build.primitive(null),
                  [
                    [
                      Build.primitive("value"),
                      Build.primitive(null)]])]),
            Build.primitive("caller"),
            Build.object(
              Build.primitive(null),
              [
                [
                  Build.primitive("value"),
                  Build.primitive(null)]])])))));

/////////////////
// Unsupported //
/////////////////

exports.YieldExpression = ({argument:nullable_expression, delegate:is_delegate}, scope, dropped, cache) => Util.Throw("Unfortunately, Aran does not support yield expressions (yet)...");

exports.AwaitExpression = ({argument:expression}, scope, dropped, cache) => Util.Throw("Unfortunately, Aran does support await expressions (yet)...");

exports.ClassExpression = ({id:{name:nullable_identifier}={name:null}, superClass:nullable_expression, body:class_body}, scope, dropped, cache) => Util.Throw("Unfortunately, Aran does not support class expressions (yet)...");
