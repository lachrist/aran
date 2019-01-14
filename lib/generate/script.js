
const ArrayLite = require("array-lite");
const Sanitize = require("./sanitize.js");

const JSON_stringify = JSON.stringify;
const Reflect_apply = Reflect.apply;
const String_prototype_repeat = String.prototype.repeat;

let namespace;
let indent;

module.exports = (block, identifier) => {
  indent = 0;
  namespace = identifier;
  return "\"use strict\";" + visit0(block);
};

const mapjoin = (array, closure, string) => ArrayLite.join(
  ArrayLite.map(array, closure),
  string);

const labelize = (labels) => ArrayLite.join(
  ArrayLite.map(labels, (label) => label+": "),
  "");

const newline = () => (
  "\n" +
  Reflect_apply(String_prototype_repeat, "  ", [indent]));

const visit0 = (array) => visitors[array[0]](array);

const visit1 = (array) => {
  indent++;
  const result = visitors[array[0]](array);
  indent--;
  return result;
};

const visitors = {};

////////////////
// Expression //
////////////////

visitors.closure = ({1:block}) => (
  "(function callee () {" + visit0(block) + newline() +
  "})");

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
  Sanitize(identifier) + " = " + visit1(expression1) + "," + newline() +
  visit1(expression2) + ")");

visitors.read = ({1:identifier}) => Sanitize(identifier);

visitors.builtin = ({1:string}) => (
  namespace + ".builtins[" + JSON.stringify(string) + "]");

visitors.sequence = ({1:expression1, 2:expression2}) => (
  "(" + newline() +
  visit1(expression1) + "," + newline() +
  visit1(expression2) + ")");

visitors.eval = ({1:expression}) => (
  "eval(" + visit0(expression) + ")");

visitors.conditional = ({1:expression1, 2:expression2, 3:expression3}) => (
  "(" + newline() +
  visit1(expression1) + " ?" + newline() +
  visit1(expression2) + " :" + newline() +
  visit1(expression3) + ")");

visitors.unary = ({1:operator, 2:expression}) => (
  "(" + operator + " " + visit0(expression) + ")");

visitors.binary = ({1:operator, 2:expression1, 3:expression2}) => (
  "(" + newline() +
  visit1(expression1) + " " + operator + newline() +
  visit1(expression2) + ")");

visitors.apply = ({1:expression1, 2:expression2, 3:expressions}) => (
  (
    expression2[0] === "primitive" &&
    expression2[1] === void 0) ?
  (
    (
      expression1[0] === "builtin" &&
      expression1[1] === "Array.of") ?
    (
      "[" +
      (expressions.length ? newline() : "") +
      mapjoin(expressions, visit1, "," + newline()) + "]") :
    (
      (
        expression1[0] === "builtin" &&
        expression1[1] === "Object.fromEntries" &&
        expressions.length === 1 &&
        expressions[0][0] === "apply" &&
        expressions[0][1][0] === "builtin" &&
        expressions[0][1][1] === "Array.of" &&
        expressions[0][2][0] === "primitive" &&
        expressions[0][2][1] === void 0 &&
        ArrayLite.every(
          expressions[0][3],
          ({0:tag, 1:expression1, 2:expression2, 3:expressions}) => (
            tag === "apply" &&
            expression1[0] === "builtin" &&
            expression1[1] === "Array.of" &&
            expression2[0] === "primitive" &&
            expression2[1] === void 0 &&
            expressions.length === 2))) ?
      (
        expressions.length === 0 ?
        "{}" :
        (
          "{" +
          (expressions[0][3].length ? newline() : "") +
          mapjoin(
            expressions[0][3],
            ({3:expressions}) => (
              visit1(expressions[0]) + ":" + newline() +
              visit1(expressions[1])),
            "," + newline()) +
          "}")) :
      (
        (
          expression1[0] === "builtin" &&
          expression1[1] === "Reflect.get" &&
          expressions.length === 2) ?
        (
          "(" + newline() +
          visit1(expressions[0]) + "[" + newline() +
          visit1(expressions[1]) + "])") :
        (
          "(null," + newline() +
          visit1(expression1) + "(" +
          (expressions.length ? newline() : "") +
          mapjoin(expressions, visit1, "," + newline()) + "))")))) :
  (
    (
      expression1[0] === "apply" &&
      expression1[1][0] === "builtin" &&
      expression1[1][1] === "Reflect.get" &&
      expression1[2][0] === "primitive" &&
      expression1[2][1] === void 0 &&
      expression1[3].length === 2 &&
      expression1[3][0] === "read" &&
      expression2[0] === "read" &&
      expression2[3][1] === expression2[1]) ?
    (
      "(" + newline() +
      visit1(expression1[3][0]) + "[" + newline() +
      visit1(expression1[3][1]) + "](" +
      (expressions.length ? newline() : "") +
      mapjoin(expressions, visit1, "," + newline()) + "))") :
    (
      namespace + ".builtins[\"Reflect.apply\"](" + newline() +
      visit1(expression1) + "," + newline() +
      visit1(expression2) + ",[" +
      (expressions.length ? newline() : "") +
      mapjoin(expressions, visit1, "," + newline()) + "])")));

