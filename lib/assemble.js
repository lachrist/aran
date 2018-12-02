
const ArrayLite = require("array-lite");

const Reflect_apply = Reflect.apply;

module.exports = (program, namespace) => {

  /////////////////////////
  // Expression Visitors //
  /////////////////////////

  const expression_visitors = {};

  expression_visitors.error = () => ({
    type: "Identifier",
    name: "error"
  });

  expression_visitors.arrival = (index) => ({
    type: "MemberExpression",
    computed: true,
    object: {
      type: "Identifier",
      name: "arrival" },
    property: {
      type: "Literal",
      value: index}});

  expression_visitors.closure = (block) => ({
    type: "FunctionExpression",
    id: {
      type: "Identifier",
      name: "callee" },
    params: [],
    body: visit_block(block),
    generator: false,
    expression: false,
    async: false});

  expression_visitors.builtin = (name) => ({
    type: "MemberExpression",
    computed: false,
    object: {
      type: "Identifier",
      name: namespace },
    property: {
      type: "Identifier",
      name: "_builtin_" + Reflect_apply(String.prototype.replace, name, [/\./g, "_"]) }});

  expression_visitors.primitive = (value) => (
    value === void 0 ?
    {
      type: "UnaryExpression",
      prefix: true,
      operator: "void",
      argument: {
        type: "Literal",
        value: 0 }}  :
    (
      value === 1/0 || value === -1/0 || value === 0/0 ?
      {
        type: "BinaryExpression",
        operator: "/",
        left: {
          type: "Literal",
          value: value === 1/0 ? 1 : (value === -1/0 ? -1 : 0) },
        right: {
          type: "Literal",
          value: 0 } } :
      {
        type: "Literal",
        value: value }));

  expression_visitors.read = (identifier) => (
    identifier === "this" ?
    {
      type: "ThisExpression" } :
    (
      identifier === "new.target" ?
      {
        type: "MetaProperty",
        meta: {
          type: "Identifier",
          name: "new" },
        property: {
          type: "Identifier",
          name: "target" } } :
      {
        type: "Identifier",
        name: sanitize(identifier)}));

  expression_visitors.write = (identifier, expression1, expression2) => ({
    type: "SequenceExpression",
    expressions: [
      {
        type: "AssignmentExpression",
        operator: "=",
        left: {
          type: "Identifier",
          name: sanitize(identifier)},
        right: visit_expression(expression1)},
      visit_expression(expression2)]});

  expression_visitors.conditional = (expression1, expression2, expression3) => ({
    type: "ConditionalExpression",
    test: visit_expression(expression1),
    consequent: visit_expression(expression2),
    alternate: visit_expression(expression3)});

  expression_visitors.sequence = (expression1, expression2) => ({
    type: "SequenceExpression",
    expressions: [
      visit_expression(expression1),
      visit_expression(expression2)]});

  expression_visitors.eval = (expression) => ({
    type: "CallExpression",
    callee: {
      type: "Identifier",
      name: "eval" },
    arguments: [
      visit_expression(expression)]});

  expression_visitors.construct = (expression, expressions) => ({
    type: "NewExpression",
    callee: visit_expression(expression),
    arguments: ArrayLite.map(expressions, visit_expression)});

  expression_visitors.apply = (expression1, expression2, expressions) => (
    expression2[0] === "primitive" && expression2[1] === void 0 ?
    {
      type: "CallExpression",
      callee: (
        expression1[0] === "get" ?
        {
          type: "SequenceExpression",
          expressions: [
            {
              type: "Literal",
              value: null},
            visit_expression(expression1)]} :
        visit_expression(expression1)),
      arguments: ArrayLite.map(expressions, visit_expression)} :
    (
      (
        expression2[0] === "read" &&
        typeof expression2[1] == "number" &&
        expression1[0] === "get" &&
        expression1[1][0] === "read" &&
        expression1[1][1] === expression2[1]) ?
      {
        type: "CallExpression",
        callee: {
          type: "MemberExpression",
          computed: true,
          object: {
            type: "Identifier",
            name: "$aran" + expression1[1][1] },
          property: visit_expression(expression1[2])},
        arguments: ArrayLite.map(expressions, visit_expression)} :
      {
        type: "CallExpression",
        callee: {
          type: "MemberExpression",
          computed: false,
          object: {
            type: "Identifier",
            name: namespace},
          property: {
            type: "Identifier",
            name: "_builtin_Reflect_apply"}},
        arguments: [
          visit_expression(expression1),
          visit_expression(expression2),
          {
            type: "ArrayExpression",
            elements: ArrayLite.map(expressions, visit_expression)}]}));

  ///////////
  // Weave //
  ///////////

  expression_visitors.trap = (name, expressions, serial) => ({
    type: "CallExpression",
    callee: {
      type: "MemberExpression",
      computed: false,
      object: {
        type: "Identifier",
        name: namespace },
      property: {
        type: "Identifier",
        name: name } },
    arguments: ArrayLite.concat(
      ArrayLite.map(expressions, visit_expression),
      [
        {
          type: "Literal",
          value: serial}])});

  //////////////////
  // Optimization //
  //////////////////

  expression_visitors.object = (properties) => ({
    type: "ObjectExpression",
    properties: ArrayLite.map(
      properties,
      (property) => ({
        type: "property",
        kind: property[0],
        computed: false,
        key: visit_expression(property[1]),
        value: visit_expression(property[2])}))});

  expression_visitors.array = (expressions) => ({
    type: "ArrayExpression",
    elements: ArrayLite.map(expressions, visit_expression) });

  expression_visitors.get = (expression1, expression2) => ({
    type: "MemberExpression",
    computed: false,
    object: visit_expression(expression1),
    property: visit_expression(expression2) });

  expression_visitors.set = (expression1, expression2, expression3) => ({
    type: "AssignmentExpression",
    operator: "=",
    left: {
      type: "MemberExpression",
      computed: false,
      object: visit_expression(expression1),
      property: visit_expression(expression2) },
    right: visit_expression(expression3) });

  expression_visitors.unary = (operator, expression) => ({
    type: "UnaryExpression",
    prefix: true,
    operator: operator,
    argument: visit_expression(expression) });

  expression_visitors.binary = (operator, expression1, expression2) => ({
    type: "BinaryExpression",
    operator: operator,
    left: visit_expression(expression1),
    right: visit_expression(expression2) });

  ///////////////
  // Statement //
  ///////////////

  const statement_visitors = {};

  statement_visitors.Write = (identifier, expression) => ({
    type: "ExpressionStatement",
    expression: {
      type: "AssignmentExpression",
      operator: "=",
      left: {
        type: "Identifier",
        name: sanitize(identifier)},
      right: visit_expression(expression)}});

  statement_visitors.Debugger = () => ({
    type: "DebuggerStatement"});

  statement_visitors.Break = (label) => ({
    type: "BreakStatement",
    label: (
      label ?
      {
        type: "Identifier",
        name: label } :
      null)});

  statement_visitors.Continue = (label) => ({
    type: "ContinueStatement",
    label: (
      label ?
      {
        type: "Identifier",
        name: label } :
      null)});

  statement_visitors.Expression = (expression) => ({
    type: "ExpressionStatement",
    expression: visit_expression(expression)});

  statement_visitors.Return = (expression) => ({
    type: "ReturnStatement",
    argument: visit_expression(expression)});

  statement_visitors.Throw = (expression) => ({
    type: "ThrowStatement",
    argument: visit_expression(expression)});

  statement_visitors.If = (label, expression, block1, block2) => labelize(
    label,
    {
      type: "IfStatement",
      test: visit_expression(expression),
      consequent: visit_block(block1),
      alternate: visit_block(block2) });

  statement_visitors.Block = (label, block) => labelize(
    label,
    visit_block(block));

  statement_visitors.Try = (label, block1, block2, block3) => labelize(
    label,
    {
      type: "TryStatement",
      block: visit_block(block1),
      handler: {
        type: "CatchClause",
        param: {
          type: "Identifier",
          name: "error" },
        body: visit_block(block2) },
      finalizer: visit_block(block3)});

  statement_visitors.While = (label, expression, block) => labelize(
    label,
    {
      type: "WhileStatement",
      test: visit_expression(expression),
      body: visit_block(block)});

  statement_visitors.Switch = (label, identifiers, clauses) => labelize(
    label,
    {
      type: "SwitchStatement",
      discriminant: {
        type: "Literal",
        value: true},
      cases: ArrayLite.concat(
        [
          {
            type: "SwitchCase",
            test: {
              type: "Literal",
              value: true},
            consequent: declaration(identifiers)}],
        ArrayLite.map(
          clauses,
          (clause) => ({
            type: "SwitchCase",
            test: visit_expression(clause[0]),
            consequent: ArrayLite.map(clause[1], visit_statement)})))});

  /////////////
  // Helpers //
  /////////////

  const sanitize = (identifier) => (
    typeof identifier === "number" ?
    "_" + identifier :
    identifier);

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

  const visit_block = (block) => ({
    type: "BlockStatement",
    body: ArrayLite.concat(
      declaration(block[0]),
      ArrayLite.map(block[1], visit_statement))});

  const visit = (visitors) => (node) => Reflect_apply(
    visitors[node[0]],
    null,
    ArrayLite.slice(node, 1, node.length));

  const visit_expression = visit(expression_visitors);

  const visit_statement = visit(statement_visitors);

  ////////////
  // Return //
  ////////////

  return ({
    type: "Program",
    body: ArrayLite.concat(
      declaration(program[0]),
      ArrayLite.map(program[1], visit_statement))});

};
