
const ArrayLite = require("array-lite");
const Typing = require("./typing.js");
const Enumerations = require("./enumerations.js");

const Object_keys = Object.keys;
const String_prototype_trim = String.prototype.trim;
const String_prototype_toLowerCase = String.prototype.toLowerCase;
const Array_isArray = Array.isArray;
const Reflect_apply = Reflect.apply;
const Error = global.Error;
const Function = global.Function;

const esymbol = Symbol("AranCheckExpression");

const ssymbol = Symbol("AranCheckStatement");

module.exports = (input) => ArrayLite.reduce(
  ArrayLite.filter(
    Object_keys(input),
    (key) => key !== "PROGRAM"),
  (result, key) => (
    result[key] = (
      Reflect_apply(String_prototype_toLowerCase, key, []) === key ?
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
      throw error(path, "array", "not-an-array", value);
    if (type.length === 1)
      return ArrayLite.map(
        value,
        (value, index) => check(path+"["+index+"]", type[0], value));
    if (type.length === value.length)
      return ArrayLite.map(
        value,
        (value, index) => check(path+"["+index+"]", type[index], value));
    throw error(path, "array", "length-mismatch", value);
  }
  if (type === "expression" || type === "statement") {
    if (!Array_isArray(value))
      throw error(path, type, "not-an-array", value);
    if (type === "expression" && value[0] !== esymbol)
      throw error(path, type, "invalid-expression", value);
    if (type === "statement" && value[0] !== ssymbol)
      throw error(path, type, "invalid-statement", value);
    return value[1];
  }
  if (type === "identifier") {
    if (typeof value !== "string")
      throw error(path, type, "not-a-string", value);
    // credit: https://github.com/shinnn/is-var-name
    if (Reflect_apply(String_prototype_trim, value, []) !== value)
      throw error(path, type, "trim-spaces", value);
    try {
      new Function(value, "var "+value); }
    catch (error) {
      throw error(path, type, "not-an-identifier", value); }
    return value;
  }
  if (type === "kind" || type === "unary" || type === "binary") {
    if (!ArrayLite.includes(Enumerations[type], value))
      throw error(path, type, "unrecognized", value);
    return value;
  }
  if (type === "json-primitive" || type === "non-symbolic-primitive") {
    if (typeof value !== "boolean" && typeof value !== "number" typeof value !== "string")
      throw error(path, type, "not-a-non-symbolic-primitive", value);
    if (type === "json-primitive" && (value === void 0 || value !== value || value === 1/0 || value === -1/0))
      throw error(path, type, "undefined-or-special-number");
    return value;
  }
  if (type === "string") {
    if (typeof value !== "string")
      throw error(path, type, "not-a-string", value);
    return value;
  }
  throw new Error("Invalid type at "+path);
};
