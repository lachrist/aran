
const ArrayLite = require("array-lite");

const Build = require("../build.js");
const Scope = require("../scope");
const Object = require("../object.js");
const Visit = require("./index.js");
const Util = require("../../throw.js");
const Query = require("../query/index.js");

const global_Reflect_apply = global.Reflect.apply;
const global_String_prototype_substring = global.String.prototype.substring;

/////////////////
// Environment //
/////////////////

exports.Identifier = (node, scope, dropped, box) => Scope.read(scope, identifier.name);

exports.ThisExpression = (node, scope, dropped, box) => Scope.read_this(scope, "this");

exports.MetaProperty = (node, scope, dropped, box) => (
  (
    node.meta.name !== "new" ||
    node.property.name !== "target") ?
  (
    (() => { throw new global_Error("Only new.target is supported as meta property") })
    ()) :
  Scope.read_new_target(scope));

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
exports.AssignmentExpression = (node, scope, dropped, box) => (
  node.left.type === "MemberExpression" ?
  (
    (
      node.operator === "=" &&
      dropped &&
      Scope.$IsStrict(scope)) ?
    // Special Case #1:
    Object.set(
      true,
      Visit.expression(node.left.object, scope, false, null),
      (
        node.left.computed ?
        Visit.expression(node.left.property, scope, false, null) :
        Build.primitive(node.left.property.name, scope, false, null)),
      Visit.expression(node.right, scope, false, null),
      null) :
    Scope.box(
      scope,
      "ExpressionAssignmentMemberObject",
      (
        node.left.object.type === "Literal" ?
        node.left.object.value :
        Visit.expression(node.left.object, scope, false, null)),
      (box1) => Scope[node.left.computed && node.left.property.type !== "Literal" ? "expression_box" : "primitive_box"](
        scope,
        "ExpressionAssignmentMemberProperty",
        (
          node.left.computed ?
          (
            node.left.property.type === "Literal" ?
            node.left.property.value :
            Visit.expression(node.left.property, scope, false, null)) :
          node.left.property.name),
        (box2) => (
          (
            (any) => (
              (
                Scope.$IsStrict(scope) &&
                dropped) ?
              // Special Case #2:
              Object.set(
                true,
                Scope.get(scope, box1),
                Scope.get(scope, box2),
                (
                  (
                    typeof any === "object" &&
                    any !== null) ?
                  any :
                  Build.primitive(any)),
                null) :
              // General Case:
              Scope.box(
                scope,
                "ExpressionAssignmentMemberRight",
                any,
                (box3) => Object.set(
                  Scope.$IsStrict(scope),
                  Object.obj(
                    () => Scope.get(scope, box1)),
                  Scope.get(scope, box2),
                  Scope.get(scope, box3),
                  (
                    dropped ?
                    null :
                    Scope.get(scope, box3))))))
          (
            node.operator === "=" ?
            (
              expression.type === "Literal" ?
              expression.value :
              Visit.expression(node.right, scope, false, null)) :
            Build.binary(
              global_Reflect_apply(
                global_String_prototype_substring,
                node.operator,
                [0, node.operator.length - 1]),
              Object.get(
                Helper.obj(
                  () => Scope.get(scope, box1)),
                Scope.get(scope, box2)),
              Visit.expression(node.right, scope, false, null))))))) :
  (
    node.left.type === "Identifier" ?
    (
      (
        (any) => (
          dropped ?
          Scope.write(
            scope,
            node.left.name,
            (
              (
                typeof any === "object" &&
                any !== null) ?
              any :
              Build.primitive(any))) :
          Scope.box(
            scope,
            "AssignmentIdentifierRight",
            any,
            (box2) => Build.sequence(
              Scope.write(
                scope,
                node.left.name,
                Scope.get(scope, box2)),
              Scope.get(scope, box2)))))
      (
        operator === "=" ?
        (
          node.right.type === "Literal" ?
          node.right.value :
          Visit.expression(
            node.right,
            scope,
            false,
            Scope.$Box(node.left.name))) :
        Build.binary(
          global_Reflect_apply(
            global_String_prototype_substring,
            operator,
            [0, operator.length - 1]),
          Scope.read(scope, node.left.name),
          // Name are not transmitted on update:
          //
          // > var f = "foo"
          // undefined
          // > f += function () {}
          // 'foofunction () {}'
          Visit.expression(node.right, scope, false, null)))) :
    Pattern.assign2(node.left, node.right, scope, false)));

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
exports.UpdateExpression = (node, scope, dropped, box) => (
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
          Build.binary(
            node.operator[0],
            Object.get(
              Object.obj(
                () => Scope.get(scope, box1)),
              Scope.get(scope, box2)),
            Build.primitive(1))) :
        (
          (
            dropped ||
            update.prefix) ?
          // Special Case #2:
          Scope.box(
            scope,
            "ExpressionUpdateMemberRight2",
            Build.binary(
              node.operator[0],
              Object.get(
                Object.obj(
                  () => Scope.get(scope, box1)),
                Scope.get(scope, box2)),
              Build.primitive(1)),
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
                Build.binary(
                  node.operator[0],
                  Object.get(
                    Object.obj(
                      () => Scope.get(scope, box1)),
                    Scope.get(scope, box2)),
                  Build.primitive(1)) :
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
                  Build.binary(
                    node.operator[0],
                    Scope.get(scope, box3),
                    Build.primitive(1))),
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
                Build.binary(
                  node.operator[0],
                  Scope.get(scope, box3),
                  Build.primitive(1)),
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
        Build.binary(
          node.operator[0],
          Scope.read(scope, node.argument.name),
          Build.primitive(1))) :
      Scope.box(
        scope,
        "ExpressionUpdateResult",
        (
          update.prefix ?
          Build.binary(
            node.operator[0],
            Scope.read(scope, node.argument.name),
            Build.primitive(1)) :
          Scope.read(scope, node.argument.name)),
        (box) => Build.sequence(
          Scope.write(
            scope,
            node.argument.name,
            (
              update.prefix ?
              Scope.get(scope, box) :
              Build.binary(
                node.operator[0],
                Scope.get(scope, box),
                Build.primitive(1)))),
          Scope.get(scope, box)))) :
    Util.Throw("Invalid left-hand side update")));

