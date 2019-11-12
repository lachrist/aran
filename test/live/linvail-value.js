
const Acorn = require("acorn");
const Aran = require("aran");
const Linvail = require("linvail");

const advice = {};
const pointcut = (name, node) => name in advice;
const aran = Aran({format:"script"});
global[aran.namespace] = advice;
global.eval(aran.setup());
let counter = 0;
const membrane = {
  taint: (value) => ({meta:"@"+(++counter), base:value}),
  clean: ($$value) => $$value.base
};
const {capture, release} = Linvail(membrane);
module.exports = (script) => {
  return aran.weave(Acorn.parse(script), pointcut, null);
};

advice.program = (closure, serial) => {
  return release(membrane.clean($closure));
};

// Consumers //
advice.throw = ($$value, serial) => release(membrane.clean($$value));
advice.test = ($$value, serial) => {
  console.log($$value.meta+" TEST");
  return membrane.clean($$value);
};
advice.success = ($$value, serial) => release(membrane.clean($$value));
advice.eval = ($$value, serial) => {
  const script = release(membrane.clean($$value));
  return aran.weave(Acorn.parse(script), pointcut, serial);
};

// Producers //
advice.primitive = (primitive, serial) => {
  const $$primitive = membrane.taint(primitive);
  console.log($$primitive.meta+" := "+JSON.stringify(primitive));
  return $$primitive;
};
advice.builtin = (value, name, serial) => membrane.taint(capture(value));
advice.closure = ($closure, serial) => {
  Reflect.setPrototypeOf($closure, capture(Function.prototype));
  return membrane.taint($closure);
};
advice.error = (value, serial) => membrane.taint(capture(value));
advice.parameter = (_value, name) => {
  if (name === "length" || name === "new.target")
    return membrane.taint(_value);
  if (name === "error")
    return membrane.taint(capture(_value));
  if (name === "arguments") {
    Reflect.setPrototypeOf(_value, capture(Array.prototype));
    return membrane.taint(_value);
  }
  return _value;
};

advice.enter = (tag, parameters, labels, identifiers, serial) => {
  if (tag === "catch") {
    parameters.error = membrane.taint(capture(parameters.error));
  } else if (tag === "closure") {
    parameters.length = membrane.taint(parameters.length);
    parameters["new.target"] = membrane.taint(parameters["new.target"]);
    parameters.arguments = membrane.enter(parameters.arguments);
  }
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
  const $$primitive = membrane.taint(primitive);
  console.log($$primitive.meta+" := "+operator+" "+$$value.meta);
  return $$primitive;
};
advice.binary = (operator, $$value1, $$value2, serial) => {
  const value1 = release(membrane.clean($$value1));
  const value2 = release(membrane.clean($$value2));
  const primitive = aran.binary(operator, value1, value2);
  const $$primitive = membrane.taint(primitive);
  console.log($$primitive.meta+" := "+$$value1.meta+" "+operator+" "+$$value2.meta);
  return $$primitive;
};
