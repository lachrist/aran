
module.exports = (node) => {
  if (node.id)
    return node.id.name;
  if (node.AranParent.type === "VariableDeclaration")
    for (let index = 0; index < node.AranParent.declarations.length; index++)
      if (node.AranParent.declarations[index].init === node)
        return (
          node.AranParent.declarations[index].id.type === "Identifier" ?
          node.AranParent.declarations[index].id.name :
          "");
  if (node.AranParent.type === "ObjectExpression")
    for (let index = 0; index < node.AranParent.properties.length; index++)
      if (node.AranParent.properties[index].value === node)
        return (
          !node.AranParent.properties[index].computed ?
          node.AranParent.properties[index].name :
          "");
  if (node.AranParent.type === "AssignmentExpression")
    return (
      node.operator === "=" && node.left.type === "Identifier" ?
      node.left.name :
      "");
  return "";
};