//////////////
// Literal //
//////////////

exports.Literal = (node, scope, dropped, box) => (
  node.value instanceof global_RegExp ?
  Build.construct(
    Build.builtin("RegExp"),
    [
      Build.primitive(node.regex.pattern),
      Build.primitive(node.regex.flags)]) :
  Build.primitive(node.value));
 
exports.TemplateLiteral = (node, scope, dropped, box) => (
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
            Visit.expression(node.expressions[index], scope, false, null)))))})
  (0));

exports.TaggedTemplateExpression = (node, scope, dropped, box) => Build.apply(
  Visit.expression(node.tag, scope),
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
                  (template_element) => Build.primitive(template_element.value.cooked))),
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
                          (template_element) => Build.primitive(template_element.value.raw)))])])])])],
    ArrayLite.map(
      node.quasi.expressions,
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
exports.SequenceExpression = (node, scope, dropped, box) => ArrayLite.reduce(
  ArrayLite.slice(node.expressions, 1, node.elements.length),
  (aran_expression, expression, index, expressions) => Build.sequence(
    aran_expression,
    Visit.expression(
      expression,
      scope,
      (
        index === expressions.length - 1 ?
        dropped :
        true),
      null)),
  Visit.expression(node.expressions[0], scope, true, null));

exports.LogicalExpression = (node, scope, dropped, box) => Scope.box(
  scope,
  "ExpressionLogicalLeft",
  Visit.expression(node.left, scope, false, null),
  (box) => (
    operator === "??" ?
    Build.conditional(
      Build.conditional(
        Build.binary(
          "===",
          Scope.get(scope, box),
          Build.primitive(null)),
        Build.primitive(true),
        Build.binary(
          "===",
          Scope.get(scope, box),
          Build.primitive(void 0))),
      Visit.expression(node.right, scope, dropped, null),
      Scope.get(scope, box)) :
    Build.conditional(
      Scope.get(scope, box),
      (
        operator === "&&" ?
        Visit.expression(node.right, scope, dropped, null) :
        Scope.get(scope, box)),
      (
        operator === "||" ?
        Visit.expression(node.right, scope, dropped, null) :
        Scope.get(scope, box)))));

exports.ConditionalExpression = (node, scope, dropped, box) => Build.conditional(
  Visit.expression(node.test, scope, false, null),
  Visit.expression(node.consequent, scope, dropped, box),
  Visit.expression(node.alternate, scope, dropped, box));

/////////////////
// Combination //
/////////////////

exports.ArrayExpression = (node, scope, dropped, box) => (
  ArrayLite.every(
    node.elements,
    (element) => (
      element !== null &&
      element.type !== "SpreadElement")) ?
  Build.apply(
    Build.builtin("Array.of"),
    Build.primitive(void 0),
    ArrayLite.map(
      node.elements,
      (element) => Visit.expression(element, scope, false, null))) :
  Build.apply(
    Build.builtin("Array.prototype.concat"),
    Build.apply(
      Build.builtin("Array.of"),
      Build.primitive(void 0),
      []),
    ArrayLite.map(
      node.elements,
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

exports.ObjectExpression = (node, scope, dropped, nullable_box, _closure, _nullable_box, _boxs1, _boxs2) => (
  // 
  _closure = (box) => Build.conditional(
    Build.binary(
      "===",
      Build.unary(
        "typeof",
        Scope.get(scope, box)),
      Build.primitive("object")),
    Scope.get(scope, box),
    Build.conditional(
      Build.binary(
        "===",
        Build.unary(
          "typeof",
          Scope.get(scope, box)),
        Build.primitive("function")),
      Scope.get(scope, box),
      Build.builtin("Object.prototype"))),
  (
    ArrayLite.every(
      node.properties,
      (property) => (
        property.type !== "SpreadElement" &&
        property.kind === "init")) ?
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
      // Special Case #1: 
      //   - Only init properties
      //   - Only side-effect free names
      //   - __proto__ only appears first
      Build.object(
        (
          (
            node.properties.length > 0 &&
            !node.properties[0].computed &&
            (
              node.properties[0].key.type === "Identifier" ?
              node.properties[0].key.name === "__proto__" :
              node.properties[0].key.value === "__proto__")) ?
          Scope.box(
            scope,
            "ExpressionObjectProto1",
            Visit.expression(node.properties[0].value, scope, false, null),
            true,
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
              Visit.expression(property.key, scope, false, null) :
              Build.primitive(
                (
                  property.key.type === "Identifier" ?
                  property.key.name :
                  property.key.value))),
            Scope.box(
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
                (box) => Visit.expression(property.value, scope, false, box))])) :
      // Special Case #2: Only init properties //
      (
        _nullable_box = null,
        _boxs1 = [],
        _boxs2 = [],
        Util.Fix(
          node.properties,
          (property, next) => (
            (
              !node.properties[index].computed &&
              (
                node.properties[index].key.type === "Identifier" ?
                node.properties[index].key.name === "__proto__" :
                node.properties[index].key.value === "__proto__")) ?
            Scope.box(
              scope,
              "ExpressionObjectProto2",
              // No name for __proto__ propeties:
              //
              // > var o = {__proto__: function () {}}
              // undefined
              // > Reflect.getPrototypeOf(o).name
              // ''
              Visit.expression(property.value, scope, false, null),
              (box) => (
                _nullable_box = box,
                next())) :
            Scope.box(
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
              (box1) => Scope.box(
                scope,
                "ExpressionObjectValue",
                Visit.expression(node.properties[index].value, scope, false, box1),
                (box2) => (
                  _boxs1[_boxs1.length] = box1,
                  _boxs2[_boxs2.length] = box2,
                  next())))),
          () => Build.object(
            (
              _nullable_box === null ?
              Build.builtin("Object.prototype") :
              closure(_nullable_box)),
            ArrayLite.map(
              _boxs1,
              (box, index) => [
                Scope.get(scope, box),
                Scope.get(scope, _boxs2[index])]))))) :
    // General Case //
    Scope.box(
      scope,
      "ExpressionObjectResult",
      Build.object(
        Build.builtin("Object.prototype"),
        []),
      (box1) => Util.Fix(
        node.properties,
        (property, next) => Build.sequence(
          (
            // https://github.com/tc39/proposal-object-rest-spread
            property.type === "SpreadElement" ?
            Build.apply(
              Build.builtin("Object.assign"),
              Build.primitive(void 0),
              [
                Scope.get(scope, box1),
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
                  Scope.get(scope, box1),
                  Scope.box(
                    scope,
                    "ExpressionObjectProto3",
                    Visit.expression(property.value, scope, false, null),
                    closure)]) :
              Scope.box(
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
                (box2) => Build.apply(
                  Build.builtin("Reflect.defineProperty"),
                  Build.primitive(void 0),
                  [
                    Scope.get(scope, box1),
                    Scope.get(scope, box2),
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
                          Visit.expression(node.properties[index].value, scope, false, null)]])])))),
        () => Scope.get(scope, box1))
        (
          function self (index) { return (
            index === node.properties.length ?
            Scope.get(scope, box1) :
            Build.sequence(
              (
                // https://github.com/tc39/proposal-object-rest-spread
                node.properties[index].type === "SpreadElement" ?
                Build.apply(
                  Build.builtin("Object.assign"),
                  Build.primitive(void 0),
                  [
                    Scope.get(scope, box1),
                    Visit.expression(node.properties[index].argument, scope, false, null)]) :
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
                      Scope.get(scope, box1),
                      Scope.box(
                        scope,
                        "ExpressionObjectProto3",
                        Visit.expression(node.properties[index].value, scope, false, null),
                        closure)]) :
                  Scope.box(
                    scope,
                    "ExpressionObjectKey3",
                    (
                      node.properties[index].key.type === "Literal" ?
                      node.properties[index].key.value :
                      (
                        node.properties[index].key.computed ?
                        Visit.expression(node.properties[index].key, scope, false, null) :
                        node.properties[index].key.name)),
                    (box2) => Build.apply(
                      Build.builtin("Reflect.defineProperty"),
                      Build.primitive(void 0),
                      [
                        Scope.get(scope, box1),
                        Scope.get(scope, box2),
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
                              Visit.expression(node.properties[index].value, scope, false, null)]])])))),
              self(index + 1)))}))));

