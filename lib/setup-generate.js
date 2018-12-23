
const Acorn = require("acorn");
const Astring = require("astring");
const Enumeration = require("./enumeration.js");

const adhoc = `
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
NAMESPACE.builtins = _Object_create(null);
NAMESPACE.builtins.global = _eval("this");
NAMESPACE.builtins.entries = function entries (object) {
  const array = [];
  _Object_setPrototypeOf(array, null);
  const keys = _Object_keys(object);
  for (let index = 0, length = keys.length; index < length; index++)
    array[index] = [key, object[key]];
  return _Object_setPrototypeOf(array, _Array_prototype);
};
NAMESPACE.builtins.fromEntries = function fromEntries (array) {
  const object = _Object_create(null);
  for (let index = 0, length = array.length; index < length; index++)
    object[array[index][0]] = array[index][1];
  return _Object_setPrototypeOf(object, _Object_prototype);
};
NAMESPACE.builtins.AranDefineDataProperty = function AranDefineDataProperty (object, key, value, writable, enumerable, configurable) {
  const descriptor = {value, writable, enumerable, configurable};
  _Object_setPrototypeOf(descriptor, null);
  return _Object_defineProperty(object, key, descriptor);
};
NAMESPACE.builtins.AranDefineAccessorProperty = function AranDefineDataProperty (object, key, get, set, enumerable, configurable) {
  const descriptor = {get, set, enumerable, configurable};
  _Object_setPrototypeOf(descriptor, null);
  return _Object_defineProperty(object, key, descriptor);
};
NAMESPACE.builtins.AranThrowTypeError = function AranThrowReferenceError (message) {
  throw new _TypeError(message);
};
NAMESPACE.builtins.AranThrowReferenceError = function AranThrowTypeError (message) {
  throw new _ReferenceError(message);
};
NAMESPACE.builtins.AranRest = function AranRest (iterator) {
  let array = [];
  let step = null;
  while (!(step = iterator.next()).done)
    array[array.length] = step.value;
  return array;
};
NAMESPACE.builtins.AranHold = function AranHold (object, name) {
  while (object) {
    if (_Object_getOwnPropertyDescriptor(object, name))
      return true;
    object = _Object_getPrototypeOf(object);
  }
  return false;
};
NAMESPACE.builtins.AranEnumerate = function AranEnumerate (object) {
  const keys = [];
  for (let key in object)
    keys[keys.length] = key;
  return keys;
};`

const generic = Enumeration.GenericBuiltin.map((name) => {
  return "NAMESPACE.builtins["+JSON.stringify(name)+"] = "+name+";";
}).join("\n");

const estree = Acorn.parse(adhoc+generic);

const loop = (node) => {
  if (node && typeof node === "object") {
    for (let key in node) {
      if (key === "start" || key === "end") {
        delete node[key];
      } else {
        loop(node[key]);
      }
    }
  }
}

loop(estree);

process.stdout.write("module.exports = " +JSON.stringify(estree, null, 2), "utf8");

process.stderr.write(Astring.generate(estree));