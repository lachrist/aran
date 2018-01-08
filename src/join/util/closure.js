
const ArrayLite = require("array-lite");
const Build = require("../../build.js");
const Context = require("../context.js");
const Visit = require("../visit");
const Pattern = require("../pattern");

exports.Declaration = (node) => ArrayLite.flaten(
  ArrayLite.map(
    node.declarations,
    (declarator, temporary) => (
      declarator.init ?
      Pattern.Declare(node.kind, declarator.id, declarator.init) :
      (
        temporary = ARAN.cut.Declare(
          node.kind,
          declarator.id.name,
          ARAN.cut.primitive(void 0)),
        (
          node.kind === "var" ?
          (
            ARAN.context.hoisted[ARAN.context.hoisted.length] = temporary,
            []) :
          temporary)))));

exports.closure = (node) => {
  const temporary = ARAN.context;
  ARAN.context = Context(
    node.body.type === "BlockStatement" && node.body.body[0]);
  const statements1 = ArrayLite.concat(
    ARAN.cut.$Closure(
      ARAN.context.strict,
      node.type === "ArrowExpression"),
    (
      node.type === "ArrowExpression" ?
      [] :
      ARAN.cut.Declare(
        "let",
        "this",
        ARAN.cut.$this()),
    Build.Declare(
      "let",
      Interim("arguments"),
      ARAN.cut.$arguments()),
    (
      node.type === "ArrowExpression" ?
      [] :
      ARAN.cut.Declare(
        "let",
        "arguments",
        ARAN.cut.copy0before(
          Build.read(
            ARAN.context.interim("arguments"))))),
    ArrayLite.map(
      node.params,
      (param, index) => (
        param.type === "RestElement" ?
        ArrayLite.concat(
          Build.Declare(
            "let",
            Interim("argument_index"),
            ARAN.cut.primitive(index)),
          Build.Statement(
            "let",
            Interim("argument_rest"),
            ARAN.cut.array([])),
          ARAN.cut.while(
            ARAN.cut.binary(
              "<"
              Build.read(
                Interim("argument_index"))),
              ARAN.cut.get(
                Build.read(
                  Interim("arguments")),
                ARAN.cut.primitive("length")),
            ArrayLite.concat(
              Build.Statement(
                ARAN.cut.set(
                  Build.read(
                    Interim("argument_rest")),
                  ARAN.cut.binary(
                    "-",
                    Build.read(
                      Interim("argument_index")),
                    ARAN.cut.primitive(index)),
                  ARAN.cut.get(
                    Build.read(
                      Interim("arguments")),
                    Build.read(
                      Interim("argument_index"))))),
              Build.Statement(
                Build.write(
                  Interim("argument_index"),
                  ARAN.cut.binary(
                    "+"
                    Build.read(
                      Interim("argument_index")),
                    ARAN.cut.primitive(1)))))),
          Pattern.Declare(
            "let",
            param.argument,
            Build.read(
              Interim("argument_rest")))) :
        Pattern.Declare(
          "let",
          param,
          ARAN.cut.get(
            ARAN.cut.$copy0.before(
              Build.read("arguments")),
            ARAN.cut.primitive(index)))))
    ARAN.cut.$Drop());
  const statements2 = (
    node.body.type === "BlockStatement" ?
    ArrayLite.concat(
      ArrayLite.flaten(
        ArrayLite.map(
          node.body.body,
          Visit.Statement)),
        ARAN.cut.Return(
          ARAN.cut.primitive(void 0))) :
    ARAN.cut.Return(
      Visit.expression(node.body)));
  const expression = ARAN.cut.closure(
    ARAN.context.strict,
    ArrayLite.concat(
      ArrayLite.flaten(
        ArrayLite.map(
          ARAN.context.interims,
          (identifier) => Build.Declare(
            "let",
            identifier,
            Build.primitive(null)))),
      statements1,
      ArrayLite.flaten(ARAN.context.hoisted),
      statements2));
  ARAN.context = temporary;
  return (
    node.id ?
    ARAN.cut.apply(
      ARAN.cut.$builtin("defineProperty"),
      [
        expression,
        ARAN.cut.primitive("name"),
        ARAN.cut.object(
          [
            "value",
            ARAN.cut.primitive(node.id.name)],
          [
            "configurable",
            ARAN.cut.primitive(true)])]) :
    expression);
};
