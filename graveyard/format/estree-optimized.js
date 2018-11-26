
const ArrayLite = require("array-lite");
const Reflect_apply = Reflect.apply;
const RegExp_prototype_test = RegExp.prototype.test;

// NOTE: read expression (identifier) are considered
// pure even if they may throw an error or trigger a
// proxy trap inside WithStatement.

/////////////
// Helpers //
/////////////

const identifiable = (expression) => (
  expression.type === "Literal" &&
  typeof expression.value === "string" &&
  Reflect_apply(RegExp_prototype_test, /^[_$A-Za-z]([0-9_$A-Za-z]*)$/, [expression.value]));

const member = (expression1, expression2) => (
  identifiable(expression2) ?
  {
    type: "MemberExpression",
    computed: false,
    object: expression1,
    property: {
      type: "Identifier",
      name: expression2.value }} :
  {
    type: "MemberExpression",
    computed: true,
    object: expression1,
    property: expression2 });

const pure = (expression) => expression.AranPure;

const optional_block = (statement) => (
  statement.body.length === 0 ?
  {
    type: "EmptyStatement"} :
  (
    statement.body.length === 1 ?
    statement.body[0] :
    statement));

const block = (statements1) => {
  for (let index1 = 0; index1<statements1.length; index1++) {
    const statement = statements1[index1];
    while (statement.type === "BlockStatement") {
      statement = statement.body[statement.body.length-1];
    }
    const type = statement.type;
    if (type === "ReturnStatement" || type === "BreakStatement" || type === "ContinueStatement" || type === "ThrowStatement") {
      const statements2 = [];
      for (let index2 = 0; index2 <= index1; index2++) {
        statements2[index2] = statements1[index2];
      }
      return {
        type: "BlockStatement",
        body: statements2
      };
    }
  }
  return {
    type: "BlockStatement",
    body: statements1
  };
}

const nullable = (expression) => (
  (
    expression.type === "UnaryExpression" &&
    expression.operator === "void" &&
    expression.AranPure) ?
  null :
  expression);

/////////////
// Program //
/////////////

exports.PROGRAM = (statements) => ({
  type: "Program",
  body: statements
});

////////////////
// Expression //
////////////////

exports.identifier = (identifier) => (
  {
    type: "Identifier",
    name: identifier});

exports.this = () => ({
  type: "ThisExpression"});

exports.meta = (identifier1, identifier2) => ({
  type: "MetaProperty",
  meta: {
    type: "Identifier",
    name: identifier1},
  property: {
    type: "Identifier",
    name: identifier2}});

exports.write = (identifier, expression) => ({
  type: "AssignmentExpression",
  AranPure: expression.type === "Identifier" && expression.name === identifier,
  operator: "=",
  left: {
    type: "Identifier",
    name: identifier},
  right: expression});

exports.array = (expressions) => ({
  type: "ArrayExpression",
  AranPure: ArrayLite.every(expressions, pure),
  elements: expressions});

exports.object = (properties) => ({
  type: "ObjectExpression",
  AranPure: ArrayLite.every(
    properties,
    (property) => property[1].AranPure),
  properties: properties.map((property) => ({
    type: "Property",
    computed: false,
    shorthand: false,
    method: false,
    kind: "init",
    key: {
      type: "Literal",
      value: property[0]
    },
    value: property[1]
  }))});

exports.function = (statements) => ({
  type: "FunctionExpression",
  id: {
    type: "Identifier",
    name: "callee"},
  params: [],
  body: block(statements),
  generator: false,
  expression: false,
  async: false});

exports.literal = (primitive) => ({
  type: "Literal",
  AranPure: true,
  value: primitive});

exports.regexp = (string1, string2) => ({
  type: "Literal",
  AranPure: true,
  regex: {
    pattern: string1,
    flags: string2}});

exports.get = (expression1, expression2) => (
  (
    expression1.type === "ArrayExpression" &&
    expression2.type === "Literal" &&
    typeof expression2.value === "number" &&
    ArrayLite.every(
      expression1.elements,
      (expression, index) => index === expression2.value || expression.AranPure)) ?
  expression1.elements[expression2.value] :
  member(expression1, expression2));

