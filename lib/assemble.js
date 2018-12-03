
const ArrayLite = require("array-lite");

const Reflect_apply = Reflect.apply;

const unaries = [
  "-",
  "+",
  "!",
  "~",
  "typeof",
  "void",
  "delete"
];

const binaries = [
  "==",
  "!=",
  "===",
  "!==",
  "<",
  "<=",
  ">",
  ">=",
  "<<",
  ">>",
  ">>>",
  "+",
  "-",
  "*",
  "/",
  "%",
  "|",
  "^",
  "&",
  "in",
  "instanceof",
];

const is_valid_flags = (flags) => {
  for (let index = 0; index<flags.length; index++) {
    if (!ArrayLite.includes(["g", "i", "m", "u", "y"], flags[index])) {
      return false;
    }
    if (ArrayLite.lastIndexOf(flags, flags[index]) !== index) {
      return false;
    }
  }
  return true;
};

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

  expression_visitors.construct = (expression, expressions) => {
    if (expression[0] === "builtin" && expression[1] === "RegExp" && expressions.length === 2) {
      if (expressions[0][0] === "primitive" && typeof expressions[0][1] === "string") {
        if (expressions[1][0] === "primitive" && is_valid_flags(expressions[1][1])) {
          return {
            type: "Literal",
            regex: {
              pattern: expressions[0][1],
              flags: expressions[1][1]
            }
          };
        }
      }
    }
    return {
      type: "NewExpression",
      callee: visit_expression(expression),
      arguments: ArrayLite.map(expressions, visit_expression)
    };
  };

  expression_visitors.apply = (expression1, expression2, expressions) => {
    if (expression1[0] === "builtin") {
      if (expression2[0] === "primitive" && expression2[1] === void 0) {
        if (expression1[1] === "Array.of") {
          return {
            type: "ArrayExpression",
            elements: ArrayLite.map(expressions, visit_expression)
          };
        }
        if (expression1[1] === "AranUnary" && expressions.length === 2) {
          if (expressions[0][0] === "primitive" && ArrayLite.includes(unaries, expressions[0][1])) {
            return {
              type: "UnaryExpression",
              prefix: true,
              operator: expressions[0][1],
              argument: visit_expression(expressions[1])
            };
          }
        }
        if (expression1[1] === "AranBinary" && expressions.length === 3) {
          if (expressions[0][0] === "primitive" && ArrayLite.includes(binaries, expressions[0][1])) {
            return {
              type: "BinaryExpression",
              operator: expressions[0][1],
              left: visit_expression(expressions[1]),
              right: visit_expression(expressions[2])
            };
          }
        }
        if (expression1[1] === "Reflect.get" && expressions.length === 2) {
          if (expressions[0][0] === "apply" && expressions[0][3].length === 1) {
            if (expressions[0][1][0] === "builtin" && expressions[0][1][1] === "AranConvert") {
              if (expressions[0][2][0] === "primitive" && expressions[0][2][1] === void 0) {
                return {
                  type: "MemberExpression",
                  computed: true,
                  object: visit_expression(expressions[0][3][0]),
                  property: visit_expression(expressions[1])
                };
              }
            }
          }
        }
        if (expression1[1] === "AranInitializeObject" && expressions.length % 3 === 0) {
          let properties = [];
          for (let index = 0; index<expressions.length; index += 3) {
            if (expressions[index][0] === "primitive" && expressions[index][1] === "init") {
              properties[properties.length] = {
                type: "Property",
                kind: "init",
                key: visit_expression(expressions[index+1]),
                value: visit_expression(expressions[index+2])
              };
            } else {
              properties = null;
              break;
            }
          }
          if (properties) {
            return {
              type: "ObjectExpression",
              properties: properties
            };
          }
        }
      }
    }
    if (expression2[0] === "primitive" && expression2[1] === void 0) {
      let node = visit_expression(expression1);
      if (node.type === "MemberExpression") {
        node = {
          type: "SequenceExpression",
          expressions: [
            {
              type: "Literal",
              value: null},
            node
          ]
        };
      }
      return {
        type: "CallExpression",
        callee: node,
        arguments: ArrayLite.map(expressions, visit_expression)
      };
    }
    const node = visit_expression(expression1);
    if (expression2[0] === "read" && typeof expression2[1] === "number") {
      if (node.type === "MemberExpression" && node.object.type === "read" && node.object.name === sanitize(expression2[1])) {
        return {
          type: "CallExpression",
          callee: node,
          arguments: ArrayLite.map(expressions, visit_expression)
        };
      }
    }
    return {
      type: "CallExpression",
      callee: {
        type: "MemberExpression",
        computed: false,
        object: {
          type: "Identifier",
          name: namespace},
        property: {
          type: "Identifier",
          name: "_builtin_Reflect_apply"
        }
      },
      arguments: [
        node,
        visit_expression(expression2),
        {
          type: "ArrayExpression",
          elements: ArrayLite.map(expressions, visit_expression)
        }
      ]
    };
  };

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

  statement_visitors.Switch = (label, identifiers, statements, clauses) => ({
    type: "BlockStatement",
    body: ArrayLite.concat(
      declaration(identifiers),
      ArrayLite.map(statements, visit_statement),
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
      [
        {
          type: "ExpressionStatement",
          expression: {
            type: "Literal",
            value: "use strict" }}],
      declaration(program[0]),
      ArrayLite.map(program[1], visit_statement))});

};
