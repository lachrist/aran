
module.exports = (statement) => ({
  strict: statement &&
    statement.type === "ExpressionStatement" &&
    statement.expression.type === "Literal" &&
    statement.expression.value === "use strict",
  hidden: [],
  hoisted: [] });
