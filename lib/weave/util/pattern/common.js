
const ArrayLite = require("array-lite");
const Interim = require("../../interim.js");
const Visit = require("../../visit");
const Util = require("../index.js");

module.exports = (transformers, pattern, string) => {
  let counter = 0;
  const visit = (pattern, string) => visitors[pattern.type](pattern, string);
  const visitors = {};
  visitors.MemberExpression = (pattern, string) => transformers.expression(
    ARAN.cut.$drop(
      ARAN.cut.set(
        ARAN.cut.$swap(
          1,
          2,
          Visit.expression(pattern.object)),
        ARAN.cut.$swap(
          1,
          2,
          Util.property(pattern)),
        Interim.read(string))));
  visitors.Identifier = (pattern, string) => transformers.binding(
    pattern.name,
    Interim.read(string));
  visitors.AssignmentPattern = (pattern, string) => ArrayLite.concat(
    transformers.expression(
      Interim.hoist(
        "default"+(++counter),
        ARAN.cut.conditional(
          ARAN.cut.binary(
            "===",
            ARAN.cut.$copy(
              1,
              Interim.read(string)),
            ARAN.cut.primitive(void 0)),
          ARAN.build.sequence(
            [
              ARAN.cut.$drop(
                Interim.read(string)),
              Visit.expression(pattern.right)]),
          Interim.read(string)))),
    visit(pattern.left, "default"+counter));
  visitors.ObjectPattern = (pattern, string) => ArrayLite.concat(
    ArrayLite.flatenMap(
      pattern.properties,
      (property) => ArrayLite.concat(
        transformers.expression(
          Interim.hoist(
            "property"+(++counter),
            ARAN.cut.get(
              ARAN.cut.$copy(
                1,
                Interim.read(string)),
              (
                property.computed ?
                Visit.expression(property.key) :
                (
                  property.key.type === "Identifier" ?
                  ARAN.cut.primitive(property.key.name) :
                  ARAN.cut.primitive(property.key.value)))))),
        visit(property.value, "property"+counter))),
    transformers.expression(
      ARAN.cut.$drop(
        Interim.read(string))));
  visitors.ArrayPattern = (pattern, string1, string2) => ArrayLite.concat(
    transformers.expression(
      Interim.hoist(
        string2 = "iterator"+(++counter),
        ARAN.cut.invoke(
          Interim.read(string1),
          ARAN.cut.$load("Symbol.iterator"),
          []))),
    ArrayLite.flatenMap(
      pattern.elements,
      (element) => (
        element ?
        (
          element.type === "RestElement" ?
          ArrayLite.concat(
            transformers.expression(
              Interim.hoist(
                "rest"+(++counter),
                ARAN.build.apply(
                  Util.rest(),
                  [
                    Interim.read(string2),
                    ARAN.cut.array([])]))),
            visit(element.argument, "rest"+counter)) :
          ArrayLite.concat(
            transformers.expression(
              Interim.hoist(
                "element"+(++counter),
                ARAN.cut.get(
                  ARAN.cut.invoke(
                    ARAN.cut.$copy(
                      1,
                      Interim.read(string2)),
                    ARAN.cut.primitive("next"),
                    []),
                  ARAN.cut.primitive("value")))),
            visit(element, "element"+counter))) :
        transformers.expression(
          ARAN.cut.$drop(
            ARAN.cut.invoke(
              ARAN.cut.$copy(
                1,
                Interim.read(string2)),
              ARAN.cut.primitive("next"),
              []))))),
    transformers.expression(
      ARAN.cut.$drop(
        Interim.read(string2))));
  return visit(pattern, string);
};
