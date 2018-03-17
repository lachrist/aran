const Aran = require("aran");
const Acorn = require("acorn");
const Astring = require("astring");
const PrintLite = require("print-lite");
global.META = {};
const aran = Aran({namespace:"META"});
global.eval(Astring.generate(aran.setup()));
module.exports = (script) => {
  script = Astring.generate(aran.weave(Acorn.parse(script), true, null));
  console.log(script);
  global.eval(script);
};
///////////////
// Modifiers //
///////////////
const pass = function () { return arguments[arguments.length-2] };
[
  "copy",
  "swap",
  "drop",
  "read",
  "builtin",
  "this",
  "callee",
  "arguments",
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
META.apply = (strict, closure, values, serial) =>
  Reflect.apply(closure, strict ? undefined : global, values);
META.invoke = (object, key, values, serial) =>
  Reflect.apply(object[key], object, values);
META.construct = (closure, values, serial) =>
  Reflect.construct(closure, values);
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
//   if (name.toLowerCase === name) {
//     const trap = META[name];
//     META[name] = function () {
//       console.log(name+" "+Array.from(arguments).map(PrintLite).join(" "));
//       return Reflect.apply(trap, this, arguments);
//     };
//   }
// });