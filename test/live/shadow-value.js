
const Acorn = require("acorn");
const Aran = require("aran");

const aran = Aran({format:"script"});
const advice = {};
const pointcut = (name, node) => name in advice;
const internals = new WeakMap();
let counter = 0;
const print = (value) => {
  if (typeof value === "string")
    return JSON.stringify(value);
  if (typeof value === "function")
    return "[Function]"
  if (typeof value === "object" && value !== null)
    return Object.prototype.toString.call(value);
  return String(value);
};
const input = (name, value, serial) => {
  const shadow = ++counter;
  console.log(shadow+" <= "+print(value)+" // "+name+"@"+serial);
  return {value, shadow};
};
const output = (name, {value, shadow}, serial) => {
  console.log(shadow+" => "+print(value)+" // "+name+"@"+serial);
  return value;
};

global[aran.namespace] = advice;
global.eval(aran.setup());
module.exports = (script) => {
  return aran.weave(Acorn.parse(script), pointcut, null);
};

// Producers //
advice.primitive = (value, serial) => {
  return input("primitive", value, serial);
};
advice.builtin = (value, name, serial) => {
  return input("builtin-("+name+")", value, serial);
}
advice.argument = (value, name, serial) => {
  if (name === "new.target" || name === "length")
    return input("argument-"+name, value, serial);
  return value
};
advice.closure = (value, serial) => {
  const closure = function () {
    "use strict";
    const $values = [];
    for (let index = arguments.length - 1; index >= 0; index--)
      $values[index] = input("arrival-argument-"+index, arguments[index], null);
    try {
      let $result;
      if (new.target) {
        $result = Reflect.construct(value, $values, new.target);
      } else {
        const $this = input("arrival-this", this, null);
        $result = Reflect.apply(value, $this, $values);
      }
      return output("return", $result, null);
    } catch ($value4) {
      throw output("abrupt", $value4, null);
    }
  };
  internals.set(closure, value);
  return input("closure", closure, serial);
};

// Consumers //
advice.test = ($value, serial) => {
  return output("test", $value, serial);
}
advice.eval = ($value, serial) => {
  const value = output("eval", $value, serial);
  return aran.weave(Acorn.parse(value), pointcut, serial);
};
advice.success = ($value, serial) => {
  return output("success", $value, serial);
}
advice.failure = ($value, serial) => {
  return output("failure", $value, serial);
};

// Combiners //
advice.unary = function (operator, $value, serial) {
  const value = output("unary-argument-("+operator+")", $value, serial);
  try {
    const result = aran.unary(operator, value, serial)
    return input("unary-result-("+operator+")", result, serial);
  } catch (error) {
    throw input("unary-error-("+operator+")", error, serial);
  }
};
advice.binary = function (operator, $value1, $value2, serial) {
  const value2 = output("binary-right-("+operator+")", $value2, serial);
  const value1 = output("binary-left-("+operator+")", $value1, serial);
  try {
    const result = aran.binary(operator, value1, value2, serial);
    return input("binary-result-("+operator+")", result, serial);
  } catch (error) {
    throw input("binary-error-("+operator+")", error, serial);
  }
};
advice.apply = function ($value1, $value2, $values, serial) {
  if (internals.has($value1.value)) {
    const value1 = output("apply-callee", $value1, serial);
    return Reflect.apply(internals.get(value1), $value2, $values);
  }
  const values = [];
  for (let index = $values.length - 1; index >= 0; index--)
    values[index] = output("apply-argument-"+index, $values[index], serial);
  const value2 = output("apply-this", $value2, serial);
  const value1 = output("apply-callee", $value1, serial);
  try {
    const result = Reflect.apply(value1, value2, values);
    return input("apply-result", result, serial);
  } catch (error) {
    throw input("apply-error", error, serial);
  }
};
advice.construct = function ($value, $values, serial) {
  if (internals.has($value.value)) {
    const value = output("construct-callee", $value, serial);
    return Reflect.construct(internals.get(value), $values);
  }
  const values = [];
  for (let index = $values.length - 1; index >= 0; index--)
    values[index] = output("construct-argument-"+index, $values[index], serial);
  const value = output("construct-callee", $value, serial);
  try {
    const result = Reflect.construct(value, values);
    return input("construct-result", result, serial);
  } catch (error) {
    throw input("construct-error", error, serial);
  }
};
