
const ArrayLite = require("array-lite");
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
  ArrayLite.every(
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
        (
          property.computed ?
          Visit.expression(property.key) :
          (
            property.key.type === "Identifier" ?
            ARAN.cut.primitive(property.key.name) :
            ARAN.cut.primitive(property.key.value))),
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

exports.SequenceExpression = (node) => ARAN.build.sequence(
  ArrayLite.map(
    node.expressions,
    (expression, index) => (
      index === node.expressions.length -1 ?
      Visit.expression(expression) :
      ARAN.cut.$drop(
        Visit.expression(expression)))));

exports.UnaryExpression = (node) => (
  node.operator === "typeof" && node.argument.type === "Identifier" ?
  ARAN.cut.unary(
      "typeof",
      ARAN.build.apply(
        ARAN.build.closure(
          false,
          ARAN.build.Try(
            ARAN.build.Return(
              ARAN.cut.read(node.argument.name)),
            ARAN.build.Return(
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

// Redondant checks on pattern (could improve {maybe}).
exports.AssignmentExpression = (node) => (
  node.left.type === "Identifier" ?
  ARAN.cut.write(
    node.left.name,
    ARAN.cut.$copy(
      1,
      (
        node.operator === "=" ?
        Visit.expression(node.right) :
        ARAN.cut.binary(
          apply(substring, node.operator, [0, node.operator.length-1]),
          ARAN.cut.read(node.left.name),
          Visit.expression(node.right))))) :
  (
    node.left.type === "MemberExpression" ?
    ARAN.cut.set(
      (
        node.operator === "=" ?
        Visit.expression(node.left.object) :
        Interim.hoist(
          "object",
          Visit.expression(node.left.object))),
      (
        node.operator === "=" ?
        Util.property(node.left),
        Interim.hoist(
          "property",
          Util.property(node.left))),
      (
        node.operator === "=" ?
        Visit.expression(node.right) :
        ARAN.cut.binary(
          apply(substring, node.operator, [0, node.operator.length-1]),
          ARAN.cut.get(
            ARAN.cut.$copy(
              2,
              Interim.read("object")),
            ARAN.cut.$copy(
              2,
              Interim.read("property"))),
          Visit.expression(node.right))))
    ARAN.build.sequence([
      Interim.hoist(
        "value",
        ARAN.cut.$copy(
          1,
          Visit.expression(node.right))),
      Util.assign(
        node.left,
        Interim.read("value")),
      Interim.read("value")])));

exports.UpdateExpression = (node) => (
  node.argument.type === "MemberExpression" ?
  (
    node.prefix ?
    ARAN.cut.set(
      Interim.hoist(
        "object",
        Visit.expression(node.argument.object)),
      Interim.hoist(
        "property",
        Util.property(node.argument)),
      ARAN.cut.binary(
        node.operator[0],
        ARAN.cut.get(
          ARAN.cut.$copy(
            2,
            Interim.read("object")),
          ARAN.cut.$copy(
            2,
            Interim.read("property"))),
        ARAN.cut.primitive(1))) :
    ARAN.build.sequence(
      [
        ARAN.cut.$drop(
          ARAN.cut.set(
            Interim.hoist(
              "object",
              Visit.expression(node.argument.object)),
            Interim.hoist(
              "property",
              Util.property(node.argument)),
            ARAN.cut.binary(
              node.operator[0],
              ARAN.cut.$copy(
                3,
                ARAN.cut.$swap(
                  1,
                  2,
                  ARAN.cut.$swap(
                    1,
                    3,
                    Interim.hoist(
                      "value",
                        ARAN.cut.get(
                          ARAN.cut.$copy(
                            2,
                            Interim.read("object")),
                          ARAN.cut.$copy(
                            2,
                            Interim.read("property"))))))),
              ARAN.cut.primitive(1)))),
        Interim.read("value")])) :
  (
    node.prefix ?
    ARAN.cut.write(
      node.argument.name,
      ARAN.cut.$copy(
        1,
        ARAN.cut.binary(
          node.operator[0],
          ARAN.cut.read(node.argument.name),
          ARAN.cut.primitive(1)))) :
    ARAN.build.sequence(
      [
        ARAN.cut.write(
          node.argument.name,
          ARAN.cut.binary(
            node.operator[0],
            Interim.hoist(
              "value",
              ARAN.cut.$copy(
                1,
                ARAN.cut.read(node.argument.name))),
            ARAN.cut.primitive(1))),
        Interim.read("value")])));

exports.LogicalExpression = (node) => ARAN.cut.conditional(
  Interim.hoist(
    "logic",
    ARAN.cut.$copy(
      1,
      Visit.expression(node.left))),
  (
    node.operator === "||" ?
    Interim.read("logic") :
    ARAN.build.sequence(
      [
        ARAN.cut.$drop(
          Interim.read("logic")),
        Visit.expression(node.right)])),
  (
    node.operator === "&&" ?
    Interim.read("logic") :
    ARAN.build.sequence(
      [
        ARAN.cut.$drop(
          Interim.read("logic")),
        Visit.expression(node.right)])));

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
  ArrayLite.every(
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
          ARAN.build.get(
            ARAN.build.array(
              ArrayLite.map(
                node.arguments,
                (argument, index) => (
                  index ?
                  ARAN.cut.$drop(
                    Visit.expression(argument)) :
                  Visit.expression(argument)))),
            ARAN.build.primitive(0))))))) :
  ARAN.cut.apply(
    ARAN.cut.builtin("apply"),
    [
      (
        node.callee.type === "MemberExpression" ?
        ARAN.cut.get(
          Interim.hoist(
            "this",
            ARAN.cut.$copy(
              1,
              Visit.expression(node.callee.object))),
          Util.property(node.callee)) :
        Visit.expression(node.callee)),
      (
        node.callee.type === "MemberExpression" ?
        ARAN.cut.$swap(
          1,
          2,
          Interim.read("this")) :
        (
          node.AranStrict ?
          ARAN.cut.primitive(void 0) :
          ARAN.cut.$builtin("global"))),
      ARAN.build.sequence(
        ArrayLite.concat(
          [
            Interim.hoist(
              "arguments",
              ARAN.cut.array([]))],
          ArrayLite.map(
            node.arguments,
            (argument) => (
              argument.type === "SpreadElement" ?
              ARAN.build.apply(
                ARAN.cut.$builtin(),
                [
                  ARAN.cut.$copy(
                    1,
                    Interim.read("arguments")),
                  ARAN.cut.invoke(
                    Visit.expression(argument.argument),
                    ARAN.cut.builtin("iterator"),
                    [])]) :
              ARAN.cut.set(
                ARAN.cut.$copy(
                  1,
                  Interim.read("arguments")),
                ARAN.cut.get(
                  ARAN.cut.$copy(
                    1,
                    Interim.read("arguments")),
                  ARAN.cut.primitive("length")),
                Visit.expression(argument)))),
          Interim.read("arguments")))]));

exports.MemberExpression = (node) => ARAN.cut.get(
  Visit.expression(node.object),
  Util.property(node));

exports.MetaProperty = (node) => ARAN.cut.read("new.target");

exports.Identifier = (node) => (
  node.name === "undefined" ?
  ARAN.build.conditional(
    ARAN.build.binary(
      "===",
      ARAN.build.read("undefined"),
      ARAN.build.primitive(void 0)),
    ARAN.cut.primitive(void 0),
    ARAN.cut.read("undefined")) :
  ARAN.cut.read(node.name));

exports.Literal = (node) => (
  node.regex ?
  ARAN.cut.regexp(node.regex.pattern, node.regex.flags) :
  ARAN.cut.primitive(node.value));
