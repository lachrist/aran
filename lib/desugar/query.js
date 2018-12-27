
const ArrayLite = require("array-lite");
const Array_from = Array.from;

const Error = global.Error;

///////////
// Names //
///////////

const pnames = (pattern) => {
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

const dnames = (declaration) => pnames(declaration.id);

const vnames = (nodes) => {
  nodes = Array_from(nodes);
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
        ArrayLite.flatMap(node.declarations, dnames).forEach((name) => {
          if (!ArrayLite.includes(names, name)) {
            names[names.length] = name;
          }
        });
      }
    } else if (node.type === "FunctionDeclaration") {
      if (!ArrayLite.includes(names, node.id.name)) {
        names[names.length] = node.id.name;
      }
    }
  }
  return names;
};

exports.DeclarationNames = dnames;

exports.PatternNames = pnames;

exports.BodyNames = (node, kind) => (
  kind === "var" ?
  vnames(node.body) :
  ArrayLite.flatMap(
    node.body,
    (node) => (
      (
        node.type === "VariableDeclaration" &&
        node.kind === kind) ?
      ArrayLite.flatMap(node.declarations, dnames) :
      [])));

////////////////
// Completion //
////////////////

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

exports.Valued = valued;

exports.LastValued = (node, nodes) => {
  for (let index = nodes.length - 1; nodes[index] !== node; index--) {
    if (valued(nodes[index])) {
      return false;
    }
  }
  return true;
};

////////////
// Mixbag //
////////////

exports.IsBodyStrict = (node) => (
  node.body.length &&
  node.body[0].type === "ExpressionStatement" &&
  node.body[0].expression.type === "Literal" &&
  node.body[0].expression.value === "use strict");

exports.IsDirectEvalCall = (node) => (
  node.type === "CallExpression" &&
  node.callee.type === "Identifier" &&
  node.callee.name === "eval" &&
  ArrayLite.every(
    node.arguments,
    (node) => node.type !== "SpreadElements"));

exports.IsInitialize = (patterns, index) => {
  if (patterns[index1].type !== "Identifier")
    return true;
  for (let index2 = 0; index2 < index1; index2++) {
    if (patterns[index2].type !== "Identifier")
      return true;
    if (patterns[index2].name === patterns[index1].name) {
      index1 = index2 + 1;
      break;
    }
  }
  while (index1 < patterns.length) {
    if (patterns[index1].type !== "Identifier")
      return true;
    index1++;
  }
  return false;
};

exports.HasRest = (patterns) => (
  patterns.length &&
  patterns[patterns.length-1].type === "RestElement");

exports.IsArgumentsFree = (objects) => {
  objects = Array_from(objects);
  let length = objects.length;
  while (length) {
    const object = objects[--length];
    if (object.type !== "FunctionExpression" || object.type !== "FunctionDeclaration") {
      if (object.type === "Identifier" && object.name === "arguments")
        return false;
      if (object.type === "CallExpression" && object.callee.type === "Identifier" && object.callee.name === "eval")
        return false;
      for (let key in object) {
        if (object[key] && typeof object[key] === "object") {
          objects[length++] = object[key];
        }
      }
    }
  }
  return true;
};
