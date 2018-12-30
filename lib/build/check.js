
const ArrayLite = require("array-lite");
const Grammar = require("./grammar.js");
const Illegal = require("../illegal.js");
const Enumeration = require("../enumeration.js");

const Array_isArray = Array.isArray;
const Math_round = Math.round;

const grammar = (kind) => (value) => {
  if (!Array_isArray(value))
    throw "not-an-array";
  if (typeof value[0] !== "string")
    throw "tag-not-a-string";
  if (!(value[0] in Grammar[kind]))
    throw "tag-unrecognized";
  return value;
};

const enumeration = (values) => (value) => {
  if (!ArrayLite.includes(values, value))
    throw "unrecognized";
  return value;
};

exports.block = grammar("block");

exports.statement = grammar("statement");

exports.expression = grammar("expression");

exports["nullable-expression"] = (value) => value === null || grammar("expression")(value);

exports.primitive = (value) => {
  if (value !== null && typeof value === "object")
    throw "non-null-object";
  if (typeof value === "function")
    throw "function";
  if (typeof value === "symbol")
    throw "symbol";
  return value;
};

exports.serial = (value) => {
  if (typeof value !== "number")
    throw "not-a-number";
  if (value !== value)
    throw "NaN";
  if (value < 0)
    throw "negative-number";
  if (Math_round(value) !== value)
    throw "fractional-number";
  return value;
};

exports["nullable-label"] = (value) => {
  if (value !== null && Illegal(value))
    throw "not-null-and-illegal";
  return value;
};

exports.label = (value) => {
  if (Illegal(value))
    throw "illegal";
  return value;
};

exports.identifier = (value) => {
  if (typeof value === "number") {
    if (value !== value)
      throw "NaN";
    if (value < 0)
      throw "negative-number";
    if (Math_round(value) !== value)
      throw "fractional-number";
  } else if (value !== "this" && value !== "new.target" && Illegal(value)) {
    throw "not-a-number-and-illegal";
  }
  return value;
};

exports["unary-operator"] = enumeration(Enumeration.UnaryOperator);

exports["binary-operator"] = enumeration(Enumeration.BinaryOperator);

exports["argument-name"] = enumeration([
  "new.target",
  "this",
  "length",
  "next"
]);

exports["trap-name"] = enumeration(
  ArrayLite.concat(
    Enumeration.InformerTrap,
    Enumeration.TransformerTrap,
    Enumeration.CombinerTrap));

exports["builtin-name"] = enumeration(
  ArrayLite.concat(
    Enumeration.GenericBuiltin,
    Enumeration.AdhocBuiltin));
