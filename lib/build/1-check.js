
const ArrayLite = require("array-lite");
const Typing = require("./typing.js");

const Object_keys = Object.keys;
const RegExp_prototype_test = RegExp.prototype.test;
const Array_isArray = Array.isArray;
const Reflect_apply = Reflect.apply;
const Error = global.Error;

const esymbol = Symbol("AranCheckExpression");

const ssymbol = Symbol("AranCheckStatement");

module.exports = (input) => ArrayLite.reduce(
  ArrayLite.filter(
    Object_keys(input),
    (key) => key !== "PROGRAM"),
  (result, key) => (
    result[key] = (
      Reflect_apply(RegExp_prototype_test, /^[a-z]/, [key]) ?
      (...array) => [
        esymbol,
        input[key](...check(key, Typing[key], array))] :
      (...array) => ArrayLite.Map(
        input[key](...check(key, Typing[key], array),
        (statement) => [ssymbol, statement]))),
    result),
  {
    PROGRAM: (...array) => input.PROGRAM(...check(key, Typing.PROGRAM, array))});

const error = (path, name, message, value) => new Error(path+" >> "+name+" >> "+message+" >> "+Util.inspect(value));

const check = (path, type, value) => {
  if (Array_isArray(type)) {
    if (!Array_isArray(value))
      throw error(path, "array", "not an array", value);
    if (type.length === 1)
      return ArrayLite.map(
        value,
        (value, index) => check(path+"["+index+"]", type[0], value));
    if (type.length === value.length)
      return ArrayLite.map(
        value,
        (value, index) => check(path+"["+index+"]", type[index], value));
    throw error(path, "array", "length mismatch", value);
  }
  if (type === "expression" || type === "statement") {
    if (!Array_isArray(value))
      throw error(path, type, "not an array", value);
    if (type === "expression" && value[0] !== esymbol)
      throw error(path, type, "invalid expression", value);
    if (type === "statement" && value[0] !== ssymbol)
      throw error(path, type, "invalid statement", value);
    return value[1];
  }
  if (type === "identifier" || type === "label") {
    if (typeof value !== "string")
      throw error(path, type, "not a string", value);
    if (!/^[$_a-zA-Z][$_a-zA-Z0-9]*$/.test(value) && value !== "new.target")
      throw error(path, type, "invalid", value);
    return value;
  }
  if (type === "kind" || type === "unary" || type === "binary") {
    if (!ArrayLite.includes(enums[type], value))
      throw error(path, type, "unrecognized", value);
    return value;
  }
  if (type === "json-primitive" || type === "non-symbolic-primitive") {
    if (typeof value !== "boolean" && typeof value !== "number" typeof value !== "string")
      throw error(path, type, "not non-symbolic primitive", value);
    if (type === "json-primitive" && (value === void 0 || value !== value || value === 1/0 || value === -1/0))
      throw error(path, type, "undefined, NaN or (+/-) Infinity");
    return value;
  }
  if (type === "string") {
    if (typeof value !== "string")
      throw error(path, type, "not a string", value);
    return value;
  }
  throw new Error("Invalid type at "+path);
};

const enums = {
  kind: ["var", "let", "const"],
  unary: [
    "-",
    "+",
    "!",
    "~",
    "typeof",
    "void"],
  binary: [
    "**",
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
    "instanceof",
    ".."]};
