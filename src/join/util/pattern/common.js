
const Build = require("../../../build");
const Visit = require("../../visit");
const Util = require("../index.js");

module.exports = (transformers, pairs) => {
  const result = [];
  for (let index1=0; index1<pairs.length; index1++) {
    const left = pairs[index1][0];
    const right = pairs[index1][1];
    if (left === null) {
      result[result.length] = transformers.expression(
        ARAN.cut.$drop.after(right));
    } else if (left.type === "Identifier") {
      result[result.length] = transformers.binding(left.name, right);
    } else if (left.type === "MemberExpression") {
      result[result.length] = transformers.expression(
        ARAN.cut.$drop.after(
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
            Build.write(
              Hide("default"+index1),
              ARAN.cut.$copy0.after(right)),
            ARAN.cut.primitive(void 0)),
          ARAN.cut.$drop.before(
            Visit.expression(left.right)),
          Hide("default"+index1))];
    } else if (left.type === "ArrayPattern") {
      if (left.elements.length === 0) {
        result[result.length] = transformers.expression(
          ARAN.cut.$drop.after(right));
      } else {
        result[result.length] = transformers.expression(
          Build.write(
            Hide("iterator"+index1),
            ARAN.cut.invoke(
              right,
              ARAN.cut.$builtin("iterator"),
              [])));
        const last = left.elements.length-1;
        for (let index2=0; index2<last; index2++)
          pairs[pairs.length] = [
            left.elements[index2],
            ARAN.cut.invoke(
              ARAN.cut.$copy0.before(
                Build.read(
                  Hide("iterator"+index))),
              ARAN.cut.primitive("next"),
              [])];
        pairs[pairs.length] = (
          left.elements[last].type === "RestElement" ?
          [
            left.elements[last].argument,
            ARAN.cut.apply(
              ARAN.cut.builtin("rest"),
              [
                ARAN.cut.array([]),
                Hide("iterator"+index)])] :
          [
            left.elements[last],
            ARAN.cut.invoke(
              Build.read(
                Hide("iterator"+index)),
              ARAN.cut.primitive("next"),
              [])]);
      }
    } else if (left.type === "ObjectPattern") {
      if (left.properties.length) {
        result[result.length] = transformers.expression(
          ARAN.cut.$drop.after(right));
      } else {
        result[result.length] = transformers.expression(
          Build.write(
            Hide("object"+index1),
            right));
        const last = left.properties.length - 1;
        for (let index2=0; index2<last; index2++)
          pairs[pairs.length] = [
            left.properties[index2].value,
            ARAN.cut.get(
              ARAN.cut.$copy0.before(
                Build.read(
                  Hide("object"+index1))),
              Property.property(left.properties[index2]))];
        pairs[pairs.length] = [
          left.properties[last].value,
          ARAN.cut.get(
            Build.read(
              Hide("object"+index1))),
            Property.property(left.properties[last])];
      }
    }
  }
  return result;
};
