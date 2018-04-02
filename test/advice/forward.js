
const Reflect_apply = global.Reflect.apply;
const Reflect_construct = global.Reflect.construct;
const Array_prototype_forEach = global.Array.prototype.forEach;

const modifiers = [
  // special //
  "copy",
  "swap",
  "drop",
  // producers //
  "read",
  "load",
  "catch",
  "primitive",
  "regexp",
  "function",
  "discard",
  // consumers //
  "save",
  "completion",
  "success",
  "failure",
  "test",
  "throw",
  "return",
  "eval",
  "with",
  "write",
  "declare"
];

const informers = [
  "try",
  "finally",
  "leave",
  "begin",
  "end",
  "block",
  "label",
  "break"
];

const empty = () => {};

const pass = function () { return arguments[arguments.length-2] }

module.exports = (instrument) => {
  const traps = {};
  Reflect_apply(Array_prototype_forEach, modifiers, [(key) => traps[key] = pass]);
  Reflect_apply(Array_prototype_forEach, informers, [(key) => traps[key] = empty]);
  traps.arrival = (strict, callee, isnew, value, values) => [callee, isnew, value, values];
  traps.apply = (callee, value, values, serial) => Reflect_apply(callee, value, values);
  traps.invoke = (object, key, values, serial) => Reflect_apply(object[key], object, values);
  traps.construct = (callee, values, serial) => Reflect_construct(callee, values);
  traps.unary = (operator, argument, serial) => eval(operator+" argument");
  traps.binary = (operator, left, right, serial) => eval("left "+operator+" right");
  traps.get = (object, key, serial) => object[key];
  traps.set = (object, key, value, serial) => object[key] = value;
  traps.delete = (object, key, serial) => delete object[key];
  traps.array = (elements, serial) => elements;
  traps.object = (properties, serial) => {
    var object = {};
    for (let index=0; index<properties.length; index++)
      object[properties[index][0]] = properties[index][1];
    return object;
  };
  return {traps:traps};
};