exports.set = (expression1, expression2, expression3) => ({
  type: "AssignmentExpression",
  operator: "=",
  left: member(expression1, expression2),
  right: expression3});

exports.conditional = (expression1, expression2, expression3) => ({
  type: "ConditionalExpression",
  AranPure: expression1.AranPure && expression2.AranPure && expression3.AranPure,
  test: expression1,
  consequent: expression2,
  alternate: expression3});

exports.binary = (operator, expression1, expression2) => ({
  type: "BinaryExpression",
  AranPure: (
    expression1.type === "Literal" &&
    expression2.type === "Literal" &&
    !expression1.regex &&
    !expression2.regex),
  operator: operator,
  left: expression1,
  right: expression2});

exports.unary = (operator, expression) => ({
  type: "UnaryExpression",
  AranPure: (
    (
      operator === "void" &&
      expression.AranPure) ||
    (
      expression.type === "Literal" &&
      !expression.regex)),
  prefix: true,
  operator: operator,
  argument: expression});

exports.new = (expression, expressions) => ({
  type: "NewExpression",
  callee: expression,
  arguments: expressions});

exports.call = (expression, expressions) => ({
  type: "CallExpression",
  callee: expression,
  arguments: expressions});

exports.sequence = (expressions, expression) => (
  expressions = ArrayLite.filter(expressions, (expression) => !expression.AranPure),
  (
    expressions.length ?
    {
      type: "SequenceExpression",
      expressions: ArrayLite.concat(expressions, [expression])} :
    expression));

///////////////
// Statement //
///////////////

exports.Block = block;

exports.Statement = (expression) => (
  expression.AranPure ?
  [] :
  [
    {
      type: "ExpressionStatement",
      expression: expression}]);

exports.Return = (expression) => [
  {
    type: "ReturnStatement",
    argument: nullable(expression)}];

exports.Throw = (expression) => [
  {
    type: "ThrowStatement",
    argument: expression}];

exports.Try = (statements1, statements2, statements3, boolean) => (
  (
    statements3.length === 0 &&
    (boolean = (
      statements2.length === 1 &&
      statements2[0].type === "ThrowStatement" &&
      statements2[0].argument.type === "Identifier" &&
      statements2[0].argument.name === "error"))) ?
  statements1 :
  [
    {
      type: "TryStatement",
      block: block(statements1),
      handler: (
        boolean ?
        null :
        {
          type: "CatchClause",
          param: {
            type: "Identifier",
            name: "error"},
          body: block(statements2)}),
      finalizer: (
        statements3.length === 0 ?
        null :
        block(statements3))}]);

exports.Declare = (kind, identifier, expression) => [
  {
    type: "VariableDeclaration",
    kind: kind,
    declarations: [
      {
        type: "VariableDeclarator",
        id: {
          type: "Identifier",
          name: identifier},
        init: nullable(expression)}]}];

exports.If = (expression, statements1, statements2) => [
  {
    type: "IfStatement",
    test: expression,
    consequent: optional_block(block(statements1)),
    alternate: (
      statements2.length ?
      optional_block(block(statements2)) :
      null)}];

exports.Label = (label, statements) => [
  {
    type: "LabeledStatement",
    label: {
      type: "Identifier",
      name: label},
    body: optional_block(block(statements))}];

exports.Break = (label) => [
  {
    type:"BreakStatement",
    label: {
      type: "Identifier",
      name: label}}];

exports.While = (expression, statements) => [
  {
    type: "WhileStatement",
    test: expression,
    body: optional_block(block(statements))}];

exports.Debugger = () => [
  {
    type: "DebuggerStatement"}];

exports.Switch = (clauses) => [
  {
    type: "SwitchStatement",
    discriminant: {
      type: "Literal",
      value: true
    },
    cases: clauses.map((clause) => ({
      type: "SwitchCase",
      test: clause[0],
      consequent: clause[1]}))}];

exports.With = (expression, statements) => [
  {
    type: "WithStatement",
    object: expression,
    body: optional_block(block(statements))}];
