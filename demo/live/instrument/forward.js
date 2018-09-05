const Acorn = require("acorn");
const Aran = require("aran");
const Astring = require("astring");

////////////
// Advice //
////////////
global.ADVICE = {};

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
].forEach((name) => { ADVICE[name] = pass });

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
].forEach((name) => { ADVICE[name] = noop });

///////////////
// Computers //
///////////////
ADVICE.apply = (callee, values, serial) => callee(...values);
ADVICE.construct = (callee, values, serial) => new callee(...values);
ADVICE.invoke = (object, key, values, serial) => Reflect.apply(object[key], object, values);
ADVICE.unary = (operator, argument, serial) => eval(operator+" argument");
ADVICE.binary = (operator, left, right, serial) => eval("left "+operator+" right");
ADVICE.get = (object, key, serial) => object[key];
ADVICE.set = (object, key, value, serial) => object[key] = value;
ADVICE.delete = (object, key, serial) => delete object[key];

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
// Object.keys(ADVICE).forEach((name) => {
//   const trap = ADVICE[name];
//   ADVICE[name] = function () {
//     console.log(name+" "+Array.from(arguments).map(print).join(" "));
//     return Reflect.apply(trap, this, arguments);
//   };
// });

///////////
// Setup //
///////////
const aran = Aran({namespace:"ADVICE", pointcut:true});
global.eval(Astring.generate(aran.setup()));
module.exports = (script) =>
  Astring.generate(aran.weave(Acorn.parse(script)));