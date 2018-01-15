
const ArrayLite = require("array-lite");
const Interim = require("../interim.js");
const Visit = require("../visit");
const Util = require("./index.js");

exports.closure = (node) => {
  const temporary = ARAN.hoisted;
  ARAN.hoisted = [];
  const statements1 = ArrayLite.concat(
    ARAN.cut.$Arrival(
      node.AranStrict,
      node.type === "ArrowFunctionExpression"),
    (
      node.type === "ArrowFunctionExpression" ?
      [] :
      ARAN.cut.Declare(
        "let",
        "this",
        ARAN.cut.$this())),
    Interim.Declare(
      "arguments",
      ARAN.cut.$arguments()),
    (
      node.type === "ArrowFunctionExpression" ?
      [] :
      ARAN.cut.Declare(
        "let",
        "arguments",
        ARAN.cut.$copy0before(
          Interim.read("arguments")))),
    ArrayLite.flaten(
      ArrayLite.map(
        node.params,
        (param, index) => (
          param.type === "RestElement" ?
          ArrayLite.concat(
            Interim.Declare(
              "argument_index",
              ARAN.cut.primitive(index)),
            Interim.Declare(
              "argument_rest",
              ARAN.cut.array([])),
            ARAN.cut.While(
              ARAN.cut.binary(
                "<",
                Interim.read("argument_index"),
                ARAN.cut.get(
                  Interim.read("arguments"),
                  ARAN.cut.primitive("length"))),
              ArrayLite.concat(
                ARAN.build.Statement(
                  ARAN.cut.set(
                    Interim.read("argument_rest"),
                    ARAN.cut.binary(
                      "-",
                      Interim.read("argument_index"),
                      ARAN.cut.primitive(index)),
                    ARAN.cut.get(
                      Interim.read("arguments"),
                      Interim.read("argument_index")))),
                ARAN.build.Statement(
                  Interim.write(
                    "argument_index",
                    ARAN.cut.binary(
                      "+",
                      Interim.read("argument_index"),
                      ARAN.cut.primitive(1)))))),
            Util.Declare(
              "let",
              param.argument,
              Interim.read("argument_rest"))) :
          Util.Declare(
            "let",
            param,
            ARAN.cut.get(
              ARAN.cut.$copy0before(
                ARAN.build.read("arguments")),
              ARAN.cut.primitive(index)))))),
    ARAN.cut.$Drop0());
  const statements2 = (
    node.expression ?
    ARAN.cut.Return(
      Visit.expression(node.body)) :
    ArrayLite.concat(
      ArrayLite.flaten(
        ArrayLite.map(
          node.body.body,
          Visit.Statement)),
        ARAN.cut.Return(
          ARAN.cut.primitive(void 0))));
  const expression = ARAN.cut.closure(
    node.AranStrict,
    ArrayLite.concat(
      statements1,
      ArrayLite.flaten(ARAN.hoisted),
      statements2));
  ARAN.hoisted = temporary;
  return (
    node.id ?
    ARAN.cut.apply(
      ARAN.cut.$builtin("defineProperty"),
      [
        expression,
        ARAN.cut.primitive("name"),
        ARAN.cut.object(
          [
            [
              ARAN.cut.primitive("value"),
              ARAN.cut.primitive(node.id.name)],
            [
              ARAN.cut.primitive("configurable"),
              ARAN.cut.primitive(true)]])]) :
    expression);
};
