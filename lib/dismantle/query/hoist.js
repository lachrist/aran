
const ArrayLite = require("array-lite");

const identifiers = (pattern) => {
  if (pattern.type === "Identifier")
    return [pattern.name];
  if (pattern.type === "Property")
    return identifiers(pattern.value);
  if (pattern.type === "RestElement")
    return identifiers(pattern.argument);
  if (pattern.type === "AssignmentPattern")
    return identifiers(pattern.left);
  if (pattern.type === "ObjectPattern")
    return ArrayLite.flatMap(pattern.properties, identifiers);
  if (pattern.type === "ArrayPattern")
    return ArrayLite.flatMap(pattern.elements, identifiers);
  return [];
};

const declaration = (declaration) => pattern(declaration.id);

const variables = (node) => {
  switch (node.type) {
    case "IfStatement": return ArrayLite.concat(
      variables(node.consequent),
      (
        node.alternate ?
        variables(node.alternate) :
        []));
    case "LabeledStatement": return variables(node.body);
    case "WhileStatement": return variables(node.body);
    case "DoWhileStatement": return variables(node.body);
    case "WithStatement": return variables(node.body);
    case "TryStatment": return ArrayLite.concat(
      variables(node.block),
      (
        node.handler ?
        variables(node.handler.body) :
        []),
      (
        node.finalizer ?
        variables(node.finalizer) :
        []));
    case "ForStatement": return ArrayLite.concat(
      (
        node.init && node.init.type === "VariableDeclaration" ?
        variables(node.init) :
        []),
      variables(node.body));
    case "ForInStatement": return ArrayLite.concat(
      (
        node.left.type === "VariableDeclaration" ?
        variables(node.left) :
        []),
      variables(node.body));
    case "ForOfStatement": return ArrayLite.concat(
      (
        node.left.type === "VariableDeclaration" ?
        variables(node.left) :
        []),
      variables(node.body));
    case "BlockStatement": return ArrayLite.flatMap(node.body, variables);
    case "SwitchStatement": return ArrayLite.flatMap(
      node.cases,
      ({consequent:statements}) => ArrayLite.flatMap(statements, variables));
    case "VariableDeclaration": return (
      node.kind === "var" ?
      ArrayLite.flatMap(node.declarations, declaration) :
      []);
    case "FunctionDeclaration": return [node.id.name];
    default: return [];
  }
};

exports.pattern = identifiers;

exports.declaration = (node) => ArrayLite.flatMap(node.declarations, declaration);

exports.variables = variables;
