
const ArrayLite = require("array-lite");
const Sanitize = require("./sanitize.js");

const JSON_stringify = JSON.stringify;

let namespace;
let indent;

module.exports = (block, identifier) => {
  indent = 0;
  namespace = identifier;
  return visit0(block);
};

const visitors = {};

const visit = (array) => {
  indent++;
  console.log(array);
  const result = visitors[array[0]](array);
  indent--;
  return result;
};

const visit0 = (array) => visitors[array[0]](array);

const newline = () => "\n" + "  ".repeat(indent);

////////////////
// Expression //
////////////////

visitors.array = ({1:expressions}) => (
  expressions.length === 0 ?
  "[]" :(
    "[" + newline() +
    ArrayLite.join(
      ArrayLite.map(expressions, visit),
      "," + newline()) +
    "]"));

visitors.closure = ({1:block}) => (
  "function callee () " + visit0(block));

visitors.primitive = ({1:primitive}) => (
  primitive === void 0 ?
  "(void 0)" :
  (
    typeof primitive === "string" ?
    JSON_stringify(primitive) :
    (
      primitive !== primitive ?
      "(0/0)" :
      (
        primitive === 1/0 ?
        "(1/0)" :
        (
          primitive === -1/0 ?
          "(-1/0)" :
          String(primitive))))));

visitors.write = ({1:identifier, 2:expression1, 3:expression2}) => (
  "(" + newline() +
  Sanitize(identifier) + " = " + visit(expression1) + "," + newline() +
  visit(expression2) + ")");

visitors.read = ({1:identifier}) => Sanitize(identifier);

visitors.builtin = ({1:string}) => (
  namespace + ".builtins[" + JSON.stringify(string) + "]");

visitors.sequence = ({1:expression1, 2:expression2}) => (
  "(" + newline() +
  visit(expression1) + "," + newline() +
  visit(expression2) + ")");

visitors.eval = ({1:expression}) => (
  "eval(" + visit0(expression));

visitors.conditional = ({1:expression1, 2:expression2, 3:expression3}) => (
  "(" + newline() +
  visit(expression1) + "?" + newline() +
  visit(expression2) + ":" + newline() +
  visit(expression3) + ")");

visitors.unary = ({1:operator, 2:expression}) => (
  "(" + operator + " " + visit0(expression) + ")");

visitors.binary = ({1:operator, 2:expression1, 3:expression2}) => (
  "(" + newline() +
  visit(expression1) + " " + operator + newline() +
  visit(expression2) + ")");

visitors.apply = ({1:expression1, 2:expression2, 3:expressions}) => (
  namespace + ".builtins[\"Reflect.apply\"](" + newline() +
  visit(expression1) + "," + newline() +
  visit(expression2) + "," + newline() +
  visit(["array", expressions]) + ")");

visitors.construct = ({1:expression, 2:expressions}) => (
  namespace + ".builtins[\"Reflect.construct\"](" + newline() +
  visit(expression), "," + newline() +
  visit(["array", expressions]) + ")");

visitors.trap = ({1:string, 2:expressions, 3:serial}) => (
  string === "unary" ?
  (
    namespace + ".unary(" + expressions[0][1] + ", " + visit0(expressions[1]) + ", " + serial + ")") :
  (
    string === "binary" ?
    (
      namespace + ".binary(" + expressions[0][1] + "," + newline() +
      visit(expressions[1]) + "," + newline() +
      visit(expressions[2]) + ", " + serial + ")") :
    (
      string === "apply" ?
      (
        namespace + ".apply(" + newline() +
        visit(expressions[0]) + "," + newline() +
        visit(expressions[1]) + "," + newline() +
        visit(expressions[2]) + ")") :
      (
        string === "construct" ?
        (
          namespace + ".construct(" + newline() +
          visit(expressions[0]) + "," + newlinw() +
          visit(expressions[1]) + ")") :
        (
          namespace + "." + string + "(" + ArrayLite.join(ArrayLite.map(expressions, visit0), ", ") + ", " + serial + ")")))));

///////////
// Block //
///////////

visitors.BLOCK = ({1:identifiers, 2:statements}) => (
  (
    identifiers.length ?
      newline() + "let " + ArrayLite.join(ArrayLite.map(identifiers, Sanitize), ", ") + ";" :
    "") +
  ArrayLite.join(
    ArrayLite.map(
      statements,
      (statement) => newline() + visit0(statement)),
    ""));

///////////////
// Statement //
///////////////

visitors.Write = ({1:identifier, 2:expression}) => (
  Sanitize(identifier) + " = " + visit(expression) + ";");

visitors.Expression = ({1:expression}) => (
  visit(expression) + ";");

visitors.Debugger = ({}) => (
  "debugger;");

visitors.Return = ({1:expression}) => (
  "return " + visit(expression) + ";");

visitors.Throw = ({1:expression}) => (
  "throw " + visit(expression) + ";");

visitors.Break = ({1:label}) => (
  "break" + (label ? "" : " " + label) + ";");

visitors.Continue = ({1:label}) => (
  "break" + (label ? "" : " " + label) + ";");

visitors.Block = ({1:labels, 2:block}) => (
  ArrayLite.map(labels, (label) => label + ": ") + "{" + visit(block) + newline() +
  "}");

visitors.If = ({1:labels, 2:expression, 3:block1, 4:block2}) => (
  ArrayLite.map(labels, (label) => label + ": ") + "if (" + newline() +
  visit(expression) + ") {" + visit(block1) + newline() +
  "} else {" + visit(block2) + newline() +
  "}");

visitors.While = ({1:labels, 2:expression, 3:block}) => (
  ArrayLite.map(labels, (label) => label + ": ") + "while (" + newline() +
  visit(expression) + ") {" + visit(block) + newline() +
  "}");

visitors.Try = ({1:labels, 2:block1, 3:block2, 4:block3}) => (
  ArrayLite.map(labels, (label) => label + ": ") + "try {" + visit(block1) + newline() +
  "} catch (error) {" + visit(block2) + newline() +
  "} finally {" + visit(block3) + newline() +
  "}");

visitors.Switch = ({1:labels, 2:block}) => (
  "{" + newline() +
  ArrayLite.join(
    ArrayLite.map(
      ArrayLite.slice(
        block[1],
        0,
        ArrayLite.indexOf(block[1], (statement) => statement[0] === "Case") - 1),
      visit0),
    newline()) + newline(),
  "switch (true) {" + newline() +
  ArrayLite.join(
    ArrayLite.map(
      ArrayLite.slice(
        block[1],
        ArrayLite.indexOf(block[1], (statement) => statement[0] === "Case"),
        block[1].length),
      visit0),
    newline()) + "}}");

visitors.Case = ({1:expression}) => (
  "case " + visit(expression) + ":");

visitors.Default = ({}) => (
  "default:");
