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
  "arrival",
  "read",
  "builtin",
  "error",
  "primitive",
  "closure",
  "success",
  "failure",
  "test",
  "throw",
  "return",
  "eval",
  "prelude",
  "write",
].forEach((name) => { ADVICE[name] = pass });

///////////////
// Informers //
///////////////
const noop = () => {};
[
  "enter",
  

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
ADVICE.apply = (closure, values, serial) => Reflect.apply(closure, values);
ADVICE.construct = (constructor, values, serial) => Reflect.construct(constructor, values);
ADVICE.invoke = (object, key, values, serial) => Reflect.apply(object[key], object, values);
ADVICE.unary = (operator, value, serial) => eval(operator+" value");
ADVICE.binary = (operator, value1, value2, serial) => eval("value1 "+operator+" value2");

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
const aran = Aran({namespace:"ADVICE"});
module.exports = (script) => Astring.generate(aran.weave(Acorn.parse(script), () => true));
