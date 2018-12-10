
const ArrayLite = require("array-lite");
const Sanitize = require("./sanitize.js");

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

module.exports = (visit, namespace) => {

  const visitors = {};

  visitors.error = () => ({
    type: "Identifier",
    name: "error"
  });

  visitors.arrival = (index) => ({
    type: "MemberExpression",
    computed: true,
    object: {
      type: "Identifier",
      name: "arrival" },
    property: {
      type: "Literal",
      value: index}});

  visitors.closure = (block) => ({
    type: "FunctionExpression",
    id: {
      type: "Identifier",
      name: "callee" },
    params: [],
    body: visit.BLOCK(block),
    generator: false,
    expression: false,
    async: false});

  visitors.builtin = (name) => ({
    type: "MemberExpression",
    computed: true,
    object: {
      type: "Identifier",
      name: namespace },
    property: {
      type: "Literal",
      value: "_builtin_" + name}});

  visitors.primitive = (value) => (
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

  visitors.read = (identifier) => (
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

  visitors.write = (identifier, expression1, expression2) => ({
    type: "SequenceExpression",
    expressions: [
      {
        type: "AssignmentExpression",
        operator: "=",
        left: {
          type: "Identifier",
          name: Sanitize(identifier)},
        right: visit.expression(expression1)},
      visit.expression(expression2)]});

  visitors.conditional = (expression1, expression2, expression3) => ({
    type: "ConditionalExpression",
    test: visit.expression(expression1),
    consequent: visit.expression(expression2),
    alternate: visit.expression(expression3)});

  visitors.sequence = (expression1, expression2) => ({
    type: "SequenceExpression",
    expressions: [
      visit.expression(expression1),
      visit.expression(expression2)]});

  visitors.eval = (expression) => ({
    type: "CallExpression",
    callee: {
      type: "Identifier",
      name: "eval" },
    arguments: [
      visit.expression(expression)]});

  visitors.construct = (expression, expressions) => {
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
      callee: visit.expression(expression),
      arguments: ArrayLite.map(expressions, visit.expression)
    };
  };

  visitors.apply = (expression1, expression2, expressions) => {
    if (expression2[0] === "primitive" && expression2[1] === void 0) {
      if (expression1[0] === "builtin" && expression1[1] === "Array.of") {
        return {
          type: "ArrayExpression",
          elements: ArrayLite.map(expressions, visit.expression)
        };
      }
      if (expression1[0] === "builtin" && expression1[1] === "Reflect.get" && expressions.length === 2) {
        return {
          type: "MemberExpression",
          computed: true,
          object: visit.expression(expressions[0]),
          property: visit.expression(expressions[1])
        };
      }
      if (expression1[0] === "builtin" && expression1[1] === "Object.fromEntries" && expressions.length === 1) {
        const node = ArrayLite.map(expressions[0], visit.expression);
        if (node.type === "ArrayExpression" && ArrayLite.every(node.elements, (node) => node.type === "ArrayExpression" && node.elements.length === 2)) {
          return {
            type: "ObjectExpression",
            properties: ArrayLite.map(node.elements, (node) => {
              type: "Property",
              kind: "init",
              computed: true,
              key: node.elements[0],
              value: node.elements[1]
            })
          };
        }
      }
      let node = visit.expression(expression1);
      if (node.type === "MemberExpression") {
        node = {
          type: "SequenceExpression",
          expressions: [
            {
              type: "Literal",
              value: null
            },
            node
          ]
        };
      }
      return {
        type: "CallExpression",
        callee: node,
        arguments: ArrayLite.map(expressions, visit.expression)
      };
    }
    const node = visit.expression(expression1);
    if (expression2[0] === "read" && typeof expression2[1] === "number") {
      if (node.type === "MemberExpression" && node.object.type === "read" && node.object.name === Sanitize(expression2[1])) {
        return {
          type: "CallExpression",
          callee: node,
          arguments: ArrayLite.map(expressions, visit.expression)
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
        visit.expression(expression2),
        {
          type: "ArrayExpression",
          elements: ArrayLite.map(expressions, visit.expression)
        }
      ]
    };
  };

  visitors.trap = (name, expressions, serial) => ({
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
      ArrayLite.map(expressions, visit.expression),
      [
        {
          type: "Literal",
          value: serial}])});

  return visitors;

};
