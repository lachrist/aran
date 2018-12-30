
const ArrayLite = require("array-lite");
const Sanitize = require("../sanitize.js");
const Visit = require("./index.js");

const Error = global.Error;

ArrayLite.forEach(["error", "argument"], (key) => {
  exports[key] = () => {
    throw new Error(key+" should not appear here");
  }
});

exports.closure = ({1:block}, namespace) => ({
  type: "FunctionExpression",
  id: {
    type: "Identifier",
    name: "callee" },
  params: [],
  body: Visit.block(block, namespace, "block"),
  generator: false,
  expression: false,
  async: false});

exports.builtin = ({1:name}, namespace) => ({
  type: "MemberExpression",
  computed: true,
  object: {
    type: "MemberExpression",
    computed: false,
    object: {
      type: "Identifier",
      name: namespace },
    property: {
      type: "Identifier",
      name: "builtins"}},
  property: {
    type: "Literal",
    value: name}});

exports.primitive = ({1:value}, namespace) => (
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

exports.read = ({1:identifier}, namespace) => (
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
      name: Sanitize(identifier)}));

exports.unary = ({1:operator, 2:expression}, namespace) => ({
  type: "UnaryExpression",
  operator: operator,
  prefix: true,
  argument: Visit.expression(expression, namespace)});

exports.binary = ({1:operator, 2:expression1, 3:expression2}, namespace) => ({
  type: "BinaryExpression",
  operator: operator,
  left: Visit.expression(expression1, namespace),
  right: Visit.expression(expression2, namespace)});

exports.write = ({1:identifier, 2:expression1, 3:expression2}, namespace) => ({
  type: "SequenceExpression",
  expressions: [
    {
      type: "AssignmentExpression",
      operator: "=",
      left: {
        type: "Identifier",
        name: Sanitize(identifier)},
      right: Visit.expression(expression1, namespace)},
    Visit.expression(expression2, namespace)]});

exports.conditional = ({1:expression1, 2:expression2, 3:expression3}, namespace) => ({
  type: "ConditionalExpression",
  test: Visit.expression(expression1, namespace),
  consequent: Visit.expression(expression2, namespace),
  alternate: Visit.expression(expression3, namespace)});

exports.sequence = ({1:expression1, 2:expression2}, namespace) => ({
  type: "SequenceExpression",
  expressions: [
    Visit.expression(expression1, namespace),
    Visit.expression(expression2, namespace)]});

exports.eval = ({1:expression}, namespace) => ({
  type: "CallExpression",
  callee: {
    type: "Identifier",
    name: "eval" },
  arguments: [
    Visit.expression(expression, namespace)]});

exports.construct = ({1:expression, 2:expressions}, namespace) => (
  (
    expression[0] === "builtin" &&
    expression[1] === "RegExp" &&
    expressions.length === 2 &&
    expressions[0][0] === "primitive" &&
    typeof expressions[0][1] === "string" &&
    expressions[1][0] === "primitive" &&
    typeof expressions[1][1] === "string" &&
    ArrayLite.every(
      expressions[1][1],
      (character, index, string) => (
        ArrayLite.includes("gimuy", character) &&
        ArrayLite.lastIndexOf(string, character) === index))) ?
  {
    type: "Literal",
    regex: {
      pattern: expressions[0][1],
      flags: expressions[1][1] }} :
  {
    type: "NewExpression",
    callee: Visit.expression(expression, namespace),
    arguments: ArrayLite.map(
      expressions,
      (expression) => Visit.expression(expression, namespace))});

exports.apply = ({1:expression1, 2:expression2, 3:expressions}, namespace) => {
  if (expression2[0] === "primitive" && expression2[1] === void 0) {
    if (expression1[0] === "builtin" && expression1[1] === "Array.of") {
      return {
        type: "ArrayExpression",
        elements: ArrayLite.map(expressions, (expression) => {
          return Visit.expression(expression, namespace);
        })
      };
    }
    if (expression1[0] === "builtin" && expression1[1] === "Object.fromEntries" && expressions.length === 1) {
      const node = Visit.expression(expressions[0], namespace);
      if (node.type === "ArrayExpression" && ArrayLite.every(node.elements, (node) => node.type === "ArrayExpression" && node.elements.length === 2)) {
        return {
          type: "ObjectExpression",
          properties: ArrayLite.map(node.elements, (node) => ({
            type: "Property",
            kind: "init",
            computed: true,
            key: node.elements[0],
            value: node.elements[1]
          }))
        };
      }
    }
    if (expression1[0] === "builtin" && expression1[1] === "Reflect.get" && expressions.length === 2) {
      return {
        type: "MemberExpression",
        computed: true,
        object: Visit.expression(expressions[0], namespace),
        property: Visit.expression(expressions[1], namespace)
      };
    }
    let node = Visit.expression(expression1, namespace);
    if (node.type === "MemberExpression") {
      node = {
        type: "SequenceExpression",
        expressions: [{
          type: "Literal",
          value: null
        }, node]
      };
    }
    return {
      type: "CallExpression",
      callee: node,
      arguments: ArrayLite.map(expressions, (expression) => {
        return Visit.expression(expression, namespace)
      })
    };
  }
  const node = Visit.expression(expression1, namespace);
  if (expression2[0] === "read" && typeof expression2[1] === "number") {
    if (node.type === "MemberExpression" && node.object.type === "read" && node.object.name === Sanitize(expression2[1])) {
      return {
        type: "CallExpression",
        callee: node,
        arguments: ArrayLite.map(expressions, (expression) => {
          return Visit.expression(expression, namespace);
        })
      };
    }
  }
  return {
    type: "CallExpression",
    callee: {
      type: "MemberExpression",
      computed: true,
      object: {
        type: "MemberExpression",
        computed: false,
        object: {
          type: "Identifier",
          name: namespace },
        property: {
          type: "Identifier",
          name: "builtins"}},
      property: {
        type: "Literal",
        value: "Reflect.apply"}},
    arguments: [node, Visit.expression(expression2), {
      type: "ArrayExpression",
      elements: ArrayLite.map(expressions, (expression) => {
        return Visit.expression(expression, namespace);
      })
    }]
  };
};

exports.trap = ({1:name, 2:expressions, 3:serial}, namespace) => ({
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
  arguments: ArrayLite.concat(ArrayLite.map(expressions, (expression) => {
    return Visit.expression(expression, namespace);
  }), [{type:"Literal", value:serial}])});
