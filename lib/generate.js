
const ArrayLite = require("array-lite");
const Label = require("./label.js");
const Visit = require("./index.js");

module.exports = (block, {tag, namespace:string}) => Visit(
  "block-" + tag, 
  block,
  1/0,
  {
    __proto__: null,
    check: false,
    map: null,
    visitors: {
      __proto__: visitors,
      _namespace: string}});

const escape_label = (label) => "$" + label;

const escape_identifier = (identifier) => {
  if (identifier === "@new.target")
    return "_0newtarget";
  if (identifier === "%new.target")
    return "_0newtarget";
  if (identifier === "new.target")
    return "$0newtarget";
  if (identifier[0] === "@")
    return "_" + Reflect.apply(String_prototype_substring, identifier, [1]);
  if (identifier[0] === "%")
    return "X" + Reflect.apply(String_prototype_substring, identifier, [1]);
  return "$" + identifier;
};

const visitors: {
  __proto__: null,
  // Block //
  BLOCK: (tag, labels, identifiers, statements, _) => ArrayLite.reduce(
    labels,
    (node, label) => ({
      type: "LabeledStatement",
      label: {
        type: "Identifier",
        name: escape_label(label)},
      body: node}),
    {
      type: "BlockStatement",
      body: ArrayLite.concat(
        (
          tag === "program" ?
          [
            {
              type: "VariableDeclaration",
              kind: "let",
              declarators: [
                {
                  type: "VariableDeclarator",
                  id: {
                    type: "Identifier",
                    name: escape_identifier("@this")},
                  init: {
                    type: "ThisExpression"}}]}] :
          (
            tag === "closure" ?
            [
              {
                type: "VariableDeclaration",
                kind: "let",
                declarations: [
                  {
                    type: "VariableDeclarator",
                    id: {
                      type: "Identifier",
                      name:  escape_identifier("@new.target")},
                    init: {
                      type: "MetaProperty",
                      meta: {
                        type: "Identifier",
                        name: "new" },
                      property: {
                        type: "Identifier",
                        name: "target" }}},
                  {
                    type: "VariableDeclarator",
                    id: {
                      type: "Identifier",
                      name: escape_identifier("@this")},
                    init: {
                      type: "ThisExpression" }},
                  {
                    type: "VariableDeclarator",
                    id: {
                      type: "Identifier",
                      name: escape_identifier("@arguments")},
                    init: {
                      type: "Identifier",
                      name: "arguments" }}]}] :
            [])),
        (
          identifiers.length ?
          [
            {
              type: "VariableDeclaration",
              kind: "let",
              declarators: ArrayLite.map(
                identifiers,
                (identifier) => ({
                  type: "VariableDeclarator",
                  id: {
                    type: "Identifier",
                    name: escape_identifier(identifier)},
                  init: null}))}] :
          []),
        statements)}),
  // Statement //
  Debugger: ({}, _) => ({
    type: "DebuggerStatement"}),
  Break: (label, _) => ({
    type: "BreakStatement",
    label: {
      type: "Identifier",
      name: escape_label(label)}}),
  Continue: (label, _) => ({
    type: "ContinueStatement",
    label: {
      type: "Identifier",
      name: escape_label(label)}}),
  Expression: (expression, _) => ({
    type: "ExpressionStatement",
    expression: expression}),
  Return: ({1:expression}, _) => ({
    type: "ReturnStatement",
    argument: expression}),
  If: (expression, block1, block2, _) => ({
    type: "IfStatement",
    test: expression,
    consequent: block1,
    alternate: block2}),
  Block: (block, _) => block,
  Try: (block1, block2, block3, _) => ({
    type: "TryStatement",
    block: block1,
    handler: {
      type: "CatchClause",
      param: {
        type: "Identifier",
        name: Sanitize.identifier("@error") },
      body: block2 },
    finalizer: block3}),
  // TODO
  _While_: function (expression, {0:constructor, 1:labels, 2:identifiers, 3:statements}}, _) { return ArrayLite.reduce(
      labels,
      (node, label) => ({
        type: "LabeledStatement",
        label: {
          type: "Identifier",
          name: label},
        body: node}),
      {
        type: "WhileStatement",
        test: expression,
        body: Visit("block-while", [constructor, [], identifiers, statements], 1/0, this)})},
  // Expression Producer //
  closure: (block, _) => ({
    type: "FunctionExpression",
    id: {
      type: "Identifier",
      name: escape_identifier("@callee")},
    generator: false,
    expression: false,
    async: false,
    params: [],
    body: block}),
  builtin: function (name, _) { return {
    type: "MemberExpression",
    computed: true,
    object: {
      type: "Identifier",
      name: this._namespace },
    property: {
      type: "Literal",
      value: name }}},
  primitive: (primitive, _) => (
    primitive === void 0 ?
    {
      type: "UnaryExpression",
      prefix: true,
      operator: "void",
      argument: {
        type: "Literal",
        value: 0 }}  :
    (
      primitive !== primitive || primitive === 1/0 || primitive === -1/0 ?
      {
        type: "BinaryExpression",
        operator: "/",
        left: {
          type: "Literal",
          value: (
            primitive === 1/0 ?
            1 :
            primitive === -1/0 ? -1 : 0) },
        right: {
          type: "Literal",
          value: 0 } } :
      {
        type: "Literal",
        value: primitive })),
  read: (identifier, _) => ({
    type: "Identifier",
    name: escape_identifier(identifier)}),
  // Expression Consumer //
  write: (identifier, expression1, expression2, _) => ({
    type: "SequenceExpression",
    expressions: [
      {
        type: "AssignmentExpression",
        operator: "=",
        left: {
          type: "Identifier",
          name: escape_identifier(identifier, options)},
        right: expression1},
      expression2]}),
  throw: (expression, _) => ({
    type: "CallExpression",
    callee: {
      type: "FunctionExpression",
      generator: false,
      expression: false,
      async: false,
      id: null,
      params: [],
      body: {
        type: "BlockStatement",
        body: [
          {
            type: "ThrowStatement",
            argument: expression}]}}}),
  conditional: (expression1, expression2, expression3, _) => ({
    type: "ConditionalExpression",
    test: expression1,
    consequent: expression2,
    alternate: expression3}),
  sequence: (expression1, expression2, _) => ({
    type: "SequenceExpression",
    expressions: [expression1, expression2]}),
  eval: (expression, _) => ({
    type: "CallExpression",
    callee: {
      type: "Identifier",
      name: "eval" },
    arguments: [expression]}),
  // Expression Combiner //
  apply: function (expression1, expression2, expressions, _) { return {
      type: "CallExpression",
      callee: {
        type: "MemberExpression",
        computed: true,
        object: {
          type: "Identifier",
          name: this._namespace},
        property: {
          type: "Literal",
          value: "Reflect.apply"}},
      arguments: [
        expression1,
        expression2,
        {
          type: "ArrayExpression",
          elements: expressions}]}},
  construct: (expression, expressions, _) => ({
    type: "NewExpression",
    callee: expression,
    arguments: expressions}),
  unary: ({1:operator, 2:expression}, options) => ({
    type: "UnaryExpression",
    operator: operator,
    prefix: true,
    argument: expression}),
  binary: ({1:operator, 2:expression1, 3:expression2}, options) => ({
    type: "BinaryExpression",
    operator: operator,
    left: expression1,
    right: expression2}),
  object: (expression, expressionss, options) => ({
    type: "ObjectExpression",
    properties: ArrayLite.concat(
      [
        {
          type: "Property",
          kind: "init",
          computed: false,
          key: {
            type: "Identifier",
            name: "__proto__" },
          value: Visit.expression(expression), options}],
      ArrayLite.map(
        expressionss,
        ({0:expression1, 1:expression2}) => ({
          type: "Property",
          kind: "init",
          computed: true,
          key: expression1,
          value: expression2})))})};
