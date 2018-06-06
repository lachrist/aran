
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

const block = (statements) => (
  statements.length === 0 ?
  {
    type: "EmptyStatement"} :
  (
    statements.length === 1 ?
    statements[0] :
    {
      type: "BlockStatement",
      body: statements}));

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

exports.PROGRAM = (boolean, statements) => ({
  type: "Program",
  body: ArrayLite.concat(
    (
      boolean ?
      [
        {
          type: "ExpressionStatement",
          expression: {
            type: "Literal",
            value: "use strict"}}] :
      []),
    [
      {
        type: "VariableDeclaration",
        kind: "let",
        declarations: [
          {
            type: "VariableDeclarator",
            id: {
              type: "Identifier",
              name: "completion"},
            init: null}]}],
    statements,
    [
      {
        type: "ExpressionStatement",
        expression: {
          type: "Identifier",
          name: "completion"}}])});

////////////////
// Expression //
////////////////

exports.read = (identifier) => (
  identifier === "this" ?
  {
    type: "ThisExpression",
    AranPure: true} :
  (
    identifier === "new.target" ?
    {
      type: "MetaProperty",
      AranPure: true,
      meta: {
        type: "Identifier",
        name: "new"},
      property: {
        type: "Identifier",
        name: "target"}} :
    {
      type: "Identifier",
      AranPure: true,
      name: identifier}));

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

exports.closure = (boolean, statements) => ({
  type: "CallExpression",
  callee: {
    type: "FunctionExpression",
    generator: false,
    async: false,
    expression: false,
    id: null,
    params: [],
    defaults: [],
    rest: null,
    body: {
      type: "BlockStatement",
      body: [
        {
          type: "VariableDeclaration",
          kind: "const",
          declarations: [
            {
              type: "VariableDeclarator",
              id: {
                type: "Identifier",
                name: "callee"},
              init: {
                type: "FunctionExpression",
                generator: false,
                async: false,
                expression: false,
                id: null,
                params: [],
                defaults: [],
                rest: null,
                body: {
                  type: "BlockStatement",
                  body: ArrayLite.concat(
                    (
                      boolean ?
                      [
                        {
                          type: "ExpressionStatement",
                          expression: {
                            type: "Literal",
                            value: "use strict"}}] :
                      []),
                    statements)}}}]},
        {
          type: "ReturnStatement",
          argument: {
            type: "Identifier",
            name: "callee"}}]}},
  arguments: []});

exports["function"] = (boolean, identifiers, statements) => ({
  type: "FunctionExpression",
  generator: false,
  async: false,
  expression: false,
  id: null,
  params: [],
  defaults: [],
  rest: null,
  params: ArrayLite.map(
    identifiers,
    (identifier) => ({
      type: "Identifier",
      name: identifier})),
  body: {
    type: "BlockStatement",
    body: ArrayLite.concat(
      (
        boolean ?
        [
          {
            type: "ExpressionStatement",
            expression: {
              type: "Literal",
              value: "use strict"}}] :
        []),
      statements)}});

exports.primitive = (primitive) => (
  primitive === void 0 ?
  {
    type: "UnaryExpression",
    AranPure: true,
    operator: "void",
    prefix: true,
    argument: {
      type: "Literal",
      AranPure: true,
      value: 0}} :
  {
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
  operator: operator,
  left: expression1,
  right: expression2});

exports.unary = (operator, expression) => ({
  type: "UnaryExpression",
  AranPure: operator === "void" && expression.AranPure,
  prefix: true,
  operator: operator,
  argument: expression});

exports.delete = (expression1, expression2) => ({
  type: "UnaryExpression",
  prefix: true,
  operator: "delete",
  argument: member(expression1, expression2)});

exports.discard = (identifier) => ({
  type: "UnaryExpression",
  prefix: true,
  operator: "delete",
  argument: {
    type: "Identifier",
    name: identifier}});

exports.construct = (expression, expressions) => ({
  type: "NewExpression",
  callee: expression,
  arguments: expressions});

exports.apply = (expression, expressions) => ({
  type: "CallExpression",
  callee: expression,
  arguments: expressions});

exports.invoke = (expression1, expression2, expressions) => ({
  type: "CallExpression",
  callee: member(expression1, expression2),
  arguments: expressions});

exports.sequence = (expressions) => (
  expressions.length === 0 ?
  {
    type: "UnaryExpression",
    AranPure: true,
    prefix: true,
    operator: "void",
    argument: {
      type: "Literal",
      value: 0}} :
  (
    expressions = ArrayLite.filter(
      expressions,
      (expression, index) => !expression.AranPure || index === expressions.length-1),
    (
      expressions.length === 1 ?
      expressions[0] :
      ({
        type: "SequenceExpression",
        expressions: expressions}))));

exports.eval = (expression) => ({
  type: "CallExpression",
  callee: {
    type: "Identifier",
    name: "eval" },
  arguments: [
    expression]});

///////////////
// Statement //
///////////////

exports.Block = (statements) => [
  {
    type: "BlockStatement",
    body: statements}];

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
      block: {
        type: "BlockStatement",
        body: statements1},
      handler: (
        boolean ?
        null :
        {
          type: "CatchClause",
          param: {
            type: "Identifier",
            name: "error"},
          body: {
            type: "BlockStatement",
            body: statements2}}),
      finalizer: (
        statements3.length === 0 ?
        null :
        {
          type: "BlockStatement",
          body: statements3})}]);

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
    consequent: block(statements1),
    alternate: (
      statements2.length ?
      block(statements2) :
      null)}];

exports.Label = (label, statements) => [
  {
    type: "LabeledStatement",
    label: {
      type: "Identifier",
      name: label},
    body: block(statements)}];

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
    body: block(statements)}];

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
    body: block(statements)}];
