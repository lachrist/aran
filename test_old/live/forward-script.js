
const Acorn = require("acorn");
const Aran = require("aran");

const aran = Aran({format:"script"});
const advice = {};
const pointcut = (name, node) => true;
const identity = (x) => x;
const noop = () => {};

global[aran.namespace] = advice;
global.eval(aran.setup());
module.exports = (script1) => {
  const estree = Acorn.parse(script1);
  const script2 = aran.weave(estree, pointcut, null);
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
  "intrinsic",
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
  const estree = Acorn.parse(value);
  return aran.weave(estree, pointcut, serial);
};

// Combiners //
const dropserial = (closure) => (...array) => (array.pop(), closure(...array));
advice.construct = dropserial(Reflect.construct);
advice.apply = dropserial(Reflect.apply);
advice.unary = dropserial(aran.unary);
advice.binary = dropserial(aran.binary);
