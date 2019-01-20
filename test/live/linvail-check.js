
const Acorn = require("acorn");
const Aran = require("aran");
const Linvail = require("linvail");

const advice = {};
const pointcut = (name, node) => name in advice;
const aran = Aran({format:"script"});
global[aran.namespace] = advice;
global.eval(aran.setup());
const membrane = {
  taint: (value) => ({inner:value}),
  clean: (value) => value.inner
};
const {capture, release} = Linvail(membrane, {check:true});
module.exports = (script) => {
  return aran.weave(Acorn.parse(script), pointcut, null);
};

// Consumers //
advice.throw = ($$value, serial) => release(membrane.clean($$value));
advice.test = ($$value, serial) => membrane.clean($$value);
advice.success = ($$value, serial) => release(membrane.clean($$value));
advice.eval = ($$value, serial) => {
  const script = release(membrane.clean($$value));
  return aran.weave(Acorn.parse(script), pointcut, serial);
};

// Producers //
advice.error = (value, serial) => membrane.taint(capture(value));
advice.primitive = (primitive, serial) => membrane.taint(primitive);
advice.primordial = (value, name, serial) => membrane.taint(capture(value));
advice.closure = ($closure, serial) => {
  Reflect.setPrototypeOf($closure, capture(Function.prototype));
  return membrane.taint($closure);
};
advice.argument = (_value, name) => {
  if (name === "length" || name === "new.target")
    return membrane.taint(_value);
  return _value;
};

// Combiners //
advice.apply = ($$value1, $$value2, $$values, serial) => {
  return Reflect.apply(membrane.clean($$value1), $$value2, $$values);
};
advice.construct = ($$value, $$values, serial) => {
  return Reflect.construct(membrane.clean($$value), $$values);
};
advice.unary = (operator, $$value, serial) => {
  const value = release(membrane.clean($$value));
  const primitive = aran.unary(operator, value);
  return membrane.taint(primitive);
};
advice.binary = (operator, $$value1, $$value2, serial) => {
  const value1 = release(membrane.clean($$value1));
  const value2 = release(membrane.clean($$value2));
  const primitive = aran.binary(operator, value1, value2);
  return membrane.taint(primitive);
};
