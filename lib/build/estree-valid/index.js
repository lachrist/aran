
const Util = require("util");
const ArrayLite = require("array-lite");
const Estree = require("../estree.js");
const Check = require("./check.js");
const ArgumentsType = require("./arguments-type.js");
const isArray = Array.isArray;
const keys = Object.keys;
const apply = Reflect.apply;

ArrayLite.forEach(keys(Estree), (key) => {
  exports[key] = function () {
    if (arguments.length !== ArgumentsType[key].length)
      throw new Error("Arguments number mismatch, ["+key+"] expected "+ArgumentsType[key].length+", got: "+Util.inspect(arguments));
    for (var index = 0; index<ArgumentsType[key].length; index++)
      duck(ArgumentsType[key][index], arguments[index]);
    return apply(Estree[key], null, arguments);
  };
});

const duck = (type, value) => {
  if (isArray(type) && type.length === 2 && type[0] === "nullable") {
    if (value !== null)
      duck(type[1], value);
  } else if (isArray(type) && type.length === 2 && type[0] === "list") {
    if (typeof value !== "object" || value === null || typeof value.length !== "number")
      throw new Error("Not an array: "+Util.inspect(value));
    ArrayLite.forEach(
      value,
      (value) => duck(type[1], value));
  } else if (typeof type === "object" && type !== null) {
    if (typeof value !== "object" || value === null)
      throw new Error("Not an object: "+Util.inspect(value));
    for (var key in type)
      duck(type[key], value[key]);
  } else if (typeof type === "string") {
    Check[type](value);
  } else {
    throw new Error("Unknown type: "+Util.inspect(type));
  }
};
