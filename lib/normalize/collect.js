
const ArrayLite = require("array-lite");

const global_Error = global.Error;

const esidentifiers_of_pattern = (pattern) => {
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
      default: throw new global_Error("Unknown pattern type: "+pattern.type);
    }
  }
  return names;
};

const esidentifiers_of_declarator = (declarator) => esidentifiers_of_pattern(declarator.id);

const esidentifiers_of_nodes = (nodes, kind) => ArrayLite.flatMap(
  ArrayLite.flatMap(
    nodes,
    (node) => (
      node.type === "SwitchCase" ?
      node.consequent :
      node)),
  (node) => (
    (
      node.type === "VariableDeclaration" &&
      node.kind === kind) ?
    ArrayLite.flatMap(node.declarations, esidentiers_of_declarator) :
    []));

exports.Pattern = (es_pattern) => esidentifiers_of_pattern(es_pattern);

exports.Lets = (es_statements) => esidentifiers_of_nodes(es_statements, "let");

exports.Consts = (es_statements) => esidentifiers_of_nodes(es_statements, "const");

exports.Vars = (nodes) => {
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
