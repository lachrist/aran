
const ArrayLite = require("array-lite");
const Scope = require("../scope.js");
const Visit = require("../index.js");
const Build = require("../build.js");
const Identifier = require("./identifier.js");

exports.BLOCK = (strict, nodes, scope1) => {
  const scope2 = Scope.Block(
    Hoist.lets(nodes),
    Hoist.consts(nodes),
    scope1);
  const statements = ArrayLite.concat(
    ArrayLite.flatMap(
      ArrayLite.filter(
        nodes,
        (node) => node.type === "FunctionDeclaration"),
      (node) => Build.Expression(
        Identifier.write(
          strict,
          node.id.name,
          Visit.expression(node, scope2),
          scope2))),
    ArrayLite.flatMap(
      ArrayLite.filter(
        nodes,
        (node) => node.type !== "FunctionDeclaration"),
      (node) => Visit.Statement(node, scope2)));
  return Build.BLOCK(
    label,
    Scope.qualifiers(scope2),
    ArrayLite.concat(
      ArrayLite.flatMap(
        Scope.stickers(scope2),
        (token) => Build.Write(
          token,
          Build.primitive(false))),
      statements);
};
