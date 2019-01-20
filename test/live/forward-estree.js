
const Acorn = require("acorn");
const Aran = require("aran");
const Astring = require("astring");

const aran = Aran({format:"estree"});
const advice = {};
const pointcut = (name, node) => true;
const identity = (x) => x;
const noop = () => {};

global[aran.namespace] = advice;
global.eval(Astring.generate(aran.setup()));
module.exports = (script1) => {
  const estree1 = Acorn.parse(script1);
  const estree2 = aran.weave(estree1, pointcut, null);
  const script2 = Astring.generate(estree2);
  // console.log(script2);
  return script2;
};

// Informers //
[
  "program",
  "arrival",
  "enter",
  "leave",
  "continue",
  "break",
  "debugger"
].forEach((key) => { advice[key] = noop });

// Transformers //
[
  "error",
  "abrupt",
  "throw",
  "return",
  "closure",
  "primordial",
  "primitive",
  "read",
  "argument",
  "drop",
  "test",
  "write",
  "success",
  "failure"
].forEach((key) => { advice[key] = identity });
advice.eval = (value, serial) => {
  const estree1 = Acorn.parse(value);
  const estree2 = aran.weave(estree1, pointcut, serial);
  return Astring.generate(estree2);
};

// Combiners //
const dropserial = (closure) => (...array) => (array.pop(), closure(...array));
advice.construct = dropserial(Reflect.construct);
advice.apply = dropserial(Reflect.apply);
advice.unary = dropserial(aran.unary);
advice.binary = dropserial(aran.binary);
