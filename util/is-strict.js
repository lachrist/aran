
module.exports = (ast) => ast &&
  ast.type === "ExpressionStatement" &&
  ast.expression.type === "Literal" &&
  ast.expression.value === "use strict";
