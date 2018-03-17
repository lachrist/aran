
const ArrayLite = require("array-lite");
const Interim = require("../interim.js");
const Visit = require("../visit");
const Util = require("./index.js");
const Error = global.Error;

exports.closure = (node) => {
  const name = node.id ? node.id.name : ARAN.name;
  const temporary = ARAN.hoisted;
  ARAN.hoisted = [];
  const statements1 = ArrayLite.concat(
    (
      node.type === "ArrowFunctionExpression" ?
      ARAN.build.If(
        ARAN.build.read("new.target"),
        ARAN.cut.Throw(
          ARAN.cut.construct(
            ARAN.cut.$builtin(["TypeError"]),
            [
              ARAN.cut.primitive(name+" is not a constructor")])),
        []) :
      []),
    ARAN.cut.Declare(
      "const",
      "new.target",
      ARAN.build.conditional(
        ARAN.build.read("new.target"),
        ARAN.cut.$copy(
          3,
          ARAN.build.get(
            ARAN.build.read("arrival"),
            ARAN.build.primitive(0))),
        ARAN.cut.primitive(void 0))),
    (
      node.type === "ArrowFunctionExpression" ?
      [] :
      ARAN.cut.Declare(
        "const",
        "this",
        ARAN.cut.$copy(
          2,
          ARAN.build.get(
            ARAN.build.read("arrival"),
            ARAN.build.primitive(1))))),
    (
      node.type === "ArrowFunctionExpression" ?
      [] :
      ARAN.cut.Declare(
        "const",
        "arguments",
        ARAN.cut.$copy(
          1,
          ARAN.build.get(
            ARAN.build.read("arrival"),
            ARAN.build.primitive(2))))),
    (
      (
        node.type === "ArrowFunctionExpression" ||
        node.AranStrict) ?
      [] :
      ARAN.build.Statement(
        ARAN.cut.$drop(
          Util.define(
            ARAN.cut.$copy(
              1,
              ARAN.build.get(
                ARAN.build.read("arrival"),
                ARAN.build.primitive(2))),
            "callee",
            ARAN.cut.$copy(
              3,
              ARAN.build.read("arrival"),
              ARAN.build.primitive(0)),
            true,
            false,
            true)))),
    (
      (
        node.params.length &&
        node.params[node.params.length-1].type === "RestElement") ?
      ArrayLite.concat(
        ARAN.build.Statement(
          Interim.hoist(
            "iterator",
            ARAN.cut.invoke(
              ARAN.build.read("arguments"),
              ARAN.cut.$builtin(["Symbol", "iterator"]),
              []))),
        ArrayLite.flatenMap(
          node.params,
          (pattern) => (
            pattern.type === "RestElement" ?
            Util.Declare(
              "let",
              pattern.argument,
              ARAN.build.apply(
                null,
                Util.rest(),
                [
                  Interim.read("iterator"),
                  ARAN.cut.array([])])) :
            Util.Declare(
              "let",
              pattern,
              ARAN.cut.get(
                ARAN.cut.invoke(
                  ARAN.cut.$copy(
                    1,
                    Interim.read("iterator")),
                  ARAN.cut.primitive("next"),
                  []),
                ARAN.cut.primitive("value"))))),
        ARAN.build.Statement(
          ARAN.cut.$drop(
            Interim.read("iterator")))) :
      ArrayLite.concat(
        ArrayLite.flatenMap(
          node.params,
          (pattern, index) => Util.Declare(
            "let",
            pattern,
            ARAN.cut.get(
              ARAN.cut.$copy(
                1,
                ARAN.build.read("arguments")),
              ARAN.cut.primitive(index)))),
        ARAN.build.Statement(
          ARAN.cut.$drop(
            ARAN.build.read("arguments"))))),
    ARAN.build.Statement(
      ARAN.cut.$drop(
        ARAN.build.primitive(null))),
    ARAN.build.Statement(
      ARAN.cut.$drop(
        ARAN.build.primitive(null))));
  const statements0 = ArrayLite.flaten(ARAN.hoisted);
  ARAN.hoisted = [];
  const statements2 = (
    node.expression ?
    ARAN.cut.Return(
      Visit.expression(node.body)) :
    ArrayLite.concat(
      ArrayLite.flatenMap(
        node.body.body,
        Visit.Statement),
      ARAN.cut.Return(
        ARAN.cut.primitive(void 0))));
  const expression = Util.define(
    Util.define(
      ARAN.cut.closure(
        node.AranStrict,
        ArrayLite.concat(
          statements0,
          statements1,
          ArrayLite.flaten(ARAN.hoisted),
          statements2)),
      "name",
      ARAN.cut.primitive(name),
      false,
      false,
      true),
    "length",
    ARAN.cut.primitive(
      (
        (
          node.params.length &&
          node.params[node.params.length-1].type === "RestElement") ?
        node.params.length - 1 :
        node.params.length)),
    false,
    false,
    true);
  ARAN.hoisted = temporary;
  return (
    node.type === "ArrowFunctionExpression" ?
    ARAN.build.sequence(
      [
        ARAN.cut.$drop(
          ARAN.cut.set(
            ARAN.cut.$copy(
              1,
              Interim.hoist("arrow", expression)),
            ARAN.cut.primitive("prototype"),
            ARAN.cut.primitive(void 0))),
        Interim.read("arrow")]) :
    expression);
};
