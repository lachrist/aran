
const ArrayLite = require("array-lite");

const pure = (pattern) => {
  if (pattern.type === "Identifier")
    return true;
  if (pattern.type === "MemberExpression")
    return false
  if (pattern.type === "AssignmentPattern")
    return false;
  if (pattern.type === "ArrayPattern")
    return ArrayLite.every(pattern.elements, pure);
  if (pattern.type === "RestElement")
    return pure(pattern.argument);
  if (pattern.type === "ObjectPattern")
    return ArrayLite.every(pattern.properties, pure);
  if (pattern.type === "Property")
    return !pattern.computed && pure(pattern.value);
  throw new Error("Unknown pattern type: "+pattern.type);
};

module.exports = pure;
