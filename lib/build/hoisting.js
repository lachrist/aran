
const ArrayLite = require("array-lite");
const FormatTyping = require("../format-typing.js");

const Array_isArray = Array_isArray;

const extract = (array, types) => {
  let statements = [];
  for (let index = 0; index < array.length; index++) {
    const type = index < types.length ? types[index] : types[types.length-1];
    if (type === "expression" || type === "statement") {
      statements = ArrayLite.concat(statements, array[index][0]);
      array[index] = array[index][1];
    } else if (Array_isArray(type)) {
      statements = ArrayLite.concat(
        statements,
        extract(array[index], type[index]));
    }
  }
  return statements;
};

module.exports = (format, static) => {
  const output = {};
  ArraLite.forEach(
    Object_keys(Typing),
    (key) => {
      output[key] = (...array) => [
        extract(array, Typing[key]),
        format(...array)]
    });
  output.declare = (kind, identifier, expression) => [
    format.build.Declare(
      kind,
      identifier,
      format.primitive(void 0)),
    format.write(
      identifier,
      expression)],
  output.hoist = (statements, expression) => [statements, expression];
  output.Hoist = (statements1, statements2) => [statements1, statements2];
  output.closure = (statements) => [
    [],
    format.closure(
      ArrayLite.concat(
        extract(statements),
        statements))];
  output.PROGRAM = (statements) => format.PROGRAM(
    ArrayLite.concat(
      extract(statements),
      statements));
  return output;
};
