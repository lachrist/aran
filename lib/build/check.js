
const ArrayLite = require("array-lite");
const Grammar = require("./grammar.js");
const Illegal = require("../illegal.js");

const Array_isArray = Array.isArray;
const Math_round = Math.round;

exports.statement = (value) => {
  if (!Array_isArray(value))
    throw "not-an-array";
  if (typeof value[0] !== "string")
    throw "tag-not-a-string";
  if (!(value[0] in Grammar.statement))
    throw "tag-unrecognized";
};

exports.expression = (value) => {
  if (!Array_isArray(value))
    throw "not-an-array";
  if (typeof value[0] !== "string")
    throw "tag-not-a-string";
  if (!(value[0] in Grammar.expression))
    throw "tag-unrecognized";
};

exports["null-expression-statement"] = (value) => {
  if (value !== null) {
    if (!Array_isArray(value))
      throw "not-an-array";
    if (typeof value[0] !== "string")
      throw "tag-not-a-string";
    if (!(value[0] in Grammar.expression) && !(value[0] in Grammar.statement))
      throw "tag-unrecognized";
  }
};

exports.primitive = (value) => {
  if (value && value !== true && typeof value !== "number" && typeof value !== "string")
    throw "reference-or-symbol";
};

exports.serial = (value) => {
  if (typeof value !== "number")
    throw "not-a-number";
  if (value < 0)
    throw "negative-number";
  if (Math_round(value) !== value)
    throw "fractional-number";
};

////////////////
// Identifier //
////////////////

exports.label = (value) => {
  if (value !== null && Illegal(value))
    throw "not-null-and-illegal";
};

exports.identifier = (value) => {
  if (typeof value === "number") {
    if (value < 0)
      throw "negative-number";
    if (Math_round(value) !== value)
      throw "fractional-number";
  } else if (value !== "this" && value !== "new.target" && Illegal(value)) {
    throw "not-a-number-and-illegal";
  }
};

/////////////////
// Enumeration //
/////////////////

const enumeration = (values) => (value) => {
  if (!ArrayLite.includes(values, value))
    throw "unrecognized";
};

exports["property-kind"] = enumeration(["init", "get", "set"]);

exports["arrival-index"] = enumeration([0, 1, 2, 3]);

exports["unary-operator"] = enumeration([
  "-",
  "+",
  "!",
  "~",
  "typeof",
  "void",
  "delete"
]);

exports["binary-operator"] = enumeration([
  "==",
  "!=",
  "===",
  "!==",
  "<",
  "<=",
  ">",
  ">=",
  "<<",
  ">>",
  ">>>",
  "+",
  "-",
  "*",
  "/",
  "%",
  "|",
  "^",
  "&",
  "in",
  "instanceof"
]);

exports["trap-name"] = enumeration([

  "enter",
  "leave",
  "arrival",
  "break",
  "continue",
  "debugger",

  "return",
  "throw",
  "test",
  "write",
  "drop",
  "eval",

  "builtin",
  "read",
  "primitive",
  "closure",
  "prelude",
  "error",

  "failure",
  "success",

  "apply",
  "construct"

]);

exports["builtin-name"] = enumeration([
  // Direct //
  "global",
  "eval",
  "ReferenceError",
  "TypeError",
  "Object",
  "RegExp",
  // Indirect //
  "Reflect.has",
  "Reflect.get",
  "Reflect.set",
  "Reflect.deleteProperty",
  "Reflect.apply",
  "Reflect.construct",
  "Symbol.unscopables",
  "Symbol.iterator",
  "Array.of",
  "Object.getOwnPropertyNames",
  "Object.defineProperty",
  "Object.keys",
  // Prototype //
  "Array.prototype.concat",
  // Aran-Specific //
  "AranObjectify",
  "AranHold",
  "AranRest",
  "AranUnary",
  "AranBinary",
  "AranInitializeObject",
  "AranThrowTypeError",
  "AranThrowReferenceError"
]);
