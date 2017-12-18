exports.Body = require("./body.js");
exports.closure = require("./closure.js");
exports.Declaration = require("./declaration.js");
exports.enumerate = require("./enumerate.js");
exports.left = require("./left.js");
exports.property = require("./property.js");
exports.rest = require("./rest.js");
exports.write = require("./write.js");


const Build = require("../../build.js");
const Flaten = require("../../flaten.hs");
const Hide = require("../../hide.js");
const Visit = require("../visit");
const Helpers = require("./index.js");

exports.Body = (statement) => statement.type === "BlockStatement" ?
  Flaten.apply(
    null,
    statement.body.map(Visit.Statement)) :
  Visit.Statement(statement);

exports.property = (property) => property.computed ?
  Visit.expression(property.key) :
  ARAN.cut.primitive(property.name);

exports.closure = (node) => {
  const temporary = ARAN.context;
  ARAN.context = Context(
    ast.body.type === "BlockStatement" && ast.body.body[0]);
  const statementss1 = node.body.type === "BlockStatement" ?
    node.body.body.map(Visit.Statement) :
    [ARAN.cut.Return(Visit.expression(node.body))];
  const statementss2 = ARAN.context.hoisted;
  ARAN.context.hoisted = null;
  const statementss3 = (node.params[node.params.length-1]||{}).type === "RestElement" ?
    Assignment(
      "var",
      [
        [
          {
            type: "ArrayPattern",
            elements: params},
          Build.read("arguments")]]) :
    params.map((param, index) => Assignment(
      "var",
      [
        [
          param,
          ARAN.cut.get(
            ARAN.cut.Copy0.before(
              Build.read("arguments")),
            ARAN.cut.primitive(index))]]));
  const statementss4 = ARAN.context.hidden.map((identifier) => Build.Declare(
    "var",
    identifier,
    Build.primitive(null)));
  const expression = ARAN.cut.closure(
    ARAN.context.strict,
    Flaten.call(
      Flaten.apply(null, statementss4),
      Flaten.apply(null, statementss3),
      Flaten.apply(null, statementss2),
      Flaten.apply(null, statementss1)));
  ARAN.context = temporary;
  return node.id ?
    ARAN.cut.apply(
      ARAN.cut.protect("defineProperty"),
      ARAN.cut.primitive(null),
      [
        expression,
        ARAN.cut.primitive("name"),
        ARAN.cut.object(
          [
            "value",
            "value",
            ARAN.cut.primitive(node.id.name)],
          [
            "value",
            "configurable",
            ARAN.cut.primitive(true)])]) :
    expression;
};

exports.write = (pattern, expression) => Build.sequence(
  Flaten(
    Assign(
      null,
      [
        [
          pattern,
          ARAN.cut.copy0.after(
            Build.write(
              Hide("write"),
              Visit(expression)))]]),
    [
      Build.read(
        Hide("write"))]));

exports.Declare = (kind, declarators) => Flaten.apply(
[],
declarators.map((declarator) => {
  if (declarator.init)
    return Assign(
      kind,
      [
        [declarator.id, declarator.init]]);
  if (declarator.id.type !== "Identifier")
    throw new Error("Missing initializer in destructuring pattern");
  const statements = ARAN.cut.Declare(
    kind,
    declarator.id.name,
    ARAN.cut.primitive(void 0));
  if (kind !== "var")
    return statements;
  ARAN.closure.hoisted.push(statements);
  return [];
}));

exports.update = (left, arrow) => left.type === "Identifier" ?
  ARAN.cut.write(
    left.name,
    arrow(
      ARAN.cut.read(left.name))) :
  ARAN.cut.set(
    ARAN.cut.copy0.after(
      Build.write(
        Hide("object"),
        Visit.expression(left.object))),
    ARAN.cut.copy2.after(
      Build.write(
        Hide("property"),
        left.property.computed ?
          Visit.expression(left.property) :
          ARAN.cut.primitive(left.name))),
    arrow(
      ARAN.cut.get(
        Build.read(
          Hide("object")),
        Build.read(
          Hide("property")))));




