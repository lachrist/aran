
const ArrayLite = require("array-lite");
const Interim = require("../interim.js");
const Visit = require("../visit");
const Util = require("./index.js");
const Error = global.Error;

const defargs = (patterns) => {
  let index1 = 0;
  for (let index1 = 0; index1 < patterns.length; index1++) {
    const pattern = patterns[index1];
    if (pattern.type === "Identifier") {
      if (pattern.name === "arguments")
        return true;
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
  return false;
};

exports.function = (node) => {
  const temporary = ARAN.hoisted;
  ARAN.hoisted = [];
  const statements1 = ArrayLite.concat(
    (
      node.type === "ArrowFunctionExpression" ?
      ARAN.cut.If(
        ARAN.cut.$copy(
          3,
          ARAN.build.get(
            ARAN.build.read("arrival"),
            ARAN.build.primitive(1))),
        ARAN.cut.Throw(
          ARAN.cut.construct(
            ARAN.cut.$load("TypeError"),
            [
              ARAN.cut.primitive((node.id ? node.id.name : ARAN.name)+" is not a constructor")])),
        []) :
      []),
    (
      node.type === "ArrowFunctionExpression" ?
      [] :
      ARAN.cut.Declare(
        "const",
        "new.target",
        ARAN.cut.conditional(
          ARAN.cut.$copy(
            3,
            ARAN.build.get(
              ARAN.build.read("arrival"),
              ARAN.build.primitive(1))),
          ARAN.cut.$copy(
            4,
            ARAN.build.get(
              ARAN.build.read("arrival"),
              ARAN.build.primitive(0))),
          ARAN.cut.primitive(void 0)))),
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
            ARAN.build.primitive(2))))),
    (
      (
        node.type === "ArrowFunctionExpression" ||
        defargs(ArrayLite.slice(node.params))) ?
      [] :
      ARAN.cut.Declare(
        "const",
        "arguments",
        ARAN.cut.$copy(
          1,
          ARAN.build.get(
            ARAN.build.read("arrival"),
            ARAN.build.primitive(3))))),
    (
      (
        node.params.length &&
        node.params[node.params.length-1].type === "RestElement") ?
      ArrayLite.concat(
        ARAN.build.Statement(
          Interim.hoist(
            "iterator",
            ARAN.cut.invoke(
              ARAN.build.get(
                ARAN.build.read("arrival"),
                ARAN.build.primitive(3)),
              ARAN.cut.$load("Symbol_iterator"),
              []))),
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
                ARAN.build.get(
                  ARAN.build.read("arrival"),
                  ARAN.build.primitive(3))),
              ARAN.cut.primitive(index)))),
        ARAN.build.Statement(
          ARAN.cut.$drop(
            ARAN.build.primitive(null))))),
    ARAN.build.Statement(
      ARAN.cut.$drop(
        ARAN.cut.$drop(
          ARAN.cut.$drop(
            ARAN.build.primitive(null))))));
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
  const expression = ARAN.cut.function(
    node.AranStrict,
    ArrayLite.concat(
      statements0,
      statements1,
      ArrayLite.flaten(ARAN.hoisted),
      statements2));
  ARAN.hoisted = temporary;
  return expression;
};
