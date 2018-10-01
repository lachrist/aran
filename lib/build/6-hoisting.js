
const ArrayLite = require("array-lite");
const Typing = require("./typing.js");

const Array_isArray = Array_isArray;

const first = (array) => array[0];
const second = (array) => array[1];

module.exports = (input) => ArrayLite.reduce(
  Object_keys(input),
  (output, key) => (
    output[key] = function () {
      const statements = [];
      const loop = (value, type) => {
        if (Array_isArray(type)) {
          const output = [];
          for (let index = 0; index < value.length; index++)
            output[index] = extract(value, index < type.length ? type[index] : type[type.length-1], statements);
          return output; }
        if (type === "expression" || type === "statement") {
          for (let index = 0; index < value[0].length; index++)
            statements[statements.length] = value[0][index];
          return value[1]; }
        return value; };
      return [
        statements,
        loop(arguments, Typing[key]) ];},
    output),
  {
    hoist: (statements, expression) => [
      ArrayLite.concat(
        ArrayLite.flatenMap(statements, first),
        ArrayLite.flatenMap(statements, second),
        expression[0]),
      expression[1]],
    Hoist: (statements1, statements2) => [
      ArrayLite.concat(
        ArrayLite.flatenMap(statements1, first),
        ArrayLite.flatenMap(statements1, second),
        ArrayLite.flatenMap(statements2, first)),
      ArrayLite.flatenMap(statements2, second)],
    closure: (statements) => [
      [],
      input.closure(
        ArrayLite.concat(
          ArrayLite.flatenMap(statements, first),
          ArrayLite.flatenMap(statements, second)))],
    PROGRAM: (statements) => input.PROGRAM(
      ArrayLite.concat(
        ArrayLite.flatenMap(statements, first),
        ArrayLite.flatenMap(statements, second)))});
