module.exports = (namespace) => `
let _Array_prototype = Array.prototype;
let _TypeError = TypeError;
let _ReferenceError = ReferenceError;
let _Object_keys = Object.keys;
let _Object_prototype = Object.prototype;
let _Object_getPrototypeOf = Object.getPrototypeOf;
let _Object_create = Object.create;
let _Object_setPrototypeOf = Object.setPrototypeOf;
let _Object_getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
let _Object_defineProperty = Object.defineProperty;
let _eval = eval;
${namespace}.builtins = _Object_create(null);
${namespace}.builtins.global = _eval("this");
${namespace}.builtins.entries = function entries (object) {
  const array = [];
  _Object_setPrototypeOf(array, null);
  const keys = _Object_keys(object);
  for (let index = 0, length = keys.length; index < length; index++)
    array[index] = [key, object[key]];
  return _Object_setPrototypeOf(array, _Array_prototype);
};
${namespace}.builtins.fromEntries = function fromEntries (array) {
  const object = _Object_create(null);
  for (let index = 0, length = array.length; index < length; index++)
    object[array[index][0]] = array[index][1];
  return _Object_setPrototypeOf(object, _Object_prototype);
};
${namespace}.builtins.AranDefineDataProperty = function AranDefineDataProperty (object, key, value, writable, enumerable, configurable) {
  const descriptor = {value, writable, enumerable, configurable};
  _Object_setPrototypeOf(descriptor, null);
  return _Object_defineProperty(object, key, descriptor);
};
${namespace}.builtins.AranDefineAccessorProperty = function AranDefineDataProperty (object, key, get, set, enumerable, configurable) {
  const descriptor = {get, set, enumerable, configurable};
  _Object_setPrototypeOf(descriptor, null);
  return _Object_defineProperty(object, key, descriptor);
};
${namespace}.builtins.AranThrowTypeError = function AranThrowReferenceError (message) {
  throw new _TypeError(message);
};
${namespace}.builtins.AranThrowReferenceError = function AranThrowTypeError (message) {
  throw new _ReferenceError(message);
};
${namespace}.builtins.AranRest = function AranRest (iterator) {
  let array = [];
  let step = null;
  while (!(step = iterator.next()).done)
    array[array.length] = step.value;
  return array;
};
${namespace}.builtins.AranHold = function AranHold (object, name) {
  while (object) {
    if (_Object_getOwnPropertyDescriptor(object, name))
      return true;
    object = _Object_getPrototypeOf(object);
  }
  return false;
};
${namespace}.builtins.AranEnumerate = function AranEnumerate (object) {
  const keys = [];
  for (let key in object)
    keys[keys.length] = key;
  return keys;
};
${namespace}.builtins["eval"] = eval;
${namespace}.builtins["RegExp"] = RegExp;
${namespace}.builtins["Reflect.get"] = Reflect.get;
${namespace}.builtins["Reflect.set"] = Reflect.set;
${namespace}.builtins["Reflect.construct"] = Reflect.construct;
${namespace}.builtins["Reflect.apply"] = Reflect.apply;
${namespace}.builtins["Reflect.deleteProperty"] = Reflect.deleteProperty;
${namespace}.builtins["Symbol.unscopables"] = Symbol.unscopables;
${namespace}.builtins["Symbol.iterator"] = Symbol.iterator;
${namespace}.builtins["Object"] = Object;
${namespace}.builtins["Object.setPrototypeOf"] = Object.setPrototypeOf;
${namespace}.builtins["Object.create"] = Object.create;
${namespace}.builtins["Object.prototype"] = Object.prototype;
${namespace}.builtins["Array.of"] = Array.of;
${namespace}.builtins["Array.prototype.concat"] = Array.prototype.concat;
${namespace}.builtins["Array.prototype[Symbol.iterator]"] = Array.prototype[Symbol.iterator];
${namespace}.builtins["Function.prototype"] = Function.prototype;
${namespace}.builtins["Object.getOwnPropertyDescriptor(Function.prototype,'arguments').get"] = Object.getOwnPropertyDescriptor(Function.prototype,'arguments').get;
${namespace}.builtins["Object.getOwnPropertyDescriptor(Function.prototype,'arguments').set"] = Object.getOwnPropertyDescriptor(Function.prototype,'arguments').set;
`;