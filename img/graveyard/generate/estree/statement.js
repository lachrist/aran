
const ArrayLite = require("array-lite");
const Label = require("./label.js");
const Visit = require("./index.js");

// exports.Assign = ({1:identifier, 2:expression}, namespace) => ({
//   type: "ExpressionStatement",
//   expression: {
//     type: "AssignmentExpression",
//     operator: "=",
//     left: {
//       type: "Identifier",
//       name: Sanitize.identifier(identifier)},
//     right: Visit.expression(expression, namespace)}});

exports.Debugger = ({}, namespace) => ({
  type: "DebuggerStatement"});

exports.Break = ({1:label}, namespace) => ({
  type: "BreakStatement",
  label: {
    type: "Identifier",
    name: Label(label)}});

exports.Continue = ({1:label}, namespace) => ({
  type: "ContinueStatement",
  label: {
    type: "Identifier",
    name: Label(label)}});

exports.Expression = ({1:expression}, namespace) => ({
  type: "ExpressionStatement",
  expression: Visit.expression(expression, namespace)});

exports.Return = ({1:expression}, namespace) => ({
  type: "ReturnStatement",
  argument: Visit.expression(expression, namespace)});

exports.If = ({1:expression, 2:block1, 3:block2}, namespace) => {
  type: "IfStatement",
  test: Visit.expression(expression, namespace),
  consequent: Visit.block(block1, namespace, "block"),
  alternate: Visit.block(block2, namespace, "block")};

exports.Block = ({1:block}, namespace) => Visit.block(block, namespace, "block"));

exports.Try = ({1:block1, 2:block2, 3:block3}, namespace) => ({
  type: "TryStatement",
  block: Visit.block(block1, namespace, "block"),
  handler: {
    type: "CatchClause",
    param: {
      type: "Identifier",
      name: Sanitize.identifier("@error") },
    body: Visit.block(block2, namespace, "block") },
  finalizer: Visit.block(block3, namespace, "block")});

exports.While = ({1:expression, 2:{1:labels, 2:identifiers, 3:statements}}, namespace) => ArrayLite.reduce(
    labels,
    (node, label) => ({
      type: "LabeledStatement",
      label: {
        type: "Identifier",
        name: label},
      body: node}),
    {
      type: "WhileStatement",
      test: Visit.expression(expression, namespace),
      body: Visit.block(["BLOCK", [], identifiers, statements], namespace, "while") });