exports.UnaryExpression = (node, scope, dropped, box) => (
  (
    node.operator === "typeof" &&
    node.argument.type === "Identifier") ?
  Scope.typeof(scope, node.argument.name) :
  (
    node.operator === "delete" ?
    (
      node.argument.type === "MemberExpression" ?
      Scope.box(
        scope,
        "ExpressionUnaryDeleteObject",
        (
          node.argument.object.type === "Literal" ?
          node.argument.object.value :
          Visit.expression(node.argument.object, scope, false, null)),
        (box) => Object.del(
          Scope._is_strict(scope),
          Object.obj(
            () => Scope.get(scope, box)),
          (
            node.argument.computed ?
            Visit.expression(node.argument.property, scope, false, null) :
            Build.primitive(node.argument.property.name)))) :
      (
        node.argument.type === "Identifier" ?
        Scope.delete(scope, node.argument.name) :
        Build.sequence(
          Visit.expression(node.argument, scope, true, null),
          Build.primitive(true)))) :
    Build.unary(
      node.operator,
      Visit.expression(node.argument, scope, false, null))));

exports.BinaryExpression = (node, scope, dropped, box) => Build.binary(
  node.operator,
  Visit.expression(node.left, scope, false, null),
  Visit.expression(node.right, scope, false, null));

