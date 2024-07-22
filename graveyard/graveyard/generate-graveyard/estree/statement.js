
const ArrayLite = require("array-lite");
const Sanitize = require("../sanitize.js");
const Visit = require("./index.js");

const labelize = (labels, node) => ArrayLite.reduce(
  labels,
  (node, label) => ({
    type: "LabeledStatement",
    label: {
      type: "Identifier",
      name: label},
    body: node}),
  node);

const declaration = (identifiers) => (
  identifiers.length ?
  [{
    type: "VariableDeclaration",
    kind: "let",
    declarations: ArrayLite.map(identifiers, (identifier) => ({
      type: "VariableDeclarator",
      id: {
        type: "Identifier",
        name: Sanitize(identifier)
      },
      init: null }))}] :
  []);

exports.Write = ({1:identifier, 2:expression}, namespace) => ({
  type: "ExpressionStatement",
  expression: {
    type: "AssignmentExpression",
    operator: "=",
    left: {
      type: "Identifier",
      name: Sanitize(identifier)},
    right: Visit.expression(expression, namespace)}});

exports.Debugger = ({}, namespace) => ({
  type: "DebuggerStatement"});

exports.Break = ({1:label}, namespace) => ({
  type: "BreakStatement",
  label: (
    label ?
    {
      type: "Identifier",
      name: label } :
    null)});

exports.Continue = ({1:label}, namespace) => ({
  type: "ContinueStatement",
  label: (
    label ?
    {
      type: "Identifier",
      name: label } :
    null)});

exports.Expression = ({1:expression}, namespace) => ({
  type: "ExpressionStatement",
  expression: Visit.expression(expression, namespace)});

exports.Return = ({1:expression}, namespace) => ({
  type: "ReturnStatement",
  argument: Visit.expression(expression, namespace)});

exports.Throw = ({1:expression}, namespace) => ({
  type: "ThrowStatement",
  argument: Visit.expression(expression, namespace)});

exports.If = ({1:expression, 2:block1, 3:block2}, namespace) => {
  type: "IfStatement",
  test: Visit.expression(expression, namespace),
  consequent: Visit.block(block1, namespace, "block"),
  alternate: Visit.block(block2, namespace, "block")};

exports.Block = ({1:block}, namespace) => Visit.block(block, namespace, "block"));

exports.Try = ({1:block1, 2:block2, 3:block3}, namespace) => (
  (
    block2[1].length === 0,
    block2[2].length === 1 &&
    block2[2][0][0] === "Throw" &&
    block2[2][0][1][0] === "read" &&
    block2[2][0][1][1] === "error" &&
    block3[1].length === 0 &&
    block3[2].length === 0) ?
  Visit.block(block1, namespace, "block") :
  {
    type: "TryStatement",
    block: Visit.block(block1, namespace, "block"),
    handler: {
      type: "CatchClause",
      param: {
        type: "Identifier",
        name: "error" },
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
      body: {
        type: "BlockStatement",
        body: ArrayLite.concat(
          Declare(identifiers),
          ArrayLite.map(statements, (statement) => Visit.statement(statement, namespace)))}});

exports.Case = ({1:expression}, namespace) => ({
  type: "SwitchCase",
  test: (
    expression ?
    Visit.expression(expression, namespace) :
    null),
  consequent: []});

exports.Switch = ({1:{1:labels, 2:identifiers, 3:statements}}, namespace) => ({
  type: "BlockStatement",
  body: ArrayLite.concat(
    Declare(identifiers),
    ArrayLite.map(
      ArrayLite.slice(
        statements,
        0,
        ArrayLite.find(statements, (statement) => statement[0] === "Case")),
      (node) => Visit.statement(node, namespace)),
    [
      ArrayLite.reduce(
        labels,
        (node, label) => ({
          type: "LabeledStatement",
          label: {
            type: "Identifier",
            name: label },
          body: node }),
        {
          type: "SwitchStatement",
          discriminant: {
            type: "Literal",
            value: true },
          cases: 
    }]
});

Visit.block(block, namespace, "switch");
