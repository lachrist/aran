
const ArrayLite = require("array-lite");
const Array_from = Array.from;

const globalError = global.Error;
const globalString = globa.String;

////////////////////
// Variable Names //
////////////////////

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
        patterns[length++] = pattern.value;
        break;
      case "RestElement":
        patterns[length++] = pattern.argument;
        break;
      case "AssignmentPattern":
        patterns[length++] = pattern.left;
        break;
      case "ObjectPattern":
        for (let index = 0; index < pattern.properties.length; index++)
          patterns[length++] = pattern.properties[index];
        break;
      case "ArrayPattern":
        for (let index = 0; index < pattern.elements.length; index++)
          patterns[length++] = pattern.elements[index];
        break;
      default: throw new Error("Unknown pattern type: "+pattern.type);
    }
  }
  return names;
};

const dnames = (declaration) => pnames(declaration.id);

exports.GetVarNames = (nodes) => {
  nodes = Array_from(nodes);
  let length = nodes.length;
  const names = [];
  while (length) {
    const node = nodes[--length];
    if (node.type === "IfStatement") {
      nodes[length++] = node.consequent;
      if (node.alternate) {
        nodes[length++] = node.alternate;
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
    } else if (node.type === "SwitchCase") {
      for (let index = node.consequent.length - 1; index >= 0; index--) {
        nodes[length++] = node.consequent[index];
      }
    } else if (node.type === "SwitchStatement") {
      for (let index = node.cases.length - 1; index >= 0; index--) {
        nodes[length++] = node.cases[index];
      }
    } else if (node.type === "VariableDeclaration") {
      if (node.kind === "var") {
        ArrayLite.forEach(ArrayLite.flatMap(node.declarations, dnames), (name) => {
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

const bnloop = (nodes, kind) => (nodes) => ArrayLite.flatMap(
  nodes,
  (node) => (
    (
      node.type === "VariableDeclaration" &&
      node.kind === kind) ?
    ArrayLite.flatMap(node.declarations, dnames) :
    []));

exports.GetLetNames = (nodes) => bnloop(nodes, "lets");

exports.GetConstNames = (nodes) => bnloop(nodes, "const");

exports.GetDeclarationNames = dnames;

exports.GetPatternNames = pnames;

//////////////////////////
// Function Declaration //
//////////////////////////

exports.IsExpressionFunctionDeclaration = (node) => node.type === "FunctionDeclaration";

expoirts.IsExpressionNotFunctionDeclaration = (node) => node.type !== "FunctionDeclaration";

////////////////
// Completion //
////////////////

exports.IsExpressionValued = function self (node) { return (
  (
    node.type === "EmptyStatement" ||
    node.type === "VariableDeclaration" ||
    node.type === "FunctionDeclaration" ||
    node.type === "DebuggerStatement") ?
  false :
  (
    (
      node.type === "BlockStatement" ||
      node.type === "LabeledStatement") ?
    Boolean(
      ArrayLite.reduce(
        node.body,
        (accumulator, node) => (
          accumulator !== null ?
          accumulator :
          (
            node.type !== "BreakStatement" &&
            node.type !== "LabeledStatement" &&
            (
              self(node) ||
              null))),
        null)) :
    true)) };

////////////
// Mixbag //
////////////

exports.IsStatementUseStrict = (node) => (
  node.type === "ExpressionStatement" &&
  node.expression.type === "Literal" &&
  node.expression.value === "use strict");

exports.IsExpressionDirectEvalCall = (node) => (
  node.type === "CallExpression" &&
  node.callee.type === "Identifier" &&
  node.callee.name === "eval" &&
  ArrayLite.every(
    node.arguments,
    (node) => node.type !== "SpreadElements"));

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

Query.IsElementSpread = (element) => element.type === "SpreadElement";

//////////////
// Property //
//////////////

exports.IsPropertyInit = (property) => (
  property.type !== "SpreadElement" &&
  property.kind === "init");

exports.IsPropertyProto = (property) => (
  property.kind === "init" &&
  !property.computed &&
  (
    property.key.type === "Identifier" ?
    property.key.name === "__proto__" :
    property.key.value === "__proto__"));

exports.IsPropertyStaticallyNamed = (property) => (
  !property.computed ||
  property.key.type === "Literal" ||
  (
    property.value.type === "FunctionExpression" ?
    property.value.id === null :
    property.value.type !== "ArrowFunctionExpression"));

exports.GetPropertyStaticName = (property, closure) => (
  property.key.type === "Literal" ?
  globalString(property.key.value) :
  (
    property.computed ?
    (
      closure ?
      closure() :
      (
        (
          property.value.type === "FunctionExpression" ?
          property.value.id === null :
          property.value.type !== "ArrowFunctionExpression") ?
        null :
        (
          (
            () => { throw new globalError("Property is not statically named") })
          ()))) :
    property.key.name));
