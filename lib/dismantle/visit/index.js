
const ArrayLite = require("array-lite");
const Expression = require("./expression.js");
const Statement = require("./statement.js");
const Block = require("./block.js");

const Reflect_defineProperty = Reflect.defineProperty;
const JSON_stringify = JSON.stringify;

const is_body_strict = (node) => (
  node.body.length &&
  node.body[0].type === "ExpressionStatement" &&
  node.body[0].expression.type === "Literal" &&
  node.body[0].expression.value === "use strict");

const is_direct_eval = (node) => (
  node.type === "CallExpression" &&
  node.callee.type === "Identifier" &&
  node.callee.name === "eval" &&
  ArrayLite.every(node.arguments, (argument) => argument.type !== "SpreadElement"));

const is_loop = (node) => (
  node.type === "WhileStatement" ||
  node.type === "DoWhileStatement" ||
  node.type === "ForStatement" ||
  node.type === "ForInStatement" ||
  node.type === "ForOfStatement");

const last_valued = (node) => {
  if (node.type === "ExpressionStatement") {
    node.AranCompletion = true;
    return true;
  }
  if (node.type === "TryStatment") {
    last_valued(node.block);
    return true;
  }
  if (node.type === "IfStatement") {
    last_valued(node.consequent);
    if (node.alternate)
      last_valued(node.alternate);
    return true;
  }
  if (is_loop(node) || node.type === "WithStatement") {
    last_valued(node.body);
    return true;
  }
  if (node.type === "LabeledStatement") {
    return last_valued(node.body);
  }
  if (node.type === "BlockStatement") {
    for (let index = node.body.length-1; index >= 0; index--)
      if (last_valued(node.body[index]))
        return true;
    return false;
  }
  if (node.type === "SwitchStatement") {
    for (let index1 = 0; index1 < node.cases.length; index1++)
      for (let index2 = node.cases[index1].length-1; index2 >= 0; index2--)
        if (last_valued(node.cases[index1][index2]))
          break;
    return true;
  }
  return false;
};

const visit = (visitors) => (node, scope) => {
  if (node.type === "LabeledStatement") {
    node = node.body;
  }
  Reflect_defineProperty(node, "AranParent", {
    value: ARAN.node,
    configurable: true,
    enumerable: false,
    writable: true,
  });
  Reflect_defineProperty(node, "AranRoot", {
    value: ARAN.root,
    configurable: true,
    enumerable: false,
    writable: true
  });
  node.AranParentSerial = ARAN.node ? ARAN.node.AranSerial : null;
  node.AranRootSerial = ARAN.root ? ARAN.root.AranSerial : null;
  node.AranStrict = (
    (
      ARAN.node &&
      ARAN.node.AranStrict) ||
    (
      node.type === "Program" &&
      is_body_strict(node)) ||
    (
      (
        node.type === "FunctionExpression" ||
        node.type === "FunctionDeclaration" ||
        node.type === "ArrowFunctionExpression") &&
      !node.expression &&
      is_body_strict(node.body)));
  node.AranSerial = ARAN.nodes.length;
  ARAN.nodes[ARAN.nodes.length] = node;
  if (node.type === "Program") {
    for (let index = node.body.length-1; index >= 0; index--) {
      if (last_valued(node.body[index])) {
        break;
      }
    }
  }
  if (is_direct_eval(node)) {
    node.AranScope = JSON_stringify(scope);
  }
  const temporary = ARAN.node;
  ARAN.node = node;
  const result = (
    node.type === "FunctionDeclaration" ?
    visitors.FunctionExpression(node, scope) :
    visitors[node.type](node, scope));
  ARAN.node = temporary;
  return result;
};

Object_assign(exports, Block);

exports.Statement = visit(Statement);

exports.expression = visit(Expression);
