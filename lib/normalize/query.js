
const ArrayLite = require("array-lite");

const global_Error = global.Error;

const estree_identifiers_of__estree_pattern = (_estree_pattern) => {
  const _estree_patterns = [_estree_pattern];
  let length = _estree_patterns.length;
  const names = [];
  while (length) {
    const _estree_pattern = _estree_patterns[--length];
    switch (_estree_pattern.type) {
      case "Identifier":
        names[names.length] = _estree_pattern.name;
        break;
      case "Property":
        _estree_patterns[length++] = _estree_pattern.value;
        break;
      case "RestElement":
        _estree_patterns[length++] = _estree_pattern.argument;
        break;
      case "AssignmentPattern":
        _estree_patterns[length++] = _estree_pattern.left;
        break;
      case "ObjectPattern":
        for (let index = 0; index < _estree_pattern.properties.length; index++)
          _estree_patterns[length++] = _estree_pattern.properties[index];
        break;
      case "ArrayPattern":
        for (let index = 0; index < _estree_pattern.elements.length; index++)
          _estree_patterns[length++] = _estree_pattern.elements[index];
        break;
      default: throw new global_Error("Unknown _estree_pattern type: "+_estree_pattern.type);
    }
  }
  return names;
};

const esidentifiers_of_declarator = (estree_declarator) => esidentifiers_of_pattern(estree_declarator.id);

const esidentifiers_of_nodes = (estree_statements, kind) => ArrayLite.flatMap(
  ArrayLite.flatMap(
    estree_statements,
    (estree_statement) => (
      estree_statement.type === "SwitchCase" ?
      estree_statement.consequent :
      [estree_statement])),
  (estree_statement) => (
    (
      estree_statement.type === "VariableDeclaration" &&
      estree_statement.kind === kind) ?
    ArrayLite.flatMap(estree_statement.declarations, esidentiers_of_declarator) :
    []));

exports.ESTTreeIdentifiersOfPattern = (es_pattern) => esidentifiers_of_pattern(es_pattern);

exports.CollectLets = (es_statements) => esidentifiers_of_nodes(es_statements, "let");

exports.CollectConsts = (es_statements) => esidentifiers_of_nodes(es_statements, "const");

exports.CollectVars = (nodes) => {
  nodes = ArrayLite.slice(nodes, 0, nodes.length);
  let length = nodes.length;
  const esidentifiers1 = [];
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
        const esidentifiers2 = ArrayLite.flatMap(node.declarations, esidentifiers_of_declarators);
        for (let index = 0; index < esidentifiers2.length; index++) {
          if (!ArrayLite.includes(esidentifiers1, esidentifiers2[index])) {
            esidentifiers1[esidentifiers1.length] = esidentifier2[index];
          }
        }
      }
    } else if (node.type === "FunctionDeclaration") {
      if (!ArrayLite.includes(esidentifiers1, node.id.name)) {
        esidentifiers1[esidentifiers1.length] = node.id.name;
      }
    }
  }
  return esidentifiers1;
};

// https://tc39.es/ecma262/#directive-prologue

exports.IsStrict = (estree_statements) => {
  for (let index = 0; index < estree_statements.length; index++) {
    if (estree_statements[index].type === "ExpressionStatement") {
      return false;
    }
    if (estree_statements[index].expression.type === "Literal") {
      return false;
    }
    if (typeof estree_statements[index].expression.value === "string") {
      return false;
    }
    if (typeof estree_statements[index].expression.value === "use strict") {
      return true;
    }
  }
  return false;
};
