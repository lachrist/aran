
const ArrayLite = require("array-lite");

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

exports.read = (identifier) => (
  identifier === "this" ?
  {
    type: "ThisExpression"} :
  (
    identifier === "new.target" ?
    {
      type: "MetaProperty",
      meta: {
        type: "Identifier",
        name: "new"},
      property: {
        type: "Identifier",
        name: "target"}} :
    {
      type: "Identifier",
      name: identifier}));

exports.write = (identifier, expression) => ({
  type: "AssignmentExpression",
  operator: "=",
  left: {
    type: "Identifier",
    name: identifier},
  right: expression});

exports.array = (expressions) => ({
  type: "ArrayExpression",
  elements: expressions});

exports.object = (properties) => ({
  type: "ObjectExpression",
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

exports.closure = (statements) => ({
  type: "FunctionExpression",
  id: {
    type: "Identifier",
    name: "callee"},
  params: [],
  body: {
    type: "BlockStatement",
    body: statements},
  generator: false,
  expression: false,
  async: false});

exports.json_primitive = (primitive) => ({
  type: "Literal",
  value: primitive});

exports.regexp = (string1, string2) => ({
  type: "Literal",
  regex: {
    pattern: string1,
    flags: string2}});

exports.get = (expression1, expression2) => ({
  type: "MemberExpression",
  computed: true,
  object: expression1,
  property: expression2});

exports.set = (expression1, expression2, expression3) => ({
  type: "AssignmentExpression",
  operator: "=",
  left: {
    type: "MemberExpression",
    computed: true,
    object: expression1,
    property: expression2},
  right: expression3});

exports.conditional = (expression1, expression2, expression3) => ({
  type: "ConditionalExpression",
  test: expression1,
  consequent: expression2,
  alternate: expression3});

exports.binary = (operator, expression1, expression2) => ({
  type: "BinaryExpression",
  operator: operator,
  left: expression1,
  right: expression2});

exports.unary = (operator, expression) => ({
  type: "UnaryExpression",
  prefix: true,
  operator: operator,
  argument: expression});

exports.construct = (expression, expressions) => ({
  type: "NewExpression",
  callee: expression,
  arguments: expressions});

exports.apply = (expression, expressions) => ({
  type: "CallExpression",
  callee: expression,
  arguments: expressions});

exports.sequence = (expressions, expression) => (
  expressions.length ?
  ({
    type: "SequenceExpression",
    expressions: ArrayLite.concat(
      expressions,
      [expression])}) :
  expression);

///////////////
// Statement //
///////////////

exports.Block = (statements) => [
  {
    type: "BlockStatement",
    body: statements}];

exports.Statement = (expression) => [
  {
    type: "ExpressionStatement",
    expression: expression}];

exports.Return = (expression) => [
  {
    type: "ReturnStatement",
    argument: expression}];

exports.Throw = (expression) => [
  {
    type: "ThrowStatement",
    argument: expression}];

exports.Try = (statements1, statements2, statements3) => [
  {
    type: "TryStatement",
    block: {
      type: "BlockStatement",
      body: statements1},
    handler: {
      type: "CatchClause",
      param: {
        type: "Identifier",
        name: "error"},
      body: {
        type: "BlockStatement",
        body: statements2}},
    finalizer: {
      type: "BlockStatement",
      body: statements3}}];

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
        init: expression}]}];

exports.If = (expression, statements1, statements2) => [
  {
    type: "IfStatement",
    test: expression,
    consequent: {
      type: "BlockStatement",
      body: statements1},
    alternate: {
      type: "BlockStatement",
      body: statements2}}];

exports.Label = (label, statements) => [
  {
    type: "LabeledStatement",
    label: {
      type: "Identifier",
      name: label},
    body: {
      type: "BlockStatement",
      body: statements}}];

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
    body: {
      type: "BlockStatement",
      body: statements}}];

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
    body: {
      type: "BlockStatement",
      body: statements}}];
