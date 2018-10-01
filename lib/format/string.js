
const ArrayLite = require("array-lite");
const JSON_stringify = JSON.stringify;

/////////////
// Program //
/////////////

exports.PROGRAM = (statements) => ArrayLite.join(statements, "");

////////////////
// Expression //
////////////////

exports.read = (identifier) => identifier;

exports.write = (identifier, expression) => (
  "(" +
  identifier +
  "=" +
  expression +
  ")");

exports.array = (expressions) => (
  "[" +
  ArrayLite.join(expressions, ",") +
  "]");

exports.object = (properties) => (
  "{" +
  ArrayLite.join(
    ArrayLite.map(
      properties,
      (property) => property[0] + ":" + property[1]),
    ",") +
  "}");

exports.closure = (statements) => (
  "function callee(){" +
  ArrayLite.statements.join("") +
  "}");

exports.json_primitive = JSON_stringify;

exports.regexp = (string1, string2) => (
  "/" +
  string1 +
  "/" +
  string2);

exports.get = (expression1, expression2) => (
  "(" +
  expression1 +
  "[" +
  expression2 +
  "])");

exports.set = (expression1, expression2, expression3) => (
  "(" +
  expression1 +
  "[" +
  expression2 +
  "]=" +
  expression3 +
  ")");

exports.conditional = (expression1, expression2, expression3) => (
  "(" +
  expression1 +
  "?" +
  expression2 +
  ":" +
  expression3 +
  ")");

exports.binary = (operator, expression1, expression2) => (
  "(" +
  expression1 +
  " " +
  operator +
  " " +
  expression2 +
  ")");

exports.unary = (operator, expression) => (
  "(" +
  operator +
  " " +
  expression +
  ")");

exports.delete = (expression1, expression2) => (
  "(delete "+
  expression1 +
  "[" +
  expression2 +
  "])");

exports.discard = (identifier) => (
  "(delete " +
  identifier +
  ")");

exports.construct = (expression, expressions) => (
  "(new " +
  expression +
  "(" +
  ArrayLite.join(expressions, ",") +
  "))");

exports.call = (expression, expressions) => (
  "(" +
  expression +
  "(" +
  ArrayLite.join(expressions, ",") +
  "))");

exports.invoke = (expression1, expression2, expressions) => (
  "(" +
  expression1 +
  "[" +
  expression2 +
  "](" +
  ArrayLite.join(expressions, ",") +
  "))");

exports.sequence = (expressions, expression) => (
  expressions.length ?
  (
    "(" +
    ArrayLite.join(expressions) +
    "," +
    expression +
    ")") :
  expression);

///////////////
// Statement //
///////////////

exports.Block = (statements) => [
  (
    "{" +
    ArrayLite.join(statements, "") +
    "}")];

exports.Statement = (expression) => [
  (
    expression +
    ";")];

exports.Return = (expression) => [
  (
    "return " +
    expression +
    ";")];

exports.Throw = (expression) => [
  (
    "throw " +
    expression +
    ";")];

exports.Try = (statements1, statements2, statements3) => [
  (
    "try{" +
    ArrayLite.join(statements1, "") +
    "}catch(error){" +
    ArrayLite.join(statements2, "") +
    "}finally{" +
    ArrayLite.join(statements3, "") +
    "}")];

exports.Declare = (kind, identifier, expression) => [
  (
    kind +
    " " +
    identifier +
    "=" +
    expression +
    ";")];

exports.If = (expression, statements1, statements2) => [
  (
    "if(" +
    expression +
    "){" +
    ArrayLite.join(statements1, "") +
    "}else{" +
    ArrayLite.join(statements2, "") +
    "}")];

exports.Label = (label, statements) => [
  (
    label +
    ":{" +
    ArrayLite.join(statements, "") +
    "}")];

exports.Break = (label) => [
  (
    "break " +
    label +
    ";")];

exports.While = (expression, statements) => [
  (
    "while(" +
    expression +
    "){" +
    ArrayLite.join(statements, "") +
    "}")];

exports.Debugger = () => [
  (
    "debugger;")];

exports.Switch = (clauses) => [
  (
    "switch(true){" +
    ArrayLite.join(
      ArrayLite.map(
        clauses,
        (clause) => (
          "case " +
          clause[0] +
          ":" +
          ArrayLite.join(clause[1], ""))),
      "") +
    "}")];

exports.With = (expression, statements) => [
  (
    "with("+
    expression +
    "){" +
    ArrayLite.join(statements, "") +
    "}")];
