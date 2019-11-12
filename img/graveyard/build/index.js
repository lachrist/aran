
const ArrayLite = require("array-lite");
const Grammar = require("./grammar.js");
const Check = require("./check.js");

const Object_keys = Object.keys;
const Array_isArray = Array.isArray;
const Array_from = Array.from;
const JSON_stringify = JSON.stringify;

const duck = (path, type, value) => {
  if (Array_isArray(type)) {
    if (!Array_isArray(value)) {
      throw new Error(path+": not-an-array >> "+print(value));
    }
    if (type.length === 1) {
      for (let index = 0; index < value.length; index++) {
        duck(path+"[0]", type[0], value[index]);
      }
    } else {
      if (type.length !== value.length) {
        throw new Error(path+": length-mismatch >> "+print(value));
      }
      for (let index = 0; index < type.length; index++) {
        duck(path+"["+index+"]", type[index], value[index]);
      }
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

ArrayLite.forEach(["block", "statement", "expression"], (kind) => {
  ArrayLite.forEach(Object_keys(Grammar[kind]), (type) => {
    exports[type] = function () {
      // Comments the line below to disable runtime build checks
      duck(type, Grammar[kind][type], Array_from(arguments));
      const array = ArrayLite.concat([type], arguments);
      return kind === "statement" ? [array] : array;
    }
  });
});
