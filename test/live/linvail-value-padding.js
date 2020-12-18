
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
  taint: (value) => ({meta:++counter, base:value}),
  clean: ($$value) => $$value.base
};
const {capture, release} = Linvail(membrane);
const location = (serial) => {
  const node = aran.nodes[serial];
  const {line, column} =  node.loc.start;
  return " // " + node.type + "@" + line + ":" + column;
};
const print = (value) => {
 if (typeof value === "string")
   return JSON.stringify(value);
 if (typeof value === "function")
   return "function";
 if (typeof value === "object" && value !== null)
   return Array.isArray(value) ? "array" : "object";
 return String(value);
};
const pad = (string, length) => {
  if (string.length < length)
    return string + Array(length - string.length + 1).join(" ");
  if (string.length > length)
    return string.substring(0, length - 3) + "...";
  return string;
};
const log = (left, link, right, serial) => {
  console.log(pad(left, 16) + " " + link + " " + pad(right, 35) + location(serial));
};
const printw = ($$value) => {
  let meta = $$value.meta;
  meta = (meta < 10 ? "00" : (meta < 100 ? "0" : "")) + meta;
  const base = print($$value)
  return "&" + meta + "[" + print($$value.base) + "]";
}
module.exports = (script) => {
  return aran.weave(Acorn.parse(script, {locations:true}), pointcut, null);
};

// Consumers //
advice.throw = ($$value, serial) => release(membrane.clean($$value));
advice.test = ($$value, serial) => {
  log(printw($$value), ">>", "TEST", serial);
  return membrane.clean($$value);
};
advice.success = ($$value, serial) => release(membrane.clean($$value));
advice.eval = ($$value, serial) => {
  const script = release(membrane.clean($$value));
  return aran.weave(Acorn.parse(script, {locations:true}), pointcut, serial);
};

// Producers //
advice.error = (value, serial) => membrane.taint(capture(value));
advice.primitive = (primitive, serial) => {
  const $$primitive = membrane.taint(primitive);
  log(printw($$primitive), "<<", "LITERAL", serial);
  return $$primitive;
};
advice.intrinsic = (value, name, serial) => membrane.taint(capture(value));
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
  const $$primitive = membrane.taint(primitive);
  log(printw($$primitive), "<<", operator + " " + printw($$value), serial);
  return $$primitive;
};
advice.binary = (operator, $$value1, $$value2, serial) => {
  const value1 = release(membrane.clean($$value1));
  const value2 = release(membrane.clean($$value2));
  const primitive = aran.binary(operator, value1, value2);
  const $$primitive = membrane.taint(primitive);
  log(printw($$primitive), "<<", printw($$value1) + " " + operator + " " + printw($$value2), serial);
  return $$primitive;
};
