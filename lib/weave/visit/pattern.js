
const ArrayLite = require("array-lite");

module.exports = loop;

const loop = (pattern) => {
  if (pattern.type === "Identifier")
    return [pattern.name];
  if (pattern.type === "Property")
    return loop(pattern.value);
  if (pattern.type === "RestElement")
    return loop(pattern.argument);
  if (pattern.type === "AssignmentPattern")
    return loop(pattern.left);
  if (pattern.type === "ObjectPattern")
    return ArrayLite.flatenMap(pattern.properties, loop);
  if (pattern.type === "ArrayPattern")
    return ArrayLite.flatenMap(pattern.elements, pattern);
  return [];
};
