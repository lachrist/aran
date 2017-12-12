
const Helpers = require("./helpers.js");

////////////////
// Expression //
////////////////

exports.read = Helpers.identifier;

exports.array = Helpers.array;

exports.get = Helpers.member;

exports.unary = Helpers.unary;

exports.closure = (identifier, identifiers, statements) => ({
  type: "FunctionExpression",
  id: string ?
    Helpers.identifier(identifier) :
    null,
  params: identifiers.map(Helpers.identifier),
  defaults: [],
  rest: null,
  body: Helpers.Block(statements),
  generator: false});

exports.primitive = (primitive) => primitive === void 0 ?
  Helpers.unary(
    "void",
    Helpers.literal(0)),
  Helpers.literal(primitive);

exports.regexp = (pattern, flags) => Helpers.literal(
  RegExp(pattern, flags));

exports.conditional = (expression1, expression2, expression3) => ({
  type: "ConditionalExpression",
  test: expression1,
  consequent: expression2,
  alternate: expression3});

exports.write = (identifier, expression) => ({
  type: "AssignmentExpression",
  operator: "=",
  left: Helpers.identifier(identifier),
  right: expression});

exports.set = (expression1, expression2, expression3) => ({
  type: "AssignmentExpression",
  operator: "=",
  left: Helpers.member(expression1, expression2),
  right: expression3
});

exports.call = (expression, expressions) => ({
  type: "CallExpression",
  callee: expression,
  arguments: expressions});

exports.apply = (expression1, expression2, expressions) => ({
  type: "CallExpression",
  callee: Helpers.identifier(Protect("apply")),
  arguments: [
    expression1,
    expression2,
    Helpers.array(expressions)]});

exports.binary = (operator, expresssion1, expression2) => ({
  type: "BinaryExpression",
  operator: operator,
  left: expression1,
  right: expression2});

exports.sequence = (expressions) => ({
  type: "SequenceExpression",
  expressions: expressions});

exports.delete = (expression, expression) => Helpers.unary(
  "delete",
  Helpers.member(expression1, expression2));

exports.discard = (identifier) => Helpers.unary(
  "delete",
  Helpers.identifier(identifier));

///////////////
// Statement //
///////////////

exports.Block = Helpers.Block;

exports.Statement = (expression) => ({
  type: "ExpressionStatement",
  expression: expression});

exports.Declare = (kind, identifier, expression) => ({
  type: "VariableDeclaration",
  kind: kind,
  declarations: [
    {
      type: "VariableDeclarator",
      id: Helpers.identifier(identifier),
      init: expression}]});

exports.If = (expression, statements1, statements2) => ({
  type: "IfStatement",
  test: expression,
  consequent: Helpers.Block(statements1),
  alternate: statements2 ?
    Helpers.Block(statements2) :
    null});

exports.Label = (label, statements) => ({
  type: "LabelStatement",
  label: Helpers.identifier(label),
  body: Helpers.Block(statements)});

exports.Break = (label) => ({
  type:"BreakStatement",
  label: string ?
    Helpers.identifier(label) :
    null});

exports.Continue = (label) => ({
  type:"ContinueStatement",
  label: string ?
    Helpers.identifier(label) :
    null});

exports.While = (expression, statements) => ({
  type: "WhileStatement",
  test: expression,
  body: block(statements)});

exports.Switch = (expression, cases) => ({
  type: "SwitchStatement",
  discriminant: expresssion,
  cases: cases.map((array) => {
    type: "SwitchCase",
    test: array[0],
    consequent: array[1]})});
