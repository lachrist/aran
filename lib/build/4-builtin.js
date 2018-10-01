
const ArrayLite = require("array-lite");

const RegExp = global.RegExp;
const Array_isArray = Array.isArray;
const Object_keys = Object.keys;

const regular1s = [
  "RegExp",
  "Object",
  "Array",
  "eval",
  "Proxy",
  "ReferenceError",
  "TypeError"];

const regular2s = [
  "Array.from"
  "Symbol.iterator",
  "Object.defineProperty",
  "Object.fromEntries",
  "Reflect.apply",
  "Reflect.set",
  "Reflect.get",
  "Reflect.deleteProperty",
  "Reflect.defineProperty",
  "Reflect.getPrototypeOf",
  "Reflect.ownKeys"];

const innerof = (statement) => statement.inner;

const isregexp = (string1, string2) => {
  try {
    new RegExp(string1, string2);
    return true; }
  catch (error) {
    return false; } };

const extract = (value, type) => (
  Array_isArray(type) ?
  ArrayLite.map(
    value,
    (
      type.length === 1 ?
      (element) => generate(element, type[0]) :
      (element, index) => generate(element, type[index]))) :
  (
    type === "expression" || type === "Statement" ?
    value.inner :
    value));

// We could have forwarded calls to the input at
// the end (PROGRAM), but we would not detect
// type errors at the right time if checks are
// enabled.

module.exports = (input) => {
  const output = {};
  ArrayLite.forEach(
    Object_keys(input),
    (key) => {
      output[key] = function () {
        arguments.tag = key;
        arguments.inner = input[key](
          ...ArrayLite.map(
            arguments,
            (argument, index) => extract(argument, Typing[key][index])));
        return arguments; }});
  output.apply = (expression1, expression2, expressions) => {
    if (
      (
        expression2.tag === "primitive" &&
        expression2[0] === void 0))
      return output.call(
        (
          expression1.tag === "get" ?
          output.sequence(
            [
              output.primitive(null),
              expression1]) :
          expression1),
        expressions);
    if (
      (
        expression1.tag === "get" &&
        expression1[0].tag === "write" &&
        expressions2.tag === "read" &&
        expression1[0][0] === expression2[0]))
      return output.call(
        expression1,
        expressions);
    return output.call(
      output.builtin("Reflect.apply"),
      [
        expression1,
        expression2,
        output.array(expressions)]); };
  const construct = output.construct;
  output.construct = (expression, expressions) => {
    if (
      (
        expression.tag === "builtin" &&
        expression[0] === "RegExp" &&
        expressions.length === 2 &&
        expressions[0].tag === "primitive" &&
        typeof expressions[0][0] === "string" &&
        expressions[1].tag === "primitive" &&
        typeof expressions[1][0] === "string" &&
        isregexp(expressions[0][0], expressions[1][0])))
      return output.regexp(
        expressions[0][0],
        expressions[1][0]);
    return construct(expression, expressions); };
  {
    const call = output.call;
    output.call = (expression, expressions) => {
        if (
        (
          expression.tag === "builtin" &&
          expression[0] === "Reflect.apply" &&
          expressions.length === 3 &&
          expressions[2].tag === "array"))
        return output.apply(
          expressions[0],
          expressions[1],
          expressions[2][0]);
      if (
        (
          expression.tag === "builtin" &&
          expression[0] === "Reflect.construct" &&
          expressions.length === 2 &&
          expressions[1].tag === "array"))
        return output.construct(
          expressions[0][0],
          expressions[1][0]);
      if (
        (
          expression.tag === "builtin" &&
          expression[0] === "Reflect.unary" &&
          expressions.length === 2 &&
          expressions[0].tag === "primitive" &&
          ArrayLite.includes(unaries, expressions[0][0])))
        return output.unary(
          expressions[0][0],
          expressions[1]);
      if (
        (
          expression.tag === "builtin" &&
          expression[0] === "Reflect.binary" &&
          expressions.length === 3 &&
          expressions[0].tag === "primitive" &&
          ArrayLite.includes(unaries, expressions[0][0])))
        return output.binary(
          expressions[0][0],
          expressions[1],
          expressions[2]);
      if (
        (
          expression.tag === "builtin" &&
          expression[0] === "Reflect.get" &&
          expressions.length === 2 &&
          expressions[0].tag === "call" &&
          expressions[0][0].tag === "builtin" &&
          expressions[0][0][0] === "Object" &&
          expressions[0][1].length === 1))
        return output.get(
          expressions[0][1][0],
          expressions[1]);
      if (
        (
          expression.tag === "builtin" &&
          expression[0] === "Reflect.delete" &&
          expressions.length === 2 &&
          expressions[0].tag === "call" &&
          expressions[0][0].tag === "builtin" &&
          expressions[0][0][0] === "Object" &&
          expressions[0][1].length === 1))
        return output.unary(
          "delete",
          output.get(
            expressions[0][1][0],
            expressions[1]));
      if (
        (
          expression.tag === "builtin" &&
          expression[0] === "Array.of"))
        return output.array(expressions);
      if (
        (
          expression.tag === "builtin" &&
          expression[0] === "Object.fromEntries" &&
          expressions.length === 1 &&
          expressions[0].tag === "array" &&
          ArrayLite.every(
            expressions[0][0],
            (expression) => (
              expression.tag === "array" &&
              expression[0].length === 2 &&
              expression[0][0].type === "primitive" &&
              typeof expression[0][0][0] === "string"))))
        return output.object(
          ArrayLite(
            (expression) => [
              expression[0][0][0],
              expression[0][1]],
            expressions));
      return call(expression, expressions); }; }
  {
    const Statement = output.Statement;
    output.Statement = (expression) => {
      if (
        (
          expression.tag === "call" &&
          expression[0].tag === "builtin" &&
          expression[0][0] === "Reflect.set" &&
          expression[1].length === 3 &&
          expression[1][0].tag === "call" &&
          expression[1][0][0].tag === "builtin" &&
          expression[1][0][0][0] === "Object" &&
          expression[1][0][1].length === 1))
        return output.Statement(
          output.set(
            expression[1][0][1][0],
            expression[1][1],
            expression[1][2]));
      return Statement(expression); }; }
  {
    const sequence = output.sequence
    output.sequence = (expressions, expression) => sequence(
      ArrayLite.map(
        expressions,
        (expression) => {
          if (
            (
              expression.tag === "call" &&
              expression[0].tag === "builtin" &&
              expression[0][0] === "Reflect.set" &&
              expression[1].length === 3 &&
              expression[1][0].tag === "call" &&
              expression[1][0][0].tag === "builtin" &&
              expression[1][0][0][0] === "Object" &&
              expression[1][0][1].length === 1))
            return output.set(
              expression[1][0][1][0],
              expression[1][1],
              expression[1][2]);
          return expression; }),
      expression); }
  output.PROGRAM = (statements) => input.PROGRAM(
    ArrayLite.concat(
      input.If(
        input.load("global"),
        [],
        ArrayLite.concat(
          ArrayLite.flatenMap(
            regular1s,
            (name) => input.Statement(
              input.save(
                name,
                input.read(name)))),
          ArrayLite.flatenMap(
            regular2s,
            (name) => input.Statement(
              input.save(
                name,
                input.get(
                  input.read(Reflect_apply(String_prototype_split, name, ["."])[0]),
                  input.primitive(Reflect_apply(String_prototype_split, name, ["."])[1]))))),
          input.Statement(
            input.save(
              "global",
              input.apply(
                input.load("eval"),
                [
                  input.primitive("this")]))))),
      ArrayLite.map(innerof, statements)));
  return output;
};
