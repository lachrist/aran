const Aran = require("aran");
const AranLive = require("aran-live");

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
  "object",
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
  "begin",
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

//////////////////////////////
// Tracer (uncomment below) //
//////////////////////////////
// const print = (value) => {
//   if (typeof value === "function")
//     return "function";
//   if (typeof value === "object")
//     return value ? "object" : "null";
//   if (typeof value === "string")
//     return JSON.stringify(value);
//   return String(value);
// };
// Object.keys(advice).forEach((name) => {
//   const trap = advice[name];
//   advice[name] = function () {
//     console.log(name+" "+Array.from(arguments).map(print).join(" "));
//     return Reflect.apply(trap, this, arguments);
//   };
// });

const instrument = AranLive(Aran(), advice);
module.exports = (script, source) => instrument(script);
