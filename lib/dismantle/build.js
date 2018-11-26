
const ArrayLite = require("array-lite");
const Grammar = require("../grammar.js");

const Array_isArray = Array.isArray;
const Array_from = Array.from;
const Reflect_apply = Reflect.apply;

const String_prototype_substring = String.prototype.substring;
const Object_keys = Object.keys;
const Math_round = Math.round;

ArrayLite.forEach(
  ["block", "statement", "expression"],
  (type) => ArrayLite.forEach(
    Object_keys(Grammar[type]),
    (instance) => exports[instance] = function () {
      // Comments the line below to disable runtime build checks
      duck(instance, Grammar[type][instance], Array_from(arguments));
      return ArrayLite.concat([key], arguments, ARAN.node.AranSerial);
    });

const duck = (path, type, value) => {
  if (Array_isArray(type)) {
    if (!Array_isArray(value))
      throw new Error(path+": not-an-array >> "+print(value));
    if (type.length === 1) {
      for (let index = 0; index<value.length; index++)
        duck(path+"[0]", type[0], value[index]);
    } else {
      if (type.length !== value.length)
        throw new Error(path+": length-mismatch >> "+print(value));
      for (let index=0; index<type.length; index++)
        duck(path+"["+index+"]", type[index], value[index]);
    }
  } else {
    try {
      Grammar.check(value, type);
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
}
