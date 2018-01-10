
const ArrayLite = require("array-lite");
const Build = require("../../build");
const Interim = require("../interim.js");
const Util = require("../util");
const Visit = require("./index.js");
const apply = Reflect.apply;
const substring = String.prototype.substring;

exports.ThisExpression = (node) => ARAN.cut.read("this");

exports.ArrayExpression = (node) => ARAN.cut.array(
  ArrayLite.map(
    node.elements,
    (expression) => (
      expression ?
      Visit.expression(expression) :
      ARAN.cut.primitive(void 0))));

exports.ObjectExpression = (node) => (
  ArrayLite.all(
    node.properties,
    (property) => property.kind === "init") ?
  ARAN.cut.object(
    ArrayLite.map(
      node.properties,
      (property) => [
        Util.property(
          {
            computed: property.computed,
            property: property.key}),
        Visit.expression(property.value)])) :
  ArrayLite.reduce(
    node.properties,
    (node, property) => ARAN.cut.apply(
      ARAN.cut.$builtin("defineProperty"),
      [
        node,
        Util.property(
          {
            computed: property.computed,
            property: property.key}),
        ARAN.cut.object(
          ArrayLite.concat(
            [
              [
                ARAN.cut.primitive("configurable"),
                ARAN.cut.primitive(true)]],
            [
              [
                ARAN.cut.primitive("enumerable"),
                ARAN.cut.primitive(true)]],
            (
              property.kind === "init" ?
              [
                [
                  ARAN.cut.primitive("writable"),
                  ARAN.cut.primitive(true)]] :
              []),
            [
              [
                ARAN.cut.primitive(
                  property.kind === "init" ? "value" : property.kind),
                Visit.expression(property.value)]]))]),
    ARAN.cut.object([])));

exports.ArrowFunctionExpression = (node) => Util.closure(node);

exports.FunctionExpression = (node) => Util.closure(node);

exports.SequenceExpression = (node) => Build.sequence(
  ArrayLite.map(
    node.expressions,
    (expression, index) => (
      index === node.expressions.length -1 ?
      Visit.expression(expression) :
      ARAN.cut.$drop0after(
        Visit.expression(expression)))));

exports.UnaryExpression = (node) => (
  node.operator === "typeof" && node.argument.type === "Identifier" ?
  ARAN.cut.unary(
      "typeof",
      Build.apply(
        Build.closure(
          false,
          Build.Try(
            Build.Return(
              ARAN.cut.read(node.argument.name)),
            Build.Return(
              ARAN.cut.primitive(void 0)),
            [])),
        [])) :
  (node.operator === "delete" && node.argument.type === "Identifier" ?
    ARAN.cut.discard(node.argument.name) :
    (
      node.operator === "delete" && node.argument.type === "MemberExpression" ?
      ARAN.cut.delete(
        Visit.expression(node.argument.object),
        Util.property(node.argument)) :
      ARAN.cut.unary(
        node.operator,
        Visit.expression(node.argument)))));

exports.BinaryExpression = (node) => ARAN.cut.binary(
  node.operator,
  Visit.expression(node.left),
  Visit.expression(node.right));

// set invariant enforced (3 pop, 0 push)
exports.AssignmentExpression = (node) => Build.sequence(
  [
    (
      node.operator === "=" ?
      Util.write(
        node.left,
        Interim.hoist(
          "value",
          ARAN.cut.$copy0after(
            Visit.expression(node.right)))) :
      (
        node.left.type === "MemberExpression" ?
        ARAN.cut.set(
          Interim.hoist(
            "object",
            ARAN.cut.$copy1after(
              Visit.expression(node.left.object))),
          Interim.hoist(
            "property",
            ARAN.cut.$copy2after(
              Util.property(node.left))),
          Interim.hoist(
            "value",
            ARAN.cut.$copy3after(
              ARAN.cut.binary(
                apply(substring, node.operator, [0, node.operator.length-1]),
                ARAN.cut.get(
                  Interim.read("object"),
                  Interim.read("property")),
                Visit.expression(node.right))))) :
        ARAN.cut.write(
          node.left.name,
          Interim.hoist(
            "value",
            ARAN.cut.$copy0after(
              ARAN.cut.binary(
                apply(substring, node.operator, [0, node.operator.length-1]),
                ARAN.cut.read(node.left.name),
                Visit.expression(node.right))))))),
    Interim.read("value")]);

// set invariant non-enforced (3 pop, 1 push)
// exports.AssignmentExpression = (node) => (
//   node.left.type === "MemberExpression" ?
//   ARAN.cut.set(
//     (
//       node.operator === "=" ?
//       Visit.expression(node.left.object) :
//       Interim.hoist(
//         "object",
//         Visit.expression(node.left.object))),
//     (
//       node.operator === "=" ?
//       Util.property(node.left) :
//       Interim.hoist(
//         "property",
//         Visit.expression(node.left))),
//     (
//       node.operator === "=" ?
//       Visit.expression(node.right) :
//       ARAN.cut.binary(
//         apply(substring, node.operator, node.operator.length-1),
//         ARAN.cut.get(
//           Interim.read("object"),
//           Interim.read("property")),
//         Visit.expression(node.right)))) :
//   Build.sequence(
//     [
//       (
//         node.operator === "=" ?
//         Util.write(
//           node.left,
//           Interim.hoist(
//             "result",
//             Visit.expression(node.right))) :
//         ARAN.cut.write(
//           node.left.name,
//           ARAN.cut.binary(
//             apply(substring, node.operator, node.operator.length-1),
//             ARAN.cut.read(node.left.name),
//             Interim.hoist(
//               "result",
//               Visit.expression(node.right))))),
//       Interim.read("result")]));

