
const ArrayLite = require("array-lite");
const Grammar = require("./grammar.js");
const Check = require("./check.js");

const Object_keys = Object.keys;
const Math_round = Math.round;
const Array_isArray = Array.isArray;
const Array_from = Array.from;
const Reflect_apply = Reflect.apply;
const String_prototype_substring = String.prototype.substring;
const String_prototype_toUpperCase = String.prototype.toUpperCase;
const JSON_stringify = JSON.stringify;

const capitalize = (string) => (
  Reflect_apply(String_prototype_toUpperCase, string[0], []) +
  Reflect_apply(String_prototype_substring, string, [1]));

const duck = (path, type, value) => {
  if (Array_isArray(type)) {
    if (!Array_isArray(value))
      throw new Error(path+": not-an-array >> "+print(value));
    if (type.length === 1) {
      for (let index = 0; index<value.length; index++)
        duck(path+"[0]", type[0], value[index]);
    } else {
      if (type.length !== value.length) {
        throw new Error(path+": length-mismatch >> "+print(value));
      }
      for (let index=0; index<type.length; index++)
        duck(path+"["+index+"]", type[index], value[index]);
    }
  } else {
    try {
      Check[type](value);
    } catch (message) {
      throw new Error(path+" ("+type+"): "+message+" >> "+print(value));
    }
  }
};

const print = (value) => {
  if (typeof value === "string")
    return JSON_stringify(value);
  if (Array_isArray(value))
    return "[array]";
  if (typeof value === "function")
    return "[function]";
  if (value && typeof value === "object")
    return "[object]";
  return String(value);
};

exports.BLOCK = (qualifiers, statements) => {
  // Comment the line below to disable runtime build checks
  duck("_", Grammar.block._, [qualifiers, statements])
  return ["_", qualifiers, statements];
};

ArrayLite.forEach(
  Object_keys(Grammar.statement),
  (tag) => exports[capitalize(tag)] = function () {
    // Comments the line below to disable runtime build checks
    duck(tag, Grammar.statement[tag], Array_from(arguments));
    return [ArrayLite.concat([tag], arguments)];
  });

ArrayLite.forEach(
  Object_keys(Grammar.expression),
  (tag) => exports[tag] = function () {
    // Comments the line below to disable runtime build checks
    duck(tag, Grammar.expression[tag], Array_from(arguments));
    return ArrayLite.concat([tag], arguments);
  });
