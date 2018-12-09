
const ArrayLite = require("array-lite");
const Expression = require("./expression.js");
const Statement = require("./statement.js");
const Program = require("./program.js");

const Reflect_defineProperty = Reflect.defineProperty;
const Reflect_apply = Reflect.apply;
const String_prototype_substring = String.prototype.substring;
const String_prototype_startsWith = String.prototype.startsWith;
const JSON_stringify = JSON.stringify;

const name_of = (node) => {
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

const length_of = (node) => (
  (
    node.params.length &&
    node.params[node.params.length-1].type === "RestElement") ?
  node.params.length - 1 :
  node.params.length);

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

const is_closure = (node) => (
  node.type === "FunctionExpression" ||
  node.type === "FunctionDeclaration" ||
  node.type === "ArrowFunctionExpression");

const is_loop = (node) => (
  node.type === "WhileStatement" ||
  node.type === "DoWhileStatement" ||
  node.type == "ForStatement" ||
  node.type === "ForOfStatement" ||
  node.type === "ForInStatement");

const collect_pattern_names = (node) => {
  if (node.type === "Identifier")
    return [node.name];
  if (node.type === "Property")
    return collect_pattern_names(node.value);
  if (node.type === "RestElement")
    return collect_pattern_names(node.argument);
  if (node.type === "AssignmentPattern")
    return collect_pattern_names(node.left);
  if (node.type === "ObjectPattern")
    return ArrayLite.flatMap(node.properties, collect_pattern_names);
  if (node.type === "ArrayPattern")
    return ArrayLite.flatMap(node.elements, collect_pattern_names);
  return [];
};

const remove_duplicate = (array) => ArrayLite.filter(
  array,
  (element, index) => index = ArrayLite.lastIndexOf(array, element));


const hoist_variable_names = (node) => {
  switch (node.type) {
    case "IfStatement": return ArrayLite.concat(
      hoist_variable_names(node.consequent),
      (
        node.alternate ?
        hoist_variable_names(node.alternate) :
        []));
    case "LabeledStatement": return hoist_variable_names(node.body);
    case "WhileStatement": return hoist_variable_names(node.body);
    case "DoWhileStatement": return hoist_variable_names(node.body);
    case "WithStatement": return hoist_variable_names(node.body);
    case "TryStatment":
     return ArrayLite.concat(
        hoist_variable_names(node.block),
        (
          node.handler ?
          hoist_variable_names(node.handler.body) :
          []),
        (
          node.finalizer ?
          hoist_variable_names(node.finalizer) :
          []));
    case "ForStatement": return ArrayLite.concat(
      (
        node.init && node.init.type === "VariableDeclaration" ?
        hoist_variable_names(node.init) :
        []),
      hoist_variable_names(node.body));
    case "ForInStatement": return ArrayLite.concat(
      (
        node.left.type === "VariableDeclaration" ?
        hoist_variable_names(node.left) :
        []),
      hoist_variable_names(node.body));
    case "ForOfStatement": return ArrayLite.concat(
      (
        node.left.type === "VariableDeclaration" ?
        hoist_variable_names(node.left) :
        []),
      hoist_variable_names(node.body));
    case "BlockStatement": return ArrayLite.flatMap(node.body, hoist_variable_names);
    case "SwitchStatement": return ArrayLite.flatMap(
      node.cases,
      ({consequent:statements}) => ArrayLite.flatMap(statements, hoist_variable_names));
    case "VariableDeclaration":
      node.AranNames = ArrayLite.flatMap(
        node.declarations,
        (node) => collect_pattern_names(node.id));
      return node.kind === "var" ? node.AranNames : [];
    case "FunctionDeclaration": return [node.id.name];
    default: return [];
  }
};

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
    node.body.AranLabel = node.label.name;
    node = node.body;
  } else if (visitors === Statement) {
    node.AranLabel = null;
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
    node.AranVariableNames = ArrayLite.flatMap(node.body, hoist_variable_names);
    for (let index = node.body.length-1; index >= 0; index--)
      if (last_valued(node.body[index]))
        break;
  }
  if (is_closure(node)) {
    node.AranLength = length_of(node);
    node.AranName = name_of(node);
    node.AranVariableNames = remove_duplicate(
      ArrayLite.flatMap(node.expression ? [] : node.body.body, hoist_variable_names));
    node.AranParameterNames = ArrayLite.flatMap(node.params, collect_pattern_names);
    node.AranParameterNames = (
      (
        node.AranStrict ||
        node.type === "ArrowFunctionExpression" ||
        ArrayLite.some(node.params, (pattern) => pattern !== "Identifier")) ?
      node.AranParameterNames :
      remove_duplicate(node.AranParameterNames));
  }
  if (node.type === "TryStatement") {
    node.AranParameterNames = node.handler ? collect_pattern_names(node.handler.param) : [];
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

exports.Statement = visit(Statement);
exports.Statements = (nodes, scope) => ArrayLite.concat(
  ArrayLite.flatMap(
    nodes,
    (node) => (
      node.type === "FunctionDeclaration" ?
      Visit.Statement(node, scope) :
      [])),
  ArrayLite.flatMap(
    nodes,
    (node) => (
      node.type !== "FunctionDeclaration" ?
      Visit.Statement(node, scope) :
      [])));
exports.expression = visit(Expression);
exports.PROGRAM = visit(Program);
