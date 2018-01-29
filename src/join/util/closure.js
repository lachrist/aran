
const ArrayLite = require("array-lite");
const Escape = require("../../escape.js");
const Interim = require("../interim.js");
const Visit = require("../visit");
const Util = require("./index.js");
const Error = global.Error;

const clean = (patterns) => {
  let index1 = 0;
  while (index1 < patterns.length) {
    const pattern = patterns[index1];
    if (pattern.type === "Identifier") {
      if (pattern.name === "arguments")
        return false;
    } else if (pattern.type === "RestElement") {
      patterns[patterns.length] = pattern.argument;
    } else if (pattern.type === "AssignmentPattern") {
      patterns[patterns.length] = pattern.left;
    } else if (pattern.type === "ArrayPattern") {
      for (let index2=0, length2=pattern.elements.length; index2<length2; index2++)
        if (pattern.elements[index2])
          patterns[patterns.length] = pattern.elements[index2];
    } else if (pattern.type === "ObjectPattern") {
      for (let index2=0, length2=patterns.properties.length; index2<length2; index2++)
        patterns[patterns.length] = pattern.properties[index2].value;
    } else {
      throw new Error("Unknown pattern type: "+pattern.type);
    }
  }
  return true;
}

exports.closure = (node, local1, local2) => {
  const temporary = ARAN.hoisted;
  ARAN.hoisted = [];
  const statements1 = ArrayLite.concat(
    (
      node.type === "ArrowFunctionExpression" ?
      (
        local1 = ARAN.build.read(
          Escape("this")),
        local2 = ARAN.cut.$drop(local1),
        (
          local1 === local2 ?
          [] :
          Build.Statement(local2))) :
      ARAN.cut.Declare(
        "const",
        "this",
        ARAN.build.read(
          Escape("this")))),
    (
      (
        node.type !== "ArrowFunctionExpression" &&
        clean(
          ArrayLite.slice(node.params))) ?
      ARAN.cut.Declare(
        "let",
        "arguments",
        ARAN.cut.$copy(
          0,
          ARAN.build.read(
            Escape("arguments")))) :
      []),
    (
      (
        node.params.length &&
        node.params[node.params.length-1].type === "RestElement") ?
      ArrayLite.concat(
        Interim.Declare(
          "iterator",
          ARAN.cut.invoke(
            ARAN.build.read(
              Escape("arguments")),
            ARAN.cut.builtin("iterator"),
            [])),
        ArrayLite.flatenMap(
          node.params,
          (pattern) => Util.Declare(
            "let",
            pattern.argument,
            (
              pattern.type === "RestElement" ?
              ARAN.cut.apply(
                ARAN.cut.$builtin("rest"),
                [
                  Interim.read("iterator")]) :
              ARAN.cut.get(
                ARAN.cut.invoke(
                  Interim.read("iterator"),
                  ARAN.cut.primitive("next"),
                  []),
                ARAN.cut.primitive("value")))))) :
      ArrayLite.flatenMap(
        node.params,
        (pattern, index) => Util.Declare(
          "let",
          pattern,
          ARAN.cut.get(
            (
              index === node.params.length-1 ?
              ARAN.build.read(
                Escape("arguments")) :
              ARAN.cut.$copy(
                0,
                ARAN.build.read(
                  Escape("arguments")))),
            ARAN.cut.primitive(index))))));
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
