
const ArrayLite = require("array-lite");
const Interim = require("../interim.js");
const Visit = require("../visit");
const Util = require("./index.js");
const Error = global.Error;

exports.closure = (node) => {
  const name = node.id ? node.id.name : ARAN.name;
  ARAN.name = "";
  const temporary = ARAN.hoisted;
  ARAN.hoisted = [];
  const statements1 = (
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
          ARAN.build.read("arguments")))));
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
  const expression = ARAN.cut.apply(
    null,
    ARAN.cut.$builtin(["Object", "defineProperty"]),
    [
      ARAN.cut.apply(
        null,
        ARAN.cut.$builtin(["Object", "defineProperty"]),
        [
          ARAN.cut.closure(
            node.AranStrict,
            ArrayLite.concat(
              statements0,
              statements1,
              ArrayLite.flaten(ARAN.hoisted),
              statements2)),
          ARAN.cut.primitive("name"),
          ARAN.cut.object(
            [
              [
                ARAN.cut.primitive("value"),
                ARAN.cut.primitive(name)],
              [
                ARAN.cut.primitive("configurable"),
                ARAN.cut.primitive(true)]])]),
      ARAN.cut.primitive("length"),
      ARAN.cut.object([
        [
          ARAN.cut.primitive("value"),
          ARAN.cut.primitive(
            (
              (
                node.params.length &&
                node.params[node.params.length-1].type === "RestElement") ?
              node.params.length - 1 :
              node.params.length))],
        [
          ARAN.cut.primitive("configurable"),
          ARAN.cut.primitive(true)]])]);
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
