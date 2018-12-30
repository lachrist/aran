
const Acorn = require("acorn");
const Aran = require("aran.js");

const aran = Aran({format:"script"});
const advice = {};
const internals = new WeakMap();
let counter = 0;
const print = (value) => {
  if (typeof value === "string")
    return JSON.stringify(value);
  if (typeof value === "function")
    return "[function]"
  if (typeof value === "object" && value !== null)
    return Object.prototype.toString.call(value);
  return String(value);
};
const wrap = (name, value, serial) => {
  counter++;
  console.log("<< "+counter+" "+name+" "+print(value)+" "+serial);
  return {meta:counter, base:value};
};
const unwrap = (name, $value, serial) => {
  console.log(">> "+$value.meta+" "+name+" "+print($value.base)+" "+serial);
  return $value.base;
};
const pointcut = (name, node) => name in advice;

global[aran.namespace] = advice;
global.eval(aran.setup());
module.exports = (script) => aran.weave(Acorn.parse(script), pointcut, null);

// Producers //
advice.primitive = (value, serial) => wrap("primitive", value, serial);
advice.builtin = (value, name, serial) => wrap("builtin", value, serial);
advice.argument = (value, name, serial) => (
  name === "new.target" || name === "length" ?
  wrap("argument-"+name, value, serial) :
  value);
advice.closure = (value, serial) => {
  const closure = function (...values) {
    try {
      if (new.target)
        return unwrap(
          "closure-result",
          Reflect.construct(
            value,
            values.map((value, index) => wrap("closure-argument-"+index, value, null))),
          null);
      return unwrap(
        "closure-result",
        Reflect.apply(
          value,
          wrap("closure-this", this, null),
          values.map((value, index) => wrap("closure-argument-"+index, value, null))),
        null);
    } catch ($value) {
      throw unwrap("closure-error", $value, null);
    }
  };
  internals.set(closure, value);
  return wrap("closure", closure, serial);
};

// Consumers //
advice.test = ($value, serial) => unwrap("test", $value, serial);
advice.eval = ($value, serial) => aran.weave(Acorn.parse(unwrap("eval", $value, serial)), pointcut, serial);
advice.success = ($value, serial) => unwrap("success", $value, serial);
advice.failure = ($value, serial) => unwrap("failure", $value, serial);

// Combiners //
advice.unary = function (operator, $value, serial) {
  try {
    return wrap(
      "unary-result",
      aran.unary(
        operator,
        unwrap("unary", $value, serial)),
      serial);
  } catch (value) {
    throw wrap("unary-error", value, serial);
  }
};
advice.binary = function (operator, $value1, $value2, serial) {
  try {
    return wrap(
      "binary-result",
      aran.binary(
        operator,
        unwrap("binary-left", $value1, serial),
        unwrap("binary-right", $value2, serial)),
      serial);
  } catch (value) {
    throw wrap("binary-error", value, serial);
  }
};
advice.apply = function ($value1, $value2, $values, serial) {
  const value1 = unwrap("apply-callee", $value1, serial);
  if (internals.has(value1))
    return Reflect.apply(internals.get(value1), $value2, $values);
  try {
    return wrap(
      "apply-result",
      Reflect.apply(
        value1,
        unwrap("apply-this", $value2, serial),
        $values.map(($value, index) => unwrap("apply-argument-"+index, $value, serial))),
      serial);
  } catch (value) {
    throw wrap("apply-error", value, serial);
  }
};
advice.construct = function ($value, $values, serial) {
  const value = unwrap("construct-callee", $value, serial);
  if (internals.has(value))
    return Reflect.construct(internals.get(value), $values);
  try {
    return wrap(
      "construct-result",
      Reflect.construct(
        value,
        $values.map(($value, index) => unwrap("apply-argument-"+index, $value, serial))));
  } catch (value) {
    throw wrap("construct-error", value, serial);
  }
};
