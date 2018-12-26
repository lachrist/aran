
const ArrayLite = require("array-lite");
const Array_from = Array.from;

const Error = global.Error;

const namesof = (pattern) => {
  const patterns = [pattern];
  let length = patterns.length;
  const names = [];
  while (length) {
    const pattern = patterns[--length];
    switch (pattern.type) {
      case "Identifier":
        names[names.length] = pattern.name;
        break;
      case "Property":
        patterns[length++] = node.value;
        break;
      case "RestElement":
        patterns[length++] = node.argument;
        break;
      case "AssignmentPattern":
        patterns[length++] = node.left;
        break;
      case "ObjectPattern":
        for (let index = 0; index < pattern.properties.length; index++)
          patterns[length++] = pattern.properties[index];
        break;
      case "ArrayPattern":
        for (let idnex = 0; index < pattern.elements.length; index++)
          patterns[length++] = pattern.elements[index];
        break;
      default: throw new Error("Unknown pattern type: "+pattern.type);
    }
  }
  return names;
};

const valued = (node) => {
  switch (node.type) {
    case "SwitchCase": return false;
    case "DebuggerStatement": return false;
    case "FunctionDeclaration": return false;
    case "VariableDeclaration": return false;
    case "LabeledStatement": return valued(node.body);
    case "BlockStatement": return ArrayLite.some(node.body, valued);
  }
  return true;
};

const variables = (nodes) => {
  let length = nodes.length;
  const names = [];
  while (length) {
    const node = nodes[--length];
    if (node.type === "IfStatement") {
      nodes[length++] = node.consequent;
      if (node.alternative) {
        nodes[length] = node.alternate;
      }
    } else if (node.type === "LabeledStatement") {
      nodes[length++] = node.body;
    } else if (node.type === "WhileStatement" || node.type === "DoWhileStatement") {
      nodes[length++] = node.body;
    } else if (node.type === "ForStatement") {
      nodes[length++] = node.body;
      if (node.init && node.init.type === "VariableDeclaration") {
        nodes[length++] = node.init;
      }
    } else if (node.type === "ForOfStatement" || node.type === "ForInStatement") {
      nodes[length++] = node.body;
      if (node.left.type === "VariableDeclaration") {
        nodes[length++] = node.left;
      }
    } else if (node.type === "BlockStatement") {
      for (let index = node.body.length - 1; index >= 0; index--) {
        nodes[length++] = node.body[index];
      }
    } else if (node.type === "TryStatement") {
      nodes[length++] = node.block;
      if (node.handler) {
        nodes[length++] = node.handler.body;
      }
      if (node.finalizer) {
        nodes[length++] = node.finalizer;
      }
    } else if (node.type === "SwitchStatement") {
      for (let index1 = node.cases.length - 1; index1 >= 0; index1--) {
        for (let index2 = nodes.cases[index1].consequent.lengt - 1; index2 >= 0; index2--) {
          nodes[length++] = node.cases[index1].consequent[index2];
        }
      }
    } else if (node.type === "VariableDeclaration") {
      if (node.kind === "var") {
        for (let index1 = 0; index1 < node.declarations.length; index1++) {
          const array = namesof(node.declarations[index].id);
          for (let index2 = 0; index2 < array.length; index2++) {
            if (!ArrayLite.includes(names, array[index])) {
              names[names.length] = array[index];
            }
          }
        }
      }
    } else if (node.type === "FunctionDeclaration") {
      if (!ArrayLite.includes(names, node.id.name)) {
        names[names.length] = node.id.name;
      }
    }
  }
  return names;
};

const is_direct_eval_call = (node) => (
  node.type === "CallExpression" &&
  node.callee.type === "Identifier" &&
  node.callee.name === "eval" &&
  ArrayLite.every(
    node.arguments,
    (node) => node.type !== "SpreadElements"));

exports.IsDirectEvalCall = is_direct_eval_call;

exports.IsBodyStrict = (node) => (
  node.body.length &&
  node.body[0].type === "ExpressionStatement" &&
  node.body[0].expression.type === "Literal" &&
  node.body[0].expression.value === "use strict");

exports.PatternsNames = namesof;

exports.BodyNames = (node, kind) => (
  kind === "var" ?
  variables(Array_from(node.body)) :
  ArrayLite.flatMap(
    node.body,
    (node) => (
      (
        node.type === "VariableDeclaration" &&
        node.kind === kind) ?
      ArrayLite.flatMap(
        node.declarations,
        (declaration) => namesof(declaration.id)) :
      [])));

exports.IsArgumentsFree = (objects) => {
  let length = objects.length;
  while (length) {
    const object = objects[--length];
    if (object !== null && (object.type !== "FunctionExpression" || object.type !== "FunctionDeclaration")) {
      if (object.type === "Identifier" && object.name === "arguments")
        return false;
      if (is_direct_eval_call(object))
        return false;
      for (let key in object) {
        if (typeof object[key] === "object") {
          objects[length++] = object[key];
        }
      }
    }
  }
  return true;
};

exports.Valued = valued;

exports.LastValued = (node, nodes) => {
  for (let index = nodes.length - 1; nodes[index] !== node; index--) {
    if (valued(nodes[index])) {
      return false;
    }
  }
  return true;
};
