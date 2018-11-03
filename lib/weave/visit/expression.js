
const ArrayLite = require("array-lite");
const Assignment = require("./assignment.js");
const Identifier = require("./identifier.js");
const Closure = require("./closure.js");

const Array = global.Array;
const Reflect_apply = global.Reflect.apply;
const String_prototype_substring = global.String.prototype.substring;

exports.ThisExpression = (node) => ARAN.cut.read("this");

// TODO: empty element should be non-existant and not set to undefined
exports.ArrayExpression = (node) => (
  ArrayLite.some(
    node.elements,
    (element) => element && element.type === "SpreadElement") ?
  ARAN.cut.apply(
    ARAN.cut.builtin("Array.prototype.concat"),
    ARAN.cut.apply(
      ARAN.cut.builtin("Arrray.of"),
      ARAN.cut.primitive(void 0),
      []),
    ArrayLite.map(
      node.elements,
      (element) => (
        element && element.type === "SpreadElement" ?
        Visit.expression(element.argument) :
        ARAN.cut.apply(
          ARAN.cut.builtin("Array.of"),
          ARAN.cut.primitive(void 0),
          [
            (
              element ?
              Visit.expressions(element) :
              ARAN.cut.primitive(void 0))])))) :
  ARAN.cut.apply(
    ARAN.cut.builtin("Array.of"),
    ARAN.cut.primitive(void 0),
    ArrayLite.map(node.elements, Visit.expression)));

// Version releying on custom builtin
exports.ObjectExpression = (node) => ARAN.cut.apply(
  ARAN.cut.builtin("AranReflect.initialize"),
  ARAN.cut.primitive(void 0),
  ArrayLite.flatenMap(
    node.properties,
    (property) => [
      ARAN.cut.primitive(property.kind),
      (
        property.computed ?
        Visit.expression(property.key),
        ARAN.cut.primitive(property.key.name || property.key.value)),
      Visit.expression(property.value)]));

// Version bosed on Object.defineProperty, Object.fromEntries and Array.of
// exports.ObjectExpression = (node) => (
//   ArrayLite.every(
//     node.properties,
//     (property) => property.kind === "init") ?
//   ARAN.cut.apply(
//     ARAN.cut.builtin("Object.fromEntries"),
//     ARAN.cut.primitive(void 0),
//     [
//       ARAN.cut.apply(
//         ARAN.cut.builtin("Array.of"),
//         ARAN.cut.primitive(void 0),
//         ArrayLite.map(
//           node.properties,
//           (property) => ARAN.cut.apply(
//             ARAN.cut.builtin("Array.of"),
//             ARAN.cut.primitive(void 0),
//             [
//               (
//                 property.computed ?
//                 Visit.expression(property.key) :
//                 ARAN.cut.primitive(property.key.name || property.key.value)),
//               Visit.expression(property.value)])))]) :
//   ArrayLite.reduce(
//     ArrayLite.filter(
//       node.properties,
//       (property) => property.kind !== "init"),
//     (expression, property) => ARAN.cut.apply(
//       ARAN.cut.builtin("Object.defineProperty"),
//       ARAN.cut.primitive(void 0),
//       [
//         expression,
//         (
//           property.computed ?
//           Visit.expression(property.key) :
//           ARAN.cut.primitive(property.key.name || property.key.value)),
//         ARAN.cut.apply(
//           ARAN.cut.builtin("Object.fromEntries"),
//           ARAN.cut.primitive(void 0),
//           [
//             ARAN.cut.apply(
//               ARAN.cut.builtin("Array.of"),
//               ARAN.cut.primitive(void 0),
//               [
//                 ARAN.cut.apply(
//                   ARAN.cut.builtin("Array.of"),
//                   ARAN.cut.primitive(void 0),
//                   [
//                     ARAN.cut.primitive("configurable"),
//                     ARAN.cut.primitive(true)]),
//                 ARAN.cut.apply(
//                   ARAN.cut.builtin("Array.of"),
//                   ARAN.cut.primitive(void 0),
//                   [
//                     ARAN.cut.primitive("enumerable"),
//                     ARAN.cut.primitive(true)]),
//                 ARAN.cut.apply(
//                   ARAN.cut.builtin("Array.of"),
//                   ARAN.cut.primitive(void 0),
//                   [
//                     ARAN.cut.primitive(property.kind),
//                     Visit.expression(property.value)])])])]),
//     ARAN.cut.apply(
//       ARAN.cut.builtin("Object.fromEntries"),
//       ARAN.cut.primitive(void 0),
//       [
//         ARAN.cut.apply(
//           ARAN.cut.builtin("Array.of"),
//           ARAN.cut.primitive(void 0),
//           ArrayLite.map(
//             ArrayLite.filter(
//               node.properties,
//               (property) => property.kind === "init"),
//             (property) => ARAN.cut.apply(
//               ARAN.cut.builtin("Array.of"),
//               ARAN.cut.primitive(void 0),
//               [
//                 (
//                   property.computed ?
//                   Visit.expression(property.key) :
//                   ARAN.cut.primitive(property.key.name || property.key.value)),
//                 Visit.expression(property.value)])))])));

