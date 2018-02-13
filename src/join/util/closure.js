
const ArrayLite = require("array-lite");
const Escape = require("../../escape.js");
const Interim = require("../interim.js");
const Visit = require("../visit");
const Util = require("./index.js");
const Error = global.Error;

exports.closure = (node) => {
  const temporary = ARAN.hoisted;
  ARAN.hoisted = [];
  const statements1 = (
    (
      node.params.length &&
      node.params[node.params.length-1].type === "RestElement") ?
    ArrayLite.concat(
      Interim.Declare(
        "iterator",
        ARAN.cut.invoke(
          ARAN.build.read(
            Escape("arguments")),
          ARAN.cut.$builtin(["Symbol", "iterator"]),
          [])),
      ArrayLite.flatenMap(
        node.params,
        (pattern) => (
          pattern.type === "RestElement" ?
          Util.Declare(
            "let",
            pattern.argument,
            ARAN.build.apply(
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
              ARAN.build.read(
                Escape("arguments"))),
            ARAN.cut.primitive(index)))),
      ARAN.build.Statement(
        ARAN.cut.$drop(
          ARAN.build.read(
            Escape("arguments"))))));
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
      ARAN.cut.$builtin(["Object", "defineProperty"]),
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
