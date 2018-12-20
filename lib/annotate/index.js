
const ArrayLite = require("array-lite");
const TypeError = global.TypeError

/////////////
// Boolean //
/////////////



exports.IsArrowReturn = (node) => {
  while (node.type !== "ArrowFunctionExpression" && node.type !== "FunctionExpression" && node.type !== "FunctionDeclaration")
    node = node.AranParent;
  return node.type === "ArrowFunctionExpression";
};

exports.IsDirectEvalCall = (node) => (
  node.type === "CallExpression" &&
  node.callee.type === "Identifier" &&
  node.callee.name === "eval" &&
  ArrayLide.every(
    node.arguments,
    (node) => node.type !== "SpreadElement"));

exports.IsArgumentsFree = (node) => {
  const objects = [node.body, node.params];
  let length = object.length;
  while (length) {
    const object = objects[--length];
    if (object !== null && object.type !== "FunctionExpression" || object.type !== "FunctionDeclaration") {
      if (object.type === "Identifier" && object.name === "arguments")
        return false;
      if (exports.DirectEvalCall(object))
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

exports.IsStrictBody = (node) => (
  (
    node.type === "Block" ||
    node.type === "Program") &&
  node.body.length > 0 &&
  node.body[0].type === "ExpressionStatement" &&
  node.body[0].expression.type === "Literal" &&
  node.body[0].expression.value === "use strict");

///////////////
// Primitive //
///////////////

exports.StrictDuplicate = (node, index) => {
  for (let )

  return node.AranStrict;
};

exports.LabelName = (node) => (
  node.AranParent.type === "LabeledStatement" ?
  node.AranParent.label.name :
  null);

exports.ClosureName = (node) => {
  if (node.id)
    return node.id.name;
  switch (node.AranParent.type) {
    case "AssignmentExpression":
      if (node.AranParent.left.type === "Identifier")
        return node.AranParent.left.name;
      break;
    case "VariableDeclaration":
      for (let index=0; index<node.AranParent.declarations.length; index++) {
        if (node.AranParent.declarations[index].init === node) {
          if (node.AranParent.declarations[index].id.type === "Identifier")
            return node.AranParent.declarations[index].id.name;
          break;
        }
      }
      break;
    case "ObjectExpression":
      for (let index=0; index<node.AranParent.properties.length; index++) {
        const property = node.AranParent.properties[index];
        if (property.value === node) {
          if (!property.computed)
            return property.key.name || property.key.value;
          break;
        }
      }
      break;
    default: return "";
  }
};

exports.ClosureLength = (node) => (
  (
    node.params.length &&
    node.params[node.params.length-1].type === "RestElement") ?
  node.params.length - 1 :
  node.params.length);

///////////
// Names //
///////////

exports.VariableNames = (node) => {
  switch (node.type) {
    case "IfStatement": return ArrayLite.concat(
      exports.VariableNames(node.consequent),
      (
        node.alternate ?
        exports.VariableNames(node.alternate) :
        []));
    case "LabeledStatement": return exports.VariableNames(node.body);
    case "WhileStatement": return exports.VariableNames(node.body);
    case "DoWhileStatement": return exports.VariableNames(node.body);
    case "WithStatement": return exports.VariableNames(node.body);
    case "TryStatment":
     return ArrayLite.concat(
        exports.VariableNames(node.block),
        (
          node.handler ?
          exports.VariableNames(node.handler.body) :
          []),
        (
          node.finalizer ?
          exports.VariableNames(node.finalizer) :
          []));
    case "ForStatement": return ArrayLite.concat(
      (
        node.init && node.init.type === "VariableDeclaration" ?
        exports.VariableNames(node.init) :
        []),
      exports.VariableNames(node.body));
    case "ForInStatement": return ArrayLite.concat(
      (
        node.left.type === "VariableDeclaration" ?
        exports.VariableNames(node.left) :
        []),
      exports.VariableNames(node.body));
    case "ForOfStatement": return ArrayLite.concat(
      (
        node.left.type === "VariableDeclaration" ?
        exports.VariableNames(node.left) :
        []),
      exports.VariableNames(node.body));
    case "BlockStatement": return ArrayLite.flatMap(node.body, exports.VariableNames);
    case "SwitchStatement": return ArrayLite.flatMap(
      node.cases,
      ({consequent:statements}) => ArrayLite.flatMap(statements, exports.VariableNames));
    case "VariableDeclaration": return exports.DeclarationNames("var", node);
    case "FunctionDeclaration": return [node.id.name];
    default: return [];
  }
};

exports.DeclarationNames = (kind, node) => (
  node.kind === kind ?
  ArrayLite.flatMap(
    node.declarations,
    (declaration) => exports.PatternNames(declaration.id)) :
  []);

exports.PatternNames = (pattern) => {
  if (pattern.type === "Identifier")
    return [pattern.name];
  const patterns = [pattern];
  const length = patterns.length;
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
      default: throw new TypeError("Unknown pattern type: "+pattern.type);
    }
  }
  return names;
};