// TODO
exports.ArrowFunctionExpression = Helpers.closure;

// TODO
exports.FunctionExpression = Helpers.closure;

exports.SequenceExpression = (node) => ARAN.cut.sequence(
  ArrayLite.map(node.expressions, Visit.expression));

exports.UnaryExpression = (node) => (
  (
    node.operator === "typeof" &&
    node.argument.type === "Identifier") ?
  Identifier.typeof(node.argument.name) :
  (
    node.operator === "delete" ?
    (
      node.argument.type === "MemberExpression" ?
      (
        node.AranStrict ?
        ARAN.node.conditional(
          ARAN.cut.apply(
            ARAN.cut.builtin("Reflect.deleteProperty"),
            ARAN.cut.primitive(void 0),
            [
              ARAN.cut.apply(
                ARAN.cut.builtin("Object"),
                ARAN.cut.primitive(void 0),
                [
                  Visit.expression(node.argument.object)]),
              (
                node.argument.computed ?
                Visit.expression(node.argument.property) :
                ARAN.cut.primitive(node.argument.property.name || node.argument.property.value))]),
          ARAN.cut.primitive(true),
          ARAN.cut.apply(
            ARAN.cut.closure(
              ARAN.cut.Throw(
                ARAN.cut.construct(
                  ARAN.cut.builtin("TypeError"),
                  [
                    ARAN.cut.primitive("Cannot delete object property")]))),
            ARAN.cut.primitive(void 0),
            [])) :
        ARAN.cut.apply(
          ARAN.cut.builtin("Reflect.deleteProperty"),
          ARAN.cut.primitive(void 0),
          [
            ARAN.cut.apply(
              ARAN.cut.builtin("Object"),
              ARAN.cut.primitive(void 0),
              [
                Visit.expression(node.argument.object)]),
            (
              node.argument.computed ?
              Visit.expression(node.argument.property) :
              ARAN.cut.primitive(node.argument.property.name || node.argument.property.value))])) :
      (
        node.argument.type === "Identifier" ?
        Identifier.delete(node.argument.name) :
        ARAN.cut.sequence(
          [
            Visit.expression(node.argument),
            ARAN.cut.primitive(true)]))) :
    ARAN.cut.apply(
      ARAN.cut.builtin("AranReflect.unary"),
      ARAN.cut.primitive(void 0),
      [
        ARAN.cut.primitive(node.operator),
        Visit.expression(node.argument)])));

exports.BinaryExpression = (scope, node) => ARAN.cut.apply(
  ARAN.cut.builtin("AranReflect.binary"),
  ARAN.cut.primitive(void 0),
  [
    ARAN.cut.primitive(node.operator),
    Visit.expression(node, scope, node.left),
    Visit.expression(node, scope, node.right)]);

// Right hand side is evaluated first:
// let {[(console.log(2), "a")]:x} = {a:console.log(1)};
// let [(console.log(3), {})[(console.log(4), "foo")]] = (console.log(1), [(console.log(2), "bar")])

