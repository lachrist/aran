
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
    // hoist: (statements, expression) => [
    //   ArrayLite.concat(
    //     ArrayLite.flatenMap(statements, first),
    //     ArrayLite.flatenMap(statements, second),
    //     expression[0]),
    //   expression[1]],
    // Hoist: (statements1, statements2) => [
    //   ArrayLite.concat(
    //     ArrayLite.flatenMap(statements1, first),
    //     ArrayLite.flatenMap(statements1, second),
    //     ArrayLite.flatenMap(statements2, first)),
    //   ArrayLite.flatenMap(statements2, second)],

    hoist: (kind, statements, expression) => (
      kind === "closure" ?
      [
        ArrayLite.concat(
          ArrayLite.flatenMap(statements, first),
          ArrayLite.flatenMap(statements, third),
          expression[0]),
        ArrayLite.concat(
          ArrayLite.flatenMap(statements, second),
          expression[1]),
        expression[2]] :
      [
        ArrayLite.concat(
          ArrayLite.flatenMap(statements, first),
          expression[0]),
        ArrayLite.concat(
          ArrayLite.flaten(statements, second),
          ArrayLite.flaten(statements, third),
          expression[1]),
        expression[2]])m
    Hoist: (kind, statements) => (
      kind === "closure" ?
      [
        ArrayLite.concat(
          ArrayLite.flatenMap(statements, first),
          ArrayLite.flatenMap(statements, third)),
        ArrayLite.flatenMap(statements, second),
        []] :
      [
        ArrayLite.flatenMap(statements, first),
        ArrayLite.concat(
          ArrayLite.flatenMap(statements, second),
          ArrayLite.flatenMap(statements, third)),
        []]);

    Declare: (kind, identifier, expression) => (
      kind === "var" ?
      [
        ArrayLite.concat(
          input.Declare(
            "var",
            identifier,
            expression[2]),
          expression[0]),
        expression[1],
        []] :
      [
        expression[0],
        ArrayLite.concat(
          input.Declare(
            kind,
            identifier,
            expression[2]),
          expression[1]),
        []]);
    declare: (kind, identifier, expression1, expression2) => (
      kind === "var" ?
      [
        ArrayLite.concat(
          input.Declare(
            "var",
            identifier,
            expression[2]),
          expression[0]),
        expression[1],
        []] :
      [
        expression[0],
        ArrayLite.concat(
          input.Declare(
            kind,
            identifier,
            expression[2]),
          expression[1]),
        []]);
  
    Hoist: (identifier, expression, statements) => [
      ArrayLite.concat(
        input.Declare(
          "var",
          identifier,
          expression[2]),
        expression[0],
        ArrayLite.flatenMap(statements, first)),
      ArrayLite.concat(
        expression[1],
        ArrayLite.flatenMap(statements, second)),
      ArrayLite.flatenMap(statements, third)],
    declare: (identifier, expression1, expression2) => [
      ArrayLite.concat(expression1[0], expression2[0]),
      ArrayLite.concat(
        input.Declare(
          "let",
          identifier,
          input.primitive(void 0)),
        expression1[1],
        expression2[1]),
      input.sequence(
        [
          input.write(
            identifier,
            expression1[2])],
        expression2[2])],
    closure: (statements) => [
      [],
      input.closure(
        ArrayLite.concat(
          ArrayLite.flatenMap(statements, first),
          ArrayLite.flatenMap(statements, second),
          ArrayLite.flatenMap(statements, third)))],
    While: (statements) => [
      ArrayLite.flatenMap(statements, first),
      [],
      ArrayLite.concat(
        ArrayLite.flatenMap(statements, second),
        ArrayLite.flatenMap(statements, third))],
    PROGRAM: (statements) => input.PROGRAM(
      ArrayLite.concat(
        ArrayLite.flatenMap(statements, first),
        ArrayLite.flatenMap(statements, second)))});