exports.UpdateExpression = (node) => Build.sequence(
  [
    (
      node.argument.type === "MemberExpression" ?
      ARAN.cut.set(
        Interim.hoist(
          "object",
          ARAN.cut.$copy1after(
            Visit.expression(node.argument.object))),
        Interim.hoist(
          "property",
          ARAN.cut.$copy2after(
            Util.property(node.argument))),
        (
          node.prefix ?
          Interim.hoist(
            "value",
            ARAN.cut.$copy3after(
              ARAN.cut.binary(
                node.operator[0],
                ARAN.cut.get(
                  Interim.read("object"),
                  Interim.read("property")),
                ARAN.cut.primitive(1)))) :
          ARAN.cut.binary(
            node.operator[0],
            Interim.hoist(
              "value",
              ARAN.cut.get(
                Interim.read("object"),
                Interim.read("property"))),
            ARAN.cut.primitive(1)))) :
      ARAN.cut.write(
        node.argument.name,
        (
          node.prefix ?
          Interim.hoist(
            "value",
            ARAN.cut.$copy0after(
              ARAN.cut.binary(
                node.operator[0],
                ARAN.cut.read(node.argument.name),
                ARAN.cut.primitive(1)))) :
          ARAN.cut.binary(
            node.operator[0],
            Interim.hoist(
              "value",
              ARAN.cut.$copy0after(
                ARAN.cut.read(node.argument.name))),
            ARAN.cut.primitive(1))))),
    Interim.read("value")]);

exports.LogicalExpression = (node) => ARAN.cut.conditional(
  Interim.hoist(
      "logical",
      ARAN.cut.$copy0after(
        Visit.expression(node.left))),
  (
    node.operator === "||" ?
    Interim.read("logic") :
    ARAN.cut.$drop0before(
      Visit.expression(node.right))),
  (
    node.operator === "&&" ?
    Interim.read("logic") :
    ARAN.cut.$drop0before(
      Visit.expression(node.right))));

exports.ConditionalExpression = (node) => ARAN.cut.conditional(
  Visit.expression(node.test),
  Visit.expression(node.consequent),
  Visit.expression(node.alternate));

exports.NewExpression = (node) => ARAN.cut.construct(
  Visit.expression(node.callee),
  ArrayLite.map(
    node.arguments,
    Visit.expression));

exports.CallExpression = (node) => (
  ArrayLite.all(
    node.arguments,
    (argument) => argument.type !== "SpreadElement") ?
  (
    node.callee.type === "MemberExpression" ?
    ARAN.cut.invoke(
      Visit.expression(node.callee.object),
      Util.property(node.callee),
      ArrayLite.map(
        node.arguments,
        Visit.expression)) :
    (
      (
        node.callee.type !== "Identifier" ||
        node.callee.name !== "eval") ?
      ARAN.cut.apply(
        Visit.expression(node.callee),
        ArrayLite.map(
          node.arguments,
          Visit.expression)) :
      ARAN.cut.eval((
        node.arguments.length === 0 ?
        ARAN.cut.primitive(void 0) :
        (
          node.arguments.length === 1 ?
          Visit.expression(node.arguments[0]) :
          Build.get(
            Build.array(
              ArrayLite.map(
                node.arguments,
                (argument, index) => (
                  index ?
                  ARAN.cut.drop0after(
                    Visit.expression(argument)) :
                  Visit.expression(argument)))),
            Build.primitive(0))))))) :
  ARAN.cut.apply(
    ARAN.cut.builtin("apply"),
    [
      (
        node.callee.type === "MemberExpression" ?
        ARAN.cut.get(
          Interim.hoist(
            "this",
            ARAN.cut.$copy2after(
              Visit.expression(node.callee.object))),
          Util.property(node.callee)) :
        Visit.expression(node.callee)),
      (
        node.callee.type === "MemberExpression" ?
        Interim.read("this") :
        (
          ARAN.context.strict ?
          ARAN.cut.primitive(void 0) :
          ARAN.cut.$builtin("global"))),
      Build.sequence(
        ArrayLite.concat(
          [
            Interim.hoist(
              "arguments",
              ARAN.cut.array([]))],
          ArrayLite.map(
            node.arguments,
            (argument) => (
              argument.type === "SpreadElement" ?
              Build.apply(
                ARAN.cut.$builtin(),
                [
                  ARAN.cut.$copy0before(
                    Interim.read("arguments")),
                  ARAN.cut.invoke(
                    Visit.expression(argument.argument),
                    ARAN.cut.builtin("iterator"),
                    [])]) :
              ARAN.cut.set(
                ARAN.cut.$copy0before(
                  Interim.read("arguments")),
                ARAN.cut.get(
                  ARAN.cut.$copy0before(
                    Interim.read("arguments")),
                  ARAN.cut.primitive("length")),
                Visit.expression(argument)))),
          Interim.read("arguments")))]));

exports.MemberExpression = (node) => ARAN.cut.get(
  Visit.expression(node.object),
  Util.property(node));

exports.Identifier = (node) => (
  node.name === "undefined" ?
  Build.conditional(
    Build.binary(
      "===",
      Build.read("undefined"),
      Build.primitive(void 0)),
    ARAN.cut.primitive(void 0),
    ARAN.cut.read("undefined")) :
  ARAN.cut.read(node.name));

exports.Literal = (node) => (
  node.regex ?
  ARAN.cut.regexp(node.regex.pattern, node.regex.flags) :
  ARAN.cut.primitive(node.value));
