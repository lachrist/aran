const Aran = require("aran");
const Acorn = require("acorn");
const Astring = require("astring");

const print = (value) => {
  if (typeof value === "function")
    return "function";
  if (typeof value === "object")
    return value ? "object" : "null";
  if (typeof value === "string")
    return JSON.stringify(value);
  return String(value);
};

global.META = {};

///////////////
// Modifiers //
///////////////
const pass = function () { return arguments[arguments.length-2] };
[
  "copy",
  "swap",
  "drop",
  "read",
  "load",
  "save",
  "catch",
  "primitive",
  "regexp",
  "function",
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
].forEach((name) => { META[name] = pass });

///////////////
// Informers //
///////////////
const noop = () => {};
[
  "try",
  "finally",
  "leave",
  "begin",
  "end",
  "block",
  "label",
  "break"
].forEach((name) => { META[name] = noop });

///////////////
// Combiners //
///////////////
META.arrival = (strict, callee, isnew, value, values) =>
  [callee, isnew, value, values];
META.apply = (strict, callee, values, serial) =>
  Reflect.apply(callee, strict ? undefined : global, values);
META.construct = (callee, values, serial) =>
  Reflect.construct(callee, values);
META.invoke = (object, key, values, serial) =>
  Reflect.apply(object[key], object, values);
META.unary = (operator, argument, serial) =>
  eval(operator+" argument");
META.binary = (operator, left, right, serial) =>
  eval("left "+operator+" right");
META.get = (object, key, serial) =>
  object[key];
META.set = (object, key, value, serial) =>
  object[key] = value;
META.delete = (object, key, serial) =>
  delete object[key];
META.array = (elements, serial) =>
  elements;
META.object = (properties, serial) =>
  properties.reduce((object, property) => {
    object[property[0]] = property[1];
    return object;
  }, {});

//////////////////////////////
// Logger (uncomment below) //
//////////////////////////////
// Object.keys(META).forEach((name) => {
//   const trap = META[name];
//   META[name] = function () {
//     console.log(name+" "+Array.from(arguments).map(print).join(" "));
//     return Reflect.apply(trap, this, arguments);
//   };
// });

///////////
// Setup //
///////////
const aran = Aran({namespace:"META"});
global.eval(Astring.generate(aran.setup(true)));
module.exports = (script) => {
  script = Astring.generate(aran.weave(Acorn.parse(script), true, null));
  console.log(script);
  global.eval(script);
};
