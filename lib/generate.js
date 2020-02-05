
const ArrayLite = require("array-lite");
const Identifier = require("./identifier.js");
const Visit = require("./index.js");

module.exports = (block, {eval, identifier}) => Visit(
  eval ? "block-eval" : "block-program",
  block,
  1 / 0,
  false,
  {
    __proto__: visitors,
    _identifier: identifier});

const visitors = {
  __proto__: null,
  // Block //
  BLOCK: (tag, labels, identifiers, estrees, node) => ArrayLite.reduce(
    labels,
    (node, label) => ({
      type: "LabeledStatement",
      label: {
        type: "Identifier",
        name: label},
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
                    name: Identifier.Parameter("this")},
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
                      name:  Identifier.Parameter("new.target")},
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
                      name: Identifier.Parameter("this")},
                    init: {
                      type: "ThisExpression" }}]}] :
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
                    name: identifier},
                  init: null}))}] :
          []),
        estrees)}),
  // Statement //
  Debugger: ({}, node) => ({
    type: "DebuggerStatement"}),
  Break: (label, node) => ({
    type: "BreakStatement",
    label: {
      type: "Identifier",
      name: label}}),
  Continue: (label, node) => ({
    type: "ContinueStatement",
    label: {
      type: "Identifier",
      name: label}}),
  Expression: (estree, node) => ({
    type: "ExpressionStatement",
    expression: estree}),
  Return: (estree, node) => ({
    type: "ReturnStatement",
    argument: estree}),
  If: (estree1, estree2, estree3, node) => ({
    type: "IfStatement",
    test: estree1,
    consequent: estree2,
    alternate: estree3}),
  Block: (estree, node) => estree,
  Try: (estree1, estree2, estree3, node) => ({
    type: "TryStatement",
    block: estree1,
    handler: {
      type: "CatchClause",
      param: {
        type: "Identifier",
        name: Identifier.Parameter("error") },
      body: estree2 },
    finalizer: estree3}),
  _While_: function (expression, block, node) { return ArrayLite.reduce(
      block[1],
      (estree, label) => ({
        type: "LabeledStatement",
        label: {
          type: "Identifier",
          name: label},
        body: estree}),
      {
        type: "WhileStatement",
        test: expression,
        body: Visit("block-while", [block[0], [], block[2], block[3]], 1 / 0, this)})},
  // Expression Producer //
  closure: (estree, node) => ({
    type: "FunctionExpression",
    id: {
      type: "Identifier",
      name: Identifier.Parameter("callee")},
    generator: false,
    expression: false,
    async: false,
    params: [
      {
        type: "RestElement",
        argument: {
          type: "Identifier",
          name: Identifier.Parameter("arguments")}}],
    body: estree}),
  builtin: function (name, node) { return {
    type: "MemberExpression",
    computed: true,
    object: {
      type: "Identifier",
      name: this._identifier },
    property: {
      type: "Literal",
      value: name }}},
  primitive: (primitive, node) => (
    primitive === void 0 ?
    {
      type: "UnaryExpression",
      prefix: true,
      operator: "void",
      argument: {
        type: "Literal",
        value: 0 }}  :
    (
      primitive !== primitive || primitive === 1 / 0 || primitive === -1 / 0 ?
      {
        type: "BinaryExpression",
        operator: "/",
        left: {
          type: "Literal",
          value: (
            primitive === 1 / 0 ?
            1 :
            primitive === -1 / 0 ? -1 : 0) },
        right: {
          type: "Literal",
          value: 0 } } :
      {
        type: "Literal",
        value: primitive })),
  read: (identifier, node) => ({
    type: "Identifier",
    name: identifier}),
  // Expression Consumer //
  write: (identifier, estree, node) => ({
    type: "SequenceExpression",
    expressions: [
      {
        type: "AssignmentExpression",
        operator: "=",
        left: {
          type: "Identifier",
          name: identifier},
        right: estree},
      {
        type: "UnaryExpression",
        operator: "void",
        prefix: true,
        argument: {
          type: "Literal",
          value: 0}}]}),
  throw: (estree, node) => ({
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
            argument: estree}]}},
    arguments: []}),
  conditional: (estree1, estree2, estree3, node) => ({
    type: "ConditionalExpression",
    test: estree1,
    consequent: estree2,
    alternate: estree3}),
  sequence: (estree1, estree2, node) => ({
    type: "SequenceExpression",
    expressions: [estree1, estree2]}),
  eval: (estree, node) => ({
    type: "CallExpression",
    callee: {
      type: "Identifier",
      name: "eval" },
    arguments: [estree]}),
  // Expression Combiner //
  apply: function (estree1, estree2, estrees, node) { return {
      type: "CallExpression",
      callee: {
        type: "MemberExpression",
        computed: true,
        object: {
          type: "Identifier",
          name: this._identifier},
        property: {
          type: "Literal",
          value: "Reflect.apply"}},
      arguments: [
        estree1,
        estree2,
        {
          type: "ArrayExpression",
          elements: estrees}]}},
  construct: (estree, estrees, node) => ({
    type: "NewExpression",
    callee: estree,
    arguments: estrees}),
  unary: (operator, estree, node) => ({
    type: "UnaryExpression",
    operator: operator,
    prefix: true,
    argument: estree}),
  binary: (operator, estree1, estree2, node) => ({
    type: "BinaryExpression",
    operator: operator,
    left: estree1,
    right: estree2}),
  object: (estree, estreess, options) => ({
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
          value: estree}],
      ArrayLite.map(
        estreess,
        ({0:estree1, 1:estree2}) => ({
          type: "Property",
          kind: "init",
          computed: true,
          key: estree1,
          value: estree2})))})};
