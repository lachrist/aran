const AranLive = require("aran/live");

const print = (value) => {
  if (typeof value === "function")
    return "function";
  if (typeof value === "object")
    return value ? "object" : "null";
  if (typeof value === "string")
    return JSON.stringify(value);
  return String(value);
};

const advice = {};

///////////////
// Modifiers //
///////////////
const pass = function () { return arguments[arguments.length-2] };
[
  "array",
  "arrival",
  "read",
  "load",
  "save",
  "catch",
  "primitive",
  "regexp",
  "closure",
  "discard",
  "completion",
  "success",
  "failure",
  "test",
  "throw",
  "return",
  "eval",
  "with",
  "write",
  "declare",
].forEach((name) => { advice[name] = pass });

///////////////
// Informers //
///////////////
const noop = () => {};
[
  "copy",
  "swap",
  "drop",
  "try",
  "finally",
  "leave",
  "begin",
  "end",
  "block",
  "label",
  "break"
].forEach((name) => { advice[name] = noop });

///////////////
// Computers //
///////////////
advice.apply = (callee, values, serial) => callee(...values);
advice.construct = (callee, values, serial) => new callee(...values);
advice.invoke = (object, key, values, serial) => Reflect.apply(object[key], object, values);
advice.unary = (operator, argument, serial) => eval(operator+" argument");
advice.binary = (operator, left, right, serial) => eval("left "+operator+" right");
advice.get = (object, key, serial) => object[key];
advice.set = (object, key, value, serial) => object[key] = value;
advice.delete = (object, key, serial) => delete object[key];
advice.object = (properties, serial) => properties.reduce((object, property) => {
  object[property[0]] = property[1];
  return object;
}, {});

//////////////////////////////
// Tracer (uncomment below) //
//////////////////////////////
// Object.keys(advice).forEach((name) => {
//   const trap = advice[name];
//   advice[name] = function () {
//     console.log(name+" "+Array.from(arguments).map(print).join(" "));
//     return Reflect.apply(trap, this, arguments);
//   };
// });

module.exports = AranLive(advice).instrument;