exports.AssignmentExpression = (node, token1, token2, token3) => (
  node.left.type === "MemberExpression" ?
  ARAN.cut.sequence(
    [
      ARAN.cut.hoist(
        token1 = ++ARAN.counter,
        Visit.expression(node.right)),
      ARAN.cut.hoist(
        token2 = ++ARAN.counter,
        Visit.expression(node.object)),
      ARAN.cut.hoist(
        token3 = ++ARAN.counter,
        (
          node.left.computed ?
          Visit.expressions(node.left.property) :
          ARAN.cut.primitive(node.left.property.name || node.left.property.value))),
      ARAN.cut.hoist(
        token4 = ++ARAN.counter,
        ARAN.cut.apply(
          ARAN.cut.builtin("Reflect.set"),
          ARAN.cut.primitive(void 0),
          [
            (
              node.AranStrict ?
              ARAN.cut.read(token2) :
              ARAN.cut.apply(
                ARAN.cut.builtin("Object"),
                ARAN.cut.primitive(void 0),
                [
                  ARAN.cut.read(token2)])),
            ARAN.cut.read(token3),
            (
              node.operator === "=" ?
              ARAN.cut.read(token1) :
              ARAN.cut.write(
                token1,
                ARAN.cut.apply(
                  ARAN.cut.builtin("AranReflect.binary"),
                  ARAN.cut.primitive(void 0),
                  [
                    ARAN.cut.primitive(
                      Reflect_apply(
                        String_prototype_substring,
                        node.operator,
                        [
                          0,
                          node.operator.length-1])),
                    ARAN.cut.read(token1),
                    ARAN.cut.apply(
                      ARAN.cut.builtin("Reflect.get"),
                      ARAN.cut.primitive(void 0),
                      [
                        ARAN.cut.apply(
                          ARAN.cut.builtin("Object"),
                          ARAN.cut.primitive(void 0),
                          [
                            ARAN.cut.read(token2)]),
                        ARAN.cut.read(token3)])])))])),
      (
        node.AranStrict ?
        ARAN.cut.conditional(
          ARAN.cut.read(token4),
          ARAN.cut.read(token1),
          ARAN.cut.apply(
            ARAN.cut.closure(
              ARAN.cut.Throw(
                ARAN.cut.construct(
                  ARAN.cut.builtin("TypeError"),
                  [
                    ARAN.cut.primitive("Cannot assign object property")]))),
            ARAN.cut.primitive(void 0),
            [])) :
        ARAN.cut.read(token1))]) :
  ARAN.cut.sequence(
    ArrayLite.concat(
      [
        ARAN.cut.hoist(
          token1 = ++ARAN.counter,
          Visit.expression(node.right))],
      (
        node.operator === "=" ?
        [] :
        [
          ARAN.cut.write(
            token1,
            ARAN.cut.apply(
              ARAN.cut.builtin("AranReflect.binary"),
              ARAN.cut.primitive(void 0),
              [
                ARAN.cut.primitive(
                  Reflect_apply(
                    String_prototype_substring,
                    node.operator,
                    [
                      0,
                      node.operator.length-1])),
                Identifier.read(node.left.name),
                ARAN.cut.read(token1)]))]),
      Assignment(node.left, token1),
      [
        ARAN.cut.read(token1)])));

exports.UpdateExpression = (node, token1, token2, token3, token4, token5) => (
  node.argument.type === "MemberExpression" ?
  ARAN.cut.sequence(
    [
      ARAN.cut.hoist(
        token1 = ++ARAN.counter,
        Visit.expression(node.argument.object)),
      ARAN.cut.hoist(
        token2 = ++ARAN.counter,
        (
          node.argument.computed ?
          Visit.expression(node.argument.property) :
          ARAN.cut.primitive(node.argument.property.name || node.argument.property.value))),
      ARAN.cut.hoist(
        token3 = ++ARAN.counter,
        ARAN.cut.apply(
          ARAN.cut.builtin("Reflect.get"),
          ARAN.cut.primitive(void 0),
          [
            ARAN.cut.apply(
              ARAN.cut.builtin("Object"),
              ARAN.cut.primitive(void 0),
              [
                ARAN.cut.read(token1)]),
            ARAN.cut.read(token2)])),
      ARAN.cut.hoist(
        token4 = ++ARAN.counter,
        ARAN.cut.apply(
          ARAN.cut.builtin("AranReflect.binary"),
          ARAN.cut.primitive(void 0),
          [
            ARAN.cut.primitive(node.operator[0]),
            ARAN.cut.read(token3),
            ARAN.cut.primitive(1)])),
      ARAN.cut.hoist(
        token5 = ++ARAN.counter,
        ARAN.cut.apply(
          ARAN.cut.builtin("Reflect.set"),
          ARAN.cut.primitive(void 0),
          [
            (
              node.AranStrict ?
              ARAN.cut.read(token1) :
              ARAN.cut.apply(
                ARAN.cut.builtin("Object"),
                ARAN.cut.primitive(void 0),
                [
                  ARAN.cut.read(token1)])),
            ARAN.cut.read(token2),
            ARAN.cut.read(token4)])),
      (
        node.AranStrict ?
        ARAN.cut.conditional(
          ARAN.cut.read(token5),
          ARAN.cut.read(node.prefix ? token4 : token3),
          ARAN.cut.apply(
            ARAN.cut.closure(
              ARAN.cut.Throw(
                ARAN.cut.construct(
                  ARAN.cut.builtin("TypeError"),
                  [
                    ARAN.cut.primitive("Cannot assign object property")]))),
            ARAN.cut.primitive(void 0),
            [])) :
        ARAN.cut.read(node.prefix ? token4, token3))]) :
  ARAN.cut.sequence(
    [
      ARAN.cut.hoist(
        token1 = ++ARAN.counter,
        Identifier.read(node.argument.name)),
      ARAN.cut.hoist(
        token2 = ++ARAN.counter,
        ARAN.cut.apply(
          ARAN.cut.builtin("AranReflect.binary"),
          ARAN.cut.primitive(void 0),
          [
            ARAN.cut.primitive(node.operator[0]),
            ARAN.cut.read(node.argument.name),
            ARAN.cut.primitive(1)])),
      Identifier.write(node.argument.name, token2),
      ARAN.cut.read(node.prefix ? token2 : token1)]));

