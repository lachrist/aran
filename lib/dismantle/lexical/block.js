
const ArrayLite = require("array-lite");
const Scope = require("../scope.js");
const Visit = require("../visit");
const Build = require("../build.js");
const Name = require("./name.js");

exports.BODY = (strict, closures, scope1) => {};

exports.BLOCK = (strict, node, )

exports.CLOSURE = (strict, )


exports.BODY = (strict, nodes, scope1) => {};
exports.BLOCK = (names1, names2, closure, scope1) => {};


exports.BLOCK = (strict, names1, names2, closure, scope1) => 

exports.BLOCK = (strict, names1, names2, closure, nodes, scope1) => {
  const scope2 = Scope.Block(
    ArrayLite.concat(
      names1,
      ArrayLite.flatMap(
        nodes,
        (node) => (
          node.type === "VariableDeclaration" && node.kind === "let" ?
          node.AranNames :
          []))),
    ArrayLite.concat(
      names2,
      ArrayLite.flatMap(
        nodes,
        (node) => (
          node.type === "VariableDeclaration" && node.kind === "const" ?
          node.AranNames :
          []))),
    scope1);
  const statements = ArrayLite.concat(
    closure(scope2),
    ArrayLite.flatMap(
      ArrayLite.filter(
        nodes,
        (node) => node.type === "FunctionDeclaration"),
      (node, $token) => ArrayLite.concat(
        Build.Write(
          $token = Scope.token(scope2),
          Visit.expression(node, scope2)),
        Build.Expression(
          Name.write(
            strict,
            node.id.name,
            $token,
            scope2)))),
    ArrayLite.flatMap(
      ArrayLite.filter(
        nodes,
        (node) => node.type !== "FunctionDeclaration"),
      (node) => Visit.Statement(node, scope2)));
  return [
    Scope.identifiers(scope2),
    ArrayLite.concat(
      ArrayLite.flatMap(
        Scope.stickers(scope2),
        (token) => Build.Write(
          token,
          Build.primitive(false))),
      statements)];
};