exports.NewExpression = (node, scope, dropped, box) => (
  ArrayLite.every(
    node.arguments,
    (argument) => argument.type !== "SpreadElement") ?
  Build.construct(
    Visit.expression(node.callee, scope, false, null),
    ArrayLite.map(
      node.arguments,
      (argument) => Visit.expression(argument, scope, false, null))) :
  Build.apply(
    Build.builtin("Reflect.construct"),
    Build.primitive(void 0),
    [
      Visit.expression(node.callee, scope, false, null),
      Build.apply(
        Build.builtin("Array.prototype.concat"),
        Build.apply(
          Build.builtin("Array.of"),
          Build.primitive(void 0),
          []),
        ArrrayLite.map(
          node.arguments,
          (argument) => (
            argument.type === "SpreadElement" ?
            Visit.expression(argument.argument, scope, false, null) :
            Build.apply(
              Build.builtin("Array.of"),
              Build.primitive(void 0),
              [
                Visit.expression(argument, scope, false, null)]))))]));

foldr(
  arguments,
  (argument, next) => Scope.box(
    scope,
    "ExpressionCallEvalArgument",
    Visit.expression(node.arguments[index], scope, false, null),
    next),
  (boxes) => Build.conditional(
    Build.binary(
      "===",
      Scope.get(scope, box),
      Build.builtin("eval")),
    Build.eval(
      Scope.get(scope, boxs[0])),
    Build.apply(
      Scope.get(scope, box),
      Build.primitive(void 0),
      ArrayLite.map(
        boxs,
        (box) => Scope.get(scope, box)))));
    
  } 
  (box) => ne
    boxs[boxs.length] = box,
    next(index + 1, boxs))), () => 


