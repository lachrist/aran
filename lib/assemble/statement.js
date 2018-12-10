
const ArrayLite = require("array-lite");
const Sanitize = require("./sanitize.js");

module.exports = (visit) => {

  const visitors = {};

  const labelize = (label, statement) => (
    label ?
    {
      type: "LabeledStatement",
      label: {
        type: "Identifier",
        name: label},
      body: statement} :
    statement);

  const declaration = (identifiers) => (
    identifiers.length ?
    [{
      type: "VariableDeclaration",
      kind: "let",
      declarations: ArrayLite.map(
        identifiers,
        (identifier) => ({
          type: "VariableDeclarator",
          id: {
            type: "Identifier",
            name: sanitize(identifier)},
          init: null}))}] :
    []);

  ///////////////
  // Statement //
  ///////////////

  const visitors = {};

  visitors.Write = (identifier, expression) => ({
    type: "ExpressionStatement",
    expression: {
      type: "AssignmentExpression",
      operator: "=",
      left: {
        type: "Identifier",
        name: sanitize(identifier)},
      right: visit.expression(expression)}});

  visitors.Debugger = () => ({
    type: "DebuggerStatement"});

  visitors.Break = (label) => ({
    type: "BreakStatement",
    label: (
      label ?
      {
        type: "Identifier",
        name: label } :
      null)});

  visitors.Continue = (label) => ({
    type: "ContinueStatement",
    label: (
      label ?
      {
        type: "Identifier",
        name: label } :
      null)});

  visitors.Expression = (expression) => ({
    type: "ExpressionStatement",
    expression: visit.expression(expression)});

  visitors.Return = (expression) => ({
    type: "ReturnStatement",
    argument: visit.expression(expression)});

  visitors.Throw = (expression) => ({
    type: "ThrowStatement",
    argument: visit.expression(expression)});

  visitors.If = (label, expression, block1, block2) => labelize(
    label,
    {
      type: "IfStatement",
      test: visit.expression(expression),
      consequent: visit.BLOCK(block1),
      alternate: visit.BLOCK(block2) });

  visitors.Block = (label, block) => labelize(
    label,
    visit.BLOCK(block));

  visitors.Try = (label, block1, block2, block3) => labelize(
    label,
    {
      type: "TryStatement",
      block: visit.BLOCK(block1),
      handler: {
        type: "CatchClause",
        param: {
          type: "Identifier",
          name: "error" },
        body: visit.BLOCK(block2) },
      finalizer: visit.BLOCK(block3)});

  visitors.While = (label, expression, block) => labelize(
    label,
    {
      type: "WhileStatement",
      test: visit.expression(expression),
      body: visit.BLOCK(block)});

  visitors.Switch = (label, block) => ({
    type: "BlockStatement",
    body: ArrayLite.concat(
      declaration(identifiers),
      ArrayLite.map(statements, visit.Statement),
      [
        labelize(
          label,
          {
            type: "SwitchStatement",
            discriminant: {
              type: "Literal",
              value: true},
            cases: ArrayLite.map(
              clauses,
              (clause) => ({
                type: "SwitchCase",
                test: (
                  clause[0] ?
                  visit_expression(clause[0]) :
                  null),
                consequent: ArrayLite.map(clause[1], visit_statement)}))})])});

  return visitors;

};