exports.LogicalExpression = (node, token) => ARAN.build.conditional(
  ARAN.cut.hoist(
    token = ++ARAN.counter,
    Visit.expression(node.left)),
  (
    node.operator === "&&" ?
    Visit.expression(node.right) :
    ARAN.cut.read(token)),
  (
    node.operator === "&&" ?
    ARAN.cut.read(token) :
    Visit.expression(node.right)));

exports.ConditionalExpression = (scope, node) => ARAN.cut.conditional(
  Visit.expression(node.test),
  Visit.expression(node.consequent),
  Visit.expression(node, scope, node.alternate));

exports.NewExpression = (scope, node) => ARAN.cut.construct(
  Vsit.expression(node.callee),
  ArrayLite.map(
    node.arguments,
    (argument) => Visit.expression(
      (
        argument.type === "SpreadElement" ?
        argument.argument :
        argument))),
  ArrayLite.map(
    node.arguments,
    (argument) => argument.type === "SpreadElement"));

exports.CallExpression = (node, token, tokens = []) => (
  // eval(x, ...xs) is not direct
  (
    ArrayLite.every(
      node.arguments,
      (argument) => argument.type !== "SpreadElement") &&
    node.callee.type === "Identifier" &&
    node.callee.type.name === "eval") ?
  ARAN.cut.sequence(
    ArrayLite.concat(
      [
        ARAN.cut.hoist(
          token = ++ARAN.counter,
          Identifier.read("eval"))],
      ArrayLite.map(
        node.arguments,
        (argument, index) => ARAN.cut.hoist(
          tokens[index] = ++ARAN.counter,
          Visit.expression(node, scope, argument))),
      [
        ARAN.cut.conditional(
          ARAN.cut.apply(
            ARAN.cut.builtin("Reflect.binary"),
            ARAN.cut.primitive(void 0),
            [
              ARAN.cut.primitive("==="),
              ARAN.cut.read(token)
              ARAN.cut.builtin("eval")]),
          ARAN.cut.eval(
            (
              tokens.length ?
              ARAN.cut.read(tokens[0]) :
              ARAN.cut.primitive(void 0))),
          ARAN.cut.apply(
            ARAN.cut.read(token),
            ARAN.cut.primitive(void 0),
            ArrayLite.map(tokens, ARAN.cut.read)))])) :
  ARAN.cut.apply(
    (
      node.callee.type === "MemberExpression" ?
      ARAN.cut.apply(
        ARAN.cut.builtin("Reflect.get"),
        ARAN.cut.primitive(void 0).
        [
          ARAN.cut.apply(
            ARAN.cut.builtin("Object"),
            ARAN.cut.primitive(void 0),
            [
              ARAN.cut.hoist(
                token = ++ARAN.counter,
                Visit.expression(node.callee.object))]),
          (
            node.callee.computed ?
            Visit.expression(node.callee.property) :
            ARAN.cut.primitive(node.callee.property.name || node.callee.property.value))]) :
      Visit.expression(node.callee)),
    (
      node.callee.type === "MemberExpression" ?
      ARAN.cut.read(token) :
      ARAN.cut.primitive(void 0)),
    ArrayLite.map(
      arguments,
      (argument) => Visit.expression(
        (
          argument.type === "SpreadElement" ?
          argument.argument :
          argument))),
    ArrayLite.map(
      arguments,
      (argument) => argument.type === "SpreadElement")));

exports.MemberExpression = (node) => ARAN.cut.apply(
  ARAN.cut.builtin("Reflect.get"),
  ARAN.cut.primitive(void 0),
  [
    ARAN.cut.apply(
      ARAN.cut.builtin("Object"),
      ARAN.cut.primitive(void 0),
      [
        Visit.expression(node, node.object)]),
    (
      node.computed ?
      Visit.expression(node, node.property) :
      ARAN.cut.primitive(node.property.name || node.property.value))]);

exports.MetaProperty = (node) => ARAN.cut.read("new.target");

exports.Identifier = (node) => Identifier.read(node.name);

exports.Literal = (node) => (
  node.regex ?
  ARAN.cut.construct(
    ARAN.cut.builtin("RegExp"),
    [
      ARAN.cut.primitive(node.regex.pattern),
      ARAN.cut.primitive(node.regex.flags)]) :
  ARAN.cut.primitive(node.value));
