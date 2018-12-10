
const ArrayLite = require("array-lite");

const Reflect_apply = Reflect.apply;

module.exports = (program, namespace) => {

  const visit = Object_create(null);
  visit.BLOCK = = (block) => ({
    type: "BlockStatement",
    body: ArrayLite.concat(
      declaration(block[0]),
      ArrayLite.map(block[1], visit_statement))});

  const visit = (visitors) => (array) => Reflect_apply(
    visitors[array[0]],
    null,
    ArrayLite.slice(array, 1, array.length));

  const visit_expression = visit(expression_visitors);

  const visit_statement = visit(statement_visitors);

  ////////////
  // Return //
  ////////////

  return ({
    type: "Program",
    body: ArrayLite.concat(
      [
        {
          type: "ExpressionStatement",
          expression: {
            type: "Literal",
            value: "use strict" }}],
      declaration(program[0]),
      ArrayLite.map(program[1], visit_statement))});

};
