
const Interim = require("../../interim.js");
const Visit = require("../../visit");
const Util = require("../index.js");

// right can only modify the last element of the stack's.
// pair, conserve stack
module.exports = (transformers, left, right) => {
  const result = [
    transformers.expression(
      Interim.hoist("right", right))];
  const pairs = [
    [
      left,
      Interim.read("right")]];
  for (let index1=0; index1<pairs.length; index1++) {
    const left = pairs[index1][0];
    const right = pairs[index1][1];
    if (left === null) {
      result[result.length] = transformers.expression(
        ARAN.cut.$drop(right));
    } else if (left.type === "Identifier") {
      result[result.length] = transformers.binding(left.name, right);
    } else if (left.type === "MemberExpression") {
      result[result.length] = transformers.expression(
        ARAN.cut.$drop(
          ARAN.cut.set(
            Visit.expression(left.object),
            Util.property(left),
            right)));
    } else if (left.type === "AssignmentPattern") {
      pairs[pairs.length] = [
        left.left,
        ARAN.cut.conditional(
          ARAN.cut.binary(
            "===",
            Interim.hoist(
              "default"+index1,
              ARAN.cut.$copy(0, right)),
            ARAN.cut.primitive(void 0)),
          ARAN.cut.$drop(
            Visit.expression(left.right)),
          Interim.read("default"+index1))];
    } else if (left.type === "ArrayPattern") {
      if (left.elements.length === 0) {
        result[result.length] = transformers.expression(
          ARAN.cut.$drop(right));
      } else {
        result[result.length] = transformers.expression(
          Interim.hoist(
            "iterator"+index1,
            ARAN.cut.invoke(
              right,
              ARAN.cut.$builtin("iterator"),
              [])));
        const last = left.elements.length-1;
        for (let index2=0; index2<last; index2++)
          pairs[pairs.length] = [
            left.elements[index2],
            ARAN.cut.get(
              ARAN.cut.invoke(
                ARAN.cut.$copy(
                  0,
                  Interim.read("iterator"+index1)),
                ARAN.cut.primitive("next"),
                []),
              ARAN.cut.primitive("value"))];
        pairs[pairs.length] = (
          left.elements[last].type === "RestElement" ?
          [
            left.elements[last].argument,
            ARAN.cut.apply(
              ARAN.cut.$builtin("rest"),
              [
                Interim.read("iterator"+index1)])] :
          [
            left.elements[last],
            ARAN.cut.get(
              ARAN.cut.invoke(
                Interim.read("iterator"+index1),
                ARAN.cut.primitive("next"),
                []),
              ARAN.cut.primitive("value"))]);
      }
    } else if (left.type === "ObjectPattern") {
      if (!left.properties.length) {
        result[result.length] = transformers.expression(
          ARAN.cut.$drop(right));
      } else {
        result[result.length] = transformers.expression(
          Interim.hoist(
            "object"+index1,
            right));
        for (let index2=0; index2<left.properties.length; index2++)
          pairs[pairs.length] = [
            left.properties[index2].value,
            ARAN.cut.get(
              (
                index2 === left.properties.length - 1 ?
                Interim.read("object"+index1) :
                ARAN.cut.$copy(
                  0,
                  Interim.read("object"+index1))),
              Util.property(
                {
                  computed: left.properties[index2].computed,
                  property: left.properties[index2].key }))];
      }
    }
  }
  result[result.length] = transformers.expression(
    ARAN.cut.$drop(
      Interim.read("right")));
  return result;
};
