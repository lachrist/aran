
const ArrayLite = require("array-lite");
const Error = global.TypeError

const collect = (pattern) => {
  if (pattern.type === "Identifier")
    return [pattern.name];
  if (pattern.type === "Property")
    return collect(pattern.value);
  if (pattern.type === "RestElement")
    return collect(pattern.argument);
  if (pattern.type === "AssignmentPattern")
    return collect(pattern.left);
  if (pattern.type === "ObjectPattern")
    return ArrayLite.flatMap(pattern.properties, collect);
  if (pattern.type === "ArrayPattern")
    return ArrayLite.flatMap(pattern.elements, collect);
  throw new Error("Unknown pattern type: "+pattern.type);
};

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
    case "TryStatment":
     return ArrayLite.concat(
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
    case "VariableDeclaration": return DeclarationNames("var", node);
    case "FunctionDeclaration": return [node.id.name];
    default: return [];
  }
};

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

exports.VariableNames = variables;

exports.PatternsContain = (patterns, name) => {
  const loop = (pattern) => {
    if (pattern.type === "Identifier")
      return pattern.name === name;
    if (pattern.type === "Property")
      return loop(pattern.value);
    if (pattern.type === "RestElement")
      return loop(pattern.argument);
    if (pattern.type === "AssignmentPattern")
      return loop(pattern.left);
    if (pattern.type === "ObjectPattern")
      return ArrayLite.some(pattern.properties, loop);
    if (pattern.type === "ArrayPattern")
      return ArrayLite.some(pattern.elements, loop);
    return [];
  };
  return ArrayLite.some(patterns, loop);
};

exports.ClosureLength = (node) => (
  (
    node.params.length &&
    node.params[node.params.length-1].type === "RestElement") ?
  node.params.length - 1 :
  node.params.length);

exports.DeclarationNames = (kind, node) => (
  node.kind === kind ?
  ArrayLite.flatMap(
    node.declarations,
    (declaration) => collect(declaration.id)) :
  []);

exports.LabelName = (node) => (
  node.AranParent.type === "LabeledStatement" ?
  node.AranParent.label.name :
  null);

exports.IsArrowReturn = (node) => {
  while (node.type !== "ArrowFunctionExpression" && node.type !== "FunctionExpression" && node.type !== "FunctionDeclaration")
    node = node.AranParent; 
  return node.type === "ArrowFunctionExpression";
};

exports.PatternNames = collect
