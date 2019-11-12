
const ArrayLite = require("array-lite");
const Visit = require("./index.js");
const Identifier = require("./identifier.js");

exports.closure = ({1:block}, options) => ({
  type: "FunctionExpression",
  id: {
    type: "Identifier",
    name: Identifier("@callee")},
  generator: false,
  expression: false,
  async: false,
  params: [],
  body: Visit.block(
    block,
    {
      __proto__: null,
      namespace: options.namespace,
      tag: "closure")}});

exports.builtin = ({1:name}, options) => ({
  type: "MemberExpression",
  computed: true,
  object: {
    type: "Identifier",
    name: options.namespace },
  property: {
    type: "Literal",
    value: name });

exports.primitive = ({1:value}, options) => (
  value === void 0 ?
  {
    type: "UnaryExpression",
    prefix: true,
    operator: "void",
    argument: {
      type: "Literal",
      value: 0 }}  :
  (
    value !== value || value === 1/0 || value === -1/0 ?
    {
      type: "BinaryExpression",
      operator: "/",
      left: {
        type: "Literal",
        value: (
          value === 1/0 ?
          1 :
          value === -1/0 ? -1 : 0) },
      right: {
        type: "Literal",
        value: 0 } } :
    {
      type: "Literal",
      value: value }));

exports.read = ({1:identifier}, options) => ({
  type: "Identifier",
  name: Identifier(identifier) });

exports.write = ({1:identifier, 2:expression1, 3:expression2}, options) => ({
  type: "SequenceExpression",
  expressions: [
    {
      type: "AssignmentExpression",
      operator: "=",
      left: {
        type: "Identifier",
        name: Identifier(identifier, options)},
      right: Visit.expression(expression1, options)},
    Visit.expression(expression2)]});

exports.throw = ({1:expression}, options) => ({
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
          argument: Visit.expression(expression, options)}]}}});

exports.conditional = ({1:expression1, 2:expression2, 3:expression3}, options) => ({
  type: "ConditionalExpression",
  test: Visit.expression(expression1, options),
  consequent: Visit.expression(expression2, options),
  alternate: Visit.expression(expression3, options)});

exports.sequence = ({1:expression1, 2:expression2}, options) => ({
  type: "SequenceExpression",
  expressions: [
    Visit.expression(expression1, options),
    Visit.expression(expression2, options)]});

exports.eval = ({1:expression}, options) => ({
  type: "CallExpression",
  callee: {
    type: "Identifier",
    name: "eval" },
  arguments: [
    Visit.expression(expression, options)]});

exports.apply = ({1:expression1, 2:expression2, 3:expressions}, options) => ({
  type: "CallExpression",
  callee: {
    type: "MemberExpression",
    computed: true,
    object: {
      type: "Identifier",
      name: options.namespace},
    property: {
      type: "Literal",
      value: "Reflect.apply"}},
  arguments: [
    Visit.expression(expression1, options),
    Visit.expression(expression2, options),
    {
      type: "ArrayExpression",
      elements: ArrayLite.map(
        expressions,
        (expression) => Visit.expression(expression, options))}]});

exports.construct = ({1:expression, 2:expressions}, options) => ({
  type: "NewExpression",
  callee: Visit.expression(expression, options),
  arguments: ArrayLite.map(
    expressions,
    (expression) => Visit.expression(expression, options))});

exports.unary = ({1:operator, 2:expression}, options) => ({
  type: "UnaryExpression",
  operator: operator,
  prefix: true,
  argument: Visit.expression(expression, options)});

exports.binary = ({1:operator, 2:expression1, 3:expression2}, options) => ({
  type: "BinaryExpression",
  operator: operator,
  left: Visit.expression(expression1, options),
  right: Visit.expression(expression2, options)});

exports.object = ({1:expression, 2:expressionss}, options) => ({
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
        key: Visit.expression(expression1, options),
        value: Visit.expression(expression2, options) })))});