// Eval with spread element is not direct:
//
// > var x = "foo";
// undefined
// > function f () { var x = "bar"; return eval(...["x"])}
// undefined
// > f()
// 'foo'
exports.CallExpression = (node, scope, dropped, box) => (
  Query._is_direct_eval_call(node) ?
  Scope.box(
    scope,
    "ExpressionCallEvalCallee",
    Scope.read(scope, "eval"),
    (box) => ArrayLite.mapReduce(
      node.arguments,
      (next, argument) => Scope.box(
        scope,
        "ExpressionCallEvalArgument",
        Visit.expression(argument, scope, false, null),
        next),
      (boxes) => Build.conditional(
        Build.binary(
          "===",
          Scope.get(scope, box),
          Build.builtin("eval")),
        Build.eval(
          Scope.get(scope, boxes[0])),
        Build.apply(
          Scope.get(scope, box),
          Build.primitive(void 0),
          ArrayLite.map(
            boxes,
            (box) => Scope.get(scope, box)))))) :
  ArrayLite.every(
    node.arguments,
    (argument) => argument.type !== "SpreadElement") ?
  (
    node.callee.type === "MemberExpression" ?
    // Evaluation order:
    // =================
    // var o = null;
    // > o[console.log("key")](console.log("arg"))
    // key
    // Thrown:
    // TypeError: Cannot read property 'undefined' of null
    Scope.box(
      scope,
      "ExpressionCallMemberObject",
      Visit.expression(node.callee.object, scope),
      (box) => Build.apply(
        Object.get(
          Object.obj(
            () => Scope.get(scope, box)),
          (
            node.callee.computed ?
            Visit.expression(node.callee.property, scope, false, null) :
            Build.primitive(node.callee.property.name))),
          Scope.get(scope, box),
          ArrayLite.map(
            node.arguments,
            (argument) => Visit.expression(argument, scope, false, null)))) :
    Build.apply(
      Visit.expression(node.callee, scope, false, null),
      Build.primitive(void 0),
      ArrayLite.map(
        node.arguments,
        (argument) => Visit.expression(argument, scope, false, null))))) :
  Scope.box(
    scope,
    "ExpressionCallSpreadMemberObject",
    (
      node.callee.type === "MemberExpression" ?
      Visit.expression(node.callee.object, scope) :
      void 0),
    (box) => Build.apply(
      Build.builtin("Reflect.apply"),
      Build.primitive(void 0),
      [
        (
          node.callee.type === "MemberExpression" ?
          Object.get(
            Object.obj(
              () => Scope.get(scope, box)),
            (
              node.callee.computed ?
              Visit.expression(node.callee.property, scope, false, null) :
              Build.primitive(node.callee.property.name))) :
          Visit.expression(node.callee, scope)),
        Scope.get(scope, box),
        Build.apply(
          Build.builtin("Array.prototype.concat"),
          Build.apply(
            Build.builtin("Array.of"),
            Build.primitive(void 0),
            []),
          ArrayLite.map(
            node.arguments,
            (argument) => (
              argument.type === "SpreadElement" ?
              Visit.expression(argument.argument, scope, false, null) :
              Build.apply(
                Build.builtin("Array.of"),
                Build.primitive(void 0),
                [
                  Visit.expression(argument, scope, false, null)]))))])));

exports.MemberExpression = (node, scope, dropped, box) => Scope.box(
  scope,
  "ExpressionMemberObject",
  (
    node.object.type === "Literal" ?
    node.object.value :
    Visit.expression(node.object, scope, false, null)),
  (box) => Object.get(
    Object.obj(
      () => Scope.get(scope, box)),
    (
      node.computed ?
      Visit.expression(node.property, scope, false, null) :
      Build.primitive(node.property.name))));

exports.ArrowFunctionExpression = Closure.arrow;

exports.FunctionExpression = Closure.function;

exports.ClassExpression = Closure.class;

exports.YieldExpression = (node, scope, dropped, box) => { throw new global_Error("Unfortunately, Aran does not support yield expressions (yet)...") };

exports.AwaitExpression = (node, scope, dropped, box) => { throw new global_Error("Unfortunately, Aran does support await expressions (yet)...") };
