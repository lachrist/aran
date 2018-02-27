const Aran = require("aran");
const Acorn = require("acorn");
const Astring = require("astring");
const pointcut = () => true;
module.exports = (script1) => {
  const ast1 = Acorn.parse(script1);
  const ast2 = aran.join(ast1, pointcut)
  const script2 = Astring.generate(ast2);
  postMessage(script2+"\n");
  try {
    postMessage("Success: "+eval(script2)+"\n");
  } catch (error) {
    postMessage("Failure: "+error+"\n");
  }
};
const aran = Aran({
  namespace: "META",
  nosetup: true
});
eval(Astring.generate(aran.setup()));
self.META = {};
// Modifiers // 
const pass = function () {
  return arguments[arguments.length-2];
};
[
  "copy",
  "swap",
  "drop",
  "read",
  "builtin",
  "this",
  "newtarget",
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
// Informers //
const noop = () => {};
[
  "try",
  "finally",
  "callee",
  "leave",
  "begin",
  "end",
  "block",
  "label",
  "break"
].forEach((name) => { META[name] = noop });
// Combiners //
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