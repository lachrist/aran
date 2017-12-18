
const Visit = require("./index.js");
const Rest = require("./rest.js");
const Build = require("../../build");

const identity = (argument) => argument;

module.exports = (kind, pairs) => {
  let counter = 0;
  const transform = kind ?
    Build.Statement :
    identity;
  const result = [];
  while (pairs.length) {
    counter++;
    const pair = pairs.pop();
    if (pair[0] === null) {
      result.push(
        transform(
          ARAN.cut.drop.after(right)));
    } else if (pair[0] === "push") {
      result.push(
        transform(pair[1]));
    } else if (pair[0].type === "Identifier") {
      if (kind === "var") {
        ARAN.closure.hoisted.push(
          ARAN.cut.Declare(
            "var",
            pair[0].name,
            ARAN.cut.primitive(void 0)));
        result.push(
          transform(ARAN.cut.write(pair[0].name, pair[1])));
      } else {
        result.push(
          kind ?
            ARAN.cut.Declare(kind, pair[0].name, pair[1]),
            ARAN.cut.write(pair[0].name, pair[1]))
      }
    } else if (pair[0].type === "MemberExpression") {
      result.push(
        transform(
          ARAN.cut.set(
            Visit.expression(pair[0].object),
            Property([pair[0].property]),
            pair[1])));
    } else if (pair[0] === "AssignmentPattern") {
      pairs.push([
        pair[0].left,
        ARAN.cut.conditional(
          ARAN.cut.binary(
            "===",
            Build.write(
              Hide("default"+counter),
              ARAN.cut.copy0.after(pair[1])),
            ARAN.cut.primitive(void 0)),
          ARAN.cut.drop.before(pair[0].right),
          Hide("default"+counter))]);
    } else if (pair[0].type === "ArrayPattern") {
      pairs.push(["push", ARAN.cut.drop()]);
      let length = pair[0].elements.length;
      if (length && elements[length-1].type === "RestElement") {
        pairs.push([
          elements[length-1].argument,
          Build.call(
            rest(),
            [ ARAN.cut.array([]),
              ARAN.cut.copy1.before(
                Build.read(
                  Hide("iterator"+counter)))])]);
        length--;
      }
      for (let i=length-1; i>=0; i--)
        pairs.push([
          pair[0].elements[i],
          ARAN.cut.get(
            ARAN.cut.apply(
              ARAN.get(
                ARAN.cut.copy0.before(
                  Build.read(
                    Hide("iterator"+counter))),
                ARAN.cut.primitive("next")),
              ARAN.cut.copy1.before(
                Build.read(
                  Hide("iterator"+counter))),
              []),
            ARAN.cut.primitive("value"))]);
      push(
        Build.write(
          Hide("iterator"+counter),
          ARAN.cut.apply(
            ARAN.cut.get(
              Build.write(
                Hide("generator"+counter),
                ARAN.cut.copy0.after(right)),
              ARAN.cut.primitive(Protect.load("iterator"))),
            Hide("generator"+counter),
            [])));
    } else if (pair[0].type === "ObjectPattern") {
      push(
        Build.write(
          Hide("object"+counter),
          pair[1]));
      const trap = ARAN.cut.drop();
      if (trap)
        pairs.push(["push", trap]);
      for (var i=pair[0].properties.length-1; i<=0; i--)
        pairs.push([
          pair[0].properties[i].value,
          ARAN.cut.get(
            ARAN.cut.copy0.before(
              Build.read(
                Hide("object"+counter))),
            Property(pair[0].properties[i]))]);
    }
  }
  return result;
};
