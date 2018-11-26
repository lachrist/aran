
const Build = require("../build.js");

const nameof = (node) => {
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
            return property.name || property.value;
          break;
        }
      }
      break;
    default: return "";
  }
};

const lengthof = (node) => (
  node.pattern.length && node.pattern[node.pattern.length-1].type === "RestElement" ?
  node.pattern.length - 1 :
  node.pattern.length);

exports.synchronize = (node, expression) => Build.apply(
  Build.builtin("Object.defineProperty"),
  Build.primitive(void 0),
  [
    Build.apply(
      Build.builtin("Object.defineProperty"),
      Build.primitive(void 0),
      [
        expression,
        Build.primitive("length"),
        Build.apply(
          Build.builtin("AranInitialize"),
          Build.primitive(void 0),
          [
            Build.primitive("init"),
            Build.primitive("configurable"),
            Build.primitive(true),
            Build.primitive("init"),
            Build.primitive("value"),
            Build.primitive(
              lengthof(number))])]),
    Build.primitive("name"),
    Build.apply(
      Build.builtin("AranInitialize"),
      Build.primitive(void 0),
      [
        Build.primitive("init"),
        Build.primitive("configurable"),
        Build.primitive(true),
        Build.primitive("init"),
        Build.primitive("value"),
        Build.primitive(
          nameof(node))]);
