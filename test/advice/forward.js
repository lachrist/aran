
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
  "callee",
  "builtin",
  "this",
  "newtarget",
  "arguments",
  "catch",
  "primitive",
  "regexp",
  "closure",
  "discard",
  // consumers //
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

module.exports = (aran, join) => {
  const traps = {};
  Reflect_apply(Array_prototype_forEach, modifiers, [(key) => traps[key] = pass]);
  Reflect_apply(Array_prototype_forEach, informers, [(key) => traps[key] = empty]);
  traps.apply = (strict, closure, arguments, serial) => Reflect_apply(closure, strict ? void 0 : global, arguments);
  traps.invoke = (object, key, arguments, serial) => Reflect_apply(object[key], object, arguments);
  traps.construct = (closure, arguments, serial) => Reflect_construct(closure, arguments);
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