visitors.construct = ({1:expression, 2:expressions}) => (
  (
    expression[0] === "builtin" &&
    expression[1] === "RegExp" &&
    expressions.length === 2 &&
    expressions[0][0] === "primitive" &&
    typeof expressions[0][1] === "string" &&
    expressions[1][0] === "primitive" &&
    typeof expressions[1][1] === "string" &&
    ArrayLite.every(
      expressions[1][1],
      (character, index, string) => (
        ArrayLite.includes("gimuy", character) &&
        ArrayLite.lastIndexOf(string, character) === index))) ?  
  "/" + expressions[0][1] + "/" + expressions[1][1] :
  (  
    "(new " + newline() +
    visit1(expression) + "(" +
    (expressions.length ? newline() : "") +
    mapjoin(expressions, visit1, "," + newline()) + "))"));

visitors.trap = ({1:string, 2:expressions, 3:serial}) => (
  (
    string === "unary" ||
    string === "binary" ||
    string === "apply" ||
    string === "construct") ?
  (
    namespace + "." + string + "(" + newline() +
    mapjoin(expressions, visit1, "," + newline()) + ", " + serial + ")") :
  (
    expressions.length ?
    namespace + "." + string + "(" + mapjoin(expressions, visit0, ", ") + ", " + serial + ")" :
    namespace + "." + string + "(" + serial + ")"));

///////////
// Block //
///////////

visitors.BLOCK = ({1:identifiers, 2:statements}) => (
  (
    identifiers.length ?
      newline() + "let " + mapjoin(identifiers, Sanitize, ", ") + ";" :
    "") +
  (statements.length ? newline() : "") +
  mapjoin(statements, visit0, newline()));

///////////////
// Statement //
///////////////

visitors.Write = ({1:identifier, 2:expression}) => (
  Sanitize(identifier) + " = " + visit1(expression) + ";");

visitors.Expression = ({1:expression}) => (
  visit1(expression) + ";");

visitors.Debugger = ({}) => (
  "debugger;");

visitors.Return = ({1:expression}) => (
  "return " + visit1(expression) + ";");

visitors.Throw = ({1:expression}) => (
  "throw " + visit1(expression) + ";");

visitors.Break = ({1:label}) => (
  "break" + (label ? " " + label : "") + ";");

visitors.Continue = ({1:label}) => (
  "break" + (label ? " " + label : "") + ";");

visitors.Block = ({1:labels, 2:block}) => (
  labelize(labels) + "{" + visit1(block) + newline() +
  "}");

visitors.If = ({1:labels, 2:expression, 3:block1, 4:block2}) => (
  labelize(labels) + "if (" + visit1(expression) + newline() +
  ") {" + visit1(block1) + newline() +
  "} else {" + visit1(block2) + newline() +
  "}");

visitors.While = ({1:labels, 2:expression, 3:block}) => (
  labelize(labels) + "while (" + visit1(expression) + ")" +newline() +
  "{" + visit1(block) + newline() +
  "}");

visitors.Try = ({1:labels, 2:block1, 3:block2, 4:block3}) => (
  (
    block2[1].length === 0 &&
    block2[2].length === 1 &&
    block2[2][0][0] === "Throw" &&
    block2[2][0][1][0] === "read" &&
    block2[2][0][1][1] === "error" &&
    block3[1].length === 0 &&
    block3[2].length === 0) ?
  (
    labelize(labels) + "{" + visit1(block1) + newline() +
    "}") :
  (
    labelize(labels) + "try {" + visit1(block1) + newline() +
    "} catch (error) {" + visit1(block2) + newline() +
    "} finally {" + visit1(block3) + newline() +
    "}"));

visitors.Switch = ({1:labels, 2:block}) => (
  ((index) => (
    "{" + newline() +
    ArrayLite.join(
      ArrayLite.map(
        ArrayLite.slice(block[2], 0, index),
        visit0),
      newline()) + newline() +
    labelize(labels) + "switch (true) {" + newline() +
    ArrayLite.join(
      ArrayLite.map(
        ArrayLite.slice(block[2], index, block[2].length),
        visit0),
      newline()) + newline() +
    "}}"))
  (ArrayLite.findIndex(block[2], (statement) => statement[0] === "Case")));

visitors.Case = ({1:expression}) => (
  expression ?
  "case " + visit1(expression) + ":" :
  "default:");